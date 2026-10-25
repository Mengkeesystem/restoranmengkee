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
  heroImage: "images/hero.jpg",          // 首页大图（2026-10-26 Old Klang Road 店面照，已去掉旁边横幅）；留空用纯色背景
  heroImageMobile: "images/hero-m.jpg",   // 手机版用的小一点的图（可留空）
  heroPos: "center 36%",                  // 图片对准哪里（招牌在上 1/3）

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
   *    ① Application restrictions → Websites → 只填 https://mengkeesystem.github.io/*
   *    ② API restrictions → 只勾 Maps JavaScript API、Places API (New)、Geocoding API
   *    ③ Billing → Budgets & alerts 设预算提醒 */
  googleMaps: { apiKey: "" },

  /* 社交平台 / 外卖平台链接，没有的留空 "" 就不会显示 */
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
  /* 分店坐标 lat/lng（外卖自动算距离 + Waze 精准导航）：2026-10-18 业主提供（分店地址 docx）。
     新分店：在 Google Maps 长按分店位置，最上面「3.1234, 101.6789」前面是 lat、后面是 lng。没填会改用地址自动查（geo.js）。 */
  outlets: [
    { region: "雪隆区", regionEn: "Klang Valley", name: "OKR", lat: 3.1064, lng: 101.6765, address: "97, Jln Klang Lama, Batu 3, 58100 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur" },
    { region: "雪隆区", regionEn: "Klang Valley", name: "OKR (Scott Garden 对面)", lat: 3.0954, lng: 101.6738, nameEn: "OKR (opposite Scott Garden)", address: "Restaurant Meng Kee, opposite Scott Garden, Jln Klang Lama, 58200 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur" },
    { region: "雪隆区", regionEn: "Klang Valley", name: "Kelana Jaya (PJ)", lat: 3.1119, lng: 101.5996, address: "15, Jalan SS 4d/2, SS 4, 47301 Petaling Jaya, Selangor" },
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

  /* 环境照片：放进 images/ 文件夹，写文件名。留空数组则不显示这一块 */
  gallery: [                              // TODO 放店内/门面照片
    // { src: "images/shop-1.jpg", caption: "店内环境" },
  ],

  /* ---------- 优惠活动 / 节日套餐 ----------
   * from/to 是显示期间(含当天)，过期会自动隐藏，不用手动删。to 留空 = 长期 */
  promos: [                               // TODO 以下是示例活动，请换成明记真实的活动（过期会自动隐藏）
    {
      badge: "限时", badgeEn: "Limited",
      title: "开张优惠：堂食满 RM50 送凉水一杯",
      titleEn: "Opening promo: free herbal drink with RM50 dine-in",
      body: "活动期间堂食消费满 RM50，送自家凉水一杯（热/冷）。",
      bodyEn: "Spend RM50 on dine-in and get a free homemade herbal drink (hot/cold).",
      from: "2026-10-01", to: "2026-12-31", image: "",
    },
    {
      badge: "平日", badgeEn: "Weekdays",
      title: "平日午市：招牌菜 9 折",
      titleEn: "Weekday lunch: 10% off signature dishes",
      body: "星期一至五 11am–3pm 堂食，点任何「招牌」标签的菜品享 9 折。",
      bodyEn: "Mon–Fri 11am–3pm dine-in: 10% off any dish marked Signature.",
      from: "2026-10-01", to: "2026-12-31", image: "",
    },
    {
      badge: "生日", badgeEn: "Birthday",
      title: "生日月份：送招牌豆腐一份",
      titleEn: "Birthday month: free Signature Beancurd",
      body: "生日当月出示身份证，堂食满 RM80 送招牌豆腐（小）一份。",
      bodyEn: "Show your IC in your birthday month — spend RM80 on dine-in for a free Signature Beancurd (S).",
      from: "2026-10-01", to: "", image: "",
    },
    {
      badge: "预订", badgeEn: "Pre-order",
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
   * 2026-10-26 为申请付款网关而写。legalName：填公司正式名称 + SSM 号（例如 "XXX Sdn Bhd (2020XXXXXXXX)"），付款网关审核常要看；留空就不显示。
   * 改了退款规则（例如几小时内投诉、几天退款）记得同步改这里，并更新 updated 日期。 */
  policies: {
    "legalName": "",
    "updated": "2026-10-26",
    "refund": {
      "title": "退款及取消政策",
      "titleEn": "Refund & Cancellation Policy",
      "sections": [
        {
          "h": "适用范围",
          "hEn": "Scope",
          "p": [
            "本政策适用于在本网站下单的自取及外卖订单。所有网上订单都须先付款，店家确认收款后才开始准备。"
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
            "外卖地址或电话填错、骑手无法联络到您而无法送达。",
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
            "您下单或订位时填写的姓名、电话、送餐地址及地图位置、订单内容、优惠码、付款参考号及付款金额。"
          ],
          "pEn": [
            "The name, phone number, delivery address and map location, order details, voucher code, payment reference and amount you provide when ordering or booking."
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
            "WhatsApp：订单及订位内容通过您自己的 WhatsApp 发送给我们。",
            "送餐骑手或配送公司：只提供送餐所需的姓名、电话及地址。",
            "付款平台：处理付款所需的资料（如使用网上付款）。",
            "地图服务：查找送餐位置时，您填写的地址会发送给 Google 地图及 OpenStreetMap 地图服务。"
          ],
          "pEn": [
            "WhatsApp: your order or booking is sent to us through your own WhatsApp.",
            "Delivery riders or courier companies: only the name, phone number and address needed for delivery.",
            "Payment providers: the details needed to process your payment (if you pay online).",
            "Map services: when locating your delivery address, the address you enter is sent to Google Maps and the OpenStreetMap map service."
          ]
        },
        {
          "h": "保存在您的手机",
          "hEn": "Stored on your device",
          "p": [
            "为了方便下次下单，网站会把购物车、语言、姓名及电话保存在您自己的浏览器里，不会上传。清除浏览器资料即可删除。本网站不使用广告或追踪 Cookie。"
          ],
          "pEn": [
            "To make your next order easier, the site keeps your cart, language, name and phone number in your own browser; this is not uploaded. Clearing your browser data removes it. This website does not use advertising or tracking cookies."
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
    qr: "",                 // TODO 明记的 DuitNow QR 图片
    bankName: "",           // TODO 例如 "Maybank"
    accountName: "",        // TODO 例如 "MENG KEE RESTAURANT SDN BHD"
    accountNo: "",          // TODO 户口号码
    /* 2026-10-18 业主规定：自取和外卖都一定要先付款（怕客人下单后不来拿，厨房白做）。
       false = 不给「到店付款 / 货到付款」；requirePrepay = 没设定收款资料时网上点餐暂停（不能下单） */
    allowPayAtCounter: false,
    requirePrepay: true,
  },

  /* ---------- 付款确认小后台（Supabase，官网专用项目，跟 ERP 分开）----------
   * 两个都填好：选「现在转账付款」的客人付款后，网页自动等店员在 admin.html 按「已收款」，再自动跳 WhatsApp。
   * 留空：客人自己勾「我已完成付款」再发 WhatsApp（旧流程）。
   * anon key 是公开用的（publishable），可以放网页；绝对不要放 service_role key。设定步骤见 README。 */
  backend: {
    supabaseUrl: "",        // 例如 "https://xxxx.supabase.co"
    supabaseAnonKey: "",    // Project Settings → API → anon public key
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
    voucherInPromos: false,   // 优惠码兑换框：false = 只在购物车结账时输入；true = 优惠活动区块也显示
    /* 外卖：客人自己选配送范围，店员看地址核对。以后要改按邮区/自动算距离再调整 */
    delivery: {
      enabled: true,
      /* maxKm：估算路程 ≤ maxKm 就用这一档（路程 = 直线距离 × roadFactor）；最后一档不写 maxKm = 以上全部。
         客人按「用我现在的位置」时自动选档（要该分店有 lat/lng），否则客人自己选、店员核对 */
      zones: [
        { label: "0–3km", labelEn: "0–3km", fee: 2, maxKm: 3 },
        { label: "3–5km", labelEn: "3–5km", fee: 5, maxKm: 5 },
        { label: "5–10km", labelEn: "5–10km", fee: 8, maxKm: 10 },
        { label: "10–12km", labelEn: "10–12km", fee: 11, maxKm: 12 },
        { label: "12–15km", labelEn: "12–15km", fee: 15, maxKm: 15 },
        /* 也支持按 km 加钱的档：{ label, fee, maxKm, perKmFrom: 10, perKm: 2 }（这种档一定要定位才能选） */
      ],
      maxKm: 15,            // 超过这个估算路程不送
      roadFactor: 1.3,      // 直线距离 × 1.3 ≈ 实际开车路程（2026-10-18 业主选的；免费，不是精准导航）
      autoDistance: true,   // 显示「📍 用我现在的位置自动算运费」按钮
      minOrder: 0,          // 外卖最低消费，0 = 不限
      freeAbove: 0,         // 满多少免运费，0 = 不设
      leadMinutes: 45,      // 最快几分钟后送达
      timeNote: "⏱️ 准备时间约 15–20 分钟（视食物分量而定），配送时间会根据交通繁忙时段和距离调整。",
      timeNoteEn: "⏱️ Preparation takes about 15–20 minutes (depending on order size); delivery time may vary with traffic and distance.",
      note: "运费按分店到送餐地址的估算路程（直线距离 × 1.3）：3km 内 RM2、3–5km RM5、5–10km RM8、10–12km RM11、12–15km RM15，最远送 15km。填好地址按「📍 确认地址」自动计算。",
      noteEn: "Delivery fee by estimated road distance from the outlet (straight line × 1.3): within 3km RM2, 3–5km RM5, 5–10km RM8, 10–12km RM11, 12–15km RM15, up to 15km. Enter your address and tap “Confirm address” to calculate.",
    },
    priceNote: "价钱不含 SST", priceNoteEn: "Prices exclude SST",
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
      "cat": "松鱼头",
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
      "cat": "金凤鱼",
      "catEn": "Red Tilapia",
      "note": "价钱按鱼的大小（小/中/大）",
      "noteEn": "Priced by fish size (S/M/L)",
      "items": [
        {
          "id": "A008",
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
      "cat": "鱼类",
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
          "tt": "海鲜爽弹、豆腐软滑 · 椰香咸甜，几乎不辣",
          "ttEn": "Bouncy seafood, silky tofu · Coconut curry, barely spicy",
          "code": "A023",
          "name": "咖喱三鲜煲",
          "nameEn": "Mixed Seafood Curry",
          "price": 88
        },
        {
          "id": "A024",
          "tt": "苏东爽脆弹牙 · 酸辣开胃，娘惹香料",
          "ttEn": "Crisp, springy squid · Sour-spicy Nyonya spices",
          "code": "A024",
          "name": "娘惹蒸苏东",
          "nameEn": "Nyonya Style Squid",
          "price": 35
        },
        {
          "id": "A025",
          "tt": "苏东嫩滑弹口 · 清鲜带甘",
          "ttEn": "Tender, bouncy squid · Light and sweet",
          "code": "A025",
          "name": "招牌蒸苏东",
          "nameEn": "Signature Squid",
          "price": 35
        },
        {
          "id": "A026",
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
          "tt": "外微焦、内松软 · 蛋香十足",
          "ttEn": "Lightly browned, fluffy · Full egg flavour",
          "code": "A061",
          "name": "煎蛋",
          "nameEn": "Omelette",
          "price": 8
        },
        {
          "id": "A062",
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
          "tt": "蛋松软、菜圃爽脆 · 咸香带甜",
          "ttEn": "Fluffy egg, crunchy preserved radish · Savoury-sweet",
          "code": "A066",
          "name": "菜圃煎蛋",
          "nameEn": "Choy Po Omelette",
          "price": 12
        },
        {
          "id": "A067",
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
      "cat": "茶类",
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
      "cat": "饮料",
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
          "tt": "竹蔗马蹄 · 清甜解渴",
          "ttEn": "Sugarcane & water chestnut · Sweet and thirst-quenching",
          "code": "B009",
          "name": "竹蔗马蹄",
          "nameEn": "Sugarcane",
          "price": 4.5
        },
        {
          "id": "B010",
          "tt": "洋参菊花 · 清香微甘",
          "ttEn": "Ginseng & chrysanthemum · Light, slightly sweet",
          "code": "B010",
          "name": "洋参菊花",
          "nameEn": "Chrysanthemum",
          "price": 4.5
        },
        {
          "id": "B011",
          "tt": "爱玉滑溜 · 酸甜冰凉",
          "ttEn": "Smooth jelly · Sweet, tangy and icy",
          "code": "B011",
          "name": "爱玉冰",
          "nameEn": "Ai Yu",
          "price": 4.5
        },
        {
          "id": "B012",
          "tt": "冰凉解渴",
          "ttEn": "Cold and refreshing",
          "code": "B012",
          "name": "100号",
          "nameEn": "100 Plus",
          "price": 3.5
        },
        {
          "id": "B013",
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
