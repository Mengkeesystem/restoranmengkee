// 操作记录页（后台，模拟 Supabase）。用法：先在仓库根目录 `python3 -m http.server 8765 &`，再 `node tests/ui/audit-log.js`
const {chromium}=require('playwright');
const MOCK=`(()=>{
window.__calls=[]; const NOW=new Date().toISOString(); let n=0;
const base=[
 {id:30,at:NOW,actor:"boss@x.com",action:"menu_off",target:"A002",outlet:10,detail:"关掉（售完）"},
 {id:29,at:NOW,actor:"boss@x.com",action:"menu_off",target:"A002",outlet:9,detail:"关掉（售完）"},
 {id:28,at:NOW,actor:"boss@x.com",action:"menu_off",target:"A002",outlet:0,detail:"关掉（售完）"},
 {id:27,at:NOW,actor:"<img src=x onerror=alert(1)>",action:"order_reject",target:"MK1123-0002",outlet:0,detail:"<script>alert(2)</script> RM 60.00"},
 {id:26,at:NOW,actor:"=cmd|' /C calc'!A0",action:"refund_manual",target:"MK1123-0001",outlet:0,detail:"RM 20.00"},
 {id:25,at:NOW,actor:"HitPay",action:"order_paid",target:"MK1123-0001",outlet:0,detail:"RM 50.00 · duitnow · pickup"}];
const MODE=location.hash.includes("mgr")?"manager":location.hash.includes("old")?"old":"admin";
function Q(t){ const q={select:()=>q,gte:()=>q,lt:()=>q,order:()=>q,limit:()=>q,range:()=>q,in:()=>q,eq:()=>q,update:()=>q,insert:()=>q,then:(a,b)=>Promise.resolve({data:[],error:null}).then(a,b)}; return q; }
window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{user:{email:"boss@x.com"}}}}),onAuthStateChange(){},signOut:async()=>{}},
 rpc:async(name,args)=>{ __calls.push([name,args]);
   if(name==="is_web_staff") return {data:true};
   if(name==="web_staff_me") return {data:MODE==="manager"?{role:"manager",outlets:[0],email:"mgr@x.com"}:{role:"admin",outlets:[],email:"boss@x.com"}};
   if(name==="web_audit_login") return {data:null};
   if(name==="web_audit_list"){ if(MODE==="old") return {error:{message:"Could not find the function public.web_audit_list(...) in the schema cache"}};
     if(args&&args.p_before){ return {data:[{id:5,at:NOW,actor:"mgr@x.com",action:"login",target:"mgr@x.com",outlet:null,detail:"登录后台"}]}; }
     if(args&&args.p_action==="refund") return {data:base.filter(r=>r.action.startsWith("refund"))};
     const many=[...base]; for(let i=0;i<194;i++) many.push({id:100-i-31+30,at:NOW,actor:"mgr@x.com",action:"order_complete",target:"MK9-"+i,outlet:0,detail:"x"}); return {data:many.slice(0,200)}; }
   return {data:null}; },
 functions:{invoke:async(n,o)=>({data:{configured:false}})}, storage:{from:()=>({})}, from:(t)=>Q(t)})};
})();`;
(async()=>{const b=await chromium.launch(); let bad=0; const ck=(c,m)=>{ console.log((c?"✅ ":"❌ ")+m); if(!c) bad++; };
for(const [mode,w] of [["admin",1280],["admin",393],["mgr",393],["old",1280]]){
  const ctx=await b.newContext({viewport:{width:w,height:900},timezoneId:"Asia/Kuala_Lumpur",acceptDownloads:true}); const p=await ctx.newPage(); const errs=[], dlg=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>{ dlg.push(d.message()); d.accept(); });
  await p.route('**/supabase.js',r=>r.fulfill({contentType:'application/javascript',body:MOCK}));
  await p.route('**/admin.html',async r=>{const res=await r.fetch();let t=await res.text();t=t.replace(/ integrity="[^"]*"/,'');r.fulfill({response:res,body:t});});
  await p.goto('http://localhost:8765/admin.html#'+mode); await p.waitForTimeout(1500);
  console.log('---',mode,w);
  const calls=()=>p.evaluate(()=>window.__calls);
  if(mode==="mgr"){ ck(await p.locator('#auditBtn').isHidden(),'分店经理看不到「🧾 操作记录」按钮'); await p.goto('http://localhost:8765/admin.html#audit'); await p.waitForTimeout(1200); ck(await p.locator('#auditView').isHidden(),'经理手动打开 #audit 也进不去'); ck(errs.length===0,'没有 JS 错误 '+errs.join('|')); await ctx.close(); continue; }
  ck((await calls()).some(c=>c[0]==="web_audit_login"),'登录后记一笔「登录」');
  ck(await p.locator('#auditBtn').isVisible(),'管理员看得到「🧾 操作记录」');
  await p.click('#auditBtn'); await p.waitForTimeout(800);
  if(mode==="old"){ ck(/还没跑 audit-log\.sql/.test(await p.locator('#auditView').innerText()),'没跑 SQL → 提示请老板去跑 audit-log.sql'); ck(errs.length===0,'没有 JS 错误 '+errs.join('|')); await ctx.close(); continue; }
  const txt=await p.locator('#auditView').innerText();
  ck(await p.locator('#auditView table.tbl tr').count()>150,'列出记录（多行）');
  ck(/全部分店|OKR/.test(txt)&&/A002/.test(txt),'菜单开关：显示菜编号');
  const menuRows=await p.locator('#auditView tr',{hasText:'A002'}).count(); ck(menuRows===1,'同一时间关 3 间同一道菜 → 合成 1 行（实际 '+menuRows+'）');
  ck(await p.locator('#auditView img[src="x"]').count()===0&&!dlg.some(d=>/alert/.test(d))&&!/<script>/.test(await p.locator('#auditView').innerHTML()),'名字/说明里的 <img>/<script> 被转义，不会执行');
  ck(/💰 付款成功/.test(txt)&&/订单取消\/拒绝/.test(txt)&&/💸 登记手动退款/.test(txt),'动作显示成中文说明');
  await p.selectOption('#audC','refund'); await p.waitForTimeout(500);
  const last=(await calls()).filter(c=>c[0]==="web_audit_list").pop();
  ck(last&&last[1].p_action==="refund"&&last[1].p_before===null,'选「退款」→ 向数据库要退款类（'+JSON.stringify(last&&last[1])+'）');
  ck(await p.locator('#auditView table.tbl tr').count()===2,'只剩退款记录');
  await p.selectOption('#audC',''); await p.waitForTimeout(500);
  ck(await p.locator('#audMore').count()===1,'满 200 笔 → 出现「载入更早的记录」');
  await p.click('#audMore'); await p.waitForTimeout(500);
  const l2=(await calls()).filter(c=>c[0]==="web_audit_list").pop();
  ck(l2[1].p_before===101||Number.isFinite(l2[1].p_before),'载入更早 → 带 p_before');
  ck(/🔑 登录后台/.test(await p.locator('#auditView').innerText()),'更早的记录接在后面');
  await p.fill('#audQ','MK1123-0002'); await p.press('#audQ','Enter'); await p.waitForTimeout(500);
  const l3=(await calls()).filter(c=>c[0]==="web_audit_list").pop(); ck(l3[1].p_q==="MK1123-0002",'搜参考号 → 带 p_q');
  const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#audCsv')]);
  const csv=require('fs').readFileSync(await dl.path(),'utf8');
  ck(/^MengKee-audit-\d{4}-\d\d-\d\d\.csv$/.test(dl.suggestedFilename())&&csv.charCodeAt(0)===0xFEFF&&csv.slice(1,5)==='"日期"','CSV 档名和表头对（'+dl.suggestedFilename()+'）');
  ck(/"'=cmd/.test(csv),'CSV 防 Excel 公式注入（= 开头加了引号）');
  const ov=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2); ck(!ov||w>=1000,'没有横向溢出（表格自己可左右滑）');
  await p.screenshot({path:`/tmp/audit-${mode}-${w}.png`});
  ck(errs.length===0,'没有 JS 错误 '+errs.join('|'));
  await ctx.close(); }
await b.close(); console.log(bad?`\n❌ ${bad} 项失败`:"\n全部通过"); process.exit(bad?1:0);})();
