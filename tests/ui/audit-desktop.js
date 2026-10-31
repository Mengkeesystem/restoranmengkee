const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [w,h] of [[1280,800],[1440,900],[1920,1080],[1024,768]]){
const ctx=await b.newContext({viewport:{width:w,height:h},timezoneId:"Asia/Kuala_Lumpur"});const p=await ctx.newPage();p.setDefaultTimeout(5000);
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date("2026-10-30T13:00:00+08:00")});
await p.route(/supabase\.co/,r=>r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}));await p.route(/googleapis|gstatic|fonts\./,r=>r.abort());
await p.goto('http://localhost:8765/');await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const W=innerWidth;const over=[];document.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.right>W+1&&getComputedStyle(e).position!=='fixed'){let a=e,hid=false;while(a&&a!==document.body){if(a!==e&&/(hidden|clip|auto|scroll)/.test(getComputedStyle(a).overflowX)){hid=true;break}a=a.parentElement}if(!hid)over.push(e.tagName+'.'+String(e.className).slice(0,25)+' r='+Math.round(r.right))}});
const imgs=[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&i.src).map(i=>i.src.slice(-40));
return {sw:document.documentElement.scrollWidth,W,over:over.slice(0,6),broken:imgs}});
console.log(w,JSON.stringify(r),errs);
if(w===1280){
 await p.screenshot({path:'/tmp/d-top.png'});
 for(const id of ['about','promos','menu','booking','outlets','contact']){await p.evaluate(i=>document.getElementById(i).scrollIntoView(),id);await p.waitForTimeout(1800);await p.screenshot({path:`/tmp/d-${id}.png`})}
 // menu category open + cart
 await p.evaluate(()=>document.getElementById('menu').scrollIntoView());await p.waitForTimeout(500);
 await p.locator('.cats button').nth(1).click();await p.waitForTimeout(900);await p.screenshot({path:'/tmp/d-cat.png'});
 await p.locator('.fcard').nth(0).locator('.fadd').click();await p.waitForTimeout(400);
 if(await p.locator('#opick.show').count()){await p.locator('#opick .opbtn').first().click();await p.waitForTimeout(400)}
 await p.screenshot({path:'/tmp/d-cust.png'});
 await p.locator('#cust .btn.wa').click();await p.waitForTimeout(400);
 await p.locator('header .cartbtn').click();await p.waitForTimeout(700);await p.screenshot({path:'/tmp/d-cart.png'});
 await p.evaluate(()=>window.__site.otype('delivery'));await p.waitForTimeout(900);await p.screenshot({path:'/tmp/d-cartdel.png'});
 await p.locator('#od_agree').check();await p.locator('#od_send').click();await p.waitForTimeout(800);await p.screenshot({path:'/tmp/d-after.png'});
 console.log(errs);
}
await ctx.close()}
await b.close()})()
