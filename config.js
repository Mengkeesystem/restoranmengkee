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
  nameEn: "Meng Kee Hometown Kitchen",    // TODO 确认英文名
  tagline: "家乡的味道，一锅一铲炒出来",
  taglineEn: "Hometown flavours, wok-fried to order",
  logo: "",                               // 例如 "images/logo.png"；留空会显示店名文字
  heroImage: "",                          // 首页大图，例如 "images/hero.jpg"；留空用纯色背景

  /* WhatsApp 号码：国家码开头、不要 + 和空格，例如 60123456789 */
  whatsapp: "60123456789",                // TODO 换成明记的 WhatsApp 号码
  phone: "+60 12-345 6789",               // TODO 显示用电话
  address: "No. 1, Jalan Contoh, 53000 Kuala Lumpur", // TODO 地址
  /* Google Maps：在 Google Maps 搜到店 →「分享」→「嵌入地图」，复制 iframe 里 src="..." 的网址贴这里 */
  mapEmbed: "",                           // TODO 留空则显示「在 Google Maps 打开」按钮
  mapLink: "https://maps.google.com/?q=Meng+Kee",     // TODO 店的 Google Maps 链接

  /* 营业时间：0=星期日 … 6=星期六；休息日写 null。可一天两段：[["07:00","14:00"],["17:00","21:00"]] */
  hours: {                                // TODO 确认营业时间
    0: [["07:00", "15:00"]],
    1: null,
    2: [["07:00", "15:00"]],
    3: [["07:00", "15:00"]],
    4: [["07:00", "15:00"]],
    5: [["07:00", "15:00"]],
    6: [["07:00", "15:00"]],
  },

  /* 社交平台 / 外卖平台链接，没有的留空 "" 就不会显示 */
  social: {
    facebook: "",                         // TODO
    instagram: "",                        // TODO
    foodpanda: "",                        // TODO
    grabfood: "",                         // TODO
  },

  /* ---------- 品牌故事 ---------- */
  story: [                                // TODO 换成明记真实的故事
    "明记从一间家乡小档口开始，几十年来只坚持一件事：用家里的做法，煮每天都吃得下的家常菜。",
    "每一道煮炒都是现点现炒，酱料自家调配，食材每天新鲜进货。欢迎来坐坐，吃一顿像回家一样的饭。",
  ],
  storyEn: [
    "Meng Kee began as a small hometown stall with one simple belief: cook everyday food the way it's done at home.",
    "Every dish is wok-fried to order with house-made sauces and fresh daily ingredients. Come in and eat like you're home.",
  ],

  /* 环境照片：放进 images/ 文件夹，写文件名。留空数组则不显示这一块 */
  gallery: [                              // TODO 放店内/门面照片
    // { src: "images/shop-1.jpg", caption: "店内环境" },
  ],

  /* ---------- 优惠活动 / 节日套餐 ----------
   * from/to 是显示期间(含当天)，过期会自动隐藏，不用手动删。to 留空 = 长期 */
  promos: [                               // TODO 示例活动
    {
      title: "开张优惠：堂食满 RM50 送饮料一杯",
      titleEn: "Opening promo: free drink with RM50 dine-in",
      body: "活动期间堂食消费满 RM50，送冰柠檬茶一杯。",
      bodyEn: "Spend RM50 on dine-in and get a free iced lemon tea.",
      from: "2026-10-01", to: "2026-12-31", image: "",
    },
  ],

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
    enabled: true,
    pickupLeadMinutes: 30,                // 最快几分钟后可自取
    currency: "RM",
  },

  /* ---------- 菜单 ----------
   * image 放 images/ 里的文件名；留空会显示一个占位图标。
   * soldOut:true 会显示「售完」且不能下单。 */
  menu: [                                 // TODO 全部是示例菜品/价格，请换成明记真实菜单
    { cat: "招牌煮炒", catEn: "Signature Wok", items: [
      { id: "m1", name: "明记招牌炒粿条", nameEn: "Signature Char Kuey Teow", price: 12.9, desc: "大火镬气，加鲜虾腊肠", image: "", tag: "招牌" },
      { id: "m2", name: "麻婆豆腐", nameEn: "Mapo Tofu", price: 14.0, desc: "", image: "" },
      { id: "m3", name: "咸蛋苦瓜", nameEn: "Salted Egg Bitter Gourd", price: 15.0, desc: "", image: "" },
      { id: "m4", name: "姜葱鸡", nameEn: "Ginger Scallion Chicken", price: 18.0, desc: "", image: "" },
    ]},
    { cat: "饭面类", catEn: "Rice & Noodles", items: [
      { id: "r1", name: "海南鸡饭", nameEn: "Hainanese Chicken Rice", price: 10.5, desc: "", image: "", tag: "人气" },
      { id: "r2", name: "干捞面", nameEn: "Dry Tossed Noodles", price: 9.0, desc: "", image: "" },
      { id: "r3", name: "福建面", nameEn: "Hokkien Mee", price: 12.0, desc: "", image: "" },
    ]},
    { cat: "小食", catEn: "Snacks", items: [
      { id: "s1", name: "炸云吞 (6粒)", nameEn: "Fried Wantan (6 pcs)", price: 7.0, desc: "", image: "" },
      { id: "s2", name: "虾饼", nameEn: "Prawn Fritters", price: 8.0, desc: "", image: "" },
    ]},
    { cat: "饮料", catEn: "Drinks", items: [
      { id: "d1", name: "冰柠檬茶", nameEn: "Iced Lemon Tea", price: 4.5, desc: "", image: "" },
      { id: "d2", name: "咖啡乌", nameEn: "Kopi O", price: 3.0, desc: "", image: "" },
      { id: "d3", name: "薏米水", nameEn: "Barley Water", price: 3.5, desc: "", image: "", soldOut: true },
    ]},
  ],

  /* ---------- 外观颜色 ---------- */
  theme: {
    primary: "#B4232A",   // 主色(按钮、标题)
    accent:  "#F2B417",   // 点缀色
    dark:    "#2A1A14",   // 深色背景(页脚)
  },
};
