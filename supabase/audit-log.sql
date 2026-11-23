-- =====================================================================
-- 操作记录 Audit log（2026-11-23，老板要求）：谁、什么时候、做了什么
-- 用法：Supabase → SQL Editor → 整份贴上 → Run（可重复跑）。跑完后，后台页头会出现「🧾 操作记录」（只有管理员看得到）。
--
-- 记什么（全部由数据库「触发器」自动记，不是网页记的——所以就算有人绕过网页直接调用 API，也照样留下记录）：
--   订单：付款成功（HitPay）、取消/拒绝（谁取消的、客人自己取消还是系统逾期）、完成 / 撤回完成、叫了骑手、骑手被取消
--   出餐拍照：谁上传了哪一张订单的照片
--   退款：谁申请退款、金额、方式（HitPay / 手动）、结果（成功 / 失败）
--   店员：新增 / 修改 / 移除店员（谁做的、给了什么角色和分店）
--   菜单开关：某分店某道菜被关掉（售完）/ 重新打开
--   登录：店员登录后台（同一个人 30 分钟内只记一次）
-- 不记：客人的下单内容、客人姓名电话地址（这些本来就在订单里，不重复存一份）。
--
-- 谁能看：只有「管理员」（web_audit_list 函数检查）。分店经理看不到，也改不了。
-- 防篡改：这张表对网页登录的人完全不开放（不能读、不能写、不能改、不能删）；
--         另有触发器连 service role 也不准改/删（append-only）。真的需要清理测试记录时，
--         老板在 SQL Editor 先 `alter table public.web_audit_log disable trigger web_audit_append_only;`，清完再 enable。
-- =====================================================================

create table if not exists public.web_audit_log (
  id         bigserial   primary key,
  at         timestamptz not null default now(),
  actor      text        not null,            -- 谁：店员邮箱；系统自动的写「系统（HitPay）」「客人」等
  action     text        not null,            -- order_paid / order_reject / order_complete / order_uncomplete / courier_dispatch / courier_cancel
                                              -- proof_upload / refund_request / refund_done / refund_failed / refund_manual
                                              -- staff_add / staff_update / staff_remove / menu_off / menu_on / login
  target     text,                            -- 对象：订单参考号 / 店员邮箱 / 菜单编号
  outlet_idx int,                             -- 哪间分店（序号，跟 config.js outlets 一样；不明就空）
  detail     text                             -- 补充说明（金额、角色、原因…）
);
create index if not exists web_audit_log_at_idx     on public.web_audit_log (at desc);
create index if not exists web_audit_log_actor_idx  on public.web_audit_log (actor, at desc);
create index if not exists web_audit_log_target_idx on public.web_audit_log (target);
alter table public.web_audit_log enable row level security;
revoke all on public.web_audit_log from anon, authenticated;
revoke all on sequence public.web_audit_log_id_seq from anon, authenticated;

-- 只增不改不删 ---------------------------------------------------------
create or replace function public.web_audit_append_only() returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'audit_log_append_only: 操作记录只能新增，不能修改或删除';
end $$;
drop trigger if exists web_audit_append_only on public.web_audit_log;
create trigger web_audit_append_only before update or delete on public.web_audit_log
  for each row execute function public.web_audit_append_only();
revoke all on function public.web_audit_append_only() from public, anon, authenticated;

-- 「谁」：有登录就用登录邮箱；没有就用 fallback（例如订单里写的 confirmed_by）；
--        你自己在 SQL Editor 手动改的，写「SQL 后台（老板手动）」；其余写「系统」 -------------
create or replace function public.web_audit_actor(p_fallback text default null) returns text language plpgsql stable set search_path = public as $$
declare v text;
begin
  v := lower(coalesce(nullif(auth.jwt() ->> 'email', ''), ''));
  if v <> '' then return v; end if;
  if nullif(btrim(coalesce(p_fallback, '')), '') is not null then return left(btrim(p_fallback), 120); end if;
  if session_user in ('postgres', 'supabase_admin') then return 'SQL 后台（老板手动）'; end if;
  return '系统';
end $$;
revoke all on function public.web_audit_actor(text) from public, anon, authenticated;

create or replace function public.web_audit_add(p_actor text, p_action text, p_target text, p_outlet int, p_detail text) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.web_audit_log (actor, action, target, outlet_idx, detail)
  values (left(coalesce(p_actor, '系统'), 120), p_action, left(p_target, 120), p_outlet, left(p_detail, 400));
end $$;
revoke all on function public.web_audit_add(text, text, text, int, text) from public, anon, authenticated;

-- 1) 订单 --------------------------------------------------------------
create or replace function public.web_audit_orders() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status is distinct from new.status then
    if new.status = 'paid' then
      perform public.web_audit_add(public.web_audit_actor(coalesce(new.confirmed_by, '系统（HitPay）')), 'order_paid', new.ref, new.outlet_idx,
        'RM ' || new.amount::text || coalesce(' · ' || new.pay_method, '') || ' · ' || coalesce(new.order_type, ''));
    elsif new.status = 'rejected' then
      perform public.web_audit_add(public.web_audit_actor(new.confirmed_by), 'order_reject', new.ref, new.outlet_idx,
        'RM ' || new.amount::text || ' · ' || coalesce(new.confirmed_by, '') || ' · 原状态 ' || coalesce(old.status, ''));
    else
      perform public.web_audit_add(public.web_audit_actor(new.confirmed_by), 'order_status', new.ref, new.outlet_idx, coalesce(old.status, '') || ' → ' || new.status);
    end if;
  end if;
  if old.completed_at is null and new.completed_at is not null then
    perform public.web_audit_add(public.web_audit_actor(new.completed_by), 'order_complete', new.ref, new.outlet_idx, 'RM ' || new.amount::text || ' · ' || coalesce(new.completed_by, ''));
  elsif old.completed_at is not null and new.completed_at is null then
    perform public.web_audit_add(public.web_audit_actor(null), 'order_uncomplete', new.ref, new.outlet_idx, '撤回「已完成」');
  end if;
  if old.courier_order_id is null and new.courier_order_id is not null then
    perform public.web_audit_add(public.web_audit_actor('系统（叫骑手）'), 'courier_dispatch', new.ref, new.outlet_idx,
      coalesce(new.courier_service, '') || case when new.courier_fee is null then '' else ' · 运费成本 RM ' || new.courier_fee::text end);
  end if;
  if old.courier_status is distinct from new.courier_status and new.courier_status = 900 then
    perform public.web_audit_add(public.web_audit_actor('系统（骑手通知）'), 'courier_cancel', new.ref, new.outlet_idx, '骑手单被取消（900）');
  end if;
  return null;
end $$;
revoke all on function public.web_audit_orders() from public, anon, authenticated;
drop trigger if exists web_audit_orders on public.web_orders;
create trigger web_audit_orders after update on public.web_orders
  for each row
  when (old.status is distinct from new.status
        or old.completed_at is distinct from new.completed_at
        or (old.courier_order_id is null and new.courier_order_id is not null)
        or (old.courier_status is distinct from new.courier_status and new.courier_status = 900))
  execute function public.web_audit_orders();

-- 2) 出餐拍照 / 3) 退款（这两张表是 verify-refund.sql 建的；没跑那份就先跳过）---------------------
do $$
begin
  if to_regclass('public.web_order_proofs') is not null then
    create or replace function public.web_audit_proofs() returns trigger language plpgsql security definer set search_path = public as $f$
    declare o record;
    begin
      select ref, outlet_idx into o from public.web_orders where id = new.order_id;
      perform public.web_audit_add(public.web_audit_actor(new.created_by), 'proof_upload', o.ref, o.outlet_idx, '上传出餐照片');
      return null;
    end $f$;
    revoke all on function public.web_audit_proofs() from public, anon, authenticated;
    drop trigger if exists web_audit_proofs on public.web_order_proofs;
    create trigger web_audit_proofs after insert on public.web_order_proofs for each row execute function public.web_audit_proofs();
  end if;
  if to_regclass('public.web_refunds') is not null then
    create or replace function public.web_audit_refunds() returns trigger language plpgsql security definer set search_path = public as $f$
    declare o record; v_action text;
    begin
      select ref, outlet_idx into o from public.web_orders where id = new.order_id;
      if tg_op = 'INSERT' then
        v_action := case when new.status = 'manual' then 'refund_manual' else 'refund_request' end;
        perform public.web_audit_add(public.web_audit_actor(new.created_by), v_action, o.ref, o.outlet_idx,
          'RM ' || new.amount::text || ' · ' || case new.mode when 'manual' then '手动退款（自己转账）' else 'HitPay 自动退款' end || ' · 原因：' || coalesce(new.reason, ''));
      elsif new.status is distinct from old.status and new.status in ('done', 'failed') then
        perform public.web_audit_add(public.web_audit_actor(new.created_by), 'refund_' || new.status, o.ref, o.outlet_idx,
          'RM ' || new.amount::text || case when new.status = 'failed' then ' · ' || coalesce(left(new.error, 120), '') else '' end);
      end if;
      return null;
    end $f$;
    revoke all on function public.web_audit_refunds() from public, anon, authenticated;
    drop trigger if exists web_audit_refunds on public.web_refunds;
    create trigger web_audit_refunds after insert or update on public.web_refunds for each row execute function public.web_audit_refunds();
  end if;
end $$;

-- 4) 店员 --------------------------------------------------------------
create or replace function public.web_audit_staff() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.web_audit_add(public.web_audit_actor(null), 'staff_add', new.email, null,
      case new.role when 'admin' then '管理员' else '分店经理 · 分店序号 ' || coalesce(array_to_string(new.outlets, ','), '') end || coalesce(' · ' || new.note, ''));
  elsif tg_op = 'UPDATE' then
    if old.role is distinct from new.role or old.outlets is distinct from new.outlets or old.note is distinct from new.note then
      perform public.web_audit_add(public.web_audit_actor(null), 'staff_update', new.email, null,
        case old.role when 'admin' then '管理员' else '经理[' || coalesce(array_to_string(old.outlets, ','), '') || ']' end || ' → ' ||
        case new.role when 'admin' then '管理员' else '经理[' || coalesce(array_to_string(new.outlets, ','), '') || ']' end);
    end if;
  else
    perform public.web_audit_add(public.web_audit_actor(null), 'staff_remove', old.email, null, '移除店员（原来是' || case old.role when 'admin' then '管理员' else '分店经理' end || '）');
  end if;
  return null;
end $$;
revoke all on function public.web_audit_staff() from public, anon, authenticated;
drop trigger if exists web_audit_staff on public.web_staff;
create trigger web_audit_staff after insert or update or delete on public.web_staff for each row execute function public.web_audit_staff();

-- 5) 菜单开关 ----------------------------------------------------------
do $$
begin
  if to_regclass('public.web_menu_86') is not null then
    create or replace function public.web_audit_menu86() returns trigger language plpgsql security definer set search_path = public as $f$
    begin
      if (tg_op = 'INSERT' and new.off) or (tg_op = 'UPDATE' and old.off is distinct from new.off) then
        perform public.web_audit_add(public.web_audit_actor(new.updated_by), case when new.off then 'menu_off' else 'menu_on' end, new.item, new.oi,
          case when new.off then '关掉（售完）' else '重新打开' end);
      end if;
      return null;
    end $f$;
    revoke all on function public.web_audit_menu86() from public, anon, authenticated;
    drop trigger if exists web_audit_menu86 on public.web_menu_86;
    create trigger web_audit_menu86 after insert or update on public.web_menu_86 for each row execute function public.web_audit_menu86();
  end if;
end $$;

-- 6) 登录（后台开页时调一次；同一个人 30 分钟内只记一次）-------------------------
create or replace function public.web_audit_login() returns void language plpgsql security definer set search_path = public as $$
declare v_email text := public.web_me_email();
begin
  if v_email = '' or not exists (select 1 from public.web_staff where email = v_email) then return; end if;
  if exists (select 1 from public.web_audit_log where actor = v_email and action = 'login' and at > now() - interval '30 minutes') then return; end if;
  insert into public.web_audit_log (actor, action, target, detail) values (v_email, 'login', v_email, '登录后台');
end $$;
revoke all on function public.web_audit_login() from public, anon;
grant execute on function public.web_audit_login() to authenticated;

-- 7) 读取（只有管理员）-----------------------------------------------------
create or replace function public.web_audit_list(p_limit int default 300, p_before bigint default null, p_actor text default null, p_action text default null, p_q text default null)
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare v_q text := nullif(btrim(coalesce(p_q, '')), '');
begin
  if not public.web_is_admin() then raise exception 'only admin'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'at', at, 'actor', actor, 'action', action, 'target', target, 'outlet', outlet_idx, 'detail', detail) order by id desc)
    from (
      select * from public.web_audit_log
      where (p_before is null or id < p_before)
        and (nullif(p_actor, '') is null or actor = lower(p_actor))
        and (nullif(p_action, '') is null or action = p_action or action like p_action || '\_%')
        and (v_q is null or target ilike '%' || v_q || '%' or detail ilike '%' || v_q || '%' or actor ilike '%' || v_q || '%')
      order by id desc
      limit greatest(1, least(coalesce(p_limit, 300), 1000))
    ) t
  ), '[]'::jsonb);
end $$;
revoke all on function public.web_audit_list(int, bigint, text, text, text) from public, anon;
grant execute on function public.web_audit_list(int, bigint, text, text, text) to authenticated;
