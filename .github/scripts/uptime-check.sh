#!/usr/bin/env bash
# 逐项检查 .github/uptime-targets.txt（名称|网址|必须出现的字|apikey，后两项可空）：HTTP 要 200，而且页面里要有指定的字。每项最多试 3 次（避免偶尔网络抖动误报）。
# 结果写进 $REPORT（默认 /tmp/uptime-report.md，给报警用）；有任何一项不正常 → 结束码 1。
set -u
TARGETS="${TARGETS_FILE:-.github/uptime-targets.txt}"
REPORT="${REPORT:-/tmp/uptime-report.md}"
SLEEP="${RETRY_SLEEP:-10}"        # 重试间隔（秒）
TMO="${CURL_TIMEOUT:-15}"         # 每次请求最多等几秒
# Supabase 的 publishable key（本来就公开在 config.js 里）；函数没关 Verify JWT 时也能通
APIKEY="sb_publishable_HVJ_hcFmSDU-N2kFUg5CRw_LH-X_phO"
: > "$REPORT"; bad=0; total=0
body="$(mktemp)"
while IFS='|' read -r name url kw key; do
  case "$name" in ''|\#*) continue;; esac
  total=$((total+1)); ok=0; why=""
  for try in 1 2 3; do
    hdr=(); if [ -n "${key:-}" ]; then hdr=(-H "apikey: $key"); else case "$url" in *kmcdokwiyetlmsrdlgqw.supabase.co*) hdr=(-H "apikey: $APIKEY");; esac; fi
    code=$(curl -sS -m "$TMO" -o "$body" -w '%{http_code}' "${hdr[@]}" "$url" 2>/tmp/uptime-curl-err) || code="000"
    if [ "$code" = "200" ] && { [ -z "$kw" ] || grep -qF -- "$kw" "$body"; }; then ok=1; break; fi
    if [ "$code" = "000" ]; then why="连不上（$(tr -d '\n' </tmp/uptime-curl-err | cut -c1-120)）"
    elif [ "$code" != "200" ]; then why="HTTP $code：$(tr -d '\n' <"$body" | cut -c1-300)"
    else why="页面打得开，但内容不对（找不到「$kw」）：$(tr -d '\n' <"$body" | cut -c1-200)"; fi
    [ "$try" -lt 3 ] && sleep "$SLEEP"
  done
  if [ "$ok" = 1 ]; then echo "✅ $name"; else bad=$((bad+1)); echo "❌ $name — $why"; printf -- '- ❌ **%s** — %s\n  `%s`\n' "$name" "$why" "$url" >> "$REPORT"; fi
done < "$TARGETS"
rm -f "$body"
echo "共 $total 项，$bad 项有问题"
[ "$bad" -eq 0 ]
