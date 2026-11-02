-- =====================================================================
-- 员工后台手机通知（2026-11-02）：存每台员工手机/电脑的推送订阅
-- 用法：Supabase → SQL Editor → 整份贴上 → Run（可重复跑）。
-- 只有 web-push 函数（service role）读写这张表；客人/店员的登录账号都碰不到（订阅里有推送密钥，不能外泄）。
-- =====================================================================
create table if not exists public.web_push_subs (
  endpoint   text primary key,
  email      text not null,
  p256dh     text not null,
  auth       text not null,
  ua         text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists web_push_subs_email_idx on public.web_push_subs (email);
alter table public.web_push_subs enable row level security;
revoke all on public.web_push_subs from anon, authenticated;
grant all on public.web_push_subs to service_role;   -- web-push 函数用（Supabase 本来就会给，这里写明白）
