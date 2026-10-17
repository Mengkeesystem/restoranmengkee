# 明记家乡小食店 · 官方网站

给客人看的公开网站（跟内部 ERP 完全分开）。纯静态网页，用 GitHub Pages 免费上线，无后台、无月费。

## 功能
| 功能 | 说明 |
|---|---|
| 门店地址 | 按区域（雪隆区 / 芙蓉区…）分组列出全部分店，每间有「导航」按钮直接开 Google Maps |
| 介绍餐厅 | 品牌故事、环境照片、营业时间（自动显示「营业中/已打烊」）、地址 + Google Maps、电话 / WhatsApp |
| 菜单 | 分类、照片、价钱、招牌/人气标签、售完标记 |
| 网上点餐（自取） | 加购物车 → 填姓名电话、自取日期时间 → **一键打开 WhatsApp，订单内容自动带好发给店里** |
| 网上订位 | 填日期、时间、人数 → 同样转 WhatsApp 发给店里确认 |
| 优惠活动 / 节日套餐 | 设定开始/结束日期，过期自动隐藏 |
| 社交 / 外卖平台 | Facebook、Instagram、Foodpanda、GrabFood 按钮（没填的不显示） |
| 中 / 英切换 | 右上角 EN / 中文 |

订位和点餐**只有在店员 WhatsApp 回复确认后才算成功**，网站本身不收钱、不存客人资料。

## 文件
```
index.html   网站程序（一般不用改）
config.js    ★ 网站全部内容：店名、电话、营业时间、菜单、优惠……改这个就好
images/      照片：菜品图、门面/环境照、logo、首页大图
```

## 怎么改内容
1. 打开 `config.js`，把标了 `TODO` 的地方换成真实资料（**目前菜单/价钱/地址/电话全部是示例**）。
2. 照片放进 `images/`，在 `config.js` 里写文件名，例如 `image: "images/ckt.jpg"`。
   建议菜品照片横的 4:3，每张压缩到 300KB 以内（手机打开比较快）。
3. **分店**：在 `config.js` 的 `outlets` 里增删。每间可加 `hours`(营业时间)、`phone`、`whatsapp`(该店自己的号码)、`map`(Google Maps 链接)。客人订位/点餐时要先选分店；该分店有填 `whatsapp` 就发到那间店，没有就发到总号码。
4. WhatsApp 号码格式：国家码开头、不要 `+` 和空格，例如 `60123456789`。
5. Google Maps 嵌入：在 Google Maps 找到店 → 分享 → 嵌入地图 → 复制 `src="..."` 里的网址贴到 `mapEmbed`。

## 上线（GitHub Pages）
仓库 → Settings → Pages → Source 选 `Deploy from a branch`，Branch 选 `main` / `(root)` → Save。
约 1 分钟后网址会出现在同一页（`https://<账号>.github.io/<仓库名>/`）。之后每次推送到 `main` 会自动更新。
想用自己的域名（例如 mengkee.com.my）：在同一页填 Custom domain，再到域名商那边加 DNS 记录。

## 复制给其他店（例如牛室 Beef House）
`index.html` 原封不动，只换 `config.js` 和 `images/`。详见 `CLAUDE.md`。

## 付款确认小后台（Supabase，可选）
设定好之后：客人选「现在转账付款」→ 扫码付款 → 网页自动等待 → **店员在 `admin.html` 核对收款后按「✅ 已收款」→ 客人网页自动跳到 WhatsApp 发订单**（客人不用自己勾选）。
没设定的话，网站照旧用「客人自己勾选我已付款」的流程。

**一次性设定（约 10 分钟）：**
1. 到 https://supabase.com 用明记的邮箱登录 → **New project**（名字例如 `mengkee-website`，地区选 Singapore）。
   ⚠️ 这是**官网专用的新项目**，不要用明记 / 牛室 ERP 的 Supabase 项目。
2. 左边 **SQL Editor** → 把本仓库 `supabase/schema.sql` 整份贴进去 → **Run**。
3. 左边 **Authentication → Users → Add user**：为每位店员建账号（邮箱 + 密码，勾 Auto Confirm）。
4. 回到 **SQL Editor**，把店员邮箱加进白名单（每人一行）：
   ```sql
   insert into public.web_staff (email) values ('店员邮箱@example.com') on conflict do nothing;
   ```
5. 左边 **Project Settings → API**：复制 **Project URL** 和 **anon public** key，填进 `config.js` 的 `backend`（或把这两个交给 Claude 帮你填）。
   ⚠️ 只填 **anon public** key，**绝对不要**用 `service_role` key。
6. 店员打开 `https://<网站网址>/admin.html` 登录，保持页面开着（会响铃提示新订单）。

**店员日常：** 有新订单响铃 → 打开 TNG / 银行 App 核对「金额 + 参考号（MKmmdd-xxxx）」→ 对得上按「✅ 已收款」，对不上按「✖ 拒绝」。
