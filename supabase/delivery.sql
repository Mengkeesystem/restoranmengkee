-- =====================================================================
-- 明记官网 · 外送自动叫骑手（Delyva）—— 数据库部分
-- ---------------------------------------------------------------------
-- 用法：明记 ERP 的 Supabase 项目（明记_ERP_1.0）→ SQL Editor → 贴上整份 → Run。
--      要先跑过 schema.sql。可重复执行。只动 web_ 开头的东西，不碰 ERP。
-- ⚠️ 绝对不能在牛室 Beef House 的项目里跑。
--
-- 做什么：
--   1) web_orders 加外送资料（送餐地址/坐标/出餐分店）和骑手状态栏位
--   2) web_outlets：出餐分店的取货地址/坐标/电话（给 Delyva 用），只有后台程序读得到
--   3) create_web_order 多一个 p_dest（外送资料），并检查坐标在雪隆/芙蓉范围内
-- Delyva 的 API key 不放这里，放 Edge Function 的 Secrets（WEB_DELYVA_*）。
-- =====================================================================

-- 1) 订单表加栏位 -------------------------------------------------------
alter table public.web_orders
  add column if not exists outlet_idx         int,
  add column if not exists dest               jsonb,          -- {address, unit, note, lat, lng, km, items}
  add column if not exists courier            text,           -- 'delyva'
  add column if not exists courier_order_id   text,
  add column if not exists courier_tracking   text,           -- consignmentNo
  add column if not exists courier_service    text,
  add column if not exists courier_fee        numeric(10,2),
  add column if not exists courier_status     int,            -- Delyva statusCode
  add column if not exists courier_rider      jsonb,          -- personnel（骑手名字/电话/车牌）
  add column if not exists courier_error      text,
  add column if not exists courier_updated_at timestamptz;
create index if not exists web_orders_courier_idx on public.web_orders (courier_order_id);

-- 店员只能改 status/confirmed_at/confirmed_by（schema.sql 已设定）；骑手栏位只有后台程序（service role）能写。

-- 2) 出餐分店资料 -------------------------------------------------------
create table if not exists public.web_outlets (
  idx       int primary key,                 -- 跟 config.js outlets 的顺序一样（0 开始）
  name      text not null,
  name_en   text,
  delivery  boolean not null default false,
  address   text not null,
  postcode  text,
  city      text,
  state     text,
  lat       double precision,
  lng       double precision,
  phone     text                              -- 骑手联络用（还没填就用 Secrets 的 WEB_DELYVA_SENDER_PHONE）
);
alter table public.web_outlets enable row level security;
revoke all on public.web_outlets from anon, authenticated;

insert into public.web_outlets (idx, name, name_en, delivery, address, postcode, city, state, lat, lng) values
  (0, 'OKR', 'OKR', true, '97, Jln Klang Lama, Batu 3, 58100 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur', '58100', 'Kuala Lumpur', 'Kuala Lumpur', 3.1064, 101.6765),
  (1, 'OKR (Scott Garden 对面)', 'OKR (opposite Scott Garden)', true, 'Restaurant Meng Kee, opposite Scott Garden, Jln Klang Lama, 58200 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur', '58200', 'Kuala Lumpur', 'Kuala Lumpur', 3.0954, 101.6738),
  (2, 'Kelana Jaya (PJ)', 'Kelana Jaya (PJ)', true, '15, Jalan SS 4d/2, SS 4, 47301 Petaling Jaya, Selangor', '47301', 'Petaling Jaya', 'Selangor', 3.1119, 101.5996),
  (3, 'Cheras (Damai Perdana)', 'Cheras (Damai Perdana)', false, '23-G, Jalan Damai Perdana 1/9d, Bandar Damai Perdana, 43200 Cheras, Selangor', '43200', 'Cheras', 'Selangor', 3.0458, 101.7419),
  (4, 'Kajang', 'Kajang', false, '13-G, Jln Besar Bukit Angkat, Bukit Angkat, 43000 Kajang, Selangor', '43000', 'Kajang', 'Selangor', 3.0034, 101.7629),
  (5, 'Puchong', 'Puchong', false, '10, Jalan Kenari 12a, Bandar Puchong Jaya, 47100 Puchong, Selangor', '47100', 'Puchong', 'Selangor', 3.0454, 101.6212),
  (6, 'Subang', 'Subang', false, '22, Jalan USJ 11/3j, USJ 11, 47620 Subang Jaya, Selangor', '47620', 'Subang Jaya', 'Selangor', 3.0423, 101.5835),
  (7, 'Klang (Bayu Tinggi)', 'Klang (Bayu Tinggi)', false, '2-G, Jln Bayu Tinggi 2a, Taman Bayu Perdana, 41200 Klang, Selangor', '41200', 'Klang', 'Selangor', 3.0163, 101.4332),
  (8, 'Bukit Rimau', 'Bukit Rimau', false, '2-G, Jln Sungai Burung Y 32/Y, Bukit Rimau, 40460 Shah Alam, Selangor', '40460', 'Shah Alam', 'Selangor', 2.9972, 101.5312),
  (9, 'Setia Alam', 'Setia Alam', false, '41-G, Jalan Setia Utama AT U13/AT, Alam Nusantara, 40170 Shah Alam, Selangor', '40170', 'Shah Alam', 'Selangor', 3.1251, 101.4646),
  (10, 'Seremban 2', 'Seremban 2', false, 'Pusat Dagangan, 325-G, Jalan S2 B28, Seremban 2, 70300 Seremban, Negeri Sembilan', '70300', 'Seremban', 'Negeri Sembilan', 2.6953, 101.9067)
on conflict (idx) do update set name=excluded.name, name_en=excluded.name_en, delivery=excluded.delivery, address=excluded.address,
  postcode=excluded.postcode, city=excluded.city, state=excluded.state, lat=excluded.lat, lng=excluded.lng;
-- 分店电话（之后业主给了再跑，例如）：
-- update public.web_outlets set phone='0312345678' where idx=0;

-- 3) 建单函数加外送资料 -------------------------------------------------
drop function if exists public.create_web_order(text,text,text,text,text,numeric,text);
create or replace function public.create_web_order(
  p_ref text, p_outlet text, p_type text, p_name text, p_phone text, p_amount numeric, p_message text, p_dest jsonb default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_token uuid; v_lat double precision; v_lng double precision; v_oi int; v_dest jsonb;
begin
  if p_ref is null or p_ref !~ '^MK[0-9]{4}-[0-9]{4}$' then raise exception 'bad ref'; end if;
  if p_amount is null or p_amount <= 0 or p_amount >= 10000 then raise exception 'bad amount'; end if;
  if p_type not in ('pickup','delivery') then raise exception 'bad type'; end if;
  if p_phone is null or regexp_replace(p_phone, '[^0-9]', '', 'g') !~ '^[0-9]{8,15}$' then raise exception 'bad phone'; end if;
  if p_message is null or length(p_message) < 10 then raise exception 'bad message'; end if;
  if p_type = 'delivery' then
    if p_dest is null or jsonb_typeof(p_dest) <> 'object' then raise exception 'bad dest'; end if;
    v_lat := (p_dest->>'lat')::double precision; v_lng := (p_dest->>'lng')::double precision; v_oi := (p_dest->>'oi')::int;
    if v_lat is null or v_lng is null or v_lat < 2.45 or v_lat > 3.45 or v_lng < 101.25 or v_lng > 102.15 then raise exception 'bad dest location'; end if;
    if not exists (select 1 from public.web_outlets where idx = v_oi and delivery) then raise exception 'bad dest outlet'; end if;
    if length(coalesce(p_dest->>'address','')) < 5 then raise exception 'bad dest address'; end if;
    v_dest := jsonb_build_object(
      'address', left(p_dest->>'address', 300), 'unit', left(coalesce(p_dest->>'unit',''), 80), 'note', left(coalesce(p_dest->>'note',''), 200),
      'lat', round(v_lat::numeric, 6), 'lng', round(v_lng::numeric, 6),
      'km', case when (p_dest->>'km') ~ '^[0-9]+(\.[0-9]+)?$' then (p_dest->>'km')::numeric else null end,
      'items', case when (p_dest->>'items') ~ '^[0-9]{1,3}$' then (p_dest->>'items')::int else null end);
  end if;
  -- 防洗单：同一个电话 10 分钟内最多 3 笔待确认；全站每分钟最多 60 笔
  if (select count(*) from public.web_orders
      where status = 'pending' and created_at > now() - interval '10 minutes'
        and regexp_replace(customer_phone, '[^0-9]', '', 'g') = regexp_replace(p_phone, '[^0-9]', '', 'g')) >= 3 then
    raise exception 'too many pending orders for this phone';
  end if;
  if (select count(*) from public.web_orders where created_at > now() - interval '1 minute') >= 60 then
    raise exception 'too many orders, try again later';
  end if;
  insert into public.web_orders (ref, outlet, order_type, customer_name, customer_phone, amount, message, outlet_idx, dest)
  values (p_ref, left(p_outlet, 80), left(p_type, 20), left(p_name, 80), left(p_phone, 30), round(p_amount, 2), left(p_message, 5900), v_oi, v_dest)
  returning token into v_token;
  return v_token;
end $$;

revoke all on function public.create_web_order(text,text,text,text,text,numeric,text,jsonb) from public;
grant execute on function public.create_web_order(text,text,text,text,text,numeric,text,jsonb) to anon, authenticated;

-- 4) 客人查骑手进度（2026-10-28）-----------------------------------------
-- 客人网页用 ref + token 查自己那笔订单的骑手状态；只回传客人需要看的栏位
-- （不含地址、金额、店员资料、Delyva 订单号）。
alter table public.web_orders add column if not exists courier_track_url text;

create or replace function public.web_order_track(p_ref text, p_token uuid)
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare o public.web_orders%rowtype;
begin
  select * into o from public.web_orders where ref = p_ref and token = p_token;
  if not found then return jsonb_build_object('status', 'notfound'); end if;
  return jsonb_build_object(
    'status', o.status,
    'type', o.order_type,
    'done', o.completed_at is not null,   -- 栏位在第 6 部分加；店员按完成或 Delyva 送达
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

-- 5) 客人用电话查「我的订单」（2026-10-28）-------------------------------
-- 只回传：参考号、时间、分店、自取/外送、金额、付款状态、骑手状态码、菜品与金额明细。
-- 不回传姓名、电话、地址、备注、token（拿到参考号也查不到骑手资料/追踪链接）。
-- 防乱查：同一个 IP 10 分钟最多 10 次、全站 10 分钟最多 600 次；只查最近 30 天、最多 20 笔。
create table if not exists public.web_lookup_log (
  id bigserial primary key,
  ip text,
  at timestamptz not null default now()
);
create index if not exists web_lookup_log_at_idx on public.web_lookup_log (at);
alter table public.web_lookup_log enable row level security;
revoke all on public.web_lookup_log from anon, authenticated;

create or replace function public.web_norm_phone(p text)
returns text language plpgsql immutable set search_path = public as $$
declare d text := regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g');
begin
  if d like '60%' then d := '0' || substr(d, 3); end if;   -- +60 12-345 6789 = 012-345 6789
  return d;
end $$;
revoke all on function public.web_norm_phone(text) from public;

create or replace function public.web_my_orders(p_phone text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_phone text := public.web_norm_phone(p_phone); v_ip text; v_out jsonb;
begin
  if v_phone !~ '^0[0-9]{8,10}$' then raise exception 'bad phone'; end if;
  begin
    v_ip := split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1);
  exception when others then v_ip := '';
  end;
  delete from public.web_lookup_log where at < now() - interval '1 day';
  if (select count(*) from public.web_lookup_log where ip = v_ip and at > now() - interval '10 minutes') >= 10 then
    raise exception 'too many lookups, try again later';
  end if;
  if (select count(*) from public.web_lookup_log where at > now() - interval '10 minutes') >= 600 then
    raise exception 'too many lookups, try again later';
  end if;
  insert into public.web_lookup_log (ip) values (v_ip);
  select coalesce(jsonb_agg(x order by x->>'at' desc), '[]'::jsonb) into v_out from (
    select jsonb_build_object('ref', ref, 'at', created_at, 'outlet', outlet, 'type', order_type, 'amount', amount, 'status', status,
      'courier', case when courier_order_id is null then null else courier_status end,
      'done', completed_at is not null,   -- 栏位在下面第 6 部分加（plpgsql 执行时才检查，同一份脚本跑完就有）
      -- 订单讯息第一段（标题、分店、菜品、小计/SST/运费/合计），空一行之后的姓名/电话/地址不回传
      'detail', left(split_part(message, E'\n\n', 1), 3000)) x
    from public.web_orders
    where public.web_norm_phone(customer_phone) = v_phone and created_at > now() - interval '30 days'
    order by created_at desc limit 20) s;
  return v_out;
end $$;

revoke all on function public.web_my_orders(text) from public;
grant execute on function public.web_my_orders(text) to anon, authenticated;

-- 6) 已完成（2026-10-28）------------------------------------------------
-- 外送：Delyva 通知送达（700/1000）时由 web-delyva 自动填；自取：店员在后台按「完成」。
alter table public.web_orders
  add column if not exists completed_at timestamptz,
  add column if not exists completed_by text;
grant update (completed_at, completed_by) on public.web_orders to authenticated;   -- 仍受 RLS 限制（只有白名单店员）
update public.web_orders set completed_at = coalesce(courier_updated_at, now()), completed_by = 'Delyva'
  where completed_at is null and status = 'paid' and courier_status in (700, 1000);

-- 7) 权限收紧（2026-10-28 安全检查）---------------------------------------
-- Supabase 会自动把新表/新函数的全部权限给 anon、authenticated（所有登录账号，包括一般 ERP 员工）。
-- RLS 已经挡住了，这里再把用不到的权限收回（多一层保险）：
revoke all on public.web_orders from anon, authenticated;
grant select on public.web_orders to authenticated;                                                  -- 仍受 RLS：只有 web_staff 看得到
grant update (status, confirmed_at, confirmed_by, completed_at, completed_by) on public.web_orders to authenticated;   -- 店员只能改状态，改不了金额/内容
revoke all on public.web_staff, public.web_outlets, public.web_lookup_log from anon, authenticated;
revoke all on function public.is_web_staff() from public, anon;
grant execute on function public.is_web_staff() to authenticated;
revoke all on function public.web_norm_phone(text) from public, anon, authenticated;
