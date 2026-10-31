// 菜单开关 86：客人网页（售完显示幽默字句、回来啦标签、不能点 +）+ 后台「🍽️ 菜单开关」页（模拟 Supabase）。用法见 tests/README.md
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
// ---------- 客人端 ----------
{ const ctx=await b.newContext({viewport:{width:393,height:852},timezoneId:"Asia/Kuala_Lumpur"});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/supabase\.co/,r=>r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}));
  await p.route(/supabase\.co\/rest\/v1\/rpc\/web_menu_86_public/,r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{oi:0,item:"A001",off:true,at:new Date().toISOString()},{oi:0,item:"A021",off:false,at:new Date(Date.now()-3600e3).toISOString()},{oi:1,item:"A001",off:false,at:new Date(Date.now()-30*3600e3).toISOString()}])}));
  await p.route(/googleapis|gstatic|fonts\./,r=>r.abort());
  await p.addInitScript(()=>{localStorage.setItem('site_outlet','0');});
  await p.goto('http://localhost:8765/');await p.waitForTimeout(1800);
  const so=await p.locator('.fcard .so').first().innerText().catch(()=>'(没有)');console.log('客人端 招牌推荐 A001 售完遮罩:',so.replace(/\s+/g,' '));
  console.log('  A001 卡片有「+」按钮?',await p.locator('.fcard').first().locator('.fadd').count());
  await p.evaluate(()=>document.getElementById('menu').scrollIntoView());await p.waitForTimeout(500);
  await p.locator('.cats button').nth(0).click();await p.waitForTimeout(900);
  console.log('  分类里 A001:',(await p.locator('.item:has(.code:text("A001")) .so').innerText().catch(()=>'(没有遮罩)')).replace(/\s+/g,' '),'| 有 + ?',await p.locator('.item:has(.code:text("A001")) .btn, .item:has(.code:text("A001")) .qty button').count());
  await p.screenshot({path:'/tmp/m86-cust-1.png'});
  await p.locator('.cats button').nth(3).click();await p.waitForTimeout(900);
  console.log('  回来啦标签数:',await p.locator('.backtag').count(),(await p.locator('.backtag').first().innerText().catch(()=>'')));
  await p.screenshot({path:'/tmp/m86-cust-2.png'});
  console.log('  errors',errs);await ctx.close(); }
// ---------- 后台 ----------
for(const [mode,w] of [["admin",1280],["manager",393]]){const ctx=await b.newContext({viewport:{width:w,height:900}});const p=await ctx.newPage();
const mock=`(()=>{const MODE=${JSON.stringify(mode)};window.__calls=[];let rows=[{oi:0,item:"A001",off:true,at:"2026-10-31T01:00:00Z",by:"x"}];
window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{user:{email:"boss@x"}}}}),onAuthStateChange(){},signOut:async()=>{}},
 rpc:async(n,a)=>{__calls.push([n,a]); if(n==="is_web_staff") return {data:true};
  if(n==="web_staff_me") return {data:MODE==="admin"?{role:"admin",outlets:[],email:"boss@x"}:{role:"manager",outlets:[2],email:"pj@x"}};
  if(n==="web_menu_86_staff") return {data:MODE==="admin"?rows:rows.filter(r=>r.oi===2)};
  if(n==="web_menu_86_set"){ if(a.p_oi===-1){ for(let i=0;i<11;i++){ rows=rows.filter(r=>!(r.oi===i&&r.item===a.p_item)).concat([{oi:i,item:a.p_item,off:a.p_off,at:"now"}]); } } else rows=rows.filter(r=>!(r.oi===a.p_oi&&r.item===a.p_item)).concat([{oi:a.p_oi,item:a.p_item,off:a.p_off,at:"now"}]); return {data:null}; }
  return {data:null}; }, functions:{invoke:async()=>({data:{configured:true}})},
 from:()=>{const q={select:()=>q,gte:()=>q,lt:()=>q,order:()=>q,limit:()=>q,range:()=>q,update:()=>q,eq:()=>q,then:(r)=>r({data:[],error:null})};return q;}})};})();`;
await p.route('**/supabase.js',r=>r.fulfill({contentType:'application/javascript',body:mock}));
await p.route('**/admin.html',async r=>{const res=await r.fetch();let t=await res.text();t=t.replace(/ integrity="[^"]*"/,'');r.fulfill({response:res,body:t});});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto('http://localhost:8765/admin.html');await p.waitForTimeout(1200);
console.log('后台',mode,'菜单开关按钮可见:',await p.isVisible('#m86Btn'));
await p.click('#m86Btn');await p.waitForTimeout(600);
console.log('  分店选项:',(await p.$$eval('#m86o option',os=>os.map(o=>o.textContent))).join(' / '));
console.log('  A001 状态:',(await p.locator('.m86i:has-text("A001")').first().innerText()).replace(/\s+/g,' '));
await p.screenshot({path:`/tmp/m86-adm-${mode}-1.png`});
if(mode==="manager"){ const btn=p.locator('.m86i:has-text("A002") button').first(); await btn.click();await p.waitForTimeout(400); }
else { await p.selectOption('#m86o','0'); await p.waitForTimeout(300); await p.locator('.m86i:has-text("A002") button').first().click();await p.waitForTimeout(400); }
console.log('  设定调用:',JSON.stringify(await p.evaluate(()=>__calls.filter(c=>c[0]==="web_menu_86_set").map(c=>c[1]))));
await p.fill('#m86q','A002');await p.waitForTimeout(300);
console.log('  搜 A002 后:',(await p.locator('.m86i').allInnerTexts()).map(s=>s.replace(/\s+/g,' ')).join(' | '));
await p.screenshot({path:`/tmp/m86-adm-${mode}-2.png`});
console.log('  errors',errs);await ctx.close();}
await b.close();})();
