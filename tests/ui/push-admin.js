// 员工后台：手机通知开关 + 拿掉手动「已收款」（2026-11-02，模拟 Supabase / 推送）。
// 用法：在同一条命令里 `python3 -m http.server 8765 --directory <仓库根目录> &` 再 `node tests/ui/push-admin.js`
const {chromium}=require('playwright');
const MOCK=`(()=>{
const NOW=new Date().toISOString(); window.__log=[];
const orders=[
 {id:21,ref:"MK1102-9001",outlet:"OKR",order_type:"pickup",customer_name:"乱发订单的人",customer_phone:"0120000000",amount:5,message:"【网上点餐 - 自取】\\n• A001 假的 x1 = RM 5.00\\n合计: RM 5.00",status:"pending",created_at:NOW,outlet_idx:0,pay_provider:null},
 {id:22,ref:"MK1102-9002",outlet:"OKR",order_type:"pickup",customer_name:"阿明",customer_phone:"0123456789",amount:40.3,message:"x\\n合计: RM 40.30",status:"pending",created_at:NOW,outlet_idx:0,pay_provider:"hitpay",pay_status:"pending",pay_id:"abc12345"},
 {id:23,ref:"MK1102-9003",outlet:"OKR",order_type:"pickup",customer_name:"阿强",customer_phone:"0121111111",amount:20,message:"x\\n合计: RM 20.00",status:"paid",created_at:NOW,confirmed_at:NOW,confirmed_by:"HitPay",outlet_idx:0,pay_provider:"hitpay",pay_status:"completed"}];
function Q(t){ const st={t,op:"select"}; const q={select:()=>q,gte:()=>q,lt:()=>q,order:()=>q,limit:()=>q,range:()=>q,in:()=>q,eq:()=>q,update:(v)=>{st.op="update";st.v=v;return q;},insert:(v)=>{st.op="insert";st.v=v;return q;},then:(res,rej)=>Promise.resolve(run(st)).then(res,rej)}; return q; }
function run(st){ __log.push([st.t,st.op,st.v&&JSON.stringify(st.v)]); if(st.t==="web_orders"&&st.op==="select") return {data:orders,error:null}; return {data:[],error:null}; }
window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{user:{email:"boss@x"}}}}),onAuthStateChange(){},signOut:async()=>{ __log.push(["signOut"]); }},
 rpc:async(n)=>{ if(n==="is_web_staff") return {data:true}; if(n==="web_staff_me") return {data:{role:"admin",outlets:[],email:"boss@x"}}; return {data:null}; },
 functions:{invoke:async(n,o)=>{ __log.push(["fn",n,JSON.stringify(o&&o.body)]); if(n==="web-delyva") return {data:{configured:false}};
   if(n==="web-push"){ const a=o.body.action; if(window.__pushDown) return {error:{message:"x",context:{json:async()=>({error:"not found"})}}};
     if(a==="status") return {data:{ok:true,configured:true,publicKey:"BN7AmYKErrYxhvoxHWtqQWj7Rfejrrh9nK7Ki6RFkcwMuOqDJk9mG-PLs8urH-z0nmIqQQQFitS3HPJUEExzeu8"}};
     if(a==="test") return {data:{ok:true,sent:1}}; return {data:{ok:true}}; }
   return {data:{}}; }},
 storage:{from:()=>({})}, from:(t)=>Q(t)})};
})();`;
// 假的推送环境（Playwright 的 Chromium 不会真的订阅）
const PUSHENV=(perm)=>`(()=>{ let permission=${JSON.stringify(perm)}; let sub=null;
 window.PushManager=function(){}; window.Notification=function(){}; Object.defineProperty(window.Notification,"permission",{get:()=>permission});
 window.Notification.requestPermission=async()=>{ window.__asked=(window.__asked||0)+1; if(permission==="default") permission="granted"; return permission; };
 const reg={pushManager:{getSubscription:async()=>sub,subscribe:async(o)=>{ window.__subKey=o.applicationServerKey.length; window.__userVisible=o.userVisibleOnly; sub={endpoint:"https://fcm.googleapis.com/fcm/send/TESTDEV",options:{applicationServerKey:o.applicationServerKey.buffer},unsubscribe:async()=>{sub=null;return true;},toJSON:()=>({endpoint:"https://fcm.googleapis.com/fcm/send/TESTDEV",keys:{p256dh:"B".repeat(87),auth:"a".repeat(22)}})}; return sub;}}};
 Object.defineProperty(navigator,"serviceWorker",{value:{ready:Promise.resolve(reg),register:()=>Promise.resolve(reg),addEventListener(){}},configurable:true}); })();`;
(async()=>{ const b=await chromium.launch(); let bad=0; const ck=(c,m)=>{ console.log((c?"✅ ":"❌ ")+m); if(!c) bad++; };
async function open(w,{perm,ua,push=true,standalone=false}={}){
  const ctx=await b.newContext({viewport:{width:w,height:1000},timezoneId:"Asia/Kuala_Lumpur",...(ua?{userAgent:ua}:{})}); const p=await ctx.newPage(); const errs=[], dlg=[]; p.errs=errs; p.dlg=dlg;
  p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>{ dlg.push(d.message()); d.accept(); });
  if(push) await p.addInitScript(PUSHENV(perm||"default")); else await p.addInitScript("delete window.PushManager;");   // 模拟浏览器没有推送功能
  if(standalone) await p.addInitScript("Object.defineProperty(navigator,'standalone',{value:true})");
  await p.route('**/supabase.js',r=>r.fulfill({contentType:'application/javascript',body:MOCK}));
  await p.route('**/admin.html',async r=>{const res=await r.fetch();let t=await res.text();t=t.replace(/ integrity="[^"]*"/,'');r.fulfill({response:res,body:t});});
  await p.goto('http://localhost:8765/admin.html'); await p.waitForTimeout(1500); return p; }
const logs=(p,f)=>p.evaluate(f=>__log.filter(x=>x[0]==="fn"&&x[1]==="web-push").map(x=>JSON.parse(x[2])).filter(f?eval("("+f+")"):()=>true),f||null);

for(const w of [1280,393]){
  console.log("--- 手机通知 / 手动已收款",w);
  const p=await open(w);
  // 手动已收款已拿掉
  ck(await p.locator('button[data-act="paid"]').count()===0,'待确认页：没有任何「已收款」按钮');
  const txt=await p.locator('.ord',{hasText:'MK1102-9001'}).innerText();
  ck(/没有经过 HitPay 付款/.test(txt)&&/不能手动按「已收款」/.test(txt),'没经过 HitPay 的假订单 → 红字警告「系统不会当成已付款」');
  ck(await p.locator('.ord',{hasText:'MK1102-9001'}).locator('button[data-act="rejected"]').count()===1,'  ……只剩「取消这张订单」');
  ck(await p.locator('.ord',{hasText:'MK1102-9002'}).locator('button[data-act="paid"]').count()===0&&/等客人付款/.test(await p.locator('.ord',{hasText:'MK1102-9002'}).innerText()),'HitPay 待付款的单 → 照旧「等客人付款」，没有已收款按钮');
  ck(!/再按「已收款」/.test(await p.locator('.hint').first().innerText()),'顶部说明不再叫店员按「已收款」');
  // 取消订单仍可用
  await p.locator('.ord',{hasText:'MK1102-9001'}).locator('button[data-act="rejected"]').click(); await p.waitForTimeout(300);
  ck(p.dlg.some(x=>/取消订单 MK1102-9001/.test(x))&&await p.evaluate(()=>__log.some(x=>x[0]==="web_orders"&&x[1]==="update"&&/rejected/.test(x[2]))),'取消订单仍然可以（送出 rejected）');
  // 手机通知
  const box=p.locator('#pushBox'); ck(await box.isVisible()&&/还没开启/.test(await box.innerText()),'手机通知：显示「还没开启」+ 开启按钮');
  await p.screenshot({path:`/tmp/push-${w}-1.png`});
  await p.click('#pushOn'); await p.waitForTimeout(600);
  ck(/手机通知已开启/.test(await box.innerText()),'按「开启手机通知」→ 变成「已开启」');
  ck(await p.evaluate(()=>window.__subKey)===65&&await p.evaluate(()=>window.__userVisible)===true,'订阅用服务器给的公钥（65 字节）+ userVisibleOnly');
  const subs=await p.evaluate(()=>__log.filter(x=>x[0]==="fn"&&x[1]==="web-push").map(x=>JSON.parse(x[2])));
  ck(subs.some(x=>x.action==="status")&&subs.some(x=>x.action==="subscribe"&&x.sub.endpoint.endsWith("TESTDEV")&&x.sub.keys.p256dh&&x.sub.keys.auth),'把订阅送到服务器登记（endpoint + 密钥）');
  await p.screenshot({path:`/tmp/push-${w}-2.png`});
  await p.click('#pushTest'); await p.waitForTimeout(400);
  ck(p.dlg.some(x=>/测试通知已发出/.test(x)),'按「发送测试通知」→ 提示已发出');
  await p.click('#pushOff'); await p.waitForTimeout(400);
  ck(/还没开启/.test(await box.innerText())&&await p.evaluate(()=>__log.some(x=>x[0]==="fn"&&x[1]==="web-push"&&/unsubscribe/.test(x[2]))),'按「关闭」→ 取消订阅并回到「还没开启」');
  await p.click('#pushOn'); await p.waitForTimeout(500);
  await p.evaluate(()=>{ __log.length=0; }); await p.click('#logoutBtn'); await p.waitForTimeout(500);
  ck(await p.evaluate(()=>__log.some(x=>x[0]==="fn"&&x[1]==="web-push"&&/unsubscribe/.test(x[2]))&&__log.some(x=>x[0]==="signOut")),'登出 → 先取消这台手机的登记，再登出');
  ck(p.errs.length===0,'没有 JS 错误 '+JSON.stringify(p.errs));
  const ov=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1); ck(!ov,'没有横向溢出');
  await p.context().close();
}
console.log("--- 新订单提示音（换成业主的 5 秒声音）");
{ const p=await open(393); await p.evaluate(()=>{ window.__starts=0; window.__bell=0; const o=AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start=function(){ window.__starts++; window.__dur=this.buffer&&this.buffer.duration; return o.apply(this,arguments); }; const oc=OscillatorNode.prototype.start; OscillatorNode.prototype.start=function(){ window.__bell++; return oc.apply(this,arguments); }; });
  await p.click('#sndBtn'); await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>({s:window.__starts,b:window.__bell,d:window.__dur}));
  ck(r.s===1&&r.b===0,'按「试听」→ 播的是业主的声音档（不是旧的叮当铃声） '+JSON.stringify(r));
  ck(r.d>4.4&&r.d<5.2,'  ……长度约 5 秒（'+(r.d&&r.d.toFixed(2))+' 秒）');
  await p.evaluate(()=>{ window.__starts=0; }); await p.click('#sndBtn'); await p.waitForTimeout(500); ck(await p.evaluate(()=>window.__starts)===1,'再按一次 → 重新播放（不会叠在一起）'); await p.context().close(); }
{ const ctx=await b.newContext({viewport:{width:393,height:900}}); const p=await ctx.newPage(); await p.route('**/supabase.js',r=>r.fulfill({contentType:'application/javascript',body:MOCK}));
  await p.route('**/admin.html',async r=>{const res=await r.fetch();let t=await res.text();t=t.replace(/ integrity="[^"]*"/,'');r.fulfill({response:res,body:t});});
  await p.route('**/new-order.mp3*',r=>r.fulfill({status:404,body:""}));   // 声音档载不到
  await p.goto('http://localhost:8765/admin.html'); await p.waitForTimeout(1200);
  await p.evaluate(()=>{ window.__bell=0; const oc=OscillatorNode.prototype.start; OscillatorNode.prototype.start=function(){ window.__bell++; return oc.apply(this,arguments); }; });
  await p.click('#sndBtn'); await p.waitForTimeout(800); ck(await p.evaluate(()=>window.__bell)>0,'声音档载不到 → 退回旧的叮当铃声（不会没声音）'); await ctx.close(); }
console.log("--- 各种状态");
{ const p=await open(393,{perm:"granted"}); await p.evaluate(()=>{}); ck(/还没开启/.test(await p.locator('#pushBox').innerText()),'已允许权限但这台还没订阅 → 显示开启按钮'); 
  await p.click('#pushOn'); await p.waitForTimeout(500); ck(await p.evaluate(()=>window.__asked||0)===0,'权限已经是允许 → 不会再弹询问'); await p.context().close(); }
{ const p=await open(393,{perm:"denied"}); const t=await p.locator('#pushBox').innerText(); ck(/拒绝了通知/.test(t)&&await p.locator('#pushOn').count()===0,'权限被拒绝 → 教他去设定里打开，不显示无用的按钮'); await p.context().close(); }
{ const p=await open(393,{ua:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",push:false}); const t=await p.locator('#pushBox').innerText(); ck(/加到主画面/.test(t)&&/iOS 16.4|主画面的图标/.test(t),'iPhone Safari（没装成 App）→ 教他先「加到主画面」'); await p.screenshot({path:'/tmp/push-ios.png'}); await p.context().close(); }
{ const p=await open(393,{push:false,ua:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"}); await p.evaluate(()=>{}); const t=await p.locator('#pushBox').innerText(); ck(/不支持|加到主画面/.test(t),'不支持推送的浏览器 → 说明原因，不报错'); ck(p.errs.length===0,'  ……没有 JS 错误'); await p.context().close(); }
{ const p=await open(393,{}); await p.evaluate(()=>{ window.__pushDown=true; }); await p.click('#pushOn'); await p.waitForTimeout(600); const t=await p.locator('#pushBox').innerText(); ck(/还没设定好手机通知|部署 web-push/.test(t),'web-push 还没部署 → 红字提示老板去部署，不崩'); ck(p.errs.length===0,'  ……没有 JS 错误'); await p.context().close(); }
await b.close(); console.log(bad?`\n❌ ${bad} 项不对`:"\n全部通过"); process.exit(bad?1:0); })();
