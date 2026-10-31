const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const w of [360,393,430]){
const ctx=await b.newContext({viewport:{width:w,height:852},hasTouch:true,isMobile:true,timezoneId:"Asia/Kuala_Lumpur"});const p=await ctx.newPage();
const errs=[],cons=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')cons.push(m.text().slice(0,120))});
await p.route(/supabase\.co/,r=>r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}));await p.route(/googleapis|gstatic|fonts\./,r=>r.abort());
await p.goto('http://localhost:8765/');await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const W=innerWidth;const over=[];document.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.right>W+1&&getComputedStyle(e).position!=='fixed'){let a=e,hid=false;while(a&&a!==document.body){const o=getComputedStyle(a);if(a!==e&&(/(hidden|clip|auto|scroll)/.test(o.overflowX))){hid=true;break}a=a.parentElement}if(!hid)over.push(e.tagName+'.'+(e.className||'').toString().slice(0,30)+' r='+Math.round(r.right))}});
const small=[];document.querySelectorAll('button,a.btn,select,input:not([type=hidden]):not([type=checkbox]),.cats button').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.height&&(r.height<34||r.width<34)&&getComputedStyle(e).visibility!=='hidden'&&e.offsetParent)small.push((e.id||e.className||e.tagName).toString().slice(0,30)+' '+Math.round(r.width)+'x'+Math.round(r.height))});
return {sw:document.documentElement.scrollWidth,W,over:over.slice(0,8),small:small.slice(0,12)}});
console.log(w,JSON.stringify(r),errs,cons);
if(w===393){await p.screenshot({path:'/tmp/a-top.png'});
 for(const id of ['about','promos','menu','booking','outlets','contact']){await p.evaluate(i=>document.getElementById(i).scrollIntoView(),id);await p.waitForTimeout(1800);await p.screenshot({path:`/tmp/a-${id}.png`})}}
await ctx.close()}
await b.close()})()
