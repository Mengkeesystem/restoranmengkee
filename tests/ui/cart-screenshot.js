const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const tag=process.argv[2]||'a';
for(const [w,h,n] of [[393,852,'m'],[1280,900,'d']]){
const ctx=await b.newContext({viewport:{width:w,height:h},timezoneId:"Asia/Kuala_Lumpur"});const p=await ctx.newPage();p.setDefaultTimeout(6000);const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date("2026-10-30T13:00:00+08:00")});
await p.route(/supabase\.co/,r=>r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}));
await p.route(/googleapis|gstatic|fonts\./,r=>r.abort());
await p.goto('http://localhost:8765/');await p.waitForTimeout(800);
for(const i of [0,1]){ await p.locator('.fcard').nth(i).locator('.fadd').click(); await p.waitForTimeout(300);
 if(await p.locator('#opick.show').count()){ await p.locator('#opick .opbtn').first().click(); await p.waitForTimeout(300);}
 if(i===0) await p.locator('#cust .cchips button').first().click().catch(()=>{});
 await p.locator('#cust .btn.wa').click(); await p.waitForTimeout(300);}
await p.locator('header .cartbtn').click(); await p.waitForTimeout(400); await p.evaluate(()=>window.__site.otype('pickup')); await p.waitForTimeout(400);
if(await p.locator('#opick.show').count()){ await p.locator('#opick .opbtn').first().click(); await p.waitForTimeout(300);}
await p.waitForTimeout(500);
const full=await p.evaluate(()=>{const d=document.getElementById('drawer');return d.scrollHeight;});
await p.setViewportSize({width:w,height:Math.min(full+120,4000)}); await p.waitForTimeout(400);
await p.locator('#drawer').screenshot({path:`cart-${tag}-${n}.png`});
console.log(n,errs);await ctx.close();}
await b.close();})();
