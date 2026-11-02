# 测试脚本（2026-10-31 从旧的临时目录搬进仓库，方便换 Claude 账号后继续用）

都用 **Playwright**（沙箱里 `require('playwright')` 直接能用，浏览器在 `/opt/pw-browsers/chromium`，**不要**另外装）。
先在仓库根目录开本地网站：`python3 -m http.server 8765`（注意：每个 Bash 调用结束服务可能被杀，**同一条命令里启动再测**）。

## tests/hitpay/（后台程序 + 网页下单流程，全部用模拟的 Supabase / HitPay / Delyva，不会碰真服务）
| 文件 | 用途 |
|---|---|
| `harness.mjs` | 模拟环境：内存订单表 + 网站 config + 模拟 Delyva 报价 + 模拟 HitPay；直接载入 `supabase/functions/web-hitpay/index.ts` |
| `t1.mjs` | web-hitpay 31 项（金额对/改金额/错 token/没开分店/假菜 id/客制化备注/外送重新报价/check/webhook 真假签名/过期/不外泄 key…） |
| `e2e.mjs` | 真网页（手机宽度）+ 真后台程序：自取+客制化+优惠码、外送+运费 → 跳 HitPay → 回来自动已收款，金额网页与后台要完全一致 |
| `t3.mjs` | **待付款订单**：继续付款换付款方式、旧付款单作废、客人取消、取消时其实已付款、逾期自动作废、逾期但已付款照收（用真 config.js；期望 16 个 ✅（逾期用 40 分钟前，10 分钟规则下也成立）、0 个 ❌；跑法同 t1 但不用 HP_CFG，`FAKE_AT=2026-10-30T12:30:00+08:00`） |
| `t5.mjs` | **退款**：只有管理员能退、金额上限不能超退、HitPay 退款 API、HitPay 拒绝后改手动记录、failed 不占额度（期望 19 个 ✅，跑法同 t3） |
| `t6.mjs` | **手机通知**：付款成功通知员工一次、金额对不上/客人付了款但订单被取消/叫骑手失败 → 提醒、web-push 当机不影响收款、`?health=1`（期望 12 个 ✅；跑法同 t3） |
| `t7.mjs` | **web-push 函数本身**：订阅（防乱填网址/SSRF、不在名单的账号）、谁会收到（管理员/分店经理/旧单）、内容没有客人资料、死订阅自动清、测试通知、没设密钥（期望 36 个 ✅；`node --experimental-strip-types t7.mjs`） |
| `t8.mjs` | **web-delyva**：骑手取消/取餐失败/送达失败 → 提醒员工（员工自己取消的不重复）、`?health=1`（期望 10 个 ✅；同上） |
| `rnd.mjs` | 凑整公式（`node rnd.mjs`，期望 13 个 ✅） |
| `t4.mjs` | **菜单开关 86（服务器拒绝售完的菜）+ 10 分钟逾期 + sweep 定时清理 + 继续付款时外送运费实时再报价**（期望 15 个 ✅，跑法同 t3；里面有一段等 15 秒，等服务器缓存过期） |
| `race.mjs` `pm.mjs` `pm2.mjs` `noqs.mjs` `warm.mjs` `win.mjs` `t2.mjs` | 针对性小测试：webhook 与 check 同时确认的竞态、付款方式限定、暖机、截单时段、… |
| `cfg-test.js` | 测试用的 config（沙箱币别 SGD 等），`HP_CFG` 环境变量指定 |
| `fakedate.mjs` | 把时间固定（`FAKE_AT=2026-10-29T12:30:00+08:00`），测截单时间用 |

跑法（在 `tests/hitpay/` 里）：
```
HP_CFG=$PWD/cfg-test.js FAKE_AT=2026-10-29T12:30:00+08:00 node --experimental-strip-types --import ./fakedate.mjs t1.mjs      # 期望 31 个 ✅、0 个 ❌
FAKE_AT=2026-10-29T12:30:00+08:00 node --experimental-strip-types --import ./fakedate.mjs e2e.mjs                                # 期望最后「✅ 没有 JS 错误」且网页/后台金额一致
```
⚠️ 改了网页的价钱算法、讯息格式或 `web-hitpay/index.ts`，这些测试要一起过；下单前网页要先勾同意（`#od_agree`，e2e 已处理）。

## tests/ui/（看画面用，要先开 `localhost:8765`）
`verify-refund.js`（后台出餐拍照 + 退款，模拟 Supabase，要在同一条命令里 `python3 -m http.server 8765 &` 再 `node tests/ui/verify-refund.js`）、`audit-mobile-pages.js`（360/393/430 宽：横向溢出、小按钮、JS 错误 + 各区块截图）、`audit-mobile-flow.js`（侧栏、客制化、购物车自取/外送、我的订单）、`audit-desktop.js`（1024–1920 宽 + 下单流程截图）、`menu86.js`（菜单开关：客人网页售完/回来啦 + 后台「🍽️ 菜单开关」页，模拟 Supabase）、`pending-flow.js`（待付款订单：关网页回来→购物车有待付款卡片→继续付款选 FPX→取消；模拟后台）、`cart-screenshot.js`、`trk-screenshot.js`（订单进度视窗）、`push-admin.js`（后台：没有手动已收款按钮 + 手机通知各种状态，模拟 Supabase 和推送；`python3 -m http.server 8765 --directory <仓库根目录> &` 再 `node tests/ui/push-admin.js`）。截图存在 `/tmp`，自己用 Read 看。
