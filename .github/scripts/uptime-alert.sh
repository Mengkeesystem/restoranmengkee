#!/usr/bin/env bash
# 监控结果 → 报警。用法：uptime-alert.sh <success|failure>
# 只在「状态变化」时通知，不会每 10 分钟吵一次：
#   出问题的第一次 → 开一个 Issue（@ 你，GitHub 会发电邮 + 手机 App 推送）+ 这次运行标红（再发一封失败通知）
#   一直没好 → 不重复通知（仍然在那个 Issue 里）
#   恢复正常 → 在 Issue 里留言「已恢复」并关掉（又通知一次）
set -u
OUTCOME="${1:-success}"; REPORT="${REPORT:-/tmp/uptime-report.md}"; ALERT_USER="${ALERT_USER:-}"
TITLE="🚨 明记网站监控报警"
RUN_URL="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-0}"
existing=$(gh issue list --state open --limit 50 --json number,title --jq ".[] | select(.title==\"$TITLE\") | .number" 2>/dev/null | head -1)
if [ "$OUTCOME" = "failure" ]; then
  [ -n "${GITHUB_STEP_SUMMARY:-}" ] && { echo "## 监控发现问题"; cat "$REPORT"; } >> "$GITHUB_STEP_SUMMARY"
  if [ -n "$existing" ]; then echo "仍然有问题，已经报警过（Issue #$existing），这次不重复通知"; exit 0; fi
  mention=""; [ -n "$ALERT_USER" ] && mention="@$ALERT_USER "
  body="${mention}监控发现下面的项目不正常（每次检查已经重试 3 次）：

$(cat "$REPORT")

- 发现时间：$(TZ=Asia/Kuala_Lumpur date '+%Y-%m-%d %H:%M') 吉隆坡时间
- 这次检查的详情：$RUN_URL

**怎么办**：先打开官网和员工后台看看；函数有问题就到 Supabase → Edge Functions → 那个函数 → Logs 看错误。恢复正常后，这个 Issue 会自动关闭。"
  if gh issue create --title "$TITLE" --body "$body" ${ALERT_USER:+--assignee "$ALERT_USER"} 2>/dev/null \
     || gh issue create --title "$TITLE" --body "$body"; then echo "已开报警 Issue"; exit 1
  else echo "::error::开 Issue 失败（仓库可能关掉了 Issues），只能靠这次运行失败的通知"; exit 1; fi
else
  if [ -n "$existing" ]; then
    gh issue comment "$existing" --body "✅ 已恢复正常（$(TZ=Asia/Kuala_Lumpur date '+%Y-%m-%d %H:%M') 吉隆坡时间）。检查详情：$RUN_URL" && gh issue close "$existing" --reason completed
    echo "已恢复，Issue #$existing 已关闭"
  else echo "一切正常"; fi
fi
