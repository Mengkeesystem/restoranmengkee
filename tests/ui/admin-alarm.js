// 后台「务必响」：新订单响到按「知道了」、声音被挡的提示、连不上服务器的提示、登录失效会响、不会自动登出（2026-11-23，模拟 Supabase）。
// 用法：同一条命令里 `python3 -m http.server 8765 &` 再 `node tests/ui/admin-alarm.js`
const {chromium}=require('playwright');
const MOCK=`(()=>{
const T0=Date.now(); window.__rings=0; window.__vib=0; window.__refresh=0; window.__signOut=0; window.__cb=null; window.__q={mode:"ok",fail:false,jwt:false};
const cfg=new URLSearchParams(location.search);
const mk=(id,ref,min,extra)=>({id,ref,outlet:"OKR",order_type:"pickup",customer_name:"阿明",customer_phone:"0123456789",amount:20,message:"x\\n合计: RM 20.00",status:"paid",created_at:new Date(T0-min*60000).toISOString(),confirmed_at:new Date(T0-min*60000).toISOString(),confirmed_by:"HitPay",outlet_idx:0,pay_provider:"hitpay",...extra});
window.__orders=[]; if(cfg.get("pre")==="recent") __orders.push(mk(31,"MK-RECENT",5)); if(cfg.get("pre")==="old") __orders.push(mk(32,"MK-OLD",60));
window.__add=(id,ref)=>__orders.push(mk(id,ref,0));
// 声音：用假的 AudioContext（要有人点过页面才会 running），并数响了几次
class FakeCtx{ constructor(){ this.state=cfg.get("locked")?"suspended":"running"; this.currentTime=0; this.destination={}; }
  resume(){ if(window.__gesture) this.state="running"; return Promise.resolve(); }
  createOscillator(){ return {type:"",frequency:{value:0},connect(){},start(){__rings+=0.0001;},stop(){}}; }
  createGain(){ return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}; }
  createBufferSource(){ return {buffer:null,connect(){},start(){ __rings++; },stop(){}}; }
  decodeAudioData(){ return Promise.resolve({}); } }
window.AudioContext=FakeCtx; window.webkitAudioContext=FakeCtx;
document.addEventListener("pointerdown",()=>{ window.__gesture=true; },true);
navigator.vibrate=()=>{ __vib++; return true; };
function Q(t){ const q={select:()=>q,gte:()=>q,lt:()=>q,order:()=>q,limit:()=>q,range:()=>q,in:()=>q,eq:()=>q,update:()=>q,insert:()=>q,
  then:(a,b)=>{ let r; if(t==="web_orders"){ if(__q.fail) r={data:null,error:{message:"Failed to fetch"}}; else if(__q.jwt){ r={data:null,error:{message:"JWT expired",code:"PGRST301"}}; } else r={data:__orders,error:null}; } else r={data:[],error:null}; return Promise.resolve(r).then(a,b); }}; return q; }
const session=()=>({user:{email:"boss@x.com"},expires_at:Math.floor(Date.now()/1000)+(cfg.get("soon")?60:3600)});
window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:session()}}),refreshSession:async()=>{ __refresh++; __q.jwt=false; return {data:{session:session()},error:null}; },
  onAuthStateChange(cb){ window.__cb=cb; },signOut:async()=>{ __signOut++; if(window.__cb) window.__cb("SIGNED_OUT"); }},
 rpc:async(n)=>{ if(n==="is_web_staff") return {data:true}; if(n==="web_staff_me") return {data:{role:"admin",outlets:[],email:"boss@x.com"}}; return {data:null}; },
 functions:{invoke:async()=>({data:{configured:false}})}, storage:{from:()=>({createSignedUrls:async()=>({data:[]})})}, from:(t)=>Q(t)})};
})();`;
(async()=>{const b=await chromium.launch(); let bad=0; const ck=(c,m)=>{ console.log((c?"✅ ":"❌ ")+m); if(!c) bad++; };
async function open(qs,w=393){ const ctx=await b.newContext({viewport:{width:w,height:900},timezoneId:"Asia/Kuala_Lumpur"}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install(); await p.route('**/supabase.js',r=>r.fulfill({contentType:'application/javascript',body:MOCK}));
  await p.route('**/admin.html*',async r=>{const res=await r.fetch();let t=await res.text();t=t.replace(/ integrity="[^"]*"/,'');r.fulfill({response:res,body:t});});
  await p.goto('http://localhost:8765/admin.html'+qs); await p.clock.runFor(1500); return {ctx,p,errs}; }
const adv=(p,ms)=>p.clock.runFor(ms);
const g=(p,k)=>p.evaluate(k=>window[k],k);
// 1) 新订单：响 + 震动 + 红条；每 15 秒再响；按「知道了」才停
{ const {ctx,p,errs}=await open(''); await p.click('body'); console.log('--- 新订单会一直响');
  const r0=await g(p,'__rings'); await p.evaluate(()=>__add(41,"MK-NEW-1")); await adv(p,6000);
  ck(await p.locator('#newBar').isVisible()&&/MK-NEW-1/.test(await p.locator('#newBar').innerText()),'新订单 → 页面最上面出现红条「🔔 1 张新订单 MK-NEW-1」');
  const r1=await g(p,'__rings'); ck(r1>r0,'新订单立刻响（'+r0+' → '+r1+'）'); ck(await g(p,'__vib')>=1,'手机震动');
  await adv(p,16000); const r2=await g(p,'__rings'); ck(r2>r1,'没按「知道了」→ 15 秒后又响（'+r1+' → '+r2+'）');
  { const ts=[]; for(let i=0;i<4;i++){ ts.push(await p.title()); await adv(p,500); } ck(ts.some(x=>/新订单/.test(x)),'标题闪「🔔 新订单」'); }
  await p.screenshot({path:'/tmp/alarm-393.png'}); await p.click('#newAck'); const r3=await g(p,'__rings'); await adv(p,40000); ck(await p.locator('#newBar').count()===0,'按「知道了」→ 红条消失'); ck(await g(p,'__rings')===r3,'按了就不再响');
  await p.evaluate(()=>__add(42,"MK-NEW-2")); await adv(p,6000); ck(await p.locator('#newBar').isVisible(),'下一张新订单照样会响');
  ck(errs.length===0,'没有 JS 错误 '+errs.join('|')); await ctx.close(); }
// 2) 刷新页面：20 分钟内没确认过的已收款订单会响；确认过的 / 太旧的不响
{ const {ctx,p}=await open('?pre=recent'); await p.click('body'); console.log('--- 刷新页面后');
  await adv(p,3000); ck(await p.locator('#newBar').isVisible(),'刚打开页面：5 分钟前付款、还没确认过的订单 → 照样响'); await p.click('#newAck');
  await p.reload(); await p.clock.runFor(2500); ck(await p.locator('#newBar').count()===0,'按过「知道了」的订单，重新打开不再响'); await ctx.close(); }
{ const {ctx,p}=await open('?pre=old'); await adv(p,3000); ck(await p.locator('#newBar').count()===0,'1 小时前的旧订单 → 不响'); await ctx.close(); }
// 3) 声音被浏览器挡住
{ const {ctx,p}=await open('?locked=1'); console.log('--- 声音被挡'); await adv(p,3000);
  ck(await p.locator('#sndWarn').isVisible()&&/声音是关闭的/.test(await p.locator('#sndWarn').innerText()),'声音没开 → 最上面红条「声音是关闭的——新订单不会响」');
  await p.click('#sndWarn'); await adv(p,3000); ck(await p.locator('#sndWarn').count()===0,'点一下 → 声音开了、红条消失'); await ctx.close(); }
// 4) 连不上服务器
{ const {ctx,p}=await open(''); console.log('--- 连线'); await p.evaluate(()=>{ __q.fail=true; }); await adv(p,45000);
  ck(await p.locator('#connBar').isVisible()&&/连不上服务器/.test(await p.locator('#connBar').innerText()),'读不到订单超过 30 秒 → 红条「连不上服务器——现在可能收不到新订单」');
  await p.evaluate(()=>{ __q.fail=false; }); await adv(p,8000); ck(await p.locator('#connBar').count()===0,'恢复后红条自己消失'); await ctx.close(); }
// 5) 登录牌过期 → 自动续期再试，不登出
{ const {ctx,p}=await open(''); console.log('--- 登录牌过期'); const r0=await g(p,'__refresh'); await p.evaluate(()=>{ __q.jwt=true; }); await adv(p,7000);
  ck(await g(p,'__refresh')>r0,'JWT 过期 → 自动续期'); ck(await p.locator('#lbtn').count()===0,'没有被登出'); ck(await p.locator('#connBar').count()===0,'续期成功 → 没有红条'); await ctx.close(); }
{ const {ctx,p}=await open('?soon=1'); const r0=await g(p,'__refresh'); await adv(p,7000); ck(await g(p,'__refresh')>r0,'登录牌只剩 1 分钟 → 提前续期'); await ctx.close(); }
// 6) 不是按登出键的登出 → 大声提醒；自己按登出 → 不吵
{ const {ctx,p}=await open(''); await p.click('body'); console.log('--- 登录失效 / 手动登出'); const r0=await g(p,'__rings');
  await p.evaluate(()=>window.__cb("SIGNED_OUT")); await adv(p,500);
  ck(await p.locator('#lbtn').isVisible()&&/登录失效了/.test(await p.locator('#lerr').innerText()),'登录被服务器取消 → 登录页 + 红字「登录失效了（不是你按的登出）」'); ck(await g(p,'__rings')>r0,'并且响铃');
  const r1=await g(p,'__rings'); await adv(p,21000); ck(await g(p,'__rings')>r1,'没重新登录 → 每 20 秒继续响'); await ctx.close(); }
{ const {ctx,p}=await open(''); await p.click('body'); const r0=await g(p,'__rings'); await p.click('#logoutBtn'); await adv(p,25000);
  ck(await p.locator('#lbtn').isVisible(),'按「登出」→ 回登录页'); ck(!/登录失效/.test(await p.locator('#lerr').innerText()),'手动登出 → 没有「登录失效」警告'); ck(await g(p,'__rings')===r0,'手动登出 → 不响'); await ctx.close(); }
await b.close(); console.log(bad?`\n❌ ${bad} 项失败`:"\n全部通过"); process.exit(bad?1:0);})();
