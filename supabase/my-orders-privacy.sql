-- =====================================================================
-- 「我的订单」隐私（2026-11-02，业主决定）：按电话号码查，只显示状态
-- 以前：知道别人的电话号码，就能看到那个人最近订单的金额和订单明细（PDPA 角度属于个人资料暴露）。
-- 现在：按电话查只回传 参考号 / 时间 / 分店 / 自取外送 / 状态；金额和明细、收据只在「下单的那部手机」显示
--       （用下单时拿到的 token 向 web_my_order_detail 要，别人没有 token 拿不到）。
-- 用法：Supabase → SQL Editor → 整份贴上 → Run（可重复跑）。跑完之前，网页会照旧显示金额（旧函数）。
-- =====================================================================
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
    -- 2026-11-02 隐私（PDPA）：按电话查只回传「状态」，不回传金额和订单明细（知道别人电话也看不到什么）。
    -- 金额/明细/收据只在下单的那部手机显示：用下面的 web_my_order_detail(ref, token)，要有下单时拿到的 token 才行。
    select jsonb_build_object('ref', ref, 'at', created_at, 'outlet', outlet, 'type', order_type, 'status', status,
      'courier', case when courier_order_id is null then null else courier_status end,
      'done', completed_at is not null) x   -- 栏位在下面第 6 部分加（plpgsql 执行时才检查，同一份脚本跑完就有）
    from public.web_orders
    where public.web_norm_phone(customer_phone) = v_phone and created_at > now() - interval '30 days'
    order by created_at desc limit 20) s;
  return v_out;
end $$;

revoke all on function public.web_my_orders(text) from public;
grant execute on function public.web_my_orders(text) to anon, authenticated;

-- 金额 + 订单明细（订单讯息第一段：标题、分店、菜品、小计/SST/运费/合计；空一行之后的姓名/电话/地址不回传）
-- 要 ref + token 都对才给（token 只有下单的那部手机有）
create or replace function public.web_my_order_detail(p_ref text, p_token uuid)
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare o public.web_orders%rowtype;
begin
  select * into o from public.web_orders where ref = p_ref and token = p_token;
  if not found then return null; end if;
  return jsonb_build_object('amount', o.amount, 'detail', left(split_part(o.message, E'\n\n', 1), 3000));
end $$;
revoke all on function public.web_my_order_detail(text, uuid) from public;
grant execute on function public.web_my_order_detail(text, uuid) to anon, authenticated;

