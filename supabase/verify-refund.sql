-- =====================================================================
-- 出餐拍照证明 + 退款记录（2026-11-01）—— 在 Supabase SQL Editor 整份贴上去 Run 一次就好（可重复跑）
-- 放在明记 ERP 的项目（kmcdokwiyetlmsrdlgqw）。⚠️ 绝不能跑在牛室的项目。
-- 需要先跑过 schema.sql / delivery.sql / staff.sql（用到 web_orders、web_staff、web_can_see）。
--
-- 1) 出餐拍照：分店把食物准备好后，在员工后台拍照上传，照片存进私人的 Storage bucket「web-proof」，
--    登记在表 web_order_proofs。照片只有白名单店员能看（管理员全部分店；分店经理只看自己分店的单）。
--    店员按「完成」时，数据库会检查这张单有没有出餐照片，没有就拒绝（Delyva 送达自动完成不受影响）。
-- 2) 退款：表 web_refunds 记录每一笔退款（金额、原因、谁退的、HitPay 退款编号）。
--    只有 web-hitpay 函数（service role）能写；店员只能读（照分店权限）。
-- 全部 plpgsql（不用 language sql，避免 RLS 递归）。
-- =====================================================================

-- 0) 这张单我看不看得到（按订单 id → 分店序号 → web_can_see）
create or replace function public.web_can_see_order(p_id bigint)
returns boolean language plpgsql security definer stable set search_path = public as $$
declare v_oi int; v_found boolean;
begin
  select outlet_idx, true into v_oi, v_found from public.web_orders where id = p_id;
  if v_found is not true then return false; end if;
  return public.web_can_see(v_oi);
end $$;
revoke all on function public.web_can_see_order(bigint) from public, anon;
grant execute on function public.web_can_see_order(bigint) to authenticated;

-- 1) 出餐照片 ---------------------------------------------------------
create table if not exists public.web_order_proofs (
  id         bigserial primary key,
  order_id   bigint      not null references public.web_orders(id) on delete cascade,
  path       text        not null unique,                 -- Storage 里的档案路径：<订单id>/<时间>_<随机>.jpg
  created_at timestamptz not null default now(),
  created_by text        not null default public.web_me_email()
);
create index if not exists web_order_proofs_order_idx on public.web_order_proofs (order_id);
alter table public.web_order_proofs enable row level security;
revoke all on public.web_order_proofs from anon, authenticated;
grant select, insert on public.web_order_proofs to authenticated;   -- 不给 update / delete：照片是证据，不能改、不能删
grant usage, select on sequence public.web_order_proofs_id_seq to authenticated;
drop policy if exists "proofs read"   on public.web_order_proofs;
drop policy if exists "proofs insert" on public.web_order_proofs;
create policy "proofs read"   on public.web_order_proofs for select to authenticated using (public.web_can_see_order(order_id));
create policy "proofs insert" on public.web_order_proofs for insert to authenticated
  with check (public.web_can_see_order(order_id) and created_by = public.web_me_email() and path like (order_id::text || '/%'));

-- Storage bucket（私人，单张最大 5MB，只收图片）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('web-proof', 'web-proof', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- 档案路径第一段 = 订单 id；只有「看得到那张订单」的店员能上传 / 读取
create or replace function public.web_proof_path_ok(p_name text)
returns boolean language plpgsql security definer stable set search_path = public as $$
declare v_id text := split_part(coalesce(p_name, ''), '/', 1);
begin
  if v_id !~ '^[0-9]{1,12}$' then return false; end if;
  return public.web_can_see_order(v_id::bigint);
end $$;
revoke all on function public.web_proof_path_ok(text) from public, anon;
grant execute on function public.web_proof_path_ok(text) to authenticated;

drop policy if exists "web-proof read"   on storage.objects;
drop policy if exists "web-proof insert" on storage.objects;
create policy "web-proof read"   on storage.objects for select to authenticated
  using (bucket_id = 'web-proof' and public.web_proof_path_ok(name));
create policy "web-proof insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'web-proof' and public.web_proof_path_ok(name));

-- 店员按「完成」（completed_at 从空变有值）时，没有出餐照片就拒绝。
-- 只管登录的店员（current_user = authenticated）；web-delyva（送达自动完成）用 service role，不受影响。
create or replace function public.web_orders_need_proof()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user = 'authenticated' and new.completed_at is not null and old.completed_at is null
     and not exists (select 1 from public.web_order_proofs where order_id = new.id) then
    raise exception 'need_proof: 请先拍照上传出餐照片，再按完成';
  end if;
  return new;
end $$;
drop trigger if exists web_orders_need_proof on public.web_orders;
create trigger web_orders_need_proof before update on public.web_orders
  for each row execute function public.web_orders_need_proof();

-- 2) 退款记录 ---------------------------------------------------------
create table if not exists public.web_refunds (
  id               bigserial primary key,
  order_id         bigint        not null references public.web_orders(id) on delete cascade,
  amount           numeric(10,2) not null check (amount > 0 and amount < 10000),
  reason           text          not null,
  mode             text          not null default 'hitpay' check (mode in ('hitpay','manual')),   -- hitpay = 由 HitPay 退回原付款方式；manual = 店家自己转账/在 HitPay 后台退，这里只是记录
  status           text          not null default 'pending' check (status in ('pending','done','manual','failed')),
  payment_id       text,
  hitpay_refund_id text,
  hitpay_status    text,
  error            text,
  created_at       timestamptz   not null default now(),
  created_by       text
);
create index if not exists web_refunds_order_idx on public.web_refunds (order_id);
create index if not exists web_refunds_created_idx on public.web_refunds (created_at desc);
alter table public.web_refunds enable row level security;
revoke all on public.web_refunds from anon, authenticated;
grant select on public.web_refunds to authenticated;          -- 只能读；写入只有 web-hitpay（service role）
drop policy if exists "refunds read" on public.web_refunds;
create policy "refunds read" on public.web_refunds for select to authenticated using (public.web_can_see_order(order_id));
