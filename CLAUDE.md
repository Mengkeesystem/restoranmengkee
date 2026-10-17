# 项目备忘 (CLAUDE.md) — 餐厅官方网站模板

本仓库是 **明记家乡小食店** 的对外官方网站（客人看的），**不是** ERP。ERP 在另一个仓库，两者完全分开：
网站不连 Supabase、不需要登录、不存任何客人资料。

## 架构（2026-10-15 建立）
- 纯静态：`index.html`（程序）+ `config.js`（全部内容，`window.SITE = {...}`）+ `images/`。无构建步骤，GitHub Pages 直接上线。
- **内容与程序分离是刻意的设计**：换店 = 换 `config.js` + `images/`，`index.html` 不改。新增功能时要守住这条——任何店名、颜色、文字、链接都放 `config.js`，不要写死在 `index.html`。
- 订位、点餐都是**转 WhatsApp**（`wa.me/<号码>?text=...`，订单内容自动组好）。业主选这个方式的原因：不用后台、不用月费、马来西亚小店最常用。店员在 WhatsApp 回复确认才算成功。
  - 第二阶段如要「订单直接进 ERP」，需要在该店**自己的** Supabase 开一张只允许匿名 insert 的表（RLS 只给 insert，不给 select），网站提交时写进去，ERP 那边读。别直接拿 ERP 现有的 `erp_store`。
- 营业时间 `hours` 驱动：首页「营业中/已打烊」、订位可选时间（开门后、打烊前 60 分钟为止，每 `slotMinutes`）、自取可选时间（今天/明天/后天，现在 + `pickupLeadMinutes` 之后、打烊前 15 分钟为止，每 15 分钟）。休息日自动不出现在日期选单。
- **多分店（2026-10-15）**：明记共 11 间（雪隆区 10 + 芙蓉区 1 / Seremban 2），资料来自业主上传的分店地址 PDF，写在 `config.js` 的 `outlets`。首页「门店地址」区块按 `region` 分组（照业主给的参考图样式：区域标题 + 卡片），导航按钮默认用「英文店名+地址」搜 Google Maps。订位/点餐表单在有 outlets 时**必须选分店**，WhatsApp 讯息第一行带分店名；分店有自己的 `whatsapp` 就发到该店，否则发到总号码 `whatsapp`。单店模式（牛室目前只有 Setapak 一间）把 `outlets` 设成 `[]`，回到原本的单一 `address`/`mapLink`/`mapEmbed`。
- **菜单（2026-10-15）**：83 道，逐项抄自业主拍的纸本菜单（`images/menu-1.jpg`、`menu-2.jpg`，网站「菜单」上方可点开原图）。25 道有从菜单照片裁出来的菜品图 `images/menu/<编号>.jpg`。菜单格式：`prices`(多份量，默认 小/大、小/中/大、小/中/大/特大，可用 `sizes` 改名如 半只/一只)、`options`(做法，如蔬菜马来栈/清炒)、`unit`+`min`(按只/位计、最少数量)、`seasonal`(时价，不可网上下单)。购物车每行 key = `菜id|份量|做法`，WhatsApp 讯息带编号+份量+做法，并注明「价钱不含 SST」。
  - **纸本菜单照片（2026-10-17）**：做成可左右滑动的 slider（◀▶ 按钮 + 底部指示条），点一下在**同一页全屏放大**（不开新分页）：右上角 ✕ 关闭、电脑按 Esc 关闭、← → 换页、点图片放大/缩小。slider 只在 `renderAll` 渲染一次（不放在 `renderMenu`，否则每次加购物车都会跳回第一张）。
  - **分类默认折叠**（业主要求，页面太长）：每个分类是一个可点开的标题（显示道数、已点数量），点开才渲染菜品；顶部分类按钮会顺便打开该分类并滚过去。菜品卡在所有屏幕都用「左图右文」横排（桌面多栏、手机单栏）。
  - 纸本菜单上 A007、A017 被遮住看不清，**没放上网站**；A069 价钱被裁掉，暂按同类汤 16-25；A067 编号在纸本上重复（虾仁煎蛋 & 老黄瓜汤），汤那道内部 id 用 `A067S`。
- **页面顺序（业主指定，2026-10-15；10-17 改）**：首页（左：大 logo（桌面 176px、手机 132px）→ 店名 → 按钮 → 营业中/已打烊状态（放在按钮下面），**右：本店故事卡片 `aside#about`**，手机上叠在下面）→ 优惠活动 → 菜单 → 订位 → 门店地址 → 营业时间/联系。菜单栏顺序同上。营业时间：周一至五 11:00–15:00、17:00–22:00；周六日 11:00–14:30、16:30–22:00（全分店统一）。
- **设计风格（2026-10-17，业主要「有棱有角、不要太圆」）**：圆角统一用 `--r:3px`/`--rs:2px`（只有营业状态小圆点是圆的），标题用 Noto Serif SC（Google Fonts）+ 金色短横线，卡片用硬投影 `3px 3px 0`，首页有金色内框线和底部金边。之后新增元件也照这套，不要再用 999px 药丸圆角。
- 优惠活动卡片可加 `badge`/`badgeEn` 角标（限时/平日/生日/预订）；目前 4 个都是**示例**，等业主给真实活动。
- **Facebook / Instagram（2026-10-17，最终位置）**：① **页头、整个画面最左边**（业主给 Oriental Kopi 截图：FB/IG 贴最左，logo/菜单留在原本位置）：单色线条图标，品牌红色，FB 在前（`socTopHTML()`/`SOC_MONO`）。宽度 ≥1260px：`position:absolute;left:24px` 贴页面最左，不占 logo 位置；≥1720px 才显示名字；<1260px（小电脑/手机）退回 logo 左边、只显示图标、加细分隔线；≤480px 店名文字隐藏只留 logo。② **联系区「关注我们」**：彩色官方图标（IG 渐层圆角方、FB 蓝圆）+ 账号名（`socIconsHTML(true)`/`SOC_ICON`）。首页红色区块、页脚**不放**（业主：下面只要一个）。名字用 `social.instagramName` / `social.facebookName`。点了开新分页。
- Logo：`images/logo.png`（业主提供的红底金字「明记」方形图），同时用作首页大图标和浏览器分页图标。
- **优惠码 Voucher（2026-10-15）**：只在购物车结账时输入（业主要求把优惠活动区块的兑换框拿掉；`ordering.voucherInPromos:true` 可再打开）。`config.js` 的 `vouchers` 只存 `sha256("mk-voucher:" + 大写码)`，**原码绝不写进仓库**（公开仓库+公开网页，写明文等于公开）。类型 percent / amount / gift，可设 minSpend、maxOff、from/to。静态网站**无法限制使用次数**，WhatsApp 讯息带优惠码与折扣金额，由店员核对。业主给新码时：算哈希加进 `vouchers`，在 commit 讯息/文件里只写标题不写码。没有任何有效优惠码时，兑换框自动隐藏。
- **付款步骤（2026-10-17，业主要「下单→QR→付款→付款成功→跳 WhatsApp」）**：选「现在转账付款」时按钮变「💳 下单并付款」，按下后弹出付款视窗（`openPayStep`）：三步指示 → 应付金额（含 SST/运费/优惠）→ 参考号 `MKmmdd-xxxx`（可复制，请客人填在转账备注）→ QR（可下载）+ 户口（可复制）→ 勾「我已完成付款」才能按「发送订单到 WhatsApp」→ 打开 WhatsApp（讯息带付款金额+参考号）→ 完成画面（可重开 WhatsApp、按完成清空购物车）。✕ / Esc 关闭回购物车。**没有付款网关，「付款成功」是客人自己确认**，店员凭 WhatsApp 收据截图+参考号核对。到店/货到付款不走这个视窗，直接发 WhatsApp。自取、外卖都适用。**测试模式**：网址加 `?paytest=1`，在还没填真实收款资料时用业主个人的 TNG eWallet QR `images/test-tng-qr.jpg`（CHONG YOU XIAN，业主指定做测试用；`images/test-qr.png` 是旧的假 QR，备用），让业主自己走一遍流程；正常网址客人看不到。填了真实 `payment` 后测试模式也会改用真实资料。要真正自动确认付款，需申请 ToyyibPay/Billplz 等付款网关 + 一个小后台（如 Supabase Edge Function）验证付款状态。
- **付款确认小后台（2026-10-17，业主选「A. 店员按确认」+「新开免费 Supabase 项目」）**：`supabase/schema.sql`（表 `web_orders`、店员白名单 `web_staff`；匿名只能调 `create_web_order()` 建单、`web_order_status(ref, token)` 查自己那笔；只有白名单店员登录后能读/改订单；函数全 plpgsql + security definer）。客人端：`config.js` 的 `backend.supabaseUrl/supabaseAnonKey` 有填时，付款视窗不再要客人勾选，而是建单（pending）→ 每 3 秒轮询 → 店员按已收款(paid) → 自动 `location.href` 到 WhatsApp（不用 window.open，因为不是点击触发会被拦）；rejected 显示联系店家；30 分钟没确认显示超时；后台连不上自动退回旧的勾选流程。店员端：`admin.html`（supabase-js@2.45.4 UMD，**档名是 dist/umd/supabase.js，不是 .min.js**），登录 → 待确认/已收款/已拒绝、按分店筛选、每 5 秒更新、新订单响铃、确认/拒绝写 `confirmed_by`。**后台是独立的 Supabase 项目，不连 ERP**。设定步骤写在 README。⚠️ 没有付款网关，「已收款」是店员人工核对 TNG/银行后按的。
  - **目前未启用（2026-10-17）**：业主 Supabase 免费版 2 个项目名额已满，决定先不做后台，`backend` 留空 → 网站走客人自己勾选的旧流程。代码都保留，以后要启用：用另一个邮箱开新 Supabase 账号（或暂停一个没用的项目）建项目，照 README 跑 schema.sql，再把 URL + anon key 填进 `config.js` 即可。**不要放进牛室 ERP 的 Supabase**；放明记 ERP 的项目也行，但要先核对表名/`auth.users` 上的邀请码触发器不冲突（店员可直接用 ERP 账号，不要另外 Add user）。
- **结账付款（2026-10-15）**：购物车表单里有「💳 付款方式」：现在转账付款（显示 DuitNow QR + 银行户口 + 复制户口号按钮 + 应付金额=扣完优惠后的合计）/ 到店取餐时付款（`allowPayAtCounter:false` 可关掉）。资料在 `config.js` 的 `payment`，分店可用 `outlets[i].payment` 覆盖。`qr` 和 `accountNo` 都空就不显示。WhatsApp 讯息最后一行带付款方式，客人需把收据截图发 WhatsApp，店员核对。**没接付款网关**：静态网站无后台，客人可在浏览器改金额，所以靠人工核对收据。
- **自取 / 外卖（2026-10-15）**：购物车顶部切换。外卖要填送餐地址 + 选配送范围，运费加进合计（顺序：小计 − 优惠 + 运费 = 合计；优惠的 minSpend 只看食物小计，不含运费）。设定在 `config.js` 的 `ordering.delivery`（zones 每档 label/fee、minOrder、freeAbove、leadMinutes、note）。业主目前规则：3km 内 RM5、3km 外 RM10，11 间都送；**客人自己选范围，店员看地址核对**（没接 Google 距离 API，以后要改按邮区或自动算距离再调整）。外卖时「到店付款」变「货到付款」，WhatsApp 标题变【网上点餐 - 外卖】并带地址与运费。
- **SST（2026-10-17）**：`ordering.sstRate:0.06`。购物车：小计 − 优惠 + **SST 6%（按「小计 − 优惠」计，运费不收）** + 运费 = 合计；付款金额、WhatsApp 讯息都用含 SST 的合计（`waTotalLines()`）。菜单每道菜价钱下方小字「(不含SST)」。`sstRate:0` 则全部不显示。
- 优惠 `promos` 按 `from`/`to` 自动显示/隐藏。
- 购物车、语言、客人姓名电话存 `localStorage`（只在客人自己的浏览器，全部 try/catch，失效不影响使用）。
- 所有 `config.js` 文字输出都经 `esc()` 转义（沿用 ERP 那边 XSS 教训）。
- 手机体验沿用 ERP 的教训：输入框 16px（防 iOS 自动放大）、`safe-area-inset-bottom`、抽屉 `overscroll-behavior:contain` + 打开时锁 body 滚动、`touch-action:manipulation`。

## 测试
Playwright（`/opt/pw-browsers/chromium`，`file://`）在 1280 宽和 393 宽（iPhone 15 Pro）跑：加购物车 → WhatsApp 下单内容、订位 → WhatsApp 内容、中英切换、无横向溢出、无 JS 错误。拦截 `https://wa.me/**` 读取组好的讯息。

## 复制给牛室 Beef House 时要改的（因店制宜）
1. `config.js` 全部内容：店名、logo、电话/WhatsApp、地址/地图、营业时间、社交链接、故事、照片。
2. **菜单结构不同**：牛室主体是 **buffet 吃到饱（按人头/时段计价）** + 单点牛扒/饮料。buffet 不适合「加购物车自取」，建议：
   - buffet 价格（成人/儿童/长者、平日/周末、午餐/晚餐）做成菜单里一个只展示、不能下单的分类（品项不放价钱按钮，或加 `soldOut`-类似的「仅堂食」标记——需要在 `index.html` 加一个 `dineInOnly` 选项）；
   - 单点牛扒/饮料照常可自取下单。
   - 订位对 buffet 更重要：可能要加「时段（午/晚）」「成人/儿童人数分开」——这是要改 `index.html` 订位表单的地方。
3. 颜色 `theme`：用牛室的深青色/金色（参考 ERP 的 `#12203A` / `#F2B417`）。
4. 新开一个仓库给牛室网站，不要跟明记共用（各自独立更新、各自 GitHub Pages）。
