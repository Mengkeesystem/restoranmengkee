# 项目备忘 (CLAUDE.md) — 餐厅官方网站模板

本仓库是 **明记家乡小食店** 的对外官方网站（客人看的），**不是** ERP。ERP 在另一个仓库，两者完全分开：
网站不连 Supabase、不需要登录、不存任何客人资料。

## 架构（2026-10-15 建立）
- 纯静态：`index.html`（程序）+ `config.js`（全部内容，`window.SITE = {...}`）+ `images/`。无构建步骤，GitHub Pages 直接上线。
- **内容与程序分离是刻意的设计**：换店 = 换 `config.js` + `images/`，`index.html` 不改。新增功能时要守住这条——任何店名、颜色、文字、链接都放 `config.js`，不要写死在 `index.html`。
- 订位、点餐都是**转 WhatsApp**（`wa.me/<号码>?text=...`，订单内容自动组好）。业主选这个方式的原因：不用后台、不用月费、马来西亚小店最常用。店员在 WhatsApp 回复确认才算成功。
  - 第二阶段如要「订单直接进 ERP」，需要在该店**自己的** Supabase 开一张只允许匿名 insert 的表（RLS 只给 insert，不给 select），网站提交时写进去，ERP 那边读。别直接拿 ERP 现有的 `erp_store`。
- 营业时间 `hours` 驱动：首页「营业中/已打烊」、订位可选时间（开门后、打烊前 60 分钟为止，每 `slotMinutes`）；**订位最少提前 `booking.leadHours` 小时（2026-10-18 业主先定 12、同日改 1）**；**周末和公共假期不能订位**（`booking.noDays:[0,6]` + `noDates`（全部分店）+ `noDatesByRegion`（按分店 region，雪隆区/芙蓉区）——2026-10-18 按网上 2026–2027 假期表填好，**每年底要加下一年**；伊斯兰节日临近时核对宪报；订位换分店会重算可订日期，日期选单不出现星期六日，时间下方显示 `noDaysNote`）；自取 `pickupLeadMinutes:60`；外卖时间选单下显示 `delivery.timeNote`（准备约 15–20 分钟、配送依交通/距离调整）——`slotsFor` 改成按真实时间比（可跨日），发送时再检查一次，过期就报错并刷新时间选单；平日/周末各按自己的营业时间，休息时间本来就不出现、自取可选时间（今天/明天/后天，现在 + `pickupLeadMinutes` 之后、打烊前 15 分钟为止，每 15 分钟）。休息日自动不出现在日期选单。
- **先选分店（2026-10-18 业主要求；同日改为每单都问）**：**每张新订单**（购物车是空的）按第一个「+」都会跳出——原本「选过就记住、不再问」，业主测试时以为功能不见了，所以改成每单都问，上次选的排最上面标「⭐ 上次选的」（`opickDone` 防止选完后加菜又跳）。跳出「📍 请选择分店」（`openOutletPick`，按区域列出 11 间+地址），选了才把菜加进去；✕/Esc 取消就不加。选择存 `site_outlet`（只认合法序号），之后购物车的分店下拉默认用它，改下拉也会更新（`setOutlet`）。
- **多分店（2026-10-15）**：明记共 11 间（雪隆区 10 + 芙蓉区 1 / Seremban 2），资料来自业主上传的分店地址 PDF，写在 `config.js` 的 `outlets`。首页「门店地址」区块按 `region` 分组（照业主给的参考图样式：区域标题 + 卡片），导航有两个按钮（2026-10-18 业主加 Waze）：📍 Google Maps（默认用「英文店名+地址」搜，可用 `map` 覆盖）、🚗 Waze（`waze.com/ul?q=<地址>&navigate=yes`，可用分店的 `waze` 覆盖；单店模式联系区也有 Waze 按钮，`S.waze` 覆盖）。哪间店 Waze 定位不准，就在该分店填 `waze: "https://waze.com/ul?ll=纬度,经度&navigate=yes"`。订位/点餐表单在有 outlets 时**必须选分店**，WhatsApp 讯息第一行带分店名；分店有自己的 `whatsapp` 就发到该店，否则发到总号码 `whatsapp`。单店模式（牛室目前只有 Setapak 一间）把 `outlets` 设成 `[]`，回到原本的单一 `address`/`mapLink`/`mapEmbed`。
  - **进场效果（2026-10-18 业主要「特别一点、不要太夸张」）**：区域标题字距由宽（10px）收紧淡入；分店卡片轻轻「立起来」（上浮 18px + rotateX 10° 回正，`.olist{perspective}`），一张接一张。`revealOutlets()` 用 IntersectionObserver，`outSeen` 按顺序记住已出现的（切换语言重绘不重播）；手机按「查看全部」展开的卡片滚到时也会照样立起。减少动态效果时不动画。
  - **手机版折叠（2026-10-17，业主要求）**：≤560px **每个区域各自**只显示前 3 间（每区包在 `.ogrp` 里），超过 3 间的区域下面有「查看全部 N 间分店 ▾」按钮只展开该区（`toggleOutlets`，箭头旋转、文字变「收起」，收起时滚回该区标题）。芙蓉区只有 1 间，永远单独显示、不被折叠（业主要求「芙蓉区单独开出来」）。电脑/平板全部显示，按钮隐藏。按钮用 addEventListener 绑定（inline onclick 找不到函数）。
- **菜单（2026-10-15）**：83 道，逐项抄自业主拍的纸本菜单（`images/menu-1.jpg`、`menu-2.jpg`，网站「菜单」上方可点开原图）。25 道有从菜单照片裁出来的菜品图 `images/menu/<编号>.jpg`。菜单格式：`prices`(多份量，默认 小/大、小/中/大、小/中/大/特大，可用 `sizes` 改名如 半只/一只)、`options`(做法，如蔬菜马来栈/清炒)、`unit`+`min`(按只/位计、最少数量)、`seasonal`(时价，不可网上下单)。购物车每行 key = `菜id|份量|做法`，WhatsApp 讯息带编号+份量+做法，并注明「价钱不含 SST」。
  - **纸本菜单照片（2026-10-17）**：做成可左右滑动的 slider（◀▶ 按钮 + 底部指示条），点一下在**同一页全屏放大**（不开新分页）：右上角 ✕ 关闭、电脑按 Esc 关闭、← → 换页、点图片放大/缩小。slider 只在 `renderAll` 渲染一次（不放在 `renderMenu`，否则每次加购物车都会跳回第一张）。滚到时有柔和的进场效果（2026-10-18 业主要「换另一种、不要太夸张」）：整块淡入+上浮 12px，照片从 1.05 倍慢慢缩回原大小，只播一次，跟优惠/菜单的左右滑入区分开。
  - **滑入动画（2026-10-18 业主要求，跟优惠活动一样）**：分类标题第一次滚进画面时从左右滑进来（`revealCats()` + IntersectionObserver，`catSeen` 记住已出现的，因为 `renderMenu()` 每次加购物车都会整个重绘，不记住会一直重播）；客人点开分类时，那一类的菜品一道接一道滑进来（`justOpened` 只在点开那次重绘加 `.pop` CSS animation，之后重绘不播；点开的分类标题直接算已出现）。`#menu{overflow-x:clip}`；减少动态效果/不支持 IO 时不动画。
  - **分类默认折叠**（业主要求，页面太长）：每个分类是一个可点开的标题（显示道数、已点数量），点开才渲染菜品；顶部分类按钮会顺便打开该分类并滚过去。菜品卡在所有屏幕都用「左图右文」横排（桌面多栏、手机单栏）。
  - **口感·味道（2026-10-18）**：菜品加 `tt`/`ttEn`（格式「口感 · 味道」，一行短句），显示在菜名下（`.item .tt`）。内容摘自业主的「菜品口感与味道指南」docm；鱼类 = 鱼种口感 + 煮法味道组合。指南里的「注意事项」是给店员看的，**不放网站**（只把对客人有用的如「细刺多」「去骨」「自制海鲜豆腐」写进去）。指南没有的（田七、加咸鱼、3 道汤、饮料 B 系列）由我按家常口吻补写（2026-10-18 业主要求「简短家常化、不要夸张」），现在 83 道全部有 `tt`。
  - 纸本菜单上 A007、A017 被遮住看不清，**没放上网站**；A069 价钱被裁掉，暂按同类汤 16-25；A067 编号在纸本上重复（虾仁煎蛋 & 老黄瓜汤），汤那道内部 id 用 `A067S`。
- **页面顺序（业主指定，2026-10-15；10-17 改）**：首页（左：大 logo（桌面 176px、手机 132px）→ 店名 → 按钮 → 营业中/已打烊状态（放在按钮下面），**右：本店故事卡片 `aside#about`**，手机上叠在下面）→ 优惠活动 → 菜单 → 订位 → 门店地址 → 营业时间/联系。菜单栏顺序同上。营业时间：周一至五 11:00–15:00、17:00–22:00；周六日 11:00–14:30、16:30–22:00（全分店统一）。
- **设计风格（2026-10-17，业主要「有棱有角、不要太圆」）**：圆角统一用 `--r:3px`/`--rs:2px`（只有营业状态小圆点是圆的），标题用 Noto Serif SC（Google Fonts）+ 金色短横线，卡片用硬投影 `3px 3px 0`，首页有金色内框线和底部金边。之后新增元件也照这套，不要再用 999px 药丸圆角。
- 优惠活动卡片可加 `badge`/`badgeEn` 角标（限时/平日/生日/预订）；目前 4 个都是**示例**，等业主给真实活动。
  - **滑入动画（2026-10-18 业主要求）**：客人滚到优惠活动时，卡片一张接一张滑进来（单数从左、双数从右，每张间隔 0.12s）。`revealPromos()` 用 IntersectionObserver，只播一次（`promosSeen`，切换语言重绘时直接显示）；`#promos{overflow-x:clip}` 防止滑入前的卡片撑出横向滚动；系统设定「减少动态效果」或浏览器不支持 IntersectionObserver 时直接显示不动画。注意 class 名用 `rv`/`seen`，**不要用 `in`**（`.promo .in` 是卡片内文容器）。
- **Facebook / Instagram（2026-10-17，最终位置）**：① **页头、整个画面最左边**（业主给 Oriental Kopi 截图：FB/IG 贴最左，logo/菜单留在原本位置）：单色线条图标，品牌红色，FB 在前（`socTopHTML()`/`SOC_MONO`）。宽度 ≥1260px：`position:absolute;left:24px` 贴页面最左，不占 logo 位置；≥1720px 才显示名字；<1260px（小电脑/手机）退回 logo 左边、只显示图标、加细分隔线；≤480px 店名文字隐藏只留 logo。② **联系区「关注我们」**：彩色官方图标（IG 渐层圆角方、FB 蓝圆）+ 账号名（`socIconsHTML(true)`/`SOC_ICON`）。首页红色区块、页脚**不放**（业主：下面只要一个）。名字用 `social.instagramName` / `social.facebookName`。点了开新分页。
- **首页背景照片（2026-10-26 业主提供 Old Klang Road 店面照）**：`images/hero.jpg`（1920 宽）+ `images/hero-m.jpg`（手机用 960 宽），`config.js` 的 `heroImage`/`heroImageMobile`/`heroPos`。原图 960×640，已去掉左上加上去的 logo 和左边绿色招工横幅（用入口右侧店面镜像补上 + inpaint），裁成只剩明记那栋，Lanczos 放大 + 锐化（不是 AI 高清，细节有限，有原图/新照片可再换）。上面盖深色渐层 + 2px 模糊让字看得清（`.hero.img::before`）。宽屏 hero 很扁，图片 cover 后主要看到招牌那一段。
- Logo：`images/logo.png`（业主提供的红底金字「明记」方形图），同时用作首页大图标和浏览器分页图标。
- **优惠码 Voucher（2026-10-15）**：只在购物车结账时输入（业主要求把优惠活动区块的兑换框拿掉；`ordering.voucherInPromos:true` 可再打开）。`config.js` 的 `vouchers` 只存 `sha256("mk-voucher:" + 大写码)`，**原码绝不写进仓库**（公开仓库+公开网页，写明文等于公开）。类型 percent / amount / gift，可设 minSpend、maxOff、from/to。静态网站**无法限制使用次数**，WhatsApp 讯息带优惠码与折扣金额，由店员核对。业主给新码时：算哈希加进 `vouchers`，在 commit 讯息/文件里只写标题不写码。没有任何有效优惠码时，兑换框自动隐藏。
- **付款步骤（2026-10-17，业主要「下单→QR→付款→付款成功→跳 WhatsApp」）**：选「现在转账付款」时按钮变「💳 下单并付款」，按下后弹出付款视窗（`openPayStep`）：三步指示 → 应付金额（含 SST/运费/优惠）→ 参考号 `MKmmdd-xxxx`（可复制，请客人填在转账备注）→ QR（可下载）+ 户口（可复制）→ 勾「我已完成付款」才能按「发送订单到 WhatsApp」→ 打开 WhatsApp（讯息带付款金额+参考号）→ 完成画面（可重开 WhatsApp、按完成清空购物车）。✕ / Esc 关闭回购物车。**没有付款网关，「付款成功」是客人自己确认**，店员凭 WhatsApp 收据截图+参考号核对。到店/货到付款不走这个视窗，直接发 WhatsApp。自取、外卖都适用。**测试模式**：网址加 `?paytest=1`，在还没填真实收款资料时用业主个人的 TNG eWallet QR `images/test-tng-qr.jpg`（CHONG YOU XIAN，业主指定做测试用；`images/test-qr.png` 是旧的假 QR，备用），让业主自己走一遍流程；正常网址客人看不到。填了真实 `payment` 后测试模式也会改用真实资料。要真正自动确认付款，需申请 ToyyibPay/Billplz 等付款网关 + 一个小后台（如 Supabase Edge Function）验证付款状态。
- **付款确认小后台（2026-10-17，业主选「A. 店员按确认」+「新开免费 Supabase 项目」）**：`supabase/schema.sql`（表 `web_orders`、店员白名单 `web_staff`；匿名只能调 `create_web_order()` 建单、`web_order_status(ref, token)` 查自己那笔；只有白名单店员登录后能读/改订单；函数全 plpgsql + security definer）。客人端：`config.js` 的 `backend.supabaseUrl/supabaseAnonKey` 有填时，付款视窗不再要客人勾选，而是建单（pending）→ 每 3 秒轮询 → 店员按已收款(paid) → 自动 `location.href` 到 WhatsApp（不用 window.open，因为不是点击触发会被拦）；rejected 显示联系店家；30 分钟没确认显示超时；后台连不上自动退回旧的勾选流程。店员端：`admin.html`（supabase-js@2.45.4 UMD，**档名是 dist/umd/supabase.js，不是 .min.js**），登录 → 待确认/已收款/已拒绝、按分店筛选、每 5 秒更新、新订单响铃、确认/拒绝写 `confirmed_by`。**后台是独立的 Supabase 项目，不连 ERP**。设定步骤写在 README。⚠️ 没有付款网关，「已收款」是店员人工核对 TNG/银行后按的。
  - **目前未启用（2026-10-17）**：业主 Supabase 免费版 2 个项目名额已满，决定先不做后台，`backend` 留空 → 网站走客人自己勾选的旧流程。代码都保留，以后要启用：用另一个邮箱开新 Supabase 账号（或暂停一个没用的项目）建项目，照 README 跑 schema.sql，再把 URL + anon key 填进 `config.js` 即可。**不要放进牛室 ERP 的 Supabase**；放明记 ERP 的项目也行，但要先核对表名/`auth.users` 上的邀请码触发器不冲突（店员可直接用 ERP 账号，不要另外 Add user）。
- **店员订单核对 + 每月总结（2026-10-17，`check.html`）**：店员把客人 WhatsApp 订单整段贴进来，按 WhatsApp 讯息格式（`buildMsg`/`waTotalLines` 产生的那套，中英文标签都认）解析，**用 config.js 现在的菜单价重算**：菜品用「编号+菜名+份量做法」整串精确比对（`variants()` 列出每道菜所有份量×做法组合），优惠码比对哈希+有效期(用订单日期)+minSpend，SST、运费（按 zone label）、合计逐项对比，客人写的已转账金额也对。结果 ✅/⚠️/❌。**改了 index.html 的 WhatsApp 讯息格式，check.html 的解析要一起改**（已用网站实际产生的讯息测：自取、外卖+优惠码、英文版、改价、假优惠码、不存在的菜）。按「记录」存进**店员那部装置的 localStorage**（`mk_staff_orders_v1`，id=参考号，没参考号就用讯息哈希防重复）；「每月总结」按订单日期分月：订单数/营业额/小计/平均/优惠/SST/运费/自取外卖/按分店/热卖 Top15/列表，导出 CSV（有防 Excel 公式注入）、JSON 备份与合并。不连任何后台，所以不是跨装置自动汇总；**等 Supabase 后台启用后**，要在 admin.html 加从 `web_orders` 读的每月总结（全分店自动汇总，只有白名单店员能看），check.html 的手动记录可作为没开后台时的备案。admin.html 页头有链接到 check.html。 可「加到主画面」当 App 用（`check.webmanifest` + apple-touch-icon，页面上有 iPhone/Android 步骤说明，App 模式下自动收起）；「📋 一键贴上并核对」用 `navigator.clipboard.readText()`（浏览器会问一次权限，读不到就退回手动贴上）。
- **只按地址算 + 路程估算（2026-10-18 业主要求，取代下面 GPS/两个按钮的写法）**：外卖表单只剩一个「📍 确认地址」按钮（GPS「用我现在的位置」拿掉了，`locateMe` 留着没用）。客人改地址（textarea `change`）会自动重新确认；没确认不能下单（`needConfirmAddr`），配送范围下拉锁住，**只有地图找不到地址时（`addrFail`）才开放客人自己选**、店员核对。**距离 = 直线 × `delivery.roadFactor`（1.3）当作开车路程**（业主测 Seri Kembangan 地址：直线 11.6km 没跳「太远」，实际开车约 15km+，所以加系数；要精准导航距离得用付费 Google API）。运费档、15km 上限、建议分店、讯息、check.html 都用这个估算路程。
- **地图图钉确认位置（2026-10-19，免费、最准；同日改成「购物车里直接显示地图」）**：客人在外卖表单填好地址（地址框 `change`/离开时）→ 自动用 `geo.js` 查位置 → **购物车里地址框下面直接出现地图**（`#pinslot`，不跳视窗），图钉放在地址上，下方即时显示「离 X 路程约 Y km → 档位 · 运费」；不准就**拖图钉或点地图**，放开那一下就算确认（`pinPlaced`，`delGeo.src="pin"`，并 `panTo`）。查不到地址时图钉放在所选分店，要客人自己点/拖到家门口，没放图钉不能下单（`needConfirmAddr`）。下次打开购物车有记住的地址会自动显示。地图元素 `pinWrap` 放在购物车外长期保留，每次 `renderDrawer` 后 `mountPin()` 搬回去（购物车会因加菜/改选项一直重绘）。讯息标签：没动图钉=「送餐定位（按地址估算）」，动过=「送餐定位（客人在地图确认）」，check.html 都认。地图用 **Leaflet 1.9.4（`vendor/leaflet/`，不走 CDN）+ OpenStreetMap 图块**（要保留署名；量大要换图块服务）。⚠️ 本页自己的 `L()` 跟 Leaflet 全局 `L` 同名，**Leaflet 一律用 `window.L`**。地图载不到时退回「用地址查到的位置」，地址也查不到才开放客人自己选范围（`addrFail`）。⚠️ 地址框 `change` 时**不能同步重绘购物车**（会吃掉客人紧接着的点击），只异步查完再重绘。按钮「📍 在地图上找地址」是手动再查一次。
  - **Google 地址建议（2026-10-26 已启用，key 已填，限制：网址 mengkeesystem.github.io/*、restoranmengkee.com.my/*、www.restoranmengkee.com.my/*；API 应只留 Maps JavaScript / Places (New) / Geocoding——业主当时还是 32 APIs，提醒他缩）**；沙箱用真 key 模拟正式网址测过：「Mid Valley Megamall」「Kinrara Ria」有建议、选了自动算运费，打完整地址不选也会用 Geocoder 定位。选建议时若 formattedAddress 没有大楼/公寓名，会把 mainText 补在前面（骑手要用）。原记录：：`config.js` 的 `googleMaps.apiKey` 有填才启用（空 = 照旧只用 OpenStreetMap）。客人在外卖地址框打 ≥3 字 → 300ms 后用 **Places API (New)** `AutocompleteSuggestion.fetchAutocompleteSuggestions`（只限马来西亚 `includedRegionCodes:["my"]`、偏向所选分店 20km、session token 省钱）在地址框下面画自己的下拉 `#addrSug`（不用 Google 的输入框，样式照网站）→ 选了用 `toPlace().fetchFields(location, formattedAddress)` 填回地址、`gPick` 直接给 `locateAddr` 用（不再查 Nominatim）、光标放最前面方便补门牌；没选建议、直接打字的地址 → `gGeocode()` 用 Google **Geocoder**（ROOFTOP=exact），失败才退回 `geo.js`（OSM）。下拉项用 `pointerdown`+`preventDefault`，否则地址框先失焦触发 `change`，会拿半截地址去查。Google 载入失败/8 秒超时 → 退回 OSM。地图显示和拖图钉仍是 Leaflet + OSM（不用 Google 地图图块，省钱）。CSP 已加 `*.googleapis.com`/`*.gstatic.com`（script）、`*.googleapis.com`/`*.google.com`（connect）。已用模拟的 google.maps 测过（建议、选取、Geocoder、XSS、没 key 时不影响）；**真实 key 沙箱连不到 Google，要业主在手机上试**。隐私说明已加「Google 地图」。
  - **地图改成 Google 地图（2026-10-26 业主反映「还是 OpenStreetMap」+ 图块空白 + 算出 165 km）**：有 Google 时 `locateAddr` 用 `gPinMap()` 建 Google 地图（`gm.Map` + 可拖的 `gm.Marker`，图钉用自带的红色 SVG data URI，不靠 Google 下载；分店点是金色圆点 `SymbolPath.CIRCLE`）；包成跟 Leaflet 一样的接口（getLatLng/setLatLng/panTo/setView/invalidateSize，`pinMap.g` 是真的 Google Map），所以 updPinInfo/pinPlaced/mountPin 两种地图通用；没 Google 才退回 Leaflet+OSM。`google.maps.Marker` 已被 Google 标为 deprecated（还能用、没说停用；改 AdvancedMarkerElement 要建 Map ID）。**送餐范围 `delivery.area`**（雪隆+芙蓉大方框 n3.45/s2.45/e102.15/w101.25）：Google 建议用 `locationRestriction` 只列范围内地址，Geocoder 加 `bounds`，查到范围外（别州同名路）一律当找不到 → 图钉放分店、请客人自己拖。CSP 加了 `img-src blob:`、`worker-src blob:`。Google 动态地图每次载入算一次 Dynamic Maps（每月有免费额度）。真 key 测过：Kinrara Ria 出 Google 地图、点地图移图钉重算运费；「Jalan Wong Ah Fook, Johor Bahru」被挡成找不到。
  - **业主开 key 的步骤**：console.cloud.google.com → 新建项目 → Billing 绑卡（debit 可）→ 启用 Maps JavaScript API、Places API (New)、Geocoding API → Credentials 建 API key → 限制 Websites `https://mengkeesystem.github.io/*` + 只准这 3 个 API → Budgets 设提醒 → key 发给我填进 config.js。
  - **以后可选的升级（2026-10-19 记录，业主说先记着）**：只把「找地址」这一步换成 **Google Geocoding API**（地图和拖图钉照旧用 Leaflet+OSM），让图钉一开始就更接近门口。业主问过：Google Cloud **马来西亚账号可以用有 Visa/Mastercard 标志、能网上/海外付款的 debit card**（不一定要信用卡，不能直接扣银行户口；开户可能有小额验证扣款）。2025-03 起 Google 每个 Essentials 功能每月约 10,000 次免费（第三方资料，以官方价目为准），小餐馆一般用不完；要设预算提醒。API key 会出现在网页里，要在 Google 后台限制只能从官网网址用、只开 Geocoding。参考：Grab 用自家 GrabMaps（建在 OSM 上，用司机数据补门牌），不对一般网站开放；Foodpanda 用哪家没公开资料。
- **本店故事滑入（2026-10-19）**：首页右边「本店故事」卡片第一次进画面时从右边滑进来（`revealStory()`，只在开页设一次；`#hero{overflow-x:clip}`）。
- **一定要先付款（2026-10-18 业主规定）**：怕客人下单后不来拿、厨房白做，所以**自取和外卖都必须先付款**：`payment.allowPayAtCounter:false`（不再有「到店付款/货到付款」选项，`?paytest=1` 也照这个设定），`payment.requirePrepay:true`——**还没填正式收款资料（qr/accountNo）时，网上点餐整个暂停**：购物车显示「网上点餐暂停：店家还在设定收款方式…」，按下单会被挡（`payNotReady`）。业主给了正式商家 QR/户口后才会恢复下单；测试用 `?paytest=1`。check.html：设定不收到店付款时，讯息里没有「已转账」就报 ❌。
- **自取也要选分店（2026-10-18）**：购物车从外卖切回「自取」时跳出「📍 请选择自取的分店」（`openOutletPick(null,"opickPickT")`）；每单第一道菜的选分店照旧。
- **结账付款（2026-10-15）**：购物车表单里有「💳 付款方式」：现在转账付款（显示 DuitNow QR + 银行户口 + 复制户口号按钮 + 应付金额=扣完优惠后的合计）/ 到店取餐时付款（`allowPayAtCounter:false` 可关掉）。资料在 `config.js` 的 `payment`，分店可用 `outlets[i].payment` 覆盖。`qr` 和 `accountNo` 都空就不显示。WhatsApp 讯息最后一行带付款方式，客人需把收据截图发 WhatsApp，店员核对。**没接付款网关**：静态网站无后台，客人可在浏览器改金额，所以靠人工核对收据。
- **自取 / 外卖（2026-10-15）**：购物车顶部切换。外卖要填送餐地址 + 选配送范围，运费加进合计（顺序：小计 − 优惠 + 运费 = 合计；优惠的 minSpend 只看食物小计，不含运费）。设定在 `config.js` 的 `ordering.delivery`（zones 每档 label/fee、minOrder、freeAbove、leadMinutes、note）。业主规则（2026-10-18 最新，参考 Grab/Foodpanda 后改）：**3km 内 RM2、3–5km RM5、5–10km RM8、10–12km RM11、12–15km RM15；最远 15km**（`zones[].maxKm`；`delivery.maxKm:15`。程序仍支持「按 km 加钱」的档：`perKmFrom`/`perKm`，目前没用。`zoneFee(z,km)` 算钱，`delKm` 是定位算出的距离）。有 perKm 的档**一定要定位/按地址算**，客人自己选会被挡（`needGeoKm`，目前没有这种档）；超过 maxKm（2026-10-18 业主要求）**自动跳出提示视窗**（`farCheck`，在定位/按地址/换分店之后触发，共用 `#opick`）：「距离太远，这间分店送不到」+ 列出离客人最近、在范围内的最多 3 间分店（距离+运费，`outletsByDist`），点一下就改用那间并重算运费；都太远就说暂时不能外卖；底部「改成到店自取」。也不能发送。check.html 同样按距离重算运费、超过 maxKm 报错。11 间都送，**按直线距离**（业主问能否用 Waze 算——Waze 没有给网站算距离的接口，只能直线；行车距离要付费 Google API，业主选了免费方案）。
  - **方案 A：外卖价 + 新运费（2026-10-26 业主选）**：`delivery.priceMarkup:0.10` + `markupStep:0.5` → 外卖价 = 菜单价 ×1.10 往上凑整到 RM0.50（`delPrice`/`priceFor`，`isDel()` 时才用；自取照原价）。菜单卡片价钱下多一行「🛵 外卖 RM x」（`.delp`），购物车/讯息小计标「(外卖价)」。运费 zones 改成 **0–5km 免运费、5–10km RM4、10–15km RM8**，`minOrder:30`（食物小计−优惠，外卖价）。理由（业主问过）：加价补近距离骑手费、远的收少量运费，整体约打平；只加外卖不加自取，免得自取客人吃亏；价钱要清楚标示。
  - **改成每份 +RM1 + 运费分段（2026-10-26 同日，业主选「方案 1」，取代上面的 +10%/5km 免运费）**：业主问「+10% 改成每道 +RM1 会不会亏」——按骑手成本估算（第三方：≤5km RM6–9、5–10km RM10–13、10–15km RM13–20），+RM1 配原运费每单亏 RM3–6，所以运费一起调高。现在 `delivery.priceAdd:1`（外卖价 = 每份菜单价 + RM1，不凑整；`priceAdd` 有值时优先，`priceMarkup` 设 0 留作备用），zones **0–5km RM4、5–10km RM8、10–15km RM12**，`minOrder:30` 不变。以 3 道菜算，各段收到 RM7/11/15，大约打平骑手成本。`hasDelMarkup()` 判断要不要显示「外卖价」标签；index.html 和 check.html 的 `delPrice` 同一套。拿到 Delyva/Lalamove 真实报价后要再核算。
  - **打包盒 + 客制化（2026-10-26 业主）**：每道菜按「+」先跳 `#cust` 视窗（`openCust`/`renderCust`/`custAct`）：口味要求可多选（`ordering.customize.options`：不要葱/不要蒜米/不要芫荽/不要辣/少辣/少盐/少油）+「其他要求」文字（`noteMax:30`，`cleanNote` 去掉 []=|<>• 换行）+ 打包盒说明 + 数量 →「加入购物车 · RM（含打包盒）」。分类 `customize:false`（茶类、饮料）不显示口味选项，但仍跳视窗显示打包盒。**打包盒** `ordering.packaging.fee:1`，鱼类三个分类 `box:3`，`ADD1 加咸鱼 box:0`；每份都收、自取外卖都收、**算进 SST 基数**，购物车/讯息有「打包盒: RM x」一行；不加外卖价。**购物车 key 扩充**：`菜id|份量|做法|选项序号(.)|备注代号`（无客制化仍是 3 段，旧购物车照用）；备注原文存 `site_cart_notes`，代号=`noteHash`，载入时全部验证（序号范围、代号对得上）。卡片「−」减同菜同份量的最后一行；卡片数量是同菜同份量各行合计（`itemQty`）。讯息每行：`• A001 招牌蒸松鱼头 [不要葱, 不要蒜米; 其他要求: …] x2 = RM 77.00`；check.html 去掉方括号再比对菜名，外卖单用外卖价、重算打包盒（缺「打包盒」行或金额不对报 ❌）、SST 含打包盒、外卖未满最低消费报 ❌。旧测试脚本要在加菜后补按 `__site.cust('add')`。
  - **只有部分分店做外卖（2026-10-26 业主：先开 3 间外卖，其他只开自取）**：`config.js` 分店加 `delivery: true` 的才送外卖（现在是 OKR、OKR (Scott Garden 对面)、Kelana Jaya (PJ)）；**全部都没写 = 全部送**。`delOK(i)`/`delOutletsOn()`/`delOutletNames()`。效果：首页分店卡片显示「🛵 外卖 + 自取」或「🛍️ 只限自取」（`.osvc`）；外卖模式下选分店视窗里不送外卖的分店变灰不能按（`.nodel`，标「只限自取」），切到外卖时若当前分店不送就跳「请选择外卖分店」；购物车分店下拉把它们 `disabled`；外卖区顶部写「外卖目前只限：…」；送出时再挡（`delNotHere`）；太远建议的分店（`outletsByDist`/`nearestOutlet`）只列有外卖的；check.html 收到只限自取分店的外卖单报 ❌。以后加开外卖分店：在 config.js 那间分店加 `delivery: true` 即可。
  - **自动算运费（GPS）**：`delivery.autoDistance:true` 时，外卖表单有「📍 用我现在的位置自动算运费」：手机定位 → 跟所选分店 `lat/lng` 算直线距离（`kmBetween` haversine）→ 自动选档并锁住下拉（`delAuto`），可点「不在送餐地址？改成自己选」解锁。换分店会重算。分店没填坐标 / 客人拒绝定位 / 定位失败 → 退回客人自己选、店员核对。位置**不存浏览器**，只写进这次 WhatsApp 讯息一行「送餐定位: https://www.google.com/maps?q=lat,lng (离分店直线约 X km)」给骑手导航+店员核对。check.html 读这行，用分店坐标重算距离，跟客人选的档不符就报 ❌ 并按应有的档算运费。
  - **分店坐标已填（2026-10-18 晚）**：业主之后给了 docx「分店地址 With Coordinates」，11 间 `lat/lng` 已写进 `config.js` 的 `outlets`（4 位小数，约 ±10 米）。所以分店位置现在直接用坐标，不再靠地址查；Waze 按钮也改成按坐标导航（`waze.com/ul?ll=lat,lng`）。`geo.js` 只剩「🏠 按客人填的地址算」会用到，以及以后新分店没填坐标时的后备。
  - **（原先的后备方案）分店坐标自动查**：业主当时没有坐标——`geo.js`（index/check 共用）在客人/店员自己的浏览器用免费 OpenStreetMap Nominatim 把分店地址转成坐标，结果存 localStorage `site_geo_cache_v1`（读回时验证在马来西亚范围内）。查不到会逐步放宽：完整地址 → 去掉前面的门牌/店名 → 只用「邮区+城市」（`lvl` = exact/street/postcode）。Nominatim 规定每秒 ≤1 次、要缓存，所以逐个查间隔 1.1 秒；**订单量大了要改用 Google Geocoding API**。config 里分店若填了 `lat/lng` 会优先用（更准）。沙箱连不到 Nominatim，只用模拟回应测过，**实际准不准要业主在手机上试**。CSP `connect-src` 已加 `https://nominatim.openstreetmap.org`。
  - **按地址算（2026-10-18）**：外卖表单两个按钮「📍 用我现在的位置算运费」「🏠 按我填的地址算运费」。按地址也是用 `geo.js` 查客人地址（只查到邮区时提示「距离是大概的」）；改了地址要重按（`change` 事件把旧结果作废）。讯息标签分「送餐定位」/「送餐定位（按地址估算）」，check.html 都认。定位/地址都可被懂技术的人伪造，店员仍要看一眼地址。
外卖时「到店付款」变「货到付款」，WhatsApp 标题变【网上点餐 - 外卖】并带地址与运费。
- **订位草稿（2026-10-26 业主要求）**：订位表单每一栏（姓名/电话/分店/日期/时间/人数/备注）一改就存 `site_bk_draft`，刷新或切换语言后照样还在；客人自己删掉的栏存成空字串，刷新后保持空（不会再用 `site_guest` 补回）。日期/时间/人数只还原选单里真的有的值（过期的就退回第一个可订时间）。
- **外卖运费说明不显示（2026-10-26 业主要求）**：`delivery.note`/`noteEn` 设成空，购物车外卖区不再显示「运费：5km 内 RM4…外卖价 +RM1」那段；运费照样在合计里算、讯息照写。
- **购物车顺序（2026-10-26 业主要求）**：菜品列表 → 姓名/电话/分店/地址/时间/备注 → **优惠码 + 小计/打包盒/SST/运费/合计（`.sumbox`，放在表格下面）** → 付款方式 → 下单按钮。
- **SST（2026-10-17）**：`ordering.sstRate:0.06`。购物车：小计 − 优惠 + **SST 6%（按「小计 − 优惠」计，运费不收）** + 运费 = 合计；付款金额、WhatsApp 讯息都用含 SST 的合计（`waTotalLines()`）。菜单每道菜价钱下方小字「(不含SST)」。`sstRate:0` 则全部不显示。
- **退款政策 & 隐私说明（2026-10-26，为申请付款网关）**：独立页面 `policy.html`（`#refund`、`#privacy`，`?lang=en` 英文；自己的 CSP；只读 config.js），内容全在 `config.js` 的 `policies`（`refund`/`privacy` 各有 `sections:[{h,hEn,p:[],pEn:[]}]`、`updated`、`legalName`）。规则：须先付款；厨房开始准备前可取消全额退款，之后不退；「改正订单问题」：错漏/品质问题 2 小时内 WhatsApp+照片 → 补送/部分/全额退款，送达（或取餐）超过 2 小时一概不受理（2026-10-26 业主加）；店家无法完成 → 全额退款或换菜；自取逾期不取（留到打烊）、地址电话填错、交通天气合理延误、口味不同不退；退款 7 个工作天内退回原付款方式；优惠不兑现金；订位不收订金。隐私按 PDPA 2010（收集什么/用途/与谁分享：WhatsApp、骑手、付款平台、OpenStreetMap/存在客人浏览器/保存多久/查阅更正删除权利）。首页页脚和购物车（「下单即表示您同意…」）有链接，新分页打开。**`legalName` 还没填**（公司正式名称 + SSM 号）。以后接后台/网关/Lalamove，隐私说明「与谁分享」要同步改。⚠️ 复制给牛室时 policies 要按牛室规则重写（buffet 订位可能收订金）。
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

## ⏳ 待办（第三步）：做到跟「客善 HakShan」一样的全自动外卖（2026-10-25 业主要求）
参考：业主下单 order.hakshan.com 的截图——网上付款「已支付」、订单号 HS-xxxx、系统自动发确认到客人电话、付款后**自动叫 Lalamove 骑手**（share.lalamove.com 追踪链接）、订单状态页 3 步（已下单→寻找骑手→送达）+「查看骑手位置」+「在此设备接收订单通知」、预计送达 60–90 分钟、分享推荐赚 RM5。
**前提**：先完成上面第一步（Supabase 后台）和第二步（后台算钱 + 付款网关）。没有付款网关不能做自动叫骑手（不然没付钱也会叫车）。
**做法（顺序）**：
1. **Lalamove API**（developers.lalamove.com，v3）：业主注册 API Partner（Partner Portal）→ 先用 Sandbox key 测 → 充值 credit 后拿 Production key。key/secret 只放 Supabase Edge Function（HMAC SHA256 签名），**绝不放网页/仓库**。Market 用马来西亚的代码（以官方文档为准）。
2. **运费改用 Lalamove 报价**：结账前 Edge Function 调 quotation（分店坐标 → 客人地址），拿真实路程运费，取代现在的「直线×1.3 + 档位」（`delivery.zones` 可留作后备）。业主要决定：运费全收客人 / 店家补贴部分 / 满额免运。
3. **付款成功（网关 webhook 验签后）→ 自动 place order 叫骑手**；把 Lalamove orderId、分享追踪链接存进 `web_orders`。
4. **Lalamove webhook**（Developers → Webhook，选 v3）打到 Edge Function，更新订单状态（寻找骑手/已接单/取餐/送达/取消）。叫不到骑手/被取消 → admin.html 响铃提醒店员处理（重叫或改自取/退款）。
5. **客人订单状态页**（如 `order.html?ref=…&token=…`，沿用 `web_order_status` 的 ref+token 防别人偷看）：步骤条、预计送达、Lalamove 追踪链接；可加浏览器推送通知（PWA Web Push）。
6. **自动确认讯息**：先用状态页 + 浏览器通知（免费）；要自动发 WhatsApp 需申请 WhatsApp Business API（按讯息收费），业主决定再做。
7. 推荐奖励（分享链接、朋友首单付款后送 RM5 券）——要后台记录推荐码，最后做。
8. admin.html 加：每张外卖单的骑手状态、Lalamove 费用、手动重叫按钮；每月总结加运费成本。
**骑手公司改为「不绑死一家」（2026-10-26 业主补充）**：业主说客善用 Lalamove 那单 delay 了约 2 小时，问能否接 GrabExpress。结论：
- **GrabExpress 有 Express API**（developer.grab.com，报价/下单/状态/取消 + 状态 webhook，先 staging 再 production），但要**先跟 Grab 业务部门谈合约**才开通，小店不一定批得快；GrabExpress 不收生食/冷冻品，熟食外卖可以。
- 网上卖家经验（非官方）：Lalamove 报价便宜但常找不到骑手，GrabExpress 贵一点但比较容易叫到车。
- **做法**：Edge Function 写成「骑手公司可换」的一层（同一套 报价/叫车/取消/状态 接口，后面接 Grab 或 Lalamove）；**主叫 GrabExpress，X 分钟（如 10 分钟）叫不到骑手就自动取消、改叫 Lalamove**，再不行响铃叫店员处理。也可考虑聚合平台（如 Delyva，一个接口接 GrabExpress/Lalamove/Borzo 等），省去分别谈合约，但多一层费用、要查它的 API 条件。
**业主要准备**：Lalamove 商家账号 + API Partner 申请（公司资料）、预充 credit；付款网关商家账号；决定运费收法与准备时间（客善写 60–90 分钟）。
**安全**：Edge Function 验 Lalamove/网关 webhook 签名；叫骑手只在后台确认已付款后；CSP 加新的 connect/导向域名。

## ⏳ 上线前待补（2026-10-19 全面检查后记录，业主说先记着、暂时不动）
全面检查结果：XSS 注入攻击（菜名/分店名/优惠/客人资料/localStorage/地图查询结果）三个页面都挡住；手机+电脑 44 项功能测试全过；9 种篡改订单 check.html 都判对。还缺：
1. **正式收款 QR + 银行户口**（`config.js` → `payment`）——没填之前正式网址「网上点餐暂停」，**最优先**。
2. 填好正式 QR 后**删掉 `images/test-tng-qr.jpg`**（业主个人 TNG，`?paytest=1` 任何人看得到）。
3. **店面电话** `phone` 还是空的（「暂停下单」提示叫客人打电话，但页面没有号码）。
4. 真实资料：优惠活动（4 个都是示例）、Facebook 专页名、店内照片（`gallery` 空，区块隐藏）、A007/A017 菜名价钱、A069 价钱（暂估）。
5. 业主自己：GitHub 开 2FA；考虑自有域名（如 mengkee.com.my）。
- 已做（2026-10-19）：**分享预览**——`index.html` `<head>` 写死 `og:title/description/url/image`（logo）+ 静态 `<title>`/`description`（WhatsApp/FB 不跑 JS，不能靠 config 动态设）。⚠️ 复制给牛室时这几行要一起改。

## 测试
Playwright（`/opt/pw-browsers/chromium`，`file://`）在 1280 宽和 393 宽（iPhone 15 Pro）跑：加购物车 → WhatsApp 下单内容、订位 → WhatsApp 内容、中英切换、无横向溢出、无 JS 错误。拦截 `https://wa.me/**` 读取组好的讯息。

## 复制给牛室 Beef House 时要改的（因店制宜）
1. `config.js` 全部内容：店名、logo、电话/WhatsApp、地址/地图、营业时间、社交链接、故事、照片。**还有 `index.html` `<head>` 里写死的 `<title>`、description、og: 分享预览几行**。
2. **菜单结构不同**：牛室主体是 **buffet 吃到饱（按人头/时段计价）** + 单点牛扒/饮料。buffet 不适合「加购物车自取」，建议：
   - buffet 价格（成人/儿童/长者、平日/周末、午餐/晚餐）做成菜单里一个只展示、不能下单的分类（品项不放价钱按钮，或加 `soldOut`-类似的「仅堂食」标记——需要在 `index.html` 加一个 `dineInOnly` 选项）；
   - 单点牛扒/饮料照常可自取下单。
   - 订位对 buffet 更重要：可能要加「时段（午/晚）」「成人/儿童人数分开」——这是要改 `index.html` 订位表单的地方。
3. 颜色 `theme`：用牛室的深青色/金色（参考 ERP 的 `#12203A` / `#F2B417`）。
4. 新开一个仓库给牛室网站，不要跟明记共用（各自独立更新、各自 GitHub Pages）。
