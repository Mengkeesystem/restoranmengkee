// 后台：骑手接单后显示「接单 N 分钟前」+「预计几点到店（还有几分钟）」（2026-11-23，模拟 Supabase）。用法：先 `python3 -m http.server 8765 &`，再 `node tests/ui/rider-eta.js`
const {chromium}=require('playwright');
const MOCK=`(()=>{
const NOW=Date.now(), iso=m=>new Date(NOW+m*60000).toISOString();
const base={customer_name:"阿花",customer_phone:"0129999999",amount:55.1,message:"x\\n运费: RM 8.00\\n合计: RM 55.10",status:"paid",created_at:iso(-12),confirmed_at:iso(-12),confirmed_by:"HitPay",outlet:"OKR",outlet_idx:0,order_type:"delivery",pay_provider:"hitpay",pay_method:"duitnow",dest:{lat:3.1,lng:101.6,address:"x"},courier_order_id:"D1"};
const orders=[
 {...base,id:1,ref:"MK-ETA-OK",courier_status:200,courier_rider:{name:"阿旺",phone:"0123456789",accepted_at:iso(-3),eta_at:iso(6)}},
 {...base,id:2,ref:"MK-ETA-LATE",courier_status:400,courier_rider:{name:"阿旺",accepted_at:iso(-9),eta_at:iso(-2)}},
 {...base,id:3,ref:"MK-NOETA",courier_status:200,courier_rider:{name:"阿旺",accepted_at:iso(-5)}},
 {...base,id:4,ref:"MK-PICKED",courier_status:500,courier_rider:{name:"阿旺",accepted_at:iso(-9),eta_at:iso(-5)}},
 {...base,id:5,ref:"MK-XSS",courier_status:200,courier_rider:{accepted_at:"<img src=x onerror=alert(1)>",eta_at:"<script>alert(2)</script>"}}];
function Q(t){ const q={select:()=>q,gte:()=>q,lt:()=>q,order:()=>q,limit:()=>q,range:()=>q,in:()=>q,eq:()=>q,update:()=>q,insert:()=>q,then:(a,b)=>Promise.resolve(t==="web_orders"?{data:orders,error:null}:{data:[],error:null}).then(a,b)}; return q; }
window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{user:{email:"boss@x.com"}}}}),onAuthStateChange(){},signOut:async()=>{}},
 rpc:async(n)=>{ if(n==="is_web_staff") return {data:true}; if(n==="web_staff_me") return {data:{role:"admin",outlets:[],email:"boss@x.com"}}; return {data:null}; },
 functions:{invoke:async()=>({data:{configured:true,company:"trydx"}})}, storage:{from:()=>({createSignedUrls:async()=>({data:[]})})}, from:(t)=>Q(t)})};
})();`;
(async()=>{const b=await chromium.launch(); let bad=0; const ck=(c,m)=>{ console.log((c?"✅ ":"❌ ")+m); if(!c) bad++; };
for(const w of [1280,393]){
  const ctx=await b.newContext({viewport:{width:w,height:1000},timezoneId:"Asia/Kuala_Lumpur"}); const p=await ctx.newPage(); const errs=[],dlg=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>{dlg.push(d.message());d.accept();});
  await p.route('**/supabase.js',r=>r.fulfill({contentType:'application/javascript',body:MOCK}));
  await p.route('**/admin.html',async r=>{const res=await r.fetch();let t=await res.text();t=t.replace(/ integrity="[^"]*"/,'');r.fulfill({response:res,body:t});});
  await p.goto('http://localhost:8765/admin.html'); await p.waitForTimeout(1800);
  await p.click('#tabs button[data-k=paid]'); await p.waitForTimeout(400);
  console.log('---',w);
  const eta=ref=>p.locator('.ord',{hasText:ref}).locator('.rETA');
  const t1=await eta('MK-ETA-OK').innerText().catch(()=>"");
  ck(/接单 3 分钟前/.test(t1)&&/预计 \d\d:\d\d 到店（约还有 [56] 分钟）/.test(t1),'有预计到店：「接单 3 分钟前 · 预计 HH:MM 到店（约还有 6 分钟）」 → '+t1.replace(/\n/g,' '));
  const t2=await eta('MK-ETA-LATE').innerText().catch(()=>"");
  ck(/接单 9 分钟前/.test(t2)&&/骑手应该快到了/.test(t2),'预计时间已过 → 「骑手应该快到了」 → '+t2.replace(/\n/g,' '));
  const t3=await eta('MK-NOETA').innerText().catch(()=>"");
  ck(/接单 5 分钟前/.test(t3)&&!/预计/.test(t3),'Delyva 没给预计时间 → 只显示「接单 5 分钟前」 → '+t3.replace(/\n/g,' '));
  ck(await eta('MK-PICKED').count()===0,'骑手已取餐(500) → 不再显示');
  ck(await p.locator('.ord',{hasText:'MK-XSS'}).locator('img[src="x"]').count()===0&&!dlg.length,'乱写的时间 → 不执行、不显示');
  ck(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'没有横向溢出');
  await p.screenshot({path:`/tmp/rider-eta-${w}.png`}); ck(errs.length===0,'没有 JS 错误 '+errs.join('|')); await ctx.close(); }
await b.close(); console.log(bad?`\n❌ ${bad} 项失败`:"\n全部通过"); process.exit(bad?1:0);})();
