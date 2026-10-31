// 待付款订单 UI：关掉网页后回来 → 购物车有「待付款」卡片 → 继续付款（选付款方式）/ 取消订单。用法见 tests/README.md
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for(const [w,h,n] of [[393,852,'m'],[1280,800,'d']]){
const ctx=await b.newContext({viewport:{width:w,height:h},timezoneId:"Asia/Kuala_Lumpur"});const p=await ctx.newPage();p.setDefaultTimeout(6000);
const errs=[];p.on('pageerror',e=>errs.push(e.message));
let calls=[],trackStatus='pending';
p.on('dialog',d=>d.accept());
await p.route(/supabase\.co/,r=>r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}));
/* Playwright 后注册的路由先匹配，所以通用的放最前面 */
await p.route(/supabase\.co\/rest\/v1\/rpc\/web_order_track/,r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:trackStatus,type:'pickup',done:false})}));
await p.route(/supabase\.co\/functions\/v1\/web-hitpay/,async r=>{const m=r.request().method();const h={'access-control-allow-origin':'*','access-control-allow-headers':'*'};if(m==='OPTIONS')return r.fulfill({status:200,headers:h});const b=JSON.parse(r.request().postData()||'{}');calls.push(b);
  if(b.action==='pay')return r.fulfill({status:200,headers:h,contentType:'application/json',body:JSON.stringify({ok:true,url:'https://securecheckout.hit-pay.com/payment-request/@mk/new-'+(b.pm||'x')+'/checkout',amount:40.28})});
  if(b.action==='cancel')return r.fulfill({status:200,headers:h,contentType:'application/json',body:JSON.stringify({ok:true})});
  return r.fulfill({status:200,headers:h,contentType:'application/json',body:JSON.stringify({status:'pending'})});});
await p.route(/securecheckout\.hit-pay\.com/,r=>r.fulfill({contentType:'text/html',body:'<h1>HitPay mock</h1>'}));
await p.route(/googleapis|gstatic|fonts\./,r=>r.abort());
await p.addInitScript(()=>{ if(!localStorage.getItem('seeded')){ localStorage.setItem('seeded','1'); localStorage.setItem('site_last_order',JSON.stringify({ref:'MK1031-2001',token:'11111111-2222-3333-4444-555555555555',amount:40.28,type:'pickup',oi:0,t0:Date.now()-5*60000,st:'pending',hp:true,payUrl:'https://securecheckout.hit-pay.com/payment-request/@mk/old/checkout'})); } });
await p.goto('http://localhost:8765/');await p.waitForTimeout(1500);
const fab=await p.locator('#fab').innerText().catch(()=>'');console.log(n,'fab:',fab.replace(/\s+/g,' '));
await p.locator('#cartBtn').click();await p.waitForTimeout(700);
console.log(n,'card:',(await p.locator('.pendcard').innerText()).replace(/\s+/g,' '));
await p.screenshot({path:`/tmp/pend-${n}-1.png`});
// 继续付款 → 选 FPX
await p.locator('.pendcard .btn').first().click();await p.waitForTimeout(500);
await p.screenshot({path:`/tmp/pend-${n}-2.png`});
await p.locator('#paystep .pm').nth(2).click();await p.waitForTimeout(900);
console.log(n,'repay call:',JSON.stringify(calls.filter(c=>c.action==='pay')[0]),'→ url',p.url().slice(0,70));
// 回来再取消
await p.goto('http://localhost:8765/');await p.waitForTimeout(1200);
await p.locator('#cartBtn').click();await p.waitForTimeout(600);
await p.locator('.pendcard .btn.alt').click();await p.waitForTimeout(900);
console.log(n,'after cancel: pendcard',await p.locator('.pendcard').count(),'cancel call',JSON.stringify(calls.filter(c=>c.action==='cancel')[0]),'fab',await p.locator('#fab.show').count());
await p.screenshot({path:`/tmp/pend-${n}-3.png`});
console.log(n,errs);await ctx.close();}
await b.close();})();
