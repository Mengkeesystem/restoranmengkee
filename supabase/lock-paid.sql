-- =====================================================================
-- 「已收款」锁（2026-11-02）：登录的店员 / 任何人都不能自己把订单改成已收款
-- 为什么：官网所有订单都走 HitPay，「已收款」只该由 web-hitpay 在 HitPay 通知（验过签名）之后自动设定。
--   以前店员后台有一颗手动「已收款」按钮；而建单函数是公开的，任何人都能建出一张假的待确认订单，
--   外送单按下「已收款」还会自动叫骑手（白扣骑手费）。现在按钮拿掉了，这里在数据库再挡一层，
--   就算有人绕过网页直接调用 API 也改不了。
-- 不受影响：web-hitpay / web-delyva（用 service role）、你自己在 SQL Editor 里手动改（需要时的紧急办法）。
-- 用法：Supabase → SQL Editor → 整份贴上 → Run（可重复跑）。
-- =====================================================================
create or replace function public.web_orders_lock_paid() returns trigger language plpgsql set search_path = public as $$
declare v_role text;
begin
  v_role := coalesce(nullif(current_setting('request.jwt.claim.role', true), ''),
                     nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', ''), '');
  if new.status = 'paid' and old.status is distinct from 'paid' and v_role in ('anon', 'authenticated') then
    raise exception 'paid_locked: 已收款只能由 HitPay 付款通知自动确认';
  end if;
  return new;
end $$;
drop trigger if exists web_orders_lock_paid on public.web_orders;
create trigger web_orders_lock_paid before update on public.web_orders
  for each row execute function public.web_orders_lock_paid();
revoke all on function public.web_orders_lock_paid() from public, anon, authenticated;
