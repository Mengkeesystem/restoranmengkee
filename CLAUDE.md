# 项目备忘 (CLAUDE.md) — 餐厅官方网站模板

本仓库是 **明记家乡小食店** 的对外官方网站（客人看的），**不是** ERP。ERP 在另一个仓库，两者完全分开：
网站不连 Supabase、不需要登录、不存任何客人资料。

## 架构（2026-10-15 建立）
- 纯静态：`index.html`（程序）+ `config.js`（全部内容，`window.SITE = {...}`）+ `images/`。无构建步骤，GitHub Pages 直接上线。
- **内容与程序分离是刻意的设计**：换店 = 换 `config.js` + `images/`，`index.html` 不改。新增功能时要守住这条——任何店名、颜色、文字、链接都放 `config.js`，不要写死在 `index.html`。
- 订位、点餐都是**转 WhatsApp**（`wa.me/<号码>?text=...`，订单内容自动组好）。业主选这个方式的原因：不用后台、不用月费、马来西亚小店最常用。店员在 WhatsApp 回复确认才算成功。
  - 第二阶段如要「订单直接进 ERP」，需要在该店**自己的** Supabase 开一张只允许匿名 insert 的表（RLS 只给 insert，不给 select），网站提交时写进去，ERP 那边读。别直接拿 ERP 现有的 `erp_store`。
- 营业时间 `hours` 驱动：首页「营业中/已打烊」、订位可选时间（开门后、打烊前 60 分钟为止，每 `slotMinutes`）、自取可选时间（今天/明天/后天，现在 + `pickupLeadMinutes` 之后、打烊前 15 分钟为止，每 15 分钟）。休息日自动不出现在日期选单。
- **多分店（2026-10-15）**：明记共 11 间（雪隆区 10 + 芙蓉区 1 / Seremban 2），资料来自业主上传的分店地址 PDF，写在 `config.js` 的 `outlets`。首页「门店地址」区块按 `region` 分组（照业主给的参考图样式：区域标题 + 卡片），导航有两个按钮（2026-10-18 业主加 Waze）：📍 Google Maps（默认用「英文店名+地址」搜，可用 `map` 覆盖）、🚗 Waze（`waze.com/ul?q=<地址>&navigate=yes`，可用分店的 `waze` 覆盖；单店模式联系区也有 Waze 按钮，`S.waze` 覆盖）。哪间店 Waze 定位不准，就在该分店填 `waze: "https://waze.com/ul?ll=纬度,经度&navigate=yes"`。订位/点餐表单在有 outlets 时**必须选分店**，WhatsApp 讯息第一行带分店名；分店有自己的 `whatsapp` 就发到该店，否则发到总号码 `whatsapp`。单店模式（牛室目前只有 Setapak 一间）把 `outlets` 设成 `[]`，回到原本的单一 `address`/`mapLink`/`mapEmbed`。
  - **手机版折叠（2026-10-17，业主要求）**：≤560px **每个区域各自**只显示前 3 间（每区包在 `.ogrp` 里），超过 3 间的区域下面有「查看全部 N 间分店 ▾」按钮只展开该区（`toggleOutlets`，箭头旋转、文字变「收起」，收起时滚回该区标题）。芙蓉区只有 1 间，永远单独显示、不被折叠（业主要求「芙蓉区单独开出来」）。电脑/平板全部显示，按钮隐藏。按钮用 addEventListener 绑定（inline onclick 找不到函数）。
- **菜单（2026-10-15）**：83 道，逐项抄自业主拍的纸本菜单（`images/menu-1.jpg`、`menu-2.jpg`，网站「菜单」上方可点开原图）。25 道有从菜单照片裁出来的菜品图 `images/menu/<编号>.jpg`。菜单格式：`prices`(多份量，默认 小/大、小/中/大、小/中/大/特大，可用 `sizes` 改名如 半只/一只)、`options`(做法，如蔬菜马来栈/清炒)、`unit`+`min`(按只/位计、最少数量)、`seasonal`(时价，不可网上下单)。购物车每行 key = `菜id|份量|做法`，WhatsApp 讯息带编号+份量+做法，并注明「价钱不含 SST」。
  - **纸本菜单照片（2026-10-17）**：做成可左右滑动的 slider（◀▶ 按钮 + 底部指示条），点一下在**同一页全屏放大**（不开新分页）：右上角 ✕ 关闭、电脑按 Esc 关闭、← → 换页、点图片放大/缩小。slider 只在 `renderAll` 渲染一次（不放在 `renderMenu`，否则每次加购物车都会跳回第一张）。
  - **分类默认折叠**（业主要求，页面太长）：每个分类是一个可点开的标题（显示道数、已点数量），点开才渲染菜品；顶部分类按钮会顺便打开该分类并滚过去。菜品卡在所有屏幕都用「左图右文」横排（桌面多栏、手机单栏）。
  - 纸本菜单上 A007、A017 被遮住看不清，**没放上网站**；A069 价钱被裁掉，暂按同类汤 16-25；A067 编号在纸本上重复（虾仁煎蛋 & 老黄瓜汤），汤那道内部 id 用 `A067S`。
- **页面顺序（业主指定，2026-10-15；10-17 改）**：首页（左：大 logo（桌面 176px、手机 132px）→ 店名 → 按钮 → 营业中/已打烊状态（放在按钮下面），**右：本店故事卡片 `aside#about`**，手机上叠在下面）→ 优惠活动 → 菜单 → 订位 → 门店地址 → 营业时间/联系。菜单栏顺序同上。营业时间：周一至五 11:00–15:00、17:00–22:00；周六日 11:00–14:30、16:30–22:00（全分店统一）。
- **设计风格（2026-10-17，业主要「有棱有角、不要太圆」）**：圆角统一用 `--r:3px`/`--rs:2px`（只有营业状态小圆点是圆的），标题用 Noto Serif SC（Google Fonts）+ 金色短横线，卡片用硬投影 `3px 3px 0`，首页有金色内框线和底部金边。之后新增元件也照这套，不要再用 999px 药丸圆角。
- 优惠活动卡片可加 `badge`/`badgeEn` 角标（限时/平日/生日/预订）；目前 4 个都是**示例**，等业主给真实活动。
  - **滑入动画（2026-10-18 业主要求）**：客人滚到优惠活动时，卡片一张接一张滑进来（单数从左、双数从右，每张间隔 0.12s）。`revealPromos()` 用 IntersectionObserver，只播一次（`promosSeen`，切换语言重绘时直接显示）；`#promos{overflow-x:clip}` 防止滑入前的卡片撑出横向滚动；系统设定「减少动态效果」或浏览器不支持 IntersectionObserver 时直接显示不动画。注意 class 名用 `rv`/`seen`，**不要用 `in`**（`.promo .in` 是卡片内文容器）。
- **Facebook / Instagram（2026-10-17，最终位置）**：① **页头、整个画面最左边**（业主给 Oriental Kopi 截图：FB/IG 贴最左，logo/菜单留在原本位置）：单色线条图标，品牌红色，FB 在前（`socTopHTML()`/`SOC_MONO`）。宽度 ≥1260px：`position:absolute;left:24px` 贴页面最左，不占 logo 位置；≥1720px 才显示名字；<1260px（小电脑/手机）退回 logo 左边、只显示图标、加细分隔线；≤480px 店名文字隐藏只留 logo。② **联系区「关注我们」**：彩色官方图标（IG 渐层圆角方、FB 蓝圆）+ 账号名（`socIconsHTML(true)`/`SOC_ICON`）。首页红色区块、页脚**不放**（业主：下面只要一个）。名字用 `social.instagramName` / `social.facebookName`。点了开新分页。
- Logo：`images/logo.png`（业主提供的红底金字「明记」方形图），同时用作首页大图标和浏览器分页图标。
- **优惠码 Voucher（2026-10-15）**：只在购物车结账时输入（业主要求把优惠活动区块的兑换框拿掉；`ordering.voucherInPromos:true` 可再打开）。`config.js` 的 `vouchers` 只存 `sha256("mk-voucher:" + 大写码)`，**原码绝不写进仓库**（公开仓库+公开网页，写明文等于公开）。类型 percent / amount / gift，可设 minSpend、maxOff、from/to。静态网站**无法限制使用次数**，WhatsApp 讯息带优惠码与折扣金额，由店员核对。业主给新码时：算哈希加进 `vouchers`，在 commit 讯息/文件里只写标题不写码。没有任何有效优惠码时，兑换框自动隐藏。
- **付款步骤（2026-10-17，业主要「下单→QR→付款→付款成功→跳 WhatsApp」）**：选「现在转账付款」时按钮变「💳 下单并付款」，按下后弹出付款视窗（`openPayStep`）：三步指示 → 应付金额（含 SST/运费/优惠）→ 参考号 `MKmmdd-xxxx`（可复制，请客人填在转账备注）→ QR（可下载）+ 户口（可复制）→ 勾「我已完成付款」才能按「发送订单到 WhatsApp」→ 打开 WhatsApp（讯息带付款金额+参考号）→ 完成画面（可重开 WhatsApp、按完成清空购物车）。✕ / Esc 关闭回购物车。**没有付款网关，「付款成功」是客人自己确认**，店员凭 WhatsApp 收据截图+参考号核对。到店/货到付款不走这个视窗，直接发 WhatsApp。自取、外卖都适用。**测试模式**：网址加 `?paytest=1`，在还没填真实收款资料时用业主个人的 TNG eWallet QR `images/test-tng-qr.jpg`（CHONG YOU XIAN，业主指定做测试用；`images/test-qr.png` 是旧的假 QR，备用），让业主自己走一遍流程；正常网址客人看不到。填了真实 `payment` 后测试模式也会改用真实资料。要真正自动确认付款，需申请 ToyyibPay/Billplz 等付款网关 + 一个小后台（如 Supabase Edge Function）验证付款状态。
- **付款确认小后台（2026-10-17，业主选「A. 店员按确认」+「新开免费 Supabase 项目」）**：`supabase/schema.sql`（表 `web_orders`、店员白名单 `web_staff`；匿名只能调 `create_web_order()` 建单、`web_order_status(ref, token)` 查自己那笔；只有白名单店员登录后能读/改订单；函数全 plpgsql + security definer）。客人端：`config.js` 的 `backend.supabaseUrl/supabaseAnonKey` 有填时，付款视窗不再要客人勾选，而是建单（pending）→ 每 3 秒轮询 → 店员按已收款(paid) → 自动 `location.href` 到 WhatsApp（不用 window.open，因为不是点击触发会被拦）；rejected 显示联系店家；30 分钟没确认显示超时；后台连不上自动退回旧的勾选流程。店员端：`admin.html`（supabase-js@2.45.4 UMD，**档名是 dist/umd/supabase.js，不是 .min.js**），登录 → 待确认/已收款/已拒绝、按分店筛选、每 5 秒更新、新订单响铃、确认/拒绝写 `confirmed_by`。**后台是独立的 Supabase 项目，不连 ERP**。设定步骤写在 README。⚠️ 没有付款网关，「已收款」是店员人工核对 TNG/银行后按的。
  - **目前未启用（2026-10-17）**：业主 Supabase 免费版 2 个项目名额已满，决定先不做后台，`backend` 留空 → 网站走客人自己勾选的旧流程。代码都保留，以后要启用：用另一个邮箱开新 Supabase 账号（或暂停一个没用的项目）建项目，照 README 跑 schema.sql，再把 URL + anon key 填进 `config.js` 即可。**不要放进牛室 ERP 的 Supabase**；放明记 ERP 的项目也行，但要先核对表名/`auth.users` 上的邀请码触发器不冲突（店员可直接用 ERP 账号，不要另外 Add user）。
- **店员订单核对 + 每月总结（2026-10-17，`check.html`）**：店员把客人 WhatsApp 订单整段贴进来，按 WhatsApp 讯息格式（`buildMsg`/`waTotalLines` 产生的那套，中英文标签都认）解析，**用 config.js 现在的菜单价重算**：菜品用「编号+菜名+份量做法」整串精确比对（`variants()` 列出每道菜所有份量×做法组合），优惠码比对哈希+有效期(用订单日期)+minSpend，SST、运费（按 zone label）、合计逐项对比，客人写的已转账金额也对。结果 ✅/⚠️/❌。**改了 index.html 的 WhatsApp 讯息格式，check.html 的解析要一起改**（已用网站实际产生的讯息测：自取、外卖+优惠码、英文版、改价、假优惠码、不存在的菜）。按「记录」存进**店员那部装置的 localStorage**（`mk_staff_orders_v1`，id=参考号，没参考号就用讯息哈希防重复）；「每月总结」按订单日期分月：订单数/营业额/小计/平均/优惠/SST/运费/自取外卖/按分店/热卖 Top15/列表，导出 CSV（有防 Excel 公式注入）、JSON 备份与合并。不连任何后台，所以不是跨装置自动汇总；**等 Supabase 后台启用后**，要在 admin.html 加从 `web_orders` 读的每月总结（全分店自动汇总，只有白名单店员能看），check.html 的手动记录可作为没开后台时的备案。admin.html 页头有链接到 check.html。 可「加到主画面」当 App 用（`check.webmanifest` + apple-touch-icon，页面上有 iPhone/Android 步骤说明，App 模式下自动收起）；「📋 一键贴上并核对」用 `navigator.clipboard.readText()`（浏览器会问一次权限，读不到就退回手动贴上）。
- **结账付款（2026-10-15）**：购物车表单里有「💳 付款方式」：现在转账付款（显示 DuitNow QR + 银行户口 + 复制户口号按钮 + 应付金额=扣完优惠后的合计）/ 到店取餐时付款（`allowPayAtCounter:false` 可关掉）。资料在 `config.js` 的 `payment`，分店可用 `outlets[i].payment` 覆盖。`qr` 和 `accountNo` 都空就不显示。WhatsApp 讯息最后一行带付款方式，客人需把收据截图发 WhatsApp，店员核对。**没接付款网关**：静态网站无后台，客人可在浏览器改金额，所以靠人工核对收据。
- **自取 / 外卖（2026-10-15）**：购物车顶部切换。外卖要填送餐地址 + 选配送范围，运费加进合计（顺序：小计 − 优惠 + 运费 = 合计；优惠的 minSpend 只看食物小计，不含运费）。设定在 `config.js` 的 `ordering.delivery`（zones 每档 label/fee、minOrder、freeAbove、leadMinutes、note）。业主目前规则：3km 内 RM5、3km 外 RM10，11 间都送；**客人自己选范围，店员看地址核对**（没接 Google 距离 API，以后要改按邮区或自动算距离再调整）。外卖时「到店付款」变「货到付款」，WhatsApp 标题变【网上点餐 - 外卖】并带地址与运费。
- **SST（2026-10-17）**：`ordering.sstRate:0.06`。购物车：小计 − 优惠 + **SST 6%（按「小计 − 优惠」计，运费不收）** + 运费 = 合计；付款金额、WhatsApp 讯息都用含 SST 的合计（`waTotalLines()`）。菜单每道菜价钱下方小字「(不含SST)」。`sstRate:0` 则全部不显示。
- 优惠 `promos` 按 `from`/`to` 自动显示/隐藏。
- 购物车、语言、客人姓名电话存 `localStorage`（只在客人自己的浏览器，全部 try/catch，失效不影响使用）。
- 所有 `config.js` 文字输出都经 `esc()` 转义（沿用 ERP 那边 XSS 教训）。
- 手机体验沿用 ERP 的教训：输入框 16px（防 iOS 自动放大）、`safe-area-inset-bottom`、抽屉 `overscroll-behavior:contain` + 打开时锁 body 滚动、`touch-action:manipulation`。

## ⏳ 待办：业主 Supabase 升级 Pro 后，启用付款确认后台（2026-10-17 记录）
业主说：等 Supabase 升级到 Pro 就开始做。业主说「开始」时**直接照下面做，不用再重新讨论方案**（方案已定：A. 店员按确认 + 官网专用的新 Supabase 项目）。代码已写好在仓库里（`supabase/schema.sql`、`admin.html`、`index.html` 的 `startAutoPay`），只差接上项目。
注：Pro 是按 organization 收费，同一个 org 里每多一个项目还有额外的 compute 费用，以 Supabase 账单页为准。

**业主要做（我在旁边一步步带）：**
1. Supabase 后台 → New project，名字如 `mengkee-website`，Region 选 Singapore。**不能用牛室 ERP 的项目**；也不要用明记 ERP 的项目，要新的。
2. SQL Editor → 贴上整份 `supabase/schema.sql` → Run。
3. Authentication → Users → Add user：给每个要确认付款的店员建账号（邮箱+密码）。
4. 把店员邮箱给我，我写好 `insert into public.web_staff (email) values (...)` 让业主去 SQL Editor 跑。
5. Project Settings → API：把 **Project URL** 和 **anon public key** 发给我。**绝不要给 service_role key**。

**我要做：**
1. 填进 `config.js` → `backend:{supabaseUrl:"...", supabaseAnonKey:"..."}`。
2. 用 Playwright 对**真实项目**测：打开 `/?paytest=1` 下单 → `web_orders` 出现 pending → 用店员账号登录 `admin.html` 按「已收款」→ 客人页面自动跳 wa.me；再测「拒绝」。测完把测试订单在 SQL Editor 删掉。（沙箱如连不到 supabase.co / jsdelivr，就请业主自己在手机走一遍。）
3. 推 main，告诉业主店员入口 `https://mengkeesystem.github.io/restoranmengkee/admin.html`，营业时间要有人开着它（新订单会响铃）。
4. 更新本文件：把「目前未启用」改成「已启用（日期）」。

**同时最好一起补的资料**（不阻塞后台）：正式商家收款 QR + 银行户口（`payment`；现在测试模式用的是业主个人 TNG QR）、真实本店故事/优惠活动、Facebook 专页名、A007/A017 菜名价钱。

## 安全（2026-10-17 全面检查，业主要求「不能被 hack、客人不能改网页或付款」）
**已做的防护（改代码时别拿掉）：**
- 所有输出都经 `esc()`；`admin.html` 显示客人填的姓名/电话/订单内容也全部 `esc()`（客人可经 RPC 写任意文字进数据库，店员页是最需要防 XSS 的地方）。
- **CSP**（`<meta http-equiv="Content-Security-Policy">`，index.html 与 admin.html 各一）：只准本站脚本（+内联，因为有 inline onclick 和 document.write config.js），外站脚本、外送数据（connect 只给 `*.supabase.co`）、插件、表单外送全挡。新增外部资源（新字体/地图/CDN）要同步改 CSP，否则会被挡。已测：注入的外站脚本和 fetch 都被拒绝。
- `admin.html` 的 supabase-js 有 **SRI integrity**（sha384，对应 2.45.4 的 `dist/umd/supabase.js`）；升级版本要重算 hash：`openssl dgst -sha384 -binary supabase.js | openssl base64 -A`。admin 加 `noindex`。
- **localStorage 不可信**：购物车载入时只留「key 跟 `keyOf()` 产生的完全一样 + 数量 1–99 整数」的行；`allItems` 用 `Object.create(null)`；`site_lang` 只认 zh/en；`site_zone` 只认数字。原因：GitHub Pages 的 `mengkeesystem.github.io` 下**所有仓库同一个 origin**（若明记 ERP 也挂在这个账号的 Pages，它跟官网共用 localStorage），所以别的页面写进来的值都要当攻击输入。
- 价钱/合计**一律用 config.js 的价钱重算**，不读 localStorage 里的金额。
- 后台 `schema.sql`：匿名只能调两个函数；`create_web_order` 检查 ref 格式、金额、order_type、电话 8–15 位、同电话 10 分钟最多 3 笔待确认、全站每分钟 60 笔；店员只有 `status/confirmed_at/confirmed_by` 三栏的 update 权限（改不了金额/订单内容）；非白名单登录者看不到任何订单。已在本地 Postgres 16 跑过攻击测试全部被挡。

**静态网站本质上挡不了的（靠店员流程）：**
- 客人可以在**自己的**浏览器改网页（改价钱、改合计、改 WhatsApp 讯息）——这只影响他自己那份，别的客人看到的网页不会变；但他发来的订单金额可能是假的。→ 店员必须**按菜单价自己核对**品项×数量，**以 TNG/银行 App 里实际到账为准**，不看客人截图（截图可伪造）。
- 优惠码哈希可被离线猜（码太短/太好猜就会被试出来）→ 码要用不好猜的，店员核对 WhatsApp 里的优惠码。
- 别人可以复制整个网站换成自己的 QR 骗客人（仿冒站）→ 宣传时只给官方网址；以后考虑绑自己的域名。
- 真正能「改网站内容」的只有 GitHub 账号 `Mengkeesystem` 和有写权限的协作者 → 账号必须开 2FA、别给不信任的人写权限。
- `?paytest=1` 会显示业主个人 TNG QR（`images/test-tng-qr.jpg`），任何知道这个网址的人都看得到 → 填了正式商家 QR 后建议删掉这张图。

## ⏳ 待办（第二步）：Pro 之后接付款网关 + 后台重算价钱（2026-10-17 记录）
业主要求：升级 Supabase Pro、付款确认后台启用之后，**再做付款网关**，目标是像 Grab/Shopee 一样「客人在自己浏览器改价也没用」，不用店员手动核对。
**为什么需要**：现在价钱是在客人浏览器算的，订单直接发 WhatsApp，没有服务器重算 → 客人可改自己那份的金额（只能靠 check.html + 看实际到账把关）。大平台安全是因为**服务器用自己存的价钱重算 + 付款网关按服务器算的金额扣款**。

**要做的（顺序）：**
1. 先完成上面「付款确认后台」那份清单（新 Supabase 项目、schema.sql、店员白名单）。
2. **后台存菜单价**：在网站专用 Supabase 建 `menu_prices`（id, si, oi, price, soldOut/seasonal）、`vouchers`（hash, type, value, minSpend, maxOff, from, to）、`delivery_zones`、SST 税率；由 `config.js` 生成同步脚本或 SQL（改菜单价时两边要一起更新，或改成网站从 Supabase 读菜单）。
3. **建单改成后台算钱**：`create_web_order` 不再收客人传来的 `p_amount`，改收购物车明细 `[{id,si,oi,q}]` + 优惠码 + 配送范围，由函数自己查价、算小计/优惠/SST/运费/合计，回传金额与 ref。
4. **付款网关**：业主先申请商家账号（马来西亚常见：ToyyibPay、Billplz；要公司/商家资料、银行户口，审核需时间，会有每笔手续费）。用 **Supabase Edge Function** 持有网关 secret key（绝不放进网页/仓库），以后台算出的金额建付款单 → 客人跳到网关付款（FPX 网银 / DuitNow / 电子钱包）→ 网关 **callback（webhook）打到 Edge Function，验证签名后**把订单设为 paid → 客人网页轮询到 paid 自动跳 WhatsApp（沿用现有 `startAutoPay` 流程）。
5. 网关接好后：店员不用手动按「已收款」（admin.html 改成只看订单 + 处理退款/异常）；check.html 保留作备用；WhatsApp 讯息里的金额改用后台回传的金额。
6. 在 admin.html 加「每月总结」直接读 `web_orders`（全分店自动汇总，取代 check.html 的手动记录）。
7. 安全：webhook 一定验签名/向网关查单确认，不能只信 callback 参数；Edge Function 用 service_role 时只在服务器端；CSP 的 `connect-src`/导向网关域名要加白名单。

**业主说「开始做付款网关」时要先问的**：选哪家网关（是否已申请好商家账号、拿到 API key / secret / collection code）、手续费由谁承担（加进客人合计或店家吸收）、还要不要保留「到店付款/货到付款」。

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
