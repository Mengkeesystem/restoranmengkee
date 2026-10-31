/* =====================================================================
 * 网站内容设定 (config.js)
 * ---------------------------------------------------------------------
 * 这个文件是「整个网站的内容」：店名、电话、营业时间、菜单、优惠……
 * 改内容只要改这个文件，不用碰 index.html。
 * 复制给牛室(或任何新店)时：index.html 原封不动，只换这个文件 + images/ 里的照片。
 *
 * ⚠️ 标了「TODO」的都是示例/占位资料，上线前一定要换成明记的真实资料。
 * ===================================================================== */
window.SITE = {
  /* ---------- 基本资料 ---------- */
  name: "明记家乡小食店",                 // TODO 确认正式店名
  nameEn: "Meng Kee Restaurant",
  tagline: "家乡的味道，一锅一铲炒出来",
  taglineEn: "Hometown flavours, wok-fried to order",
  logo: "images/logo.png",               // 网站 logo（页头、首页、浏览器分页图标）
  heroImage: "images/hero-sign.png",     // 首页背景（2026-10-26 业主：整个背景换成招牌设计图；之前的店面照 hero.jpg / hero-m.jpg 还留着）
  heroImageMobile: "",                    // 手机版另外的图（留空 = 用同一张）
  heroPos: "center",                      // 图片对准哪里
  heroSize: "100% auto",                  // 电脑版：招牌整张横着摆满（上下用招牌底色补）
  heroSizeMobile: "100% auto",            // 手机版：整块招牌横着摆一次、居中（2026-10-28 业主：像电脑版一样只铺一次、淡一点）
  heroPosMobile: "center top",            // 手机版：招牌放在红色背景最上面（2026-10-28 业主）
  heroRepeatMobile: false,                // 手机版：不重复铺（2026-10-28 业主：铺一次就好）
  heroPushMobile: true,                   // 手机版把 logo/店名/按钮推到招牌下面
  heroColor: "#800000",                   // 招牌底色，图片没盖到的地方用它

  /* WhatsApp 号码：国家码开头、不要 + 和空格，例如 60123456789 */
  whatsapp: "60176952455",              // 订单/订位 WhatsApp（+60 17-695 2455，2026-10-25 业主改）
  phone: "",                              // 显示用电话（「打电话」按钮）；空着 = 不显示
  address: "",                            // 多间分店时留空，地址改看下面 outlets
  /* Google Maps：在 Google Maps 搜到店 →「分享」→「嵌入地图」，复制 iframe 里 src="..." 的网址贴这里 */
  mapEmbed: "",                           // TODO 留空则显示「在 Google Maps 打开」按钮
  mapLink: "",                            // 单店时填 Google Maps 链接；多间分店留空

  /* 营业时间：0=星期日 … 6=星期六；休息日写 null。可一天两段：[["07:00","14:00"],["17:00","21:00"]] */
  hours: {
    0: [["11:00", "14:30"], ["16:30", "22:00"]],   // 星期日
    1: [["11:00", "15:00"], ["17:00", "22:00"]],   // 星期一
    2: [["11:00", "15:00"], ["17:00", "22:00"]],
    3: [["11:00", "15:00"], ["17:00", "22:00"]],
    4: [["11:00", "15:00"], ["17:00", "22:00"]],
    5: [["11:00", "15:00"], ["17:00", "22:00"]],   // 星期五
    6: [["11:00", "14:30"], ["16:30", "22:00"]],   // 星期六
  },

  /* Google 地址建议（客人打几个字就跳出建议地址）+ 更准的地址定位。2026-10-26 加。
   * apiKey 留空 = 不用 Google，照旧用免费的 OpenStreetMap。
   * ⚠️ key 会出现在网页里，必须在 Google Cloud 后台限制：
   *    ① Application restrictions → Websites → 填 https://restoranmengkee.com.my/*、https://www.restoranmengkee.com.my/*、https://mengkeesystem.github.io/*
   *    ② API restrictions → 只勾 Maps JavaScript API、Places API (New)、Geocoding API、Routes API
   *    ③ Billing → Budgets & alerts 设预算提醒 */
  googleMaps: { apiKey: "AIzaSyDT_OLyOxzx60ITUbkw-7O9sp_f3oIa_Y0" },   // 2026-10-26 业主提供；已限制 3 个网址 + 3 个 API

  /* 社交平台 / 外送平台链接，没有的留空 "" 就不会显示 */
  social: {
    facebook: "https://www.facebook.com/share/1GN91yegZu/?mibextid=wwXIfr",
    instagram: "https://www.instagram.com/restaurant_mengkee",
    instagramName: "restaurant_mengkee",     // 图标旁显示的账号名
    facebookName: "明记家乡小食店",           // TODO 确认 Facebook 专页名称
    foodpanda: "",                        // TODO
    grabfood: "",                         // TODO
  },

  /* ---------- 门店地址（分店） ----------
   * 按 region 分组显示（顺序 = 第一次出现的顺序）。
   * 每间可选填：hours(营业时间文字)、phone(显示用电话)、whatsapp(该店号码，国家码开头)、map(Google Maps 链接)。
   * 没填 map 会自动用地址搜 Google Maps；没填 whatsapp 订位/点餐就发到上面的总号码。 */
  /* 分店坐标 lat/lng（外送自动算距离 + Waze 精准导航）：2026-10-18 业主提供（分店地址 docx）。
     新分店：在 Google Maps 长按分店位置，最上面「3.1234, 101.6789」前面是 lat、后面是 lng。没填会改用地址自动查（geo.js）。 */
  /* delivery: true = 这间分店有外送（2026-10-26 业主：先开 OKR 两间 + Kelana Jaya 三间外送，其他只开自取）。
     全部分店都没写 delivery 时 = 每间都送。 */
  /* hitpay（2026-10-30）：payment.gateway = "hitpay" 时全部分店都用 HitPay；某间写 hitpay: false 就排除（那间暂停网上点餐）。
     HitPay 的 key 放在 Supabase 的 web-hitpay Secrets，不放这里（分店没有自己的账号就用共用账号）。 */
  outlets: [
    { region: "雪隆区", regionEn: "Klang Valley", delivery: true, name: "OKR", lat: 3.1064, lng: 101.6765, address: "97, Jln Klang Lama, Batu 3, 58100 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur",
      /* 2026-10-26 业主给的店面 Maybank DuitNow 商家 QR（照片解码后重新生成清晰版，内容一字不改） */
      payment: { qr: "images/pay/okr-duitnow.png", bankName: "Maybank (DuitNow QR)", accountName: "RESTORAN MENG KEE" } },
    { region: "雪隆区", regionEn: "Klang Valley", delivery: true, sst: false, name: "OKR (Scott Garden 对面)", lat: 3.0954, lng: 101.6738, nameEn: "OKR (opposite Scott Garden)", address: "Restaurant Meng Kee, opposite Scott Garden, Jln Klang Lama, 58200 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur",
      payment: { qr: "images/pay/scott-duitnow.png", accountName: "RESTORAN MENG KEE SCOTT" } },
    { region: "雪隆区", regionEn: "Klang Valley", delivery: true, name: "Kelana Jaya (PJ)", lat: 3.1119, lng: 101.5996, address: "15, Jalan SS 4d/2, SS 4, 47301 Petaling Jaya, Selangor",
      payment: { qr: "images/pay/pj-duitnow.png", bankName: "Maybank (DuitNow QR)", accountName: "MK KELANA SB" } },
    { region: "雪隆区", regionEn: "Klang Valley", name: "Cheras (Damai Perdana)", lat: 3.0458, lng: 101.7419, address: "23-G, Jalan Damai Perdana 1/9d, Bandar Damai Perdana, 43200 Cheras, Selangor" },
    { region: "雪隆区", regionEn: "Klang Valley", name: "Kajang", lat: 3.0034, lng: 101.7629, address: "13-G, Jln Besar Bukit Angkat, Bukit Angkat, 43000 Kajang, Selangor" },
    { region: "雪隆区", regionEn: "Klang Valley", name: "Puchong", lat: 3.0454, lng: 101.6212, address: "10, Jalan Kenari 12a, Bandar Puchong Jaya, 47100 Puchong, Selangor" },
    { region: "雪隆区", regionEn: "Klang Valley", name: "Subang", lat: 3.0423, lng: 101.5835, address: "22, Jalan USJ 11/3j, USJ 11, 47620 Subang Jaya, Selangor" },
    { region: "雪隆区", regionEn: "Klang Valley", name: "Klang (Bayu Tinggi)", lat: 3.0163, lng: 101.4332, address: "2-G, Jln Bayu Tinggi 2a, Taman Bayu Perdana, 41200 Klang, Selangor" },
    { region: "雪隆区", regionEn: "Klang Valley", name: "Bukit Rimau", lat: 2.9972, lng: 101.5312, address: "2-G, Jln Sungai Burung Y 32/Y, Bukit Rimau, 40460 Shah Alam, Selangor" },
    { region: "雪隆区", regionEn: "Klang Valley", name: "Setia Alam", lat: 3.1251, lng: 101.4646, address: "41-G, Jalan Setia Utama AT U13/AT, Alam Nusantara, 40170 Shah Alam, Selangor" },
    { region: "芙蓉区", regionEn: "Seremban", name: "Seremban 2", lat: 2.6953, lng: 101.9067, address: "Pusat Dagangan, 325-G, Jalan S2 B28, Seremban 2, 70300 Seremban, Negeri Sembilan" },
  ],

  /* ---------- 品牌故事 ---------- */
  story: [
    "明记家乡小食店成立于 2005 年，故事从旧巴生路的一个家乡小档口开始。",
    "21 年来，明记只坚持一件事：用家里的做法，煮大家每天都吃不腻的家常菜。",
    "我们坚持现点现炒、酱料自家熬制、食材每日新鲜采办。不管外面多忙，欢迎随时来坐坐，吃一顿像回家一样热腾腾的饭。",
  ],
  storyEn: [
    "Meng Kee Restaurant was founded in 2005, starting out as a small hometown stall on Old Klang Road.",
    "For 21 years, we have held on to one thing: cooking the home-style dishes everyone can enjoy every day, the way it's done at home.",
    "Every dish is wok-fried to order, our sauces are made in-house, and our ingredients are bought fresh every day. However busy life gets, drop by anytime for a warm meal that feels like home.",
  ],
  storyTag: "SINCE 2005",          // 本店故事标题上面的小标签（留空不显示）
  /* 本店故事下面三个特色（图标 + 短句）；留空数组不显示 */
  storyPoints: [
    { icon: "flame", t: "现点现炒", tEn: "Wok-fried to order", d: "一锅一铲，热腾腾上桌", dEn: "Straight from the wok" },
    { icon: "bowl", t: "酱料自家熬制", tEn: "House-made sauces", d: "老味道，外面吃不到", dEn: "Our family recipes" },
    { icon: "leaf", t: "食材每日新鲜", tEn: "Fresh every day", d: "每天一早采办", dEn: "Bought every morning" },
  ],
  /* 本店故事旁边的照片（用 3 张：第一张横幅大图（只看下半部的菜，从上面滑下来），下面左边一张（从左边进来）、右边一张（从右边进来））。有店内/门面照片后可以换掉 */
  storyImages: ["images/menu/A001.jpg", "images/menu/A021.jpg", "images/menu/A034.jpg"],

  /* 环境照片：放进 images/ 文件夹，写文件名。留空数组则不显示这一块 */
  gallery: [                              // TODO 放店内/门面照片
    // { src: "images/shop-1.jpg", caption: "店内环境" },
  ],

  /* ---------- 优惠活动 / 节日套餐 ----------
   * from/to 是显示期间(含当天)，过期会自动隐藏，不用手动删。to 留空 = 长期 */
  promos: [                               // TODO 以下是示例活动，请换成明记真实的活动（过期会自动隐藏）
    {
      icon: "clock", badge: "限时", badgeEn: "Limited",
      title: "开张优惠：堂食满 RM50 送凉水一杯",
      titleEn: "Opening promo: free herbal drink with RM50 dine-in",
      body: "活动期间堂食消费满 RM50，送自家凉水一杯（热/冷）。",
      bodyEn: "Spend RM50 on dine-in and get a free homemade herbal drink (hot/cold).",
      from: "2026-10-01", to: "2026-12-31", image: "",
    },
    {
      icon: "tag", badge: "平日", badgeEn: "Weekdays",
      title: "平日午市：招牌菜 9 折",
      titleEn: "Weekday lunch: 10% off signature dishes",
      body: "星期一至五 11am–3pm 堂食，点任何「招牌」标签的菜品享 9 折。",
      bodyEn: "Mon–Fri 11am–3pm dine-in: 10% off any dish marked Signature.",
      from: "2026-10-01", to: "2026-12-31", image: "",
    },
    {
      icon: "gift", badge: "生日", badgeEn: "Birthday",
      title: "生日月份：送招牌豆腐一份",
      titleEn: "Birthday month: free Signature Beancurd",
      body: "生日当月出示身份证，堂食满 RM80 送招牌豆腐（小）一份。",
      bodyEn: "Show your IC in your birthday month — spend RM80 on dine-in for a free Signature Beancurd (S).",
      from: "2026-10-01", to: "", image: "",
    },
    {
      icon: "calendar", badge: "预订", badgeEn: "Pre-order",
      title: "农历新年团圆饭：开放预订",
      titleEn: "Chinese New Year reunion dinner: now taking bookings",
      body: "6–10 人团圆套餐，含松鱼头、琵琶鸭、咖喱三鲜煲等招牌菜。请提前 7 天 WhatsApp 预订。",
      bodyEn: "Reunion sets for 6–10 pax featuring our signature bighead carp, pipa duck and seafood curry. Book 7 days ahead on WhatsApp.",
      from: "2026-10-15", to: "2027-02-28", image: "",
    },
  ],


  /* ---------- 优惠码 Voucher ----------
   * ⚠️ 这里只放「哈希」，不放真正的优惠码（不然任何人看网页源码就知道码）。
   * 新增优惠码：把码告诉 Claude，或自己在电脑终端跑：
   *   node -e "console.log(require('crypto').createHash('sha256').update('mk-voucher:'+'你的码'.toUpperCase()).digest('hex'))"
   * 字段：hash, title/titleEn(显示名称), type: "percent"(打折%) | "amount"(减 RM) | "gift"(送东西，不扣钱),
   *       value(数值), minSpend(最低消费), maxOff(最多折扣 RM), gift/giftEn(送什么), from/to(有效日期，含当天)
   * 静态网站无法限制使用次数：顾客下单讯息会带优惠码，由店员在 WhatsApp 核对。 */
  vouchers: [
    { hash: "66c5af23f003fb398977fdc6af49d9f495ea7915b3876d34453945e0121b64af", title: "新客优惠 减 RM10", titleEn: "New guest RM10 off", type: "amount", value: 10, minSpend: 100 },
    // { hash: "…", title: "开张优惠 9 折", titleEn: "Opening 10% off", type: "percent", value: 10, minSpend: 50, maxOff: 30, from: "2026-10-01", to: "2026-12-31" },
  ],


  /* ---------- 退款政策 & 隐私说明（policy.html 显示；网站页脚、购物车有链接）----------
   * 2026-10-26 为申请付款网关而写。legalName：填公司正式名称 + SSM 号（例如 "XXX Sdn Bhd (2020XXXXXXXX)"），付款网关审核常要看；留空就不显示。分店若有自己的公司（不同 SSM），在 outlets 那间分店加 legalName 就会盖过这里（目前只影响电子收据；退款政策页面和页脚永远显示这里的）。
   * 改了退款规则（例如几小时内投诉、几天退款）记得同步改这里，并更新 updated 日期。 */
  policies: {
    "legalName": "TCY Food Management Sdn Bhd (1333819-V)",
    "updated": "2026-10-31",
    "refund": {
      "title": "退款及取消政策",
      "titleEn": "Refund & Cancellation Policy",
      "sections": [
        {
          "h": "适用范围",
          "hEn": "Scope",
          "p": [
            "本政策适用于在本网站下单的自取及外送订单。所有网上订单都须先付款，店家确认收款后才开始准备。"
          ],
          "pEn": [
            "This policy applies to pickup and delivery orders placed on this website. All online orders must be paid in advance; we start preparing your food once payment is confirmed."
          ]
        },
        {
          "h": "取消订单",
          "hEn": "Cancelling an order",
          "p": [
            "厨房还没开始准备前，请尽快通过 WhatsApp 联系我们取消，可全额退款。",
            "厨房已开始准备后，因食物已经烹煮，恕不接受取消或退款。"
          ],
          "pEn": [
            "If the kitchen has not started preparing your order, contact us on WhatsApp as soon as possible to cancel for a full refund.",
            "Once the kitchen has started cooking, we are unable to accept cancellations or give refunds."
          ]
        },
        {
          "h": "改正订单问题",
          "hEn": "Order corrections",
          "p": [
            "如果收到的食物有错漏、少了菜，或品质有问题，请在收到后 2 小时内通过 WhatsApp 联系我们，并附上照片及订单参考号。核实后我们会补送、部分退款或全额退款。",
            "订单送达（或自取取餐）超过 2 小时，一概不受理。",
            "如果因为售罄、分店临时休息或其他原因无法完成订单，我们会主动联系您，并全额退款或经您同意改换其他菜品。"
          ],
          "pEn": [
            "If any item is wrong, missing or not up to standard, contact us on WhatsApp within 2 hours of receiving your order with photos and your order reference. After checking, we will replace the item or give a partial or full refund.",
            "Claims made more than 2 hours after delivery (or pickup) will not be accepted.",
            "If we cannot fulfil your order (sold out, outlet closed or other reasons), we will contact you and give a full refund, or a replacement dish if you agree."
          ]
        },
        {
          "h": "不设退款的情况",
          "hEn": "When refunds do not apply",
          "p": [
            "自取订单在约定时间后没有取餐：食物会保留到当天打烊，逾期恕不退款。",
            "外送地址或电话填错、骑手无法联络到您而无法送达。",
            "因交通或天气造成的合理延误（我们会尽量准时送达）。",
            "个人口味喜好不同。"
          ],
          "pEn": [
            "Pickup orders not collected: we keep the food until closing time that day, after which no refund is given.",
            "Delivery cannot be completed because the address or phone number given was wrong, or the rider could not reach you.",
            "Reasonable delays caused by traffic or weather (we always try to deliver on time).",
            "Differences in personal taste."
          ]
        },
        {
          "h": "退款方式及时间",
          "hEn": "How refunds are paid",
          "p": [
            "退款会退回原付款方式或您的银行户口，一般在确认后 7 个工作天内处理完成；经付款平台处理的退款，到账时间以银行或平台为准。",
            "优惠码及折扣不能兑换现金；部分退款按实际付款金额计算。"
          ],
          "pEn": [
            "Refunds are made to your original payment method or bank account, normally within 7 working days after approval. For payments made through a payment provider, the time to reach your account depends on the bank or provider.",
            "Vouchers and discounts cannot be exchanged for cash; partial refunds are based on the amount actually paid."
          ]
        },
        {
          "h": "订位",
          "hEn": "Table bookings",
          "p": [
            "网上订位不收订金。如需更改或取消订位，请通过 WhatsApp 通知我们。"
          ],
          "pEn": [
            "Online table bookings do not require a deposit. Please let us know on WhatsApp if you need to change or cancel."
          ]
        }
      ]
    },
    "privacy": {
      "title": "隐私说明",
      "titleEn": "Privacy Notice",
      "sections": [
        {
          "h": "我们收集什么资料",
          "hEn": "What we collect",
          "p": [
            "您下单或订位时填写的姓名、电话、送餐地址及地图位置、订单内容及备注、优惠码、付款参考号、付款方式及付款金额。"
          ],
          "pEn": [
            "The name, phone number, delivery address and map location, order details, voucher code, payment reference, payment method and amount you provide when ordering or booking."
          ]
        },
        {
          "h": "用途",
          "hEn": "How we use it",
          "p": [
            "只用来处理您的订单及订位、安排送餐、联系您、处理退款，以及店内对账。",
            "未经您同意，我们不会用您的资料发送推广讯息，也绝不会出售您的资料。"
          ],
          "pEn": [
            "Only to process your orders and bookings, arrange delivery, contact you, handle refunds and keep our own accounts.",
            "We will not send you promotions without your consent, and we never sell your data."
          ]
        },
        {
          "h": "与谁分享",
          "hEn": "Who we share it with",
          "p": [
            "本店订单系统：您在网站下的订单会直接送到我们的订单系统（云端数据库），只有本店获授权的员工账号能查看，并按分店分开。",
            "WhatsApp：网上订位的内容会通过您自己的 WhatsApp 发送给我们；联系店家或查询订单时也可能用到。",
            "送餐骑手或配送平台：只提供送餐所需的姓名、电话及地址。",
            "付款平台（HitPay）：网上付款由 HitPay 处理，付款时您输入的银行卡或网银资料只提供给 HitPay 及银行，我们不会看到，也不会保存。",
            "地图服务：查找送餐位置、计算路程时，您填写的地址及地图位置会发送给 Google 地图服务。"
          ],
          "pEn": [
            "Our order system: orders placed on this website go straight to our order system (a cloud database). Only authorised staff accounts of our outlets can view them, separated by outlet.",
            "WhatsApp: table bookings are sent to us through your own WhatsApp; it may also be used when you contact us or ask about an order.",
            "Delivery riders or delivery platforms: only the name, phone number and address needed for delivery.",
            "Payment provider (HitPay): online payments are processed by HitPay. The card or online-banking details you enter go only to HitPay and your bank; we never see or store them.",
            "Map services: when locating your delivery address and calculating the route, the address and map location you enter are sent to Google Maps."
          ]
        },
        {
          "h": "保存在您的手机",
          "hEn": "Stored on your device",
          "p": [
            "为了方便下次下单，网站会把购物车、语言、姓名、电话、送餐地址及地图位置保存在您自己的浏览器里，不会上传。清除浏览器资料即可删除。本网站不使用广告或追踪 Cookie。"
          ],
          "pEn": [
            "To make your next order easier, the site keeps your cart, language, name, phone number, delivery address and map location in your own browser; this is not uploaded. Clearing your browser data removes it. This website does not use advertising or tracking cookies."
          ]
        },
        {
          "h": "保存多久",
          "hEn": "How long we keep it",
          "p": [
            "订单资料只保存到处理订单、退款及会计记录所需的时间。"
          ],
          "pEn": [
            "Order details are kept only as long as needed for orders, refunds and accounting records."
          ]
        },
        {
          "h": "您的权利",
          "hEn": "Your rights",
          "p": [
            "根据马来西亚《2010 年个人资料保护法令》（PDPA），您可以要求查阅、更正或删除您的个人资料，请通过下方 WhatsApp 联系我们。"
          ],
          "pEn": [
            "Under Malaysia's Personal Data Protection Act 2010 (PDPA), you may ask to access, correct or delete your personal data. Please contact us on WhatsApp below."
          ]
        }
      ]
    }
  },

  /* ---------- 付款（结账时显示） ----------
   * qr: DuitNow QR 图片（放 images/ 里，例如 "images/duitnow-qr.png"）
   * bankName / accountName / accountNo: 银行转账资料（会显示「复制」按钮）
   * allowPayAtCounter: true = 客人可选「到店付款」；false = 一定要先转账
   * qr 和 accountNo 都空着 = 结账不显示付款区块。
   * 某分店用不同户口：在 outlets 那间加 payment: { qr: "...", accountNo: "..." } 覆盖。 */
  payment: {
    /* 2026-10-30 业主：全部分店都用 HitPay 网上付款（测试和正式都是），不再用 QR 转账。
       某间分店要排除就在那间写 hitpay: false。HitPay 的 key 在 Supabase web-hitpay 的 Secrets。
       下面 qr/bank 和各分店的 payment（QR 图）现在不会显示，留着以后要退回 QR 才用。 */
    gateway: "hitpay",
    /* 付款视窗让客人先选付款方式（2026-10-31 业主：信用卡手续费高，先推 DuitNow QR 等）。
       排第一、best:true 的会做成大按钮；small:true 的放最下面小字。icon 用线条图标名 qr/wallet/bank/card（也可以写 emoji）。codes = HitPay 的付款方式代码，
       客人选了哪组，HitPay 付款页就只显示那几种（账号没开的方式会自动改成显示全部）。 */
    methods: [
      { key: "duitnow", codes: ["duitnow"], best: true, icon: "qr", t: "DuitNow QR", tEn: "DuitNow QR",
        d: "用任何银行 App 或电子钱包扫码付款", dEn: "Scan with any banking app or e-wallet" },
      { key: "ewallet", codes: ["touch_n_go", "grabpay_direct", "shopee_pay"], icon: "wallet", t: "Touch 'n Go / GrabPay / ShopeePay", tEn: "Touch 'n Go / GrabPay / ShopeePay",
        d: "电子钱包", dEn: "E-wallet" },
      { key: "fpx", codes: ["fpx"], icon: "bank", t: "FPX 网上银行", tEn: "FPX online banking", d: "用网银转账", dEn: "Pay from your bank account" },
      { key: "card", codes: ["card"], small: true, icon: "card", t: "信用卡 / 借记卡", tEn: "Credit / debit card" },
    ],
    qr: "",                 // TODO 明记的 DuitNow QR 图片
    bankName: "",           // TODO 例如 "Maybank"
    accountName: "",        // TODO 例如 "MENG KEE RESTAURANT SDN BHD"
    accountNo: "",          // TODO 户口号码
    /* 2026-10-18 业主规定：自取和外送都一定要先付款（怕客人下单后不来拿，厨房白做）。
       false = 不给「到店付款 / 货到付款」；requirePrepay = 没设定收款资料时网上点餐暂停（不能下单） */
    allowPayAtCounter: false,
    requirePrepay: true,
  },

  /* ---------- 订单后台（Supabase）----------
   * 2026-10-27 业主决定放在明记 ERP 的 Supabase 项目（只用 web_ 开头的表/函数，不碰 ERP 资料）。
   * 两个都填好：客人付款后按「送出订单」，订单直接进店员后台 admin.html（会响铃），不用客人发 WhatsApp；
   *   店员核对收款后按「已收款」，客人网页显示「店家已确认」。
   * 留空：客人自己勾「我已完成付款」再发 WhatsApp（旧流程）。
   * 这里放的是 publishable key（本来就公开在 ERP 网页里）；绝对不要放 secret / service_role key。 */
  backend: {
    supabaseUrl: "https://kmcdokwiyetlmsrdlgqw.supabase.co",
    supabaseAnonKey: "sb_publishable_HVJ_hcFmSDU-N2kFUg5CRw_LH-X_phO",
  },

  /* ---------- 订位设定 ---------- */
  booking: {
    enabled: true,
    maxPax: 20,                           // 网上一次最多订几位，再多请打电话
    minDaysAhead: 0,                      // 0 = 可订当天
    maxDaysAhead: 30,
    slotMinutes: 30,                      // 时间选项间隔
    leadHours: 1,                         // 最少提前几小时订位（2026-10-18 业主定 1 小时）
    noDays: [0, 6],                       // 不接受订位的日子（0=星期日、6=星期六）：2026-10-18 业主定周末不能订位
    /* 公共假期不能订位（YYYY-MM-DD）。2026-10-18 按网上公布的 2026–2027 假期表填（伊斯兰节日按月亮，实际日期以政府宪报为准，临近时再核对）。
       周末本来就不能订，所以落在星期六日的假期写不写都一样。 */
    noDates: [   // 雪隆 + 森美兰都放假
      "2026-11-08", "2026-11-09",                 // 屠妖节 + 补假
      "2026-12-25",                               // 圣诞节
      "2027-01-01",                               // 元旦
      "2027-01-22",                               // 大宝森节
      "2027-02-06", "2027-02-07", "2027-02-08",   // 农历新年 + 补假
      "2027-03-10", "2027-03-11",                 // 开斋节
      "2027-05-01",                               // 劳动节
      "2027-05-17",                               // 哈芝节
      "2027-05-20",                               // 卫塞节
      "2027-06-06", "2027-06-07",                 // 回历新年、最高元首诞辰
      "2027-08-15", "2027-08-16",                 // 先知诞辰 + 补假
      "2027-08-31",                               // 国庆日
      "2027-09-16",                               // 马来西亚日
      "2027-10-28",                               // 屠妖节
      "2027-12-25",                               // 圣诞节
    ],
    noDatesByRegion: {   // 只有该区放假（按分店的 region）
      "雪隆区": ["2026-12-11", "2027-02-01", "2027-02-24", "2027-12-11"],   // 雪州苏丹诞辰、联邦直辖区日(KL)、可兰经降世日
      "芙蓉区": ["2027-01-06", "2027-01-14"],                               // 登霄节、森州最高统治者诞辰
    },
    noDaysNote: "星期六、日及公共假期是繁忙时段，暂不接受订位，欢迎直接到店。不便之处，敬请见谅 🙏",
    noDaysNoteEn: "Saturdays, Sundays and public holidays are our busiest times, so we don't take reservations — walk-ins are always welcome. Sorry for any inconvenience 🙏",
  },

  /* ---------- 网上点餐(自取) ---------- */
  ordering: {
    /* 菜单最上面「招牌推荐」：写菜的编号（id），按顺序显示；没照片/时价的不显示。删掉这一行 = 自动用有「招牌」标签的菜。
       要加角标就写成 { id: "A001", badge: "明记六宝", badgeEn: "MK Six" } */
    featured: [
      { id: "A001", badge: "明记六宝", badgeEn: "MK Six" },   // 招牌蒸松鱼头
      { id: "A021", badge: "明记六宝", badgeEn: "MK Six" },   // 招牌蒸啦啦
      { id: "A034", badge: "明记六宝", badgeEn: "MK Six" },   // 卤猪脚
      { id: "A043", badge: "明记六宝", badgeEn: "MK Six" },   // 南乳炸鸡
      { id: "A038", badge: "明记六宝", badgeEn: "MK Six" },   // 冬菜蒸猪肉
      { id: "A057", badge: "明记六宝", badgeEn: "MK Six" },   // 招牌豆腐
      "A008",   // 招牌蒸金凤鱼
      "R005",   // 咕咾肉饭
    ],
    pickupFollowsDelivery: true,   // 网上自取跟外送同一个接单时段（delivery.windows）：过了最后点餐时间，自取也不接、不能预约（2026-10-30 业主）
    voucherInPromos: false,   // 优惠码兑换框：false = 只在购物车结账时输入；true = 优惠活动区块也显示
    /* 外送：客人自己选配送范围，店员看地址核对。以后要改按邮区/自动算距离再调整 */
    delivery: {
      enabled: true,
      /* maxKm：估算路程 ≤ maxKm 就用这一档（路程 = Google 路线真实路程）；最后一档不写 maxKm = 以上全部。
         客人按「用我现在的位置」时自动选档（要该分店有 lat/lng），否则客人自己选、店员核对 */
      /* 2026-10-26 业主改：外送价 = 每份菜单价 +RM1（priceAdd），运费按距离分段收（原方案 A 是 +10% + 5km 内免运费，算下来每单亏 RM3–6） */
      /* 运费来源（2026-10-28 业主）："delyva" = 客人定好送餐位置后，向 Delyva 报价（web-delyva 的 quote），运费 = Delyva 价钱
         （跟之后叫骑手选的同一个服务：Delyva 排第一的 = 最快）。不写 feeSource = 只用 zones。 */
      feeSource: "delyva",
      feeFallback: "none",   // 2026-10-28 业主：运费 100% 照 Delyva；报不到价就不能下外送单（"zones" = 改用下面的距离分段估算）
      zones: [
        { label: "0–5km", labelEn: "0–5km", fee: 4, maxKm: 5 },
        { label: "5–10km", labelEn: "5–10km", fee: 8, maxKm: 10 },
        { label: "10–15km", labelEn: "10–15km", fee: 12, maxKm: 15 },
      ],
      /* 外送接单时段（2026-10-26 业主）：平日 11:00–14:30、17:00–21:30；周末 11:00–14:00、17:00–21:30。
         首页外送灯：时段内青色「外送」；结束前 warnMinutes（30 分钟）黄色「最后点餐时间」；时段外红色「停止外送 · 下次几点开启点餐」 */
      windows: { weekday: [["11:00", "14:30"], ["17:00", "21:30"]], weekend: [["11:00", "14:00"], ["17:00", "21:30"]] },
      warnMinutes: 30,
      maxKm: 15,            // 2026-10-26 业主：Google 路线（驾驶）路程 15km 内才送（10–15km 运费 RM12）
      travelMode: "TWO_WHEELER",   // 2026-10-26 业主：距离全部用 Google 路线（Routes API）真实路程；摩托（TWO_WHEELER），算不到才用驾车
      autoDistance: true,   // 显示「📍 用我现在的位置自动算运费」按钮
      minOrder: 30,          // 外送最低消费，0 = 不限
      freeAbove: 0,         // 满多少免运费，0 = 不设
      leadMinutes: 45,      // 最快几分钟后送达
      area: { n: 3.45, s: 2.45, e: 102.15, w: 101.25 },   // 送餐服务范围（雪隆 + 芙蓉的大方框）：地址建议/定位只认这里面的位置
      priceAdd: 0,          // 2026-10-28 业主取消外送每份 +RM1（外送跟自取同价）；填数字 = 每份菜单价 + 这个金额
      priceMarkup: 0,       // 外送价 = 菜单价 × (1+priceMarkup)，往上凑整到 markupStep（priceAdd 为 0 时才用）
      markupStep: 0.5,
      /* 外送预计时间（2026-10-26 业主）：只接「现在送」，不选送达日期/时间；全部是预计。
         准备时间按购物车总份数：繁忙时段（12:00–14:00、19:00–21:00）用 peakTiers；其他时段用 tiers（业主：快 5 分钟）。
         配送 = Google 路线时间 + ride.wait，以后接 Delyva 有真实时间就改用它。 */
      prep: {
        peak: [["12:00", "14:00"], ["19:00", "21:00"]],
        peakTiers: [ { maxQty: 3, min: 10, max: 15 }, { maxQty: 7, min: 20, max: 25 }, { min: 40, max: 45 } ],
        tiers:     [ { maxQty: 3, min: 5, max: 10 }, { maxQty: 7, min: 15, max: 20 }, { min: 35, max: 40 } ],
      },
      ride: { wait: [5, 10], slow: 1.3 },   // 配送时间 = Google 路线时间 + 等骑手 5–10 分；慢的那头 × 1.3（塞车）
      /* 2026-10-26 业主：运费说明不用显示给客人看（运费照样在购物车合计里算）；要再显示就填回这两行 */
      note: "",
      noteEn: "",
    },
    priceNote: "以上价格未含 6% 服务税（SST），结账时另计。", priceNoteEn: "Prices exclude 6% SST, which is added at checkout.",   // 2026-10-28 业主
    /* 打包盒（2026-10-26 业主）：自取、外送每份都加，一律 RM1；鱼类（松鱼头/金凤鱼/鱼类）分类设 box: 3；单道菜可用 box 覆盖（如加咸鱼 box: 0） */
    packaging: { fee: 1, label: "打包盒", labelEn: "Takeaway box" },
    /* 客人按「+」时跳出的客制化选项（2026-10-26 业主）；分类写 customize: false 就不跳（饮料） */
    customize: {
      options: [
        { zh: "不要葱", en: "No spring onion" },
        { zh: "不要蒜米", en: "No garlic" },
        { zh: "不要芫荽", en: "No coriander" },
        { zh: "不要辣", en: "Not spicy" },
        { zh: "少辣", en: "Less spicy" },
        { zh: "少盐", en: "Less salt" },
        { zh: "少油", en: "Less oil" },
      ],
      noteMax: 30,   // 「其他要求」最多几个字
    },
    sstRate: 0.06,            // 购物车自动加 SST（6%）；0 = 不加。算法：（食物小计 − 优惠）× 税率，运费不收 SST
    menuPhotos: ["images/menu-1.jpg", "images/menu-2.jpg"],   // 纸本菜单原图，可点开放大
    enabled: true,
    pickupLeadMinutes: 60,                // 最快几分钟后可自取（2026-10-18 业主定 1 小时）
    currency: "RM",
  },

  /* ---------- 菜单 ----------
   * 来源：明记纸本菜单照片（images/menu-1.jpg、menu-2.jpg），价钱不含 SST。
   * price: 单一价钱；prices: 多个份量的价钱（2 个=小/大，3 个=小/中/大，可用 sizes 自订名称如 半只/一只）
   * unit: 每「粒/只/位」计价；min: 最少数量；seasonal: true = 时价（不能网上下单，请致电）
   * options: 做法选择（例如蔬菜的马来栈/清炒）；image: 菜品照片；tag: 角标（招牌）；soldOut: 售完 */
  menu: [
    {
      "box": 3, "cat": "松鱼头",
      "catEn": "Bighead Carp",
      "items": [
        {
          "id": "A001",
          "tt": "肉嫩滑，鱼头胶质软糯（细刺多） · 鲜香甘甜，姜蓉微辣",
          "ttEn": "Silky flesh, soft collagen-rich head (many fine bones) · Fresh and sweet, light ginger-chilli kick",
          "code": "A001",
          "name": "招牌蒸松鱼头",
          "nameEn": "Signature Steamed Bighead Carp",
          "price": 35,
          "image": "images/menu/A001.jpg",
          "tag": "招牌"
        },
        {
          "id": "A002",
          "tt": "肉嫩滑，鱼头胶质软糯（细刺多） · 酸甜微辣 (Tiga Rasa)",
          "ttEn": "Silky flesh, soft collagen-rich head (many fine bones) · Sweet, sour, mildly spicy (Tiga Rasa)",
          "code": "A002",
          "name": "酱蒸松鱼头 (微辣)",
          "nameEn": "Steamed with Spicy Paste Bean",
          "price": 38,
          "image": "images/menu/A002.jpg"
        },
        {
          "id": "A003",
          "image": "images/menu/A003.jpg",
          "tt": "肉嫩滑，鱼头胶质软糯（细刺多） · 姜丝鲜香，较清淡",
          "ttEn": "Silky flesh, soft collagen-rich head (many fine bones) · Fresh ginger aroma, lighter taste",
          "code": "A003",
          "name": "清蒸松鱼头",
          "nameEn": "Steamed with Ginger Silk",
          "price": 35
        },
        {
          "id": "A004",
          "tt": "肉嫩滑，鱼头胶质软糯（细刺多） · 面豉苦瓜，咸香下饭",
          "ttEn": "Silky flesh, soft collagen-rich head (many fine bones) · Taucu & bitter gourd, savoury with rice",
          "code": "A004",
          "name": "炒松鱼头",
          "nameEn": "Stir-Fried Bighead Carp",
          "price": 38,
          "image": "images/menu/A004.jpg"
        },
        {
          "id": "A005",
          "tt": "肉嫩滑，鱼头胶质软糯（细刺多） · 酸辣开胃",
          "ttEn": "Silky flesh, soft collagen-rich head (many fine bones) · Appetising sour and spicy",
          "code": "A005",
          "name": "娘惹蒸松鱼头",
          "nameEn": "Steamed with Nyonya Style",
          "price": 40,
          "image": "images/menu/A005.jpg"
        },
        {
          "id": "A006",
          "tt": "肉嫩滑，鱼头胶质软糯（细刺多） · 咸香，稍偏咸",
          "ttEn": "Silky flesh, soft collagen-rich head (many fine bones) · Rich and savoury, a bit salty",
          "code": "A006",
          "name": "豆豉面豉蒸松鱼头 (咸)",
          "nameEn": "Steamed with Black Bean Taucu",
          "price": 38,
          "image": "images/menu/A006.jpg"
        }
      ]
    },
    {
      "box": 3, "cat": "金凤鱼",
      "catEn": "Red Tilapia",
      "note": "价钱按鱼的大小（小/中/大）",
      "noteEn": "Priced by fish size (S/M/L)",
      "items": [
        {
          "id": "A008",
          "image": "images/menu/A008.jpg",
          "tt": "肉质紧实细嫩，刺少 · 鲜香甘甜，姜蓉微辣",
          "ttEn": "Firm, tender flesh, few bones · Fresh and sweet, light ginger-chilli kick",
          "code": "A008",
          "name": "招牌蒸金凤鱼",
          "nameEn": "Signature Steamed Red Tilapia",
          "prices": [
            48,
            50,
            55
          ]
        },
        {
          "id": "A009",
          "tt": "肉质紧实细嫩，刺少 · 酸甜微辣 (Tiga Rasa)",
          "ttEn": "Firm, tender flesh, few bones · Sweet, sour, mildly spicy (Tiga Rasa)",
          "code": "A009",
          "name": "酱蒸金凤鱼 (微辣)",
          "nameEn": "Steamed with Spicy Paste Bean",
          "prices": [
            51,
            53,
            58
          ]
        },
        {
          "id": "A010",
          "tt": "肉质紧实细嫩，刺少 · 姜丝鲜香，较清淡",
          "ttEn": "Firm, tender flesh, few bones · Fresh ginger aroma, lighter taste",
          "code": "A010",
          "name": "清蒸金凤鱼",
          "nameEn": "Steamed with Ginger Silk",
          "prices": [
            48,
            50,
            55
          ],
          "image": "images/menu/A010.jpg"
        },
        {
          "id": "A011",
          "tt": "肉质紧实细嫩，刺少 · 面豉苦瓜，咸香下饭",
          "ttEn": "Firm, tender flesh, few bones · Taucu & bitter gourd, savoury with rice",
          "code": "A011",
          "name": "炒金凤鱼",
          "nameEn": "Stir-Fried Red Tilapia",
          "price": 55
        },
        {
          "id": "A012",
          "image": "images/menu/A012.jpg",
          "tt": "肉质紧实细嫩，刺少 · 香脆可口",
          "ttEn": "Firm, tender flesh, few bones · Crispy and fragrant",
          "code": "A012",
          "name": "油浸金凤鱼",
          "nameEn": "Deep-Fried Red Tilapia",
          "prices": [
            48,
            50,
            55
          ]
        },
        {
          "id": "A013",
          "tt": "肉质紧实细嫩，刺少 · 酸辣开胃",
          "ttEn": "Firm, tender flesh, few bones · Appetising sour and spicy",
          "code": "A013",
          "name": "娘惹蒸金凤鱼",
          "nameEn": "Steamed with Nyonya Style",
          "prices": [
            51,
            53,
            58
          ]
        },
        {
          "id": "A014",
          "tt": "外酥脆、肉细嫩，刺少 · 酸辣开胃",
          "ttEn": "Crispy outside, tender inside, few bones · Sour and spicy",
          "code": "A014",
          "name": "娘惹炸金凤鱼",
          "nameEn": "Deep-Fried with Nyonya Style",
          "prices": [
            51,
            53,
            58
          ]
        },
        {
          "id": "A015",
          "tt": "肉质紧实细嫩，刺少 · 椰香咸甜，几乎不辣",
          "ttEn": "Firm, tender flesh, few bones · Savoury-sweet coconut curry, barely spicy",
          "code": "A015",
          "name": "咖喱金凤鱼",
          "nameEn": "Curry Red Tilapia",
          "price": 60
        },
        {
          "id": "A016",
          "tt": "肉质紧实细嫩，刺少 · 咸香，稍偏咸",
          "ttEn": "Firm, tender flesh, few bones · Rich and savoury, a bit salty",
          "code": "A016",
          "name": "豆豉面豉蒸金凤鱼 (咸)",
          "nameEn": "Steamed with Black Bean Taucu",
          "prices": [
            48,
            50,
            55
          ]
        }
      ]
    },
    {
      "box": 3, "cat": "鱼类",
      "catEn": "Fish",
      "items": [
        {
          "id": "A018",
          "tt": "肉滑弹，胶质多 · 椰香咸甜，几乎不辣",
          "ttEn": "Bouncy flesh, collagen-rich · Coconut curry, barely spicy",
          "code": "A018",
          "name": "咖喱石斑鱼头",
          "nameEn": "Grouper Head (Curry)",
          "price": 58,
          "image": "images/menu/A018.jpg"
        },
        {
          "id": "A019",
          "image": "images/menu/A019.jpg",
          "tt": "肉厚细腻、入口即化，刺少 · 咸鲜回甘，油脂香浓",
          "ttEn": "Thick, melt-in-mouth flesh, few bones · Savoury, rich natural oils",
          "code": "A019",
          "name": "马友鱼",
          "nameEn": "Threadfin",
          "prices": [
            48,
            55
          ],
          "options": [
            "招牌蒸 Signature",
            "清蒸 Steamed",
            "娘惹炸 Nyonya Fried",
            "油浸 Deep-Fried"
          ]
        },
        {
          "id": "A020",
          "image": "images/menu/A020.jpg",
          "tt": "肉嫩滑，几乎无刺 · 清甜鲜美",
          "ttEn": "Tender and smooth, almost boneless · Light and sweet",
          "code": "A020",
          "name": "红尾斑 / 红尾白须公",
          "nameEn": "Catfish",
          "prices": [
            60,
            65
          ],
          "options": [
            "招牌蒸 Signature",
            "清蒸 Steamed"
          ]
        }
      ]
    },
    {
      "cat": "海鲜",
      "catEn": "Seafood",
      "items": [
        {
          "id": "A021",
          "tt": "蚌肉滑嫩多汁 · 清鲜带甘，海水鲜味",
          "ttEn": "Juicy, tender clams · Light, sweet, briny",
          "code": "A021",
          "name": "招牌蒸啦啦",
          "nameEn": "Signature Lala",
          "prices": [
            22,
            32
          ],
          "image": "images/menu/A021.jpg",
          "tag": "招牌"
        },
        {
          "id": "A022",
          "image": "images/menu/A022.jpg",
          "tt": "蚌肉爽滑弹牙 · 香辣惹味，蒜香虾米味浓",
          "ttEn": "Springy clams · Spicy, garlic & dried-shrimp aroma",
          "code": "A022",
          "name": "金香啦啦",
          "nameEn": "Kam Heong Lala",
          "prices": [
            25,
            35
          ]
        },
        {
          "id": "A023",
          "image": "images/menu/A023.jpg",
          "tt": "海鲜爽弹、豆腐软滑 · 椰香咸甜，几乎不辣",
          "ttEn": "Bouncy seafood, silky tofu · Coconut curry, barely spicy",
          "code": "A023",
          "name": "咖喱三鲜煲",
          "nameEn": "Mixed Seafood Curry",
          "price": 88
        },
        {
          "id": "A024",
          "image": "images/menu/A024.jpg",
          "tt": "苏东爽脆弹牙 · 酸辣开胃，娘惹香料",
          "ttEn": "Crisp, springy squid · Sour-spicy Nyonya spices",
          "code": "A024",
          "name": "娘惹蒸苏东",
          "nameEn": "Nyonya Style Squid",
          "price": 35
        },
        {
          "id": "A025",
          "image": "images/menu/A025.jpg",
          "tt": "苏东嫩滑弹口 · 清鲜带甘",
          "ttEn": "Tender, bouncy squid · Light and sweet",
          "code": "A025",
          "name": "招牌蒸苏东",
          "nameEn": "Signature Squid",
          "price": 35
        },
        {
          "id": "A026",
          "image": "images/menu/A026.jpg",
          "tt": "外脆内嫩弹牙 · 咸香惹味",
          "ttEn": "Crispy outside, springy inside · Savoury",
          "code": "A026",
          "name": "炸苏东",
          "nameEn": "Deep-Fried Squid",
          "prices": [
            30,
            40
          ]
        },
        {
          "id": "A027",
          "image": "images/menu/A027.jpg",
          "tt": "外酥内弹 · 椒盐香咸，微辣",
          "ttEn": "Crispy, bouncy · Salt & pepper, mildly spicy",
          "code": "A027",
          "name": "椒盐苏东",
          "nameEn": "Salt & Pepper Squid",
          "prices": [
            30,
            40
          ]
        },
        {
          "id": "A028",
          "tt": "外酥内弹，咸蛋沙沙 · 咸香浓郁",
          "ttEn": "Crispy, sandy salted-egg coating · Rich and savoury",
          "code": "A028",
          "name": "咸蛋苏东",
          "nameEn": "Salted Egg Yolk Fried Squid",
          "prices": [
            30,
            40
          ],
          "image": "images/menu/A028.jpg"
        },
        {
          "id": "A029",
          "tt": "虾肉厚实弹牙，虾膏丰腴 · 鲜甜浓香",
          "ttEn": "Thick, bouncy, rich roe · Sweet and fragrant",
          "code": "A029",
          "name": "招牌蒸大头虾",
          "nameEn": "Signature King Prawn",
          "seasonal": true,
          "image": "images/menu/A029.jpg",
          "tag": "招牌"
        },
        {
          "id": "A030",
          "tt": "虾肉厚实弹牙，虾膏丰腴 · 鲜甜浓香",
          "ttEn": "Thick, bouncy, rich roe · Sweet and fragrant",
          "code": "A030",
          "name": "干煎大头虾",
          "nameEn": "Pan Fried King Prawn",
          "seasonal": true,
          "desc": "最少 2 只 (min 2)",
          "descEn": "Min 2 pcs"
        },
        {
          "id": "A031",
          "image": "images/menu/A031.jpg",
          "tt": "虾肉紧实弹牙 · 鲜甜多汁",
          "ttEn": "Firm, bouncy prawn · Sweet and juicy",
          "code": "A031",
          "name": "招牌蒸老虎虾",
          "nameEn": "Signature Tiger Prawn",
          "price": 60,
          "tag": "招牌"
        },
        {
          "id": "A032",
          "tt": "虾肉紧实爽脆 · 鲜甜多汁",
          "ttEn": "Firm, crisp prawn · Sweet and juicy",
          "code": "A032",
          "name": "干煎老虎虾",
          "nameEn": "Pan Fried Tiger Prawn",
          "price": 60,
          "image": "images/menu/A032.jpg"
        },
        {
          "id": "A033",
          "image": "images/menu/A033.jpg",
          "tt": "虾肉紧实弹牙 · 咸蛋咸香",
          "ttEn": "Firm, bouncy prawn · Savoury salted egg",
          "code": "A033",
          "name": "咸蛋炒老虎虾",
          "nameEn": "Salted Egg Yolk Tiger Prawn",
          "price": 60
        }
      ]
    },
    {
      "cat": "猪肉",
      "catEn": "Pork",
      "items": [
        {
          "id": "A034",
          "tt": "皮糯肉软，胶质黏口 · 卤香咸甜，微带药材香",
          "ttEn": "Sticky skin, soft meat · Savoury-sweet braise, light herbal note",
          "code": "A034",
          "name": "卤猪脚",
          "nameEn": "Signature Stewed Pork",
          "prices": [
            20,
            30,
            40
          ],
          "image": "images/menu/A034.jpg",
          "tag": "招牌",
          "desc": "卤蛋另加",
          "descEn": "Braised egg extra"
        },
        {
          "id": "A035",
          "tt": "外皮酥脆，内馅扎实 · 五香咸香",
          "ttEn": "Crispy skin, meaty filling · Savoury five-spice",
          "code": "A035",
          "name": "五香肉卷",
          "nameEn": "Lo Bak",
          "price": 12,
          "image": "images/menu/A035.jpg",
          "unit": "条",
          "unitEn": "pc"
        },
        {
          "id": "A036",
          "image": "images/menu/A036.jpg",
          "tt": "外脆内嫩多汁 · 南乳咸香回甘",
          "ttEn": "Crispy and juicy · Fermented beancurd, sweet finish",
          "code": "A036",
          "name": "南乳炸肉",
          "nameEn": "Deep-Fried Marinated Pork",
          "prices": [
            20,
            30,
            40
          ]
        },
        {
          "id": "A037",
          "tt": "外酥内嫩 · 酸甜微辣开胃",
          "ttEn": "Crispy and tender · Sweet-sour, slightly spicy",
          "code": "A037",
          "name": "咕老肉",
          "nameEn": "Sweet and Sour Pork",
          "prices": [
            20,
            30,
            40
          ],
          "image": "images/menu/A037.jpg"
        },
        {
          "id": "A038",
          "tt": "肉质软嫩多汁 · 咸鲜清甜，冬菜香",
          "ttEn": "Soft, juicy meat · Savoury-sweet preserved vegetable",
          "code": "A038",
          "name": "冬菜蒸猪肉",
          "nameEn": "Dong Choi Steam Meat Patty",
          "prices": [
            18,
            25,
            32
          ],
          "image": "images/menu/A038.jpg",
          "tag": "招牌"
        },
        {
          "id": "A039",
          "image": "images/menu/A039.jpg",
          "tt": "排骨软嫩脱骨 · 咖喱香辣，微带椰香",
          "ttEn": "Fall-off-the-bone · Spicy curry, hint of coconut",
          "code": "A039",
          "name": "咖喱排骨",
          "nameEn": "Curry Pork Ribs",
          "prices": [
            20,
            30,
            40
          ]
        },
        {
          "id": "A040",
          "tt": "肉嫩多汁、软脱骨 · 豆豉咸香，蒜香浓",
          "ttEn": "Tender, juicy ribs · Black bean and garlic",
          "code": "A040",
          "name": "豉汁排骨",
          "nameEn": "Black Bean Paste Pork Ribs",
          "prices": [
            20,
            30,
            40
          ],
          "image": "images/menu/A040.jpg"
        },
        {
          "id": "A041",
          "image": "images/menu/A041.jpg",
          "tt": "五花肉软糯，肥而不腻 · 咸鱼香浓，下饭",
          "ttEn": "Soft pork belly, not greasy · Salted fish, great with rice",
          "code": "A041",
          "name": "咸鱼花腩煲",
          "nameEn": "Claypot Pork Belly with Salted Fish",
          "prices": [
            25,
            40
          ]
        }
      ]
    },
    {
      "cat": "鸡类",
      "catEn": "Chicken",
      "items": [
        {
          "id": "A042",
          "tt": "皮脆肉嫩 · 卤香咸甜",
          "ttEn": "Crispy skin, tender meat · Savoury-sweet braise",
          "code": "A042",
          "name": "琵琶鸭",
          "nameEn": "Pipa Duck",
          "prices": [
            40,
            80
          ],
          "image": "images/menu/A042.jpg",
          "sizes": [
            "半只",
            "一只"
          ],
          "sizesEn": [
            "Half",
            "Whole"
          ],
          "tag": "招牌",
          "desc": "只限星期五、六、日",
          "descEn": "Fri, Sat & Sun only"
        },
        {
          "id": "A043",
          "tt": "外酥脆、内多汁 · 南乳咸香回甘",
          "ttEn": "Crispy and juicy · Fermented beancurd flavour",
          "code": "A043",
          "name": "南乳炸鸡",
          "nameEn": "Deep-Fried Marinated Chicken",
          "prices": [
            18,
            28,
            38
          ],
          "image": "images/menu/A043.jpg",
          "tag": "招牌"
        },
        {
          "id": "A044",
          "image": "images/menu/A044.jpg",
          "tt": "鸡肉嫩滑入味 · 酱香浓，九层塔麻油香",
          "ttEn": "Tender chicken · Rich sauce, basil & sesame oil",
          "code": "A044",
          "name": "三杯鸡",
          "nameEn": "Taiwan Style Chicken",
          "prices": [
            28,
            48
          ]
        },
        {
          "id": "A045",
          "tt": "去骨鸡翼，皮微脆肉嫩 · 酸甜微辣",
          "ttEn": "Boneless wing, tender · Sweet-sour, slightly spicy",
          "code": "A045",
          "name": "飞鸡翼",
          "nameEn": "Chicken Wing with Sauce",
          "price": 5,
          "image": "images/menu/A045.jpg",
          "unit": "只",
          "unitEn": "pc",
          "min": 4,
          "desc": "最少 4 只",
          "descEn": "Min 4 pcs"
        },
        {
          "id": "A046",
          "tt": "鸡肉滑嫩，原汁多 · 药材清香回甘",
          "ttEn": "Silky, juicy chicken · Light herbal, sweet finish",
          "code": "A046",
          "name": "杞子当归蒸菜园鸡",
          "nameEn": "Steamed Herb Chicken",
          "prices": [
            40,
            80
          ],
          "image": "images/menu/A046.jpg",
          "sizes": [
            "半只",
            "一只"
          ],
          "sizesEn": [
            "Half",
            "Whole"
          ]
        }
      ]
    },
    {
      "cat": "蔬菜",
      "catEn": "Vegetable",
      "note": "可选做法：马来栈 / 腐乳椒仔 / 油菜 / 清炒 / 虾米椒仔；加咸鱼 +RM2",
      "noteEn": "Choose preparation: Belacan / Pickled Beancurd / Boiled / Stir Fried / Dried Shrimp & Chili Padi; add salted fish +RM2",
      "items": [
        {
          "id": "A047",
          "tt": "叶嫩微滑 · 清香微苦，回甘",
          "ttEn": "Tender leaves · Light, slightly bitter, sweet finish",
          "code": "A047",
          "name": "田七",
          "nameEn": "Tien Chi",
          "prices": [
            13,
            18
          ],
          "options": [
            "马来栈 Belacan",
            "腐乳椒仔 Pickled Beancurd",
            "油菜 Boiled",
            "清炒 Stir Fried",
            "虾米椒仔 Dried Shrimp & Chili Padi"
          ]
        },
        {
          "id": "A048",
          "image": "images/menu/A048.jpg",
          "tt": "爽脆多汁 · 清甜微苦",
          "ttEn": "Crisp and juicy · Sweet, slightly bitter",
          "code": "A048",
          "name": "油麦",
          "nameEn": "Yau Mak",
          "prices": [
            13,
            18
          ],
          "options": [
            "马来栈 Belacan",
            "腐乳椒仔 Pickled Beancurd",
            "油菜 Boiled",
            "清炒 Stir Fried",
            "虾米椒仔 Dried Shrimp & Chili Padi"
          ]
        },
        {
          "id": "A049",
          "image": "images/menu/A049.jpg",
          "tt": "梗脆叶软 · 清香微甘",
          "ttEn": "Crisp stems, soft leaves · Light and sweet",
          "code": "A049",
          "name": "蕹菜",
          "nameEn": "Kang Kung",
          "prices": [
            13,
            18
          ],
          "options": [
            "马来栈 Belacan",
            "腐乳椒仔 Pickled Beancurd",
            "油菜 Boiled",
            "清炒 Stir Fried",
            "虾米椒仔 Dried Shrimp & Chili Padi"
          ]
        },
        {
          "id": "A050",
          "image": "images/menu/A050.jpg",
          "tt": "叶滑茎嫩 · 清甜温和",
          "ttEn": "Silky leaves, tender stems · Mild and sweet",
          "code": "A050",
          "name": "番薯苗",
          "nameEn": "Sweet Potato Leaf",
          "prices": [
            13,
            18
          ],
          "options": [
            "马来栈 Belacan",
            "腐乳椒仔 Pickled Beancurd",
            "油菜 Boiled",
            "清炒 Stir Fried",
            "虾米椒仔 Dried Shrimp & Chili Padi"
          ]
        },
        {
          "id": "A051",
          "image": "images/menu/A051.jpg",
          "tt": "嫩滑爽口 · 清甜鲜嫩",
          "ttEn": "Tender and smooth · Sweet and fresh",
          "code": "A051",
          "name": "帝王苗",
          "nameEn": "Dai Wong Miu",
          "prices": [
            13,
            18
          ],
          "options": [
            "马来栈 Belacan",
            "腐乳椒仔 Pickled Beancurd",
            "油菜 Boiled",
            "清炒 Stir Fried",
            "虾米椒仔 Dried Shrimp & Chili Padi"
          ]
        },
        {
          "id": "A052",
          "image": "images/menu/A052.jpg",
          "tt": "梗脆叶嫩 · 清甜淡雅",
          "ttEn": "Crisp stems, tender leaves · Sweet and delicate",
          "code": "A052",
          "name": "奶白",
          "nameEn": "Nai Bak",
          "prices": [
            13,
            18
          ],
          "options": [
            "马来栈 Belacan",
            "腐乳椒仔 Pickled Beancurd",
            "油菜 Boiled",
            "清炒 Stir Fried",
            "虾米椒仔 Dried Shrimp & Chili Padi"
          ]
        },
        {
          "id": "A053",
          "image": "images/menu/A053.jpg",
          "tt": "爽脆多汁 · 清甜解腻",
          "ttEn": "Crunchy and juicy · Light and refreshing",
          "code": "A053",
          "name": "芽菜",
          "nameEn": "Bean Sprout",
          "prices": [
            13,
            18
          ],
          "options": [
            "马来栈 Belacan",
            "腐乳椒仔 Pickled Beancurd",
            "油菜 Boiled",
            "清炒 Stir Fried",
            "虾米椒仔 Dried Shrimp & Chili Padi"
          ]
        },
        {
          "id": "A054",
          "image": "images/menu/A054.jpg",
          "tt": "叶嫩梗脆 · 清甜带甘",
          "ttEn": "Tender leaves, crisp stems · Sweet and refreshing",
          "code": "A054",
          "name": "青龙菜",
          "nameEn": "Qing Long",
          "price": 13,
          "options": [
            "马来栈 Belacan",
            "腐乳椒仔 Pickled Beancurd",
            "油菜 Boiled",
            "清炒 Stir Fried",
            "虾米椒仔 Dried Shrimp & Chili Padi"
          ]
        },
        {
          "id": "A055",
          "image": "images/menu/A055.jpg",
          "tt": "多样蔬菜爽脆 · 参峇香辣，虾米味浓",
          "ttEn": "Crunchy mixed veg · Spicy sambal, dried shrimp",
          "code": "A055",
          "name": "四大天王",
          "nameEn": "Spicy Mixed Vegetable",
          "prices": [
            15,
            18,
            23
          ]
        },
        {
          "id": "A056",
          "tt": "双菜爽脆多汁 · 清甜，蒜香提味",
          "ttEn": "Crunchy and juicy · Sweet, with garlic",
          "code": "A056",
          "name": "青龙菜炒芽菜",
          "nameEn": "Stir-Fried Bean Sprout with Qing Long",
          "price": 18,
          "image": "images/menu/A056.jpg"
        },
        {
          "id": "ADD1",
          "box": 0,
          "tt": "咸鱼香脆 · 咸香下饭",
          "ttEn": "Crispy salted fish · Savoury, great with rice",
          "code": "",
          "name": "加咸鱼",
          "nameEn": "Add Salted Fish",
          "price": 2
        }
      ]
    },
    {
      "cat": "豆腐 & 鸡蛋",
      "catEn": "Beancurd & Egg",
      "items": [
        {
          "id": "A057",
          "tt": "外酥内嫩 · 咸香微甜（自制海鲜豆腐）",
          "ttEn": "Crispy outside, silky inside · Savoury-sweet (homemade seafood tofu)",
          "code": "A057",
          "name": "招牌豆腐",
          "nameEn": "Signature Fried Beancurd",
          "prices": [
            12,
            15,
            18,
            20
          ],
          "image": "images/menu/A057.jpg",
          "sizes": [
            "小",
            "中",
            "大",
            "特大"
          ],
          "sizesEn": [
            "S",
            "M",
            "L",
            "XL"
          ],
          "tag": "招牌"
        },
        {
          "id": "A058",
          "tt": "豆腐嫩滑如水 · 葱油虾米，清鲜温和",
          "ttEn": "Silky-smooth tofu · Scallion oil & dried shrimp, mild",
          "code": "A058",
          "name": "葱油豆腐",
          "nameEn": "Scallion Steamed Beancurd",
          "price": 10,
          "image": "images/menu/A058.jpg"
        },
        {
          "id": "A059",
          "image": "images/menu/A059.jpg",
          "tt": "外焦香、内滑嫩 · 酱香浓，蛋香足",
          "ttEn": "Seared outside, silky inside · Rich sauce with egg",
          "code": "A059",
          "name": "铁板豆腐",
          "nameEn": "Sizzling Beancurd",
          "prices": [
            18,
            25
          ]
        },
        {
          "id": "A060",
          "image": "images/menu/A060.jpg",
          "tt": "边脆心嫩，蛋黄流心 · 蛋香浓，咸香",
          "ttEn": "Crispy edges, runny yolk · Rich and savoury",
          "code": "A060",
          "name": "荷包蛋",
          "nameEn": "Poached Egg",
          "price": 2,
          "unit": "粒",
          "unitEn": "pc"
        },
        {
          "id": "A061",
          "image": "images/menu/A061.jpg",
          "tt": "外微焦、内松软 · 蛋香十足",
          "ttEn": "Lightly browned, fluffy · Full egg flavour",
          "code": "A061",
          "name": "煎蛋",
          "nameEn": "Omelette",
          "price": 8
        },
        {
          "id": "A062",
          "image": "images/menu/A062.jpg",
          "tt": "蛋松软、葱爽甜 · 咸香开胃",
          "ttEn": "Fluffy egg, sweet onion · Savoury",
          "code": "A062",
          "name": "大葱蛋",
          "nameEn": "Onion Omelette",
          "price": 12
        },
        {
          "id": "A063",
          "tt": "蛋嫩、苦瓜脆 · 微苦回甘",
          "ttEn": "Tender egg, crisp bitter gourd · Slightly bitter, sweet finish",
          "code": "A063",
          "name": "苦瓜蛋",
          "nameEn": "Bitter Gourd Omelette",
          "price": 13,
          "image": "images/menu/A063.jpg"
        },
        {
          "id": "A064",
          "tt": "滑嫩细致 · 鸡蛋咸蛋皮蛋，咸鲜浓郁",
          "ttEn": "Silky · Egg, salted egg & century egg, rich",
          "code": "A064",
          "name": "三皇蛋",
          "nameEn": "Three Flavours Steam Egg",
          "price": 15,
          "image": "images/menu/A064.jpg"
        },
        {
          "id": "A065",
          "tt": "滑嫩如布丁 · 清鲜温和",
          "ttEn": "Silky like pudding · Light and mild",
          "code": "A065",
          "name": "蒸水蛋",
          "nameEn": "Steamed Egg",
          "price": 12
        },
        {
          "id": "A066",
          "image": "images/menu/A066.jpg",
          "tt": "蛋松软、菜圃爽脆 · 咸香带甜",
          "ttEn": "Fluffy egg, crunchy preserved radish · Savoury-sweet",
          "code": "A066",
          "name": "菜圃煎蛋",
          "nameEn": "Choy Po Omelette",
          "price": 12
        },
        {
          "id": "A067",
          "image": "images/menu/A067.jpg",
          "tt": "蛋松软、虾仁弹牙 · 鲜甜咸香",
          "ttEn": "Fluffy egg, bouncy shrimp · Sweet and savoury",
          "code": "A067",
          "name": "虾仁煎蛋",
          "nameEn": "Shrimp Omelette",
          "price": 15
        }
      ]
    },
    {
      "cat": "炖汤",
      "catEn": "Soup",
      "items": [
        {
          "id": "A067S",
          "tt": "瓜软肉嫩 · 清甜温润，家常老火汤",
          "ttEn": "Soft melon, tender pork · Light and sweet home-style soup",
          "code": "A067",
          "name": "老黄瓜炖瘦肉",
          "nameEn": "Chinese Melon Soup",
          "prices": [
            16,
            25
          ]
        },
        {
          "id": "A068",
          "tt": "西洋菜软滑 · 清甜润喉",
          "ttEn": "Soft watercress · Light, sweet and soothing",
          "code": "A068",
          "name": "西洋菜汤炖瘦肉",
          "nameEn": "Watercress Soup",
          "prices": [
            16,
            25
          ]
        },
        {
          "id": "A069",
          "tt": "花生粉糯，粉葛绵软 · 清甜温和",
          "ttEn": "Soft peanuts & arrowroot · Mild and sweet",
          "code": "A069",
          "name": "花生粉葛汤",
          "nameEn": "Peanuts & Arrowroot Soup",
          "prices": [
            16,
            25
          ]
        }
      ]
    },
    {
      /* 2026-10-26 业主：新增饭类，照 Grab 价钱减 RM1（白饭 RM1.50）；炒饭的口味用「份量」那排按钮选（价钱不同） */
      "cat": "饭类",
      "catEn": "Rice",
      "items": [
        { "id": "R001", "code": "R001", "name": "白饭", "nameEn": "White Rice", "price": 1.5,
          "tt": "粒粒松软 · 配什么菜都好吃", "ttEn": "Soft and fluffy · Goes with every dish" },
        { "id": "R002", "code": "R002", "name": "炒饭", "nameEn": "Fried Rice",
          "sizes": ["家乡炒饭", "叁巴炒饭", "咸鱼炒饭", "虾仁炒饭", "海鲜炒饭"],
          "sizesEn": ["Kampung", "Sambal", "Salted Fish", "Shrimp", "Seafood"],
          "prices": [12.9, 12.9, 13.9, 14.9, 18.9],
          "tt": "粒粒分明有锅气 · 五种口味任选", "ttEn": "Fluffy with wok hei · Choose from five flavours" },
        { "id": "R003", "code": "R003", "name": "豉汁排骨饭", "nameEn": "Black Bean Paste Pork Ribs Rice", "price": 15.9, "image": "images/menu/R003.jpg",
          "tt": "排骨嫩滑 · 豉汁咸香下饭", "ttEn": "Tender ribs · Savoury black bean sauce" },
        { "id": "R004", "code": "R004", "name": "咖喱排骨饭", "nameEn": "Curry Pork Ribs Rice", "price": 15.9, "image": "images/menu/R004.jpg",
          "tt": "排骨入味 · 咖喱浓香微辣", "ttEn": "Well-seasoned ribs · Rich, mildly spicy curry" },
        { "id": "R005", "code": "R005", "name": "咕咾肉饭", "nameEn": "Sweet and Sour Pork Rice", "price": 15.9, "image": "images/menu/R005.jpg",
          "tt": "外脆内嫩 · 酸甜开胃", "ttEn": "Crispy outside, tender inside · Sweet and tangy" },
        { "id": "R006", "code": "R006", "name": "冬菜蒸猪肉饭", "nameEn": "Dong Choi Steam Meat Patty Rice", "price": 18.9, "image": "images/menu/R006.jpg",
          "tt": "肉饼嫩滑多汁 · 冬菜咸香", "ttEn": "Juicy steamed patty · Savoury preserved vegetable" },
        { "id": "R007", "code": "R007", "name": "卤猪脚饭", "nameEn": "Signature Stewed Pork Rice", "price": 18.9, "image": "images/menu/R007.jpg", "tag": "招牌",
          "tt": "皮糯肉软 · 卤汁咸甜拌饭一流", "ttEn": "Soft, sticky pork · Savoury-sweet braise over rice" }
      ]
    },
    {
      "customize": false, "cat": "茶类",
      "catEn": "Tea",
      "note": "每位计，最少 2 位",
      "noteEn": "Per pax, min 2 pax",
      "items": [
        {
          "id": "B001",
          "tt": "花香清淡 · 解腻",
          "ttEn": "Light floral aroma · Refreshing",
          "code": "B001",
          "name": "香片",
          "nameEn": "Jasmine Tea",
          "price": 3,
          "unit": "位",
          "unitEn": "pax",
          "min": 2
        },
        {
          "id": "B002",
          "tt": "茶味醇厚 · 解油腻",
          "ttEn": "Smooth and mellow · Cuts the grease",
          "code": "B002",
          "name": "普洱",
          "nameEn": "Pu-erh",
          "price": 3,
          "unit": "位",
          "unitEn": "pax",
          "min": 2
        },
        {
          "id": "B003",
          "tt": "茶香浓 · 微甘回甘",
          "ttEn": "Fragrant · Slight sweet aftertaste",
          "code": "B003",
          "name": "铁观音",
          "nameEn": "Tieguanyin",
          "price": 3,
          "unit": "位",
          "unitEn": "pax",
          "min": 2
        },
        {
          "id": "B004",
          "tt": "普洱加菊花 · 醇厚带清香",
          "ttEn": "Pu-erh with chrysanthemum · Mellow and floral",
          "code": "B004",
          "name": "菊普",
          "nameEn": "Chrysanthemum Pu-erh",
          "price": 3,
          "unit": "位",
          "unitEn": "pax",
          "min": 2
        },
        {
          "id": "B005",
          "tt": "醇厚饱满，带兰花香、焙火香 · 回甘强烈，非常耐泡",
          "ttEn": "Full-bodied, with orchid and roasted notes · Strong sweet aftertaste, lasts many brews",
          "code": "B005",
          "name": "茶王",
          "nameEn": "Tea King",
          "price": 4,
          "unit": "位",
          "unitEn": "pax",
          "min": 2
        },
        {
          "id": "B006",
          "tt": "菊花清香 · 清淡",
          "ttEn": "Light chrysanthemum aroma",
          "code": "B006",
          "name": "菊花",
          "nameEn": "Chrysanthemum",
          "price": 3,
          "unit": "位",
          "unitEn": "pax",
          "min": 2
        }
      ]
    },
    {
      "customize": false, "cat": "饮料",
      "catEn": "Drink",
      "items": [
        {
          "id": "B008",
          "tt": "自家熬煮凉茶 · 清润微甘",
          "ttEn": "Homemade herbal drink · Cooling, lightly sweet",
          "code": "B008",
          "name": "凉水 (热/冷)",
          "nameEn": "Homemade Herbal (Hot/Cold)",
          "price": 3,
          "options": [
            "热 Hot",
            "冷 Cold"
          ]
        },
        {
          "id": "B009",
          "image": "images/menu/B009.jpg",
          "tt": "竹蔗马蹄 · 清甜解渴",
          "ttEn": "Sugarcane & water chestnut · Sweet and thirst-quenching",
          "code": "B009",
          "name": "竹蔗马蹄",
          "nameEn": "Sugarcane",
          "price": 4.5
        },
        {
          "id": "B010",
          "image": "images/menu/B010.jpg",
          "tt": "洋参菊花 · 清香微甘",
          "ttEn": "Ginseng & chrysanthemum · Light, slightly sweet",
          "code": "B010",
          "name": "洋参菊花",
          "nameEn": "Chrysanthemum",
          "price": 4.5
        },
        {
          "id": "B011",
          "image": "images/menu/B011.jpg",
          "tt": "爱玉滑溜 · 酸甜冰凉",
          "ttEn": "Smooth jelly · Sweet, tangy and icy",
          "code": "B011",
          "name": "爱玉冰",
          "nameEn": "Ai Yu",
          "price": 4.5
        },
        {
          "id": "B012",
          "image": "images/menu/B012.jpg",
          "tt": "冰凉解渴",
          "ttEn": "Cold and refreshing",
          "code": "B012",
          "name": "100号",
          "nameEn": "100 Plus",
          "price": 3.5
        },
        {
          "id": "B013",
          "image": "images/menu/B013.jpg",
          "tt": "冰凉清爽",
          "ttEn": "Cold and refreshing",
          "code": "B013",
          "name": "可乐",
          "nameEn": "Coca Cola",
          "price": 3.5
        },
        {
          "id": "B014",
          "tt": "下班了 犒劳一下辛苦的自己 来杯 冰凉清爽外国凉茶吧~",
          "ttEn": "Done with work? Treat yourself to an ice-cold, refreshing \"foreign herbal tea\"~",
          "code": "B014",
          "name": "啤酒",
          "nameEn": "Tiger",
          "price": 23
        },
        {
          "id": "B015",
          "tt": "浓郁微苦，简直就是夜间版“冰美式”，成年人的专属去火续命水！☕️",
          "ttEn": "Rich and slightly bitter — basically a night-time iced Americano, the grown-up's cooling lifesaver! ☕️",
          "code": "B015",
          "name": "黑啤酒",
          "nameEn": "Guinness",
          "price": 25
        }
      ]
    }
  ],

  /* ---------- 外观颜色 ---------- */
  theme: {
    primary: "#B4232A",   // 主色(按钮、标题)
    accent:  "#F2B417",   // 点缀色
    dark:    "#2A1A14",   // 深色背景(页脚)
  },
};
