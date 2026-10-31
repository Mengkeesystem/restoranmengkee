-- =====================================================================
-- 明记官网 · 员工后台权限：分店经理只看自己分店（2026-10-31）
-- 在 schema.sql、delivery.sql、hitpay.sql 之后跑。放在明记 ERP 的 Supabase 项目。⚠️ 绝不能放牛室的项目。可以重复跑。
--
-- 角色：
--   admin   = 老板和老板指定的账号：看全部分店、全部订单和每月总结，能在后台加/改/删店员
--   manager = 分店经理：只看得到 outlets 里那几间分店的订单和每月总结，只能处理那几间的订单
-- 原本已经在 web_staff 里的邮箱（例如老板本人）自动当作 admin，不受影响。
-- =====================================================================

-- 1) 店员表加角色和分店 --------------------------------------------------
alter table public.web_staff add column if not exists role     text   not null default 'admin';
alter table public.web_staff add column if not exists outlets  int[]  not null default '{}';
alter table public.web_staff add column if not exists note     text;
alter table public.web_staff add column if not exists added_at timestamptz not null default now();
alter table public.web_staff add column if not exists added_by text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'web_staff_role_chk') then
    alter table public.web_staff add constraint web_staff_role_chk check (role in ('admin','manager'));
  end if;
end $$;
update public.web_staff set email = lower(email) where email <> lower(email);

-- 2) 自取单也记下分店序号（原本只有外送单有 outlet_idx）------------------
create or replace function public.web_orders_set_outlet_idx()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.outlet_idx is null then
    select idx into new.outlet_idx from public.web_outlets where name = new.outlet limit 1;
  end if;
  return new;
end $$;
drop trigger if exists web_orders_outlet_idx on public.web_orders;
create trigger web_orders_outlet_idx before insert on public.web_orders
  for each row execute function public.web_orders_set_outlet_idx();
-- 旧订单补上
update public.web_orders o set outlet_idx = w.idx from public.web_outlets w
  where o.outlet_idx is null and w.name = o.outlet;

-- 3) 权限判断函数（全部 plpgsql，不会在 RLS 里递归）-----------------------
create or replace function public.web_me_email()
returns text language plpgsql stable set search_path = public as $$
begin
  return lower(coalesce(auth.jwt() ->> 'email', ''));
end $$;

create or replace function public.web_is_admin()
returns boolean language plpgsql security definer stable set search_path = public as $$
begin
  return exists (select 1 from public.web_staff where email = public.web_me_email() and role = 'admin');
end $$;

-- 这张单（按分店序号）我看不看得到：admin 全部；manager 只看自己的分店；分店不明的单只有 admin 看得到
create or replace function public.web_can_see(p_oi int)
returns boolean language plpgsql security definer stable set search_path = public as $$
declare s public.web_staff%rowtype;
begin
  select * into s from public.web_staff where email = public.web_me_email();
  if not found then return false; end if;
  if s.role = 'admin' then return true; end if;
  return p_oi is not null and p_oi = any(s.outlets);
end $$;

-- 后台开页时问「我是谁」：角色和可以看的分店
create or replace function public.web_staff_me()
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare s public.web_staff%rowtype;
begin
  select * into s from public.web_staff where email = public.web_me_email();
  if not found then return null; end if;
  return jsonb_build_object('email', s.email, 'role', s.role, 'outlets', to_jsonb(s.outlets));
end $$;

-- 4) 订单的读/改改成按分店 ------------------------------------------------
drop policy if exists "staff read orders"   on public.web_orders;
drop policy if exists "staff update orders" on public.web_orders;
create policy "staff read orders"   on public.web_orders for select to authenticated using (public.web_can_see(outlet_idx));
create policy "staff update orders" on public.web_orders for update to authenticated
  using (public.web_can_see(outlet_idx)) with check (public.web_can_see(outlet_idx));

-- 5) 店员管理（只有 admin 能用；不能改/删自己，免得把自己锁在外面）---------
create or replace function public.web_staff_list()
returns setof jsonb language plpgsql security definer stable set search_path = public as $$
begin
  if not public.web_is_admin() then raise exception 'only admin'; end if;
  return query select jsonb_build_object('email', email, 'role', role, 'outlets', to_jsonb(outlets), 'note', note,
    'added_at', added_at, 'added_by', added_by, 'me', email = public.web_me_email())
    from public.web_staff order by (role = 'admin') desc, email;
end $$;

create or replace function public.web_staff_save(p_email text, p_role text, p_outlets int[], p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(coalesce(p_email, ''))); v_out int[];
begin
  if not public.web_is_admin() then raise exception 'only admin'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 120 then raise exception 'bad email'; end if;
  if v_email = public.web_me_email() then raise exception 'cannot change yourself'; end if;
  if p_role not in ('admin','manager') then raise exception 'bad role'; end if;
  select coalesce(array_agg(distinct x order by x), '{}') into v_out
    from unnest(coalesce(p_outlets, '{}')) x where exists (select 1 from public.web_outlets where idx = x);
  if p_role = 'manager' and cardinality(v_out) = 0 then raise exception 'manager needs outlets'; end if;
  if p_role = 'admin' then v_out := '{}'; end if;
  insert into public.web_staff (email, role, outlets, note, added_by)
    values (v_email, p_role, v_out, left(p_note, 80), public.web_me_email())
  on conflict (email) do update set role = excluded.role, outlets = excluded.outlets, note = excluded.note;
end $$;

create or replace function public.web_staff_delete(p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(coalesce(p_email, '')));
begin
  if not public.web_is_admin() then raise exception 'only admin'; end if;
  if v_email = public.web_me_email() then raise exception 'cannot change yourself'; end if;
  delete from public.web_staff where email = v_email;
end $$;

-- 分店名单（给 admin 的店员管理选分店用）
create or replace function public.web_outlet_names()
returns setof jsonb language plpgsql security definer stable set search_path = public as $$
begin
  if not exists (select 1 from public.web_staff where email = public.web_me_email()) then raise exception 'not staff'; end if;
  return query select jsonb_build_object('idx', idx, 'name', name) from public.web_outlets order by idx;
end $$;

-- 6) 权限：函数只给登录的人；表照旧不能直接碰 --------------------------------
revoke all on public.web_staff from anon, authenticated;
revoke all on function public.web_orders_set_outlet_idx() from public, anon, authenticated;
revoke all on function public.web_me_email() from public, anon;
revoke all on function public.web_is_admin() from public, anon;
revoke all on function public.web_can_see(int) from public, anon;
revoke all on function public.web_staff_me() from public, anon;
revoke all on function public.web_staff_list() from public, anon;
revoke all on function public.web_staff_save(text, text, int[], text) from public, anon;
revoke all on function public.web_staff_delete(text) from public, anon;
revoke all on function public.web_outlet_names() from public, anon;
grant execute on function public.web_me_email(), public.web_is_admin(), public.web_can_see(int), public.web_staff_me(),
  public.web_staff_list(), public.web_staff_save(text, text, int[], text), public.web_staff_delete(text), public.web_outlet_names() to authenticated;

-- 7) 查看现在的店员（跑完可以看一眼）
select email, role, outlets, note from public.web_staff order by (role = 'admin') desc, email;
