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
  heroImage: "",                          // 首页大图，例如 "images/hero.jpg"；留空用纯色背景

  /* WhatsApp 号码：国家码开头、不要 + 和空格，例如 60123456789 */
  whatsapp: "6589107948",               // 订单/订位 WhatsApp（+65 8910 7948）
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
    allowPayAtCounter: true,
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
  },

  /* ---------- 网上点餐(自取) ---------- */
  ordering: {
    voucherInPromos: false,   // 优惠码兑换框：false = 只在购物车结账时输入；true = 优惠活动区块也显示
    /* 外卖：客人自己选配送范围，店员看地址核对。以后要改按邮区/自动算距离再调整 */
    delivery: {
      enabled: true,
      /* maxKm：直线距离 ≤ maxKm 就用这一档；最后一档不写 maxKm = 以上全部。
         客人按「用我现在的位置」时自动选档（要该分店有 lat/lng），否则客人自己选、店员核对 */
      zones: [
        { label: "0–3km", labelEn: "0–3km", fee: 5, maxKm: 3 },
        { label: "3–5km", labelEn: "3–5km", fee: 10, maxKm: 5 },
        { label: "5km 以上", labelEn: "Over 5km", fee: 15 },
      ],
      autoDistance: true,   // 显示「📍 用我现在的位置自动算运费」按钮
      minOrder: 0,          // 外卖最低消费，0 = 不限
      freeAbove: 0,         // 满多少免运费，0 = 不设
      leadMinutes: 45,      // 最快几分钟后送达
      note: "运费按分店到送餐地址的直线距离：0–3km RM5、3–5km RM10、5km 以上 RM15。在送餐地址按「📍 用我现在的位置」可自动计算。",
      noteEn: "Delivery fee by straight-line distance from the outlet: 0–3km RM5, 3–5km RM10, over 5km RM15. Tap “Use my current location” at the delivery address to calculate automatically.",
    },
    priceNote: "价钱不含 SST", priceNoteEn: "Prices exclude SST",
    sstRate: 0.06,            // 购物车自动加 SST（6%）；0 = 不加。算法：（食物小计 − 优惠）× 税率，运费不收 SST
    menuPhotos: ["images/menu-1.jpg", "images/menu-2.jpg"],   // 纸本菜单原图，可点开放大
    enabled: true,
    pickupLeadMinutes: 30,                // 最快几分钟后可自取
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
          "code": "A001",
          "name": "招牌蒸松鱼头",
          "nameEn": "Signature Steamed Bighead Carp",
          "price": 35,
          "image": "images/menu/A001.jpg",
          "tag": "招牌"
        },
        {
          "id": "A002",
          "code": "A002",
          "name": "酱蒸松鱼头 (微辣)",
          "nameEn": "Steamed with Spicy Paste Bean",
          "price": 38,
          "image": "images/menu/A002.jpg"
        },
        {
          "id": "A003",
          "code": "A003",
          "name": "清蒸松鱼头",
          "nameEn": "Steamed with Ginger Silk",
          "price": 35
        },
        {
          "id": "A004",
          "code": "A004",
          "name": "炒松鱼头",
          "nameEn": "Stir-Fried Bighead Carp",
          "price": 38,
          "image": "images/menu/A004.jpg"
        },
        {
          "id": "A005",
          "code": "A005",
          "name": "娘惹蒸松鱼头",
          "nameEn": "Steamed with Nyonya Style",
          "price": 40,
          "image": "images/menu/A005.jpg"
        },
        {
          "id": "A006",
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
          "code": "A011",
          "name": "炒金凤鱼",
          "nameEn": "Stir-Fried Red Tilapia",
          "price": 55
        },
        {
          "id": "A012",
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
          "code": "A015",
          "name": "咖喱金凤鱼",
          "nameEn": "Curry Red Tilapia",
          "price": 60
        },
        {
          "id": "A016",
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
          "code": "A018",
          "name": "咖喱石斑鱼头",
          "nameEn": "Grouper Head (Curry)",
          "price": 58,
          "image": "images/menu/A018.jpg"
        },
        {
          "id": "A019",
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
          "code": "A023",
          "name": "咖喱三鲜煲",
          "nameEn": "Mixed Seafood Curry",
          "price": 88
        },
        {
          "id": "A024",
          "code": "A024",
          "name": "娘惹蒸苏东",
          "nameEn": "Nyonya Style Squid",
          "price": 35
        },
        {
          "id": "A025",
          "code": "A025",
          "name": "招牌蒸苏东",
          "nameEn": "Signature Squid",
          "price": 35
        },
        {
          "id": "A026",
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
          "code": "A029",
          "name": "招牌蒸大头虾",
          "nameEn": "Signature King Prawn",
          "seasonal": true,
          "image": "images/menu/A029.jpg",
          "tag": "招牌"
        },
        {
          "id": "A030",
          "code": "A030",
          "name": "干煎大头虾",
          "nameEn": "Pan Fried King Prawn",
          "seasonal": true,
          "desc": "最少 2 只 (min 2)",
          "descEn": "Min 2 pcs"
        },
        {
          "id": "A031",
          "code": "A031",
          "name": "招牌蒸老虎虾",
          "nameEn": "Signature Tiger Prawn",
          "price": 60,
          "tag": "招牌"
        },
        {
          "id": "A032",
          "code": "A032",
          "name": "干煎老虎虾",
          "nameEn": "Pan Fried Tiger Prawn",
          "price": 60,
          "image": "images/menu/A032.jpg"
        },
        {
          "id": "A033",
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
          "code": "A056",
          "name": "青龙菜炒芽菜",
          "nameEn": "Stir-Fried Bean Sprout with Qing Long",
          "price": 18,
          "image": "images/menu/A056.jpg"
        },
        {
          "id": "ADD1",
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
          "code": "A058",
          "name": "葱油豆腐",
          "nameEn": "Scallion Steamed Beancurd",
          "price": 10,
          "image": "images/menu/A058.jpg"
        },
        {
          "id": "A059",
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
          "code": "A060",
          "name": "荷包蛋",
          "nameEn": "Poached Egg",
          "price": 2,
          "unit": "粒",
          "unitEn": "pc"
        },
        {
          "id": "A061",
          "code": "A061",
          "name": "煎蛋",
          "nameEn": "Omelette",
          "price": 8
        },
        {
          "id": "A062",
          "code": "A062",
          "name": "大葱蛋",
          "nameEn": "Onion Omelette",
          "price": 12
        },
        {
          "id": "A063",
          "code": "A063",
          "name": "苦瓜蛋",
          "nameEn": "Bitter Gourd Omelette",
          "price": 13,
          "image": "images/menu/A063.jpg"
        },
        {
          "id": "A064",
          "code": "A064",
          "name": "三皇蛋",
          "nameEn": "Three Flavours Steam Egg",
          "price": 15,
          "image": "images/menu/A064.jpg"
        },
        {
          "id": "A065",
          "code": "A065",
          "name": "蒸水蛋",
          "nameEn": "Steamed Egg",
          "price": 12
        },
        {
          "id": "A066",
          "code": "A066",
          "name": "菜圃煎蛋",
          "nameEn": "Choy Po Omelette",
          "price": 12
        },
        {
          "id": "A067",
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
          "code": "B009",
          "name": "竹蔗马蹄",
          "nameEn": "Sugarcane",
          "price": 4.5
        },
        {
          "id": "B010",
          "code": "B010",
          "name": "洋参菊花",
          "nameEn": "Chrysanthemum",
          "price": 4.5
        },
        {
          "id": "B011",
          "code": "B011",
          "name": "爱玉冰",
          "nameEn": "Ai Yu",
          "price": 4.5
        },
        {
          "id": "B012",
          "code": "B012",
          "name": "100号",
          "nameEn": "100 Plus",
          "price": 3.5
        },
        {
          "id": "B013",
          "code": "B013",
          "name": "可乐",
          "nameEn": "Coca Cola",
          "price": 3.5
        },
        {
          "id": "B014",
          "code": "B014",
          "name": "啤酒",
          "nameEn": "Tiger",
          "price": 23
        },
        {
          "id": "B015",
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
