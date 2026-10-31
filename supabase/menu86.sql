-- =====================================================================
-- 菜单开关 86（2026-10-31）：员工在后台把某分店的某道菜关掉（售完）/ 重新开启
-- 在明记 ERP 的 Supabase 项目 → SQL Editor 跑一次（可重复跑）。要先跑过 staff.sql（用到 web_can_see / web_is_admin）。
--   表 web_menu_86：oi = 分店序号（跟 config.js outlets 顺序一样），item = 菜单编号（例 A001），off = true 表示售完
--   web_menu_86_public()  ：客人网页每分钟读一次（只回传「售完的」和「12 小时内刚恢复的」，不含任何隐私）
--   web_menu_86_staff()   ：后台读（店员只看得到自己有权限的分店；管理员全部）
--   web_menu_86_set(p_oi, p_item, p_off) ：后台开/关。p_oi = -1 表示全部分店（只有管理员可以）
-- 全部 plpgsql（不用 language sql，避免 RLS 递归）。
-- =====================================================================
create table if not exists public.web_menu_86 (
  oi         int         not null,
  item       text        not null,
  off        boolean     not null default true,
  updated_at timestamptz not null default now(),
  updated_by text,
  primary key (oi, item)
);
alter table public.web_menu_86 enable row level security;
revoke all on public.web_menu_86 from anon, authenticated;

create or replace function public.web_menu_86_public()
returns jsonb language plpgsql security definer stable set search_path = public as $$
begin
  return coalesce((select jsonb_agg(jsonb_build_object('oi', oi, 'item', item, 'off', off, 'at', updated_at))
                   from public.web_menu_86 where off or updated_at > now() - interval '12 hours'), '[]'::jsonb);
end $$;

create or replace function public.web_menu_86_staff()
returns jsonb language plpgsql security definer stable set search_path = public as $$
begin
  if not exists (select 1 from public.web_staff where email = public.web_me_email()) then raise exception 'not staff'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('oi', oi, 'item', item, 'off', off, 'at', updated_at, 'by', updated_by))
                   from public.web_menu_86 where public.web_can_see(oi)), '[]'::jsonb);
end $$;

create or replace function public.web_menu_86_set(p_oi int, p_item text, p_off boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_by text := public.web_me_email();
begin
  if not exists (select 1 from public.web_staff where email = v_by) then raise exception 'not staff'; end if;
  if p_item is null or p_item !~ '^[A-Za-z0-9_-]{1,16}$' then raise exception 'bad item'; end if;
  if p_off is null then raise exception 'bad flag'; end if;
  if p_oi = -1 then
    if not public.web_is_admin() then raise exception 'only admin'; end if;
    insert into public.web_menu_86 (oi, item, off, updated_at, updated_by)
      select idx, p_item, p_off, now(), v_by from public.web_outlets
    on conflict (oi, item) do update set off = excluded.off, updated_at = now(), updated_by = v_by
      where public.web_menu_86.off is distinct from excluded.off;
  else
    if not exists (select 1 from public.web_outlets where idx = p_oi) then raise exception 'bad outlet'; end if;
    if not public.web_can_see(p_oi) then raise exception 'no permission'; end if;
    insert into public.web_menu_86 (oi, item, off, updated_at, updated_by) values (p_oi, p_item, p_off, now(), v_by)
    on conflict (oi, item) do update set off = excluded.off, updated_at = now(), updated_by = v_by
      where public.web_menu_86.off is distinct from excluded.off;
  end if;
end $$;

revoke all on function public.web_menu_86_public() from public;
revoke all on function public.web_menu_86_staff() from public, anon;
revoke all on function public.web_menu_86_set(int, text, boolean) from public, anon;
grant execute on function public.web_menu_86_public() to anon, authenticated;
grant execute on function public.web_menu_86_staff(), public.web_menu_86_set(int, text, boolean) to authenticated;

select count(*) as rows_in_web_menu_86 from public.web_menu_86;
