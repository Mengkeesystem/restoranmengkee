// web-push 函数本身：订阅、谁会收到通知、防乱填网址、测试通知、健康检查（2026-11-02）
// 跑法（在 tests/hitpay/）：node --experimental-strip-types t7.mjs
let ok=0, bad=0; const t=(n,c,x)=>{ if(c){ ok++; console.log("✅",n); } else { bad++; console.log("❌",n,x===undefined?"":JSON.stringify(x)); } };
const ENV={SUPABASE_URL:"https://p.supabase.co",SUPABASE_SERVICE_ROLE_KEY:"srk-test",SUPABASE_ANON_KEY:"anon-test",WEB_VAPID_PUBLIC:"BPUB"+"x".repeat(83),WEB_VAPID_PRIVATE:process.env.NO_VAPID?"":"priv"};
let handler; globalThis.Deno={env:{get:k=>ENV[k]},serve:h=>{handler=h;}};
const STAFF=[{email:"a@x.com",role:"admin",outlets:[]},{email:"m0@x.com",role:"manager",outlets:[0]},{email:"m1@x.com",role:"manager",outlets:[1]}];
const ORDERS={1:{ref:"MK1102-0001",outlet:"OKR",outlet_idx:0,order_type:"pickup",amount:20.5,customer_name:"王小明",customer_phone:"0123456789"},
  2:{ref:"MK1102-0002",outlet:"Scott",outlet_idx:1,order_type:"delivery",amount:58.3},3:{ref:"MK1102-0003",outlet:"旧单",outlet_idx:null,order_type:"pickup",amount:9}};
let SUBS=[]; const sent=[]; let staffNoRole=false; const deleted=[];
const J=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{"content-type":"application/json"}});
const ep=(n,host="fcm.googleapis.com")=>`https://${host}/fcm/send/${n}`; const K="B".repeat(65), A="a".repeat(22);
globalThis.__webpush={ setVapidDetails(){}, async sendNotification(sub,body,opt){ if(sub.endpoint.includes("dead")){ const e=new Error("gone"); e.statusCode=410; throw e; } sent.push({endpoint:sub.endpoint,body:JSON.parse(body),opt}); } };
globalThis.fetch=async(u,init={})=>{ u=String(u); const m=(init.method||"GET").toUpperCase(); const url=new URL(u);
  if(u.includes("/auth/v1/user")){ const a=(init.headers||{}).Authorization||""; const em={"Bearer eyadmin":"a@x.com","Bearer eym0":"m0@x.com","Bearer eystranger":"z@x.com"}[a]; return em?J({email:em}):J({},401); }
  if(u.includes("/rest/v1/web_staff")){ if(staffNoRole&&url.searchParams.get("select").includes("role")) return J({message:"column role does not exist"},400); return J(STAFF.map(s=>staffNoRole?{email:s.email}:s)); }
  if(u.includes("/rest/v1/web_orders")){ const id=url.searchParams.get("id").replace("eq.",""); return J(ORDERS[id]?[ORDERS[id]]:[]); }
  if(u.includes("/rest/v1/web_push_subs")){ const sp=url.searchParams;
    if(m==="POST"){ const b=JSON.parse(init.body); const i=SUBS.findIndex(x=>x.endpoint===b.endpoint); if(i>=0) SUBS[i]={...SUBS[i],...b}; else SUBS.push(b); return new Response("",{status:200}); }
    if(m==="DELETE"){ const e=decodeURIComponent((sp.get("endpoint")||"").replace("eq.","")), em=sp.get("email")&&decodeURIComponent(sp.get("email").replace("eq.","")); deleted.push(e); SUBS=SUBS.filter(x=>!(x.endpoint===e&&(!em||x.email===em))); return new Response("",{status:200}); }
    let rows=SUBS; const e=sp.get("email"); if(e){ if(e.startsWith("eq.")) rows=rows.filter(x=>x.email===decodeURIComponent(e.slice(3))); else { const list=e.slice(4,-1).split(",").map(x=>x.replace(/"/g,"")); rows=rows.filter(x=>list.includes(x.email)); } }
    if(sp.get("order")) rows=rows.slice().sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at))); return J(rows); }
  throw new Error("unexpected fetch "+m+" "+u); };
await import("../../supabase/functions/web-push/index.ts?"+Math.random());
const call=async(body,auth,method="POST",qs="")=>{ const r=await handler(new Request("https://p.supabase.co/functions/v1/web-push"+qs,{method,headers:{"content-type":"application/json",origin:"https://restoranmengkee.com.my",...(auth?{authorization:auth}:{})},body:method==="POST"?JSON.stringify(body):undefined})); return {s:r.status,b:await r.json().catch(()=>null)}; };
const SRK="Bearer srk-test";
const sub=(n,host)=>({endpoint:ep(n,host),keys:{p256dh:K,auth:A}});

if(process.env.NO_VAPID){   // 子进程：只测「没设推送密钥」
  SUBS=[{endpoint:ep("A"),email:"a@x.com",p256dh:K,auth:A}];
  let q=await call(null,null,"GET","?health=1"); t("没设推送密钥 → 健康检查 503（监控会报警）", q.s===503&&q.b.ok===false&&q.b.problems.length>0, q);
  q=await call({action:"notify",kind:"paid",id:1},SRK); t("没设密钥时 notify 不崩，回报没设定", q.s===200&&q.b.ok===false&&!sent.length, q);
  q=await call({action:"status"}); t("没设密钥 → status 显示 configured:false", q.b.configured===false, q);
  q=await call({action:"test"},"Bearer eyadmin"); t("没设密钥时按测试通知 → 说清楚原因", q.s===400&&/推送密钥/.test(q.b.error), q);
  process.exit(0);
}

let r=await call({action:"status"}); t("status：公开，回传公钥和 configured:true", r.s===200&&r.b.configured&&r.b.publicKey===ENV.WEB_VAPID_PUBLIC&&!JSON.stringify(r.b).includes("priv"), r);

// ---- 订阅 ----
r=await call({action:"subscribe",sub:sub("x1")}); t("没登录不能订阅", r.s===400, r);
r=await call({action:"subscribe",sub:sub("x1")},"Bearer eystranger"); t("不在店员名单的登录账号不能订阅", r.s===400&&/白名单/.test(r.b.error), r);
for(const [n,s] of [["内部网址 http",{endpoint:"http://169.254.169.254/x",keys:{p256dh:K,auth:A}}],["别人的网站 https",{endpoint:"https://evil.example.com/push",keys:{p256dh:K,auth:A}}],["冒充域名",{endpoint:"https://fcm.googleapis.com.evil.com/x",keys:{p256dh:K,auth:A}}],["带端口",{endpoint:"https://fcm.googleapis.com:8443/x",keys:{p256dh:K,auth:A}}],["密钥乱填",{endpoint:ep("x2"),keys:{p256dh:"<script>",auth:A}}],["没有密钥",{endpoint:ep("x3")}]]){
  r=await call({action:"subscribe",sub:s},"Bearer eyadmin"); t(`订阅被拒：${n}`, r.s===400&&SUBS.length===0, r); }
r=await call({action:"subscribe",sub:sub("a1"),ua:"iPhone"},"Bearer eyadmin"); t("管理员订阅成功，存在自己的邮箱下", r.s===200&&SUBS.length===1&&SUBS[0].email==="a@x.com", SUBS);
r=await call({action:"subscribe",sub:sub("a1")},"Bearer eyadmin"); t("同一台重复订阅 → 不会重复存", SUBS.length===1, SUBS.length);
await call({action:"subscribe",sub:sub("m0a",  "web.push.apple.com")},"Bearer eym0"); t("苹果推送网址可以订阅（分店经理）", SUBS.some(x=>x.email==="m0@x.com"), SUBS);
for(let i=0;i<10;i++){ await call({action:"subscribe",sub:sub("many"+i)},"Bearer eyadmin"); }
t(`同一个人最多留 8 台（${SUBS.filter(x=>x.email==="a@x.com").length}）`, SUBS.filter(x=>x.email==="a@x.com").length<=8, SUBS.length);

// ---- 通知给谁 ----
SUBS=[{endpoint:ep("A"),email:"a@x.com",p256dh:K,auth:A},{endpoint:ep("M0"),email:"m0@x.com",p256dh:K,auth:A},{endpoint:ep("M1"),email:"m1@x.com",p256dh:K,auth:A},{endpoint:ep("dead"),email:"a@x.com",p256dh:K,auth:A}]; sent.length=0;
r=await call({action:"notify",kind:"paid",id:1}); t("notify 没有 service role → 403（外人不能叫它发通知）", r.s===403&&!sent.length, r);
r=await call({action:"notify",kind:"paid",id:1},"Bearer anon-test"); t("notify 用公开的 anon key → 403", r.s===403&&!sent.length, r);
r=await call({action:"notify",kind:"paid",id:1},"Bearer eyadmin"); t("notify 用员工登录 → 403", r.s===403&&!sent.length, r);
r=await call({action:"notify",kind:"paid",id:1},SRK);
const to1=sent.map(x=>x.endpoint.split("/").pop()).sort().join();
t("OKR 的单 → 管理员 + OKR 经理收到；别间分店经理没有", to1==="A,M0", to1);
t("死掉的订阅（410）自动清掉", deleted.some(e=>e.includes("dead"))&&!SUBS.some(x=>x.endpoint.includes("dead")), deleted);
const p=sent[0].body; t("通知内容：参考号、分店、金额、已付款；没有客人姓名/电话", p.title.includes("MK1102-0001")&&p.body.includes("OKR")&&p.body.includes("RM 20.50")&&p.body.includes("自取")&&!/王小明|0123456789/.test(JSON.stringify(p)), p);
t("发送参数：高优先级 + 有 TTL", sent[0].opt.urgency==="high"&&sent[0].opt.TTL>0, sent[0].opt);
sent.length=0; await call({action:"notify",kind:"paid",id:2},SRK); t("Scott 的外送单 → 管理员 + 序号 1 的经理", sent.map(x=>x.endpoint.split("/").pop()).sort().join()==="A,M1", sent.map(x=>x.endpoint));
sent.length=0; await call({action:"notify",kind:"paid",id:3},SRK); t("分店不明的旧单 → 只有管理员", sent.map(x=>x.endpoint.split("/").pop()).join()==="A", sent.map(x=>x.endpoint));
sent.length=0; await call({action:"notify",kind:"alert",id:1,text:"自动叫骑手失败 <script>alert(1)</script>"},SRK);
t("出问题提醒：⚠️ 标题 + 说明，网页符号被洗掉", sent[0].body.title.startsWith("⚠️")&&sent[0].body.body.includes("自动叫骑手失败")&&!/[<>]/.test(sent[0].body.body), sent[0]?.body);
r=await call({action:"notify",kind:"paid",id:999},SRK); t("订单不存在 → 不报错、不发", r.s===200&&r.b.sent===0, r);
r=await call({action:"notify",kind:"paid",id:"1; drop"},SRK); t("乱填 id → 拒绝", r.s===400, r);
staffNoRole=true; sent.length=0; await call({action:"notify",kind:"paid",id:2},SRK); t("还没跑 staff.sql（没有 role 栏）→ 全部当管理员，照样发", sent.length>=3, sent.length); staffNoRole=false;

// ---- 取消订阅 / 测试通知 ----
SUBS=[{endpoint:ep("A"),email:"a@x.com",p256dh:K,auth:A},{endpoint:ep("M0"),email:"m0@x.com",p256dh:K,auth:A}];
await call({action:"unsubscribe",endpoint:ep("M0")},"Bearer eyadmin"); t("不能取消别人的订阅", SUBS.some(x=>x.endpoint===ep("M0")), SUBS);
await call({action:"unsubscribe",endpoint:ep("M0")},"Bearer eym0"); t("取消自己的订阅", !SUBS.some(x=>x.endpoint===ep("M0")), SUBS);
sent.length=0; r=await call({action:"test"},"Bearer eyadmin"); t("测试通知：只发给自己的手机", r.s===200&&r.b.sent===1&&sent.length===1&&sent[0].endpoint===ep("A"), {r,sent:sent.length});
r=await call({action:"test"},"Bearer eym0"); t("还没开启通知的人按测试 → 说清楚原因", r.s===400&&/还没有开启/.test(r.b.error), r);

// ---- 健康检查 + 没设密钥（没设密钥的情况用另一个进程重跑，因为密钥是载入时读的）----
r=await call(null,null,"GET","?health=1"); t("GET ?health=1 → ok:true", r.s===200&&r.b.ok===true, r);
r=await call(null,null,"GET",""); t("没带 ?health 的 GET → 405", r.s===405, r);
{ const { spawnSync } = await import("node:child_process"); const c=spawnSync(process.execPath,[...process.execArgv,new URL(import.meta.url).pathname],{env:{...process.env,NO_VAPID:"1"},encoding:"utf8"});
  const out=(c.stdout||"").split("\n").filter(l=>/^(✅|❌)/.test(l)); out.forEach(l=>console.log(l)); out.forEach(l=>l.startsWith("✅")?ok++:bad++);
  if(out.length<4){ bad++; console.log("❌ 没设密钥的那一轮没跑完",(c.stderr||"").slice(-300)); } }

console.log(`\n${ok} ✅ / ${bad} ❌`); process.exit(bad?1:0);
