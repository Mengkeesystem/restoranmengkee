-- =====================================================================
-- 明记官网 · HitPay 网上付款（2026-10-30）—— 在 schema.sql、delivery.sql 之后跑
-- 放在明记 ERP 的 Supabase 项目。⚠️ 绝不能放牛室的项目。可以重复跑。
--
-- 只在 web_orders 加付款栏位，并让客人查进度时看得到付款状态。
-- 这些栏位只有 web-hitpay（service role）会写；店员和客人都改不了。
-- =====================================================================

alter table public.web_orders add column if not exists pay_provider text;          -- 'hitpay'；空 = 旧的 QR 转账（店员人工核对）
alter table public.web_orders add column if not exists pay_acct     text;          -- 用哪个 HitPay 账号：'d' = 共用账号，数字 = 那间分店自己的账号
alter table public.web_orders add column if not exists pay_id       text;          -- HitPay payment request id
alter table public.web_orders add column if not exists pay_url      text;          -- HitPay 付款页网址
alter table public.web_orders add column if not exists pay_status   text;          -- pending / completed / failed / mismatch …
alter table public.web_orders add column if not exists pay_method   text;          -- card / fpx / touch_n_go / grabpay …（HitPay 回传）
alter table public.web_orders add column if not exists pay_fees     numeric(10,2); -- HitPay 手续费（店家吸收，每月总结用）
alter table public.web_orders add column if not exists paid_amount  numeric(10,2);
alter table public.web_orders add column if not exists paid_at      timestamptz;
create index if not exists web_orders_pay_id_idx on public.web_orders (pay_id);

-- 客人查进度：多回传付款方式与付款状态（不回传付款页网址、手续费）
create or replace function public.web_order_track(p_ref text, p_token uuid)
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare o public.web_orders%rowtype;
begin
  select * into o from public.web_orders where ref = p_ref and token = p_token;
  if not found then return jsonb_build_object('status', 'notfound'); end if;
  return jsonb_build_object(
    'status', o.status,
    'type', o.order_type,
    'done', o.completed_at is not null,
    'pay', case when o.pay_provider is null then null else jsonb_build_object('provider', o.pay_provider, 'status', o.pay_status, 'method', o.pay_method) end,
    'courier', case when o.courier_order_id is null then null else jsonb_build_object(
      'status', o.courier_status,
      'service', o.courier_service,
      'track', o.courier_track_url,
      'rider', case when o.courier_rider is null then null else jsonb_build_object(
        'name', o.courier_rider->>'name', 'phone', o.courier_rider->>'phone', 'plate', o.courier_rider->>'plate') end,
      'updated', o.courier_updated_at) end);
end $$;
revoke all on function public.web_order_track(text, uuid) from public;
grant execute on function public.web_order_track(text, uuid) to anon, authenticated;

-- 权限：店员照旧只能改 status/confirmed_*/completed_*（付款栏位改不了）
revoke all on public.web_orders from anon, authenticated;
grant select on public.web_orders to authenticated;
grant update (status, confirmed_at, confirmed_by, completed_at, completed_by) on public.web_orders to authenticated;
