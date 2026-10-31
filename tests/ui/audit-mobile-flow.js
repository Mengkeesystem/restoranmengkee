const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:360,height:740},hasTouch:true,isMobile:true,timezoneId:"Asia/Kuala_Lumpur"});const p=await ctx.newPage();p.setDefaultTimeout(5000);
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date("2026-10-30T13:00:00+08:00")});
await p.route(/supabase\.co/,r=>r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}));await p.route(/googleapis|gstatic|fonts\./,r=>r.abort());
await p.goto('http://localhost:8765/');await p.waitForTimeout(1200);
const ov=async(l,sel)=>{const r=await p.evaluate(s=>{const root=document.querySelector(s);if(!root)return 'missing';const W=innerWidth;const bad=[];root.querySelectorAll('*').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&(r.right>W+1||r.left<-1)&&getComputedStyle(e).position!=='fixed'){let a=e,hid=false;while(a&&a!==root){if(/(hidden|clip|auto|scroll)/.test(getComputedStyle(a).overflowX)){hid=true;break}a=a.parentElement}if(!hid)bad.push(e.tagName+'.'+String(e.className).slice(0,25)+' '+Math.round(r.left)+'-'+Math.round(r.right))}});return bad.slice(0,6)},sel);console.log(l,JSON.stringify(r))};
// side menu
await p.locator('#menuBtn, header .menubtn, header button[aria-label*=enu]').first().click().catch(async()=>{await p.locator('header button').nth(0).click()});await p.waitForTimeout(500);await p.screenshot({path:'/tmp/b-menu.png'});await ov('menu','header');
await p.keyboard.press('Escape');await p.evaluate(()=>{document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'))});
// add item
await p.evaluate(()=>document.getElementById('menu').scrollIntoView());await p.waitForTimeout(600);
await p.locator('.fcard').nth(0).locator('.fadd').click();await p.waitForTimeout(500);await p.screenshot({path:'/tmp/b-pick.png'});
if(await p.locator('#opick.show').count()){await p.locator('#opick .opbtn').first().click();await p.waitForTimeout(500)}
await p.screenshot({path:'/tmp/b-cust.png'});await ov('cust','#cust');
await p.locator('#cust .btn.wa').click();await p.waitForTimeout(400);
await p.locator('header .cartbtn').click();await p.waitForTimeout(600);await ov('drawer','#drawer');
await p.locator('#drawer').evaluate(d=>d.scrollTop=d.scrollHeight);await p.waitForTimeout(300);await p.screenshot({path:'/tmp/b-cartbot.png'});
await p.evaluate(()=>window.__site.otype('delivery'));await p.waitForTimeout(900);await ov('drawer-del','#drawer');await p.screenshot({path:'/tmp/b-del.png'});
// my orders
await p.locator('#drawer button:has-text("我的订单")').first().click().catch(()=>{});await p.waitForTimeout(600);await p.screenshot({path:'/tmp/b-myo.png'});await ov('myord','#myord');
console.log(errs);await b.close()})()
