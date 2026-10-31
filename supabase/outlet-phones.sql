-- =====================================================================
-- 3 间外送分店的电话（给 Delyva 骑手取餐时联络分店用）2026-10-31
-- 在明记 ERP 的 Supabase 项目 → SQL Editor 跑一次（可重复跑）。idx 要跟 config.js outlets 顺序一样。
-- =====================================================================
update public.web_outlets set phone = '017-2408981' where idx = 0;  -- OKR
update public.web_outlets set phone = '018-6692638' where idx = 1;  -- OKR (Scott Garden 对面)
update public.web_outlets set phone = '018-7678897' where idx = 2;  -- Kelana Jaya (PJ)
select idx, name, phone from public.web_outlets order by idx;
