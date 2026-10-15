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
  - 纸本菜单上 A007、A017 被遮住看不清，**没放上网站**；A069 价钱被裁掉，暂按同类汤 16-25；A067 编号在纸本上重复（虾仁煎蛋 & 老黄瓜汤），汤那道内部 id 用 `A067S`。
- **页面顺序（业主指定，2026-10-15）**：首页 → 本店故事(`about`) → 优惠活动 → 菜单 → 订位 → 门店地址 → 营业时间/联系。菜单栏顺序同上。营业时间：周一至五 11:00–15:00、17:00–22:00；周六日 11:00–14:30、16:30–22:00（全分店统一）。
- Logo：`images/logo.png`（业主提供的红底金字「明记」方形图），同时用作首页大图标和浏览器分页图标。
- **优惠码 Voucher（2026-10-15）**：优惠活动区块上方 + 购物车里都可输入。`config.js` 的 `vouchers` 只存 `sha256("mk-voucher:" + 大写码)`，**原码绝不写进仓库**（公开仓库+公开网页，写明文等于公开）。类型 percent / amount / gift，可设 minSpend、maxOff、from/to。静态网站**无法限制使用次数**，WhatsApp 讯息带优惠码与折扣金额，由店员核对。业主给新码时：算哈希加进 `vouchers`，在 commit 讯息/文件里只写标题不写码。没有任何有效优惠码时，兑换框自动隐藏。
- **结账付款（2026-10-15）**：购物车表单里有「💳 付款方式」：现在转账付款（显示 DuitNow QR + 银行户口 + 复制户口号按钮 + 应付金额=扣完优惠后的合计）/ 到店取餐时付款（`allowPayAtCounter:false` 可关掉）。资料在 `config.js` 的 `payment`，分店可用 `outlets[i].payment` 覆盖。`qr` 和 `accountNo` 都空就不显示。WhatsApp 讯息最后一行带付款方式，客人需把收据截图发 WhatsApp，店员核对。**没接付款网关**：静态网站无后台，客人可在浏览器改金额，所以靠人工核对收据。
- **自取 / 外卖（2026-10-15）**：购物车顶部切换。外卖要填送餐地址 + 选配送范围，运费加进合计（顺序：小计 − 优惠 + 运费 = 合计；优惠的 minSpend 只看食物小计，不含运费）。设定在 `config.js` 的 `ordering.delivery`（zones 每档 label/fee、minOrder、freeAbove、leadMinutes、note）。业主目前规则：3km 内 RM5、3km 外 RM10，11 间都送；**客人自己选范围，店员看地址核对**（没接 Google 距离 API，以后要改按邮区或自动算距离再调整）。外卖时「到店付款」变「货到付款」，WhatsApp 标题变【网上点餐 - 外卖】并带地址与运费。
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
