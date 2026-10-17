-- =====================================================================
-- 明记官网「付款确认」小后台（Supabase）
-- ---------------------------------------------------------------------
-- 用法：在【官网专用的新 Supabase 项目】→ SQL Editor → 贴上整份 → Run。
--      可重复执行（会覆盖函数与策略，不会删订单）。
-- ⚠️ 这是官网专用项目，跟明记 / 牛室 ERP 的 Supabase 完全分开，别在 ERP 项目里跑。
--
-- 流程：
--   客人网页（匿名）→ create_web_order() 建一笔「待付款」订单，拿到一个秘密 token
--   客人网页每几秒 → web_order_status(ref, token) 查状态（只查得到自己那笔）
--   店员登录 admin.html → 看到订单 → 核对 TNG/银行收款 → 按「已收款」(status=paid)
--   客人网页查到 paid → 自动打开 WhatsApp 发订单
--
-- 安全：
--   * 匿名客人【不能】直接读写 web_orders 表，只能透过两个函数（建单、查自己状态）。
--   * 只有 web_staff 白名单里的邮箱、并且登录了，才能看 / 改订单。
--   * 函数一律 language plpgsql + security definer（沿用 ERP 的教训，不用 language sql）。
-- =====================================================================

create extension if not exists pgcrypto;

-- 1) 订单表 ------------------------------------------------------------
create table if not exists public.web_orders (
  id             bigserial primary key,
  ref            text        not null unique,                 -- 参考号，例如 MK1017-4821
  token          uuid        not null default gen_random_uuid(), -- 只有下单的客人知道，用来查状态
  outlet         text,
  order_type     text,                                         -- pickup / delivery
  customer_name  text,
  customer_phone text,
  amount         numeric(10,2) not null check (amount > 0 and amount < 10000),
  message        text        not null check (length(message) < 6000),   -- 会发到 WhatsApp 的订单全文
  status         text        not null default 'pending' check (status in ('pending','paid','rejected')),
  created_at     timestamptz not null default now(),
  confirmed_at   timestamptz,
  confirmed_by   text
);
create index if not exists web_orders_created_idx on public.web_orders (created_at desc);
alter table public.web_orders enable row level security;

-- 2) 店员白名单 --------------------------------------------------------
create table if not exists public.web_staff (
  email text primary key
);
alter table public.web_staff enable row level security;
-- （不开任何策略：只有在 Supabase 后台 / SQL 才能增删店员）

create or replace function public.is_web_staff()
returns boolean language plpgsql security definer stable set search_path = public as $$
begin
  return exists (
    select 1 from public.web_staff
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
end $$;

-- 3) 店员才能看 / 改订单 ----------------------------------------------
drop policy if exists "staff read orders"   on public.web_orders;
drop policy if exists "staff update orders" on public.web_orders;
create policy "staff read orders"   on public.web_orders for select to authenticated using (public.is_web_staff());
create policy "staff update orders" on public.web_orders for update to authenticated using (public.is_web_staff()) with check (public.is_web_staff());

-- 4) 客人建单（匿名可调用）------------------------------------------
create or replace function public.create_web_order(
  p_ref text, p_outlet text, p_type text, p_name text, p_phone text, p_amount numeric, p_message text
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_token uuid;
begin
  if p_ref is null or p_ref !~ '^MK[0-9]{4}-[0-9]{4}$' then raise exception 'bad ref'; end if;
  if p_amount is null or p_amount <= 0 or p_amount >= 10000 then raise exception 'bad amount'; end if;
  -- 简单防洗单：全站每分钟最多 30 笔
  if (select count(*) from public.web_orders where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'too many orders, try again later';
  end if;
  insert into public.web_orders (ref, outlet, order_type, customer_name, customer_phone, amount, message)
  values (p_ref, left(p_outlet, 80), left(p_type, 20), left(p_name, 80), left(p_phone, 30), round(p_amount, 2), left(p_message, 5900))
  returning token into v_token;
  return v_token;
end $$;

-- 5) 客人查自己订单状态（要 ref + token 都对才查得到）---------------
create or replace function public.web_order_status(p_ref text, p_token uuid)
returns text language plpgsql security definer stable set search_path = public as $$
declare v_status text;
begin
  select status into v_status from public.web_orders where ref = p_ref and token = p_token;
  return coalesce(v_status, 'notfound');
end $$;

-- 6) 权限：匿名只能执行这两个函数，不能碰表 ---------------------------
revoke all on public.web_orders from anon;
revoke all on public.web_staff  from anon, authenticated;
grant select, update on public.web_orders to authenticated;   -- 仍受上面 RLS 限制（只有白名单店员）
revoke all on function public.create_web_order(text,text,text,text,text,numeric,text) from public;
revoke all on function public.web_order_status(text,uuid) from public;
grant execute on function public.create_web_order(text,text,text,text,text,numeric,text) to anon, authenticated;
grant execute on function public.web_order_status(text,uuid) to anon, authenticated;
grant execute on function public.is_web_staff() to authenticated;

-- 7) 加店员（把邮箱换成真的，可加多行）-------------------------------
--    店员账号先在 Supabase 后台 Authentication → Users → Add user 建（邮箱 + 密码），再把邮箱加进白名单：
-- insert into public.web_staff (email) values ('staff1@example.com') on conflict do nothing;
