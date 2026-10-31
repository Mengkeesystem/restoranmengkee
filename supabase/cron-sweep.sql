-- =====================================================================
-- （可选）每分钟自动清掉「超过 10 分钟没付款」的订单（2026-10-31）
-- 不跑也行：客人回来看订单、或有人打开购物车时，系统也会顺便清；跑了的话就算没人上网站，后台也不会挂着没付款的单。
-- 需要 Supabase 的 pg_cron 和 pg_net（Pro 方案有）。在 SQL Editor 跑一次；要换时间/停掉：select cron.unschedule('web-hitpay-sweep');
-- 下面的网址和 key 已经填好：就是网站 config.js 里公开的项目网址和 publishable key（不是 service_role，可以放心写在这里）。
-- =====================================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('web-hitpay-sweep', '* * * * *', $$
  select net.http_post(
    url     := 'https://kmcdokwiyetlmsrdlgqw.supabase.co/functions/v1/web-hitpay',
    headers := '{"Content-Type":"application/json","apikey":"sb_publishable_HVJ_hcFmSDU-N2kFUg5CRw_LH-X_phO"}'::jsonb,
    body    := '{"action":"sweep"}'::jsonb
  );
$$);
select jobid, jobname, schedule from cron.job where jobname = 'web-hitpay-sweep';
