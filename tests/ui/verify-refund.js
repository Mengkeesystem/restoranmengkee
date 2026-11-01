// 出餐拍照 + 退款（后台，模拟 Supabase）。用法：先在仓库根目录 `python3 -m http.server 8765 &`，再 `node tests/ui/verify-refund.js`（要在同一条命令里启动 server）
const {chromium}=require('playwright');
const MOCK=`(()=>{
const NOW=new Date().toISOString(); window.__log=[];
const orders=[
 {id:11,ref:"MK1101-1111",outlet:"OKR",order_type:"pickup",customer_name:"阿明",customer_phone:"0123456789",amount:40.3,message:"【网上点餐 - 自取】\\n• A001 招牌蒸松鱼头 x1 = RM 35.00\\n凑整: +RM 0.02\\n合计: RM 40.30",status:"paid",created_at:NOW,confirmed_at:NOW,confirmed_by:"HitPay",outlet_idx:0,pay_provider:"hitpay",pay_method:"duitnow",pay_fees:0.48,paid_amount:40.3},
 {id:12,ref:"MK1101-2222",outlet:"OKR",order_type:"delivery",customer_name:"阿花",customer_phone:"0129999999",amount:55.1,message:"x\\n运费: RM 8.00\\n合计: RM 55.10",status:"paid",created_at:NOW,confirmed_at:NOW,confirmed_by:"HitPay",outlet_idx:0,courier_status:500,courier_order_id:"D1",dest:{lat:3.1,lng:101.6,address:"x"},pay_provider:"hitpay",pay_method:"card",pay_fees:1.2},
 {id:13,ref:"MK1101-3333",outlet:"OKR",order_type:"pickup",customer_name:"阿强",customer_phone:"0121111111",amount:20,message:"x",status:"paid",created_at:NOW,confirmed_at:NOW,confirmed_by:"HitPay",outlet_idx:0,pay_provider:"hitpay"}];
const proofs=[{id:1,order_id:13,path:"13/a.jpg",created_at:NOW,created_by:"staff@x"}], refunds=[{id:1,order_id:13,amount:5,reason:"漏单 / 少餐",mode:"hitpay",status:"done",created_at:NOW,created_by:"boss@x"}];
const TINY="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const MODE=location.hash.includes("mgr")?"manager":"admin";
function Q(t){ const st={t,op:"select"}; const q={select:()=>q,gte:()=>q,lt:()=>q,order:()=>q,limit:()=>q,range:()=>q,in:()=>q,eq:()=>q,
  update:(v)=>{st.op="update";st.v=v;return q;}, insert:(v)=>{st.op="insert";st.v=v;return q;},
  then:(res,rej)=>Promise.resolve(run(st)).then(res,rej)}; return q; }
function run(st){ __log.push([st.t,st.op]);
  if(st.t==="web_orders"){ if(st.op==="update"){ if(st.v.completed_at&&!proofs.some(p=>p.order_id===window.__doneId)) return {error:{message:"need_proof: 请先拍照"}}; return {error:null}; } return {data:orders,error:null}; }
  if(st.t==="web_order_proofs"){ if(st.op==="insert"){ proofs.push({id:9,created_at:new Date().toISOString(),created_by:"boss@x",...st.v}); return {error:null}; } return {data:proofs,error:null}; }
  if(st.t==="web_refunds") return {data:refunds,error:null};
  return {data:[],error:null}; }
window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{user:{email:"boss@x"}}}}),onAuthStateChange(){},signOut:async()=>{}},
 rpc:async(n)=>{ if(n==="is_web_staff") return {data:true}; if(n==="web_staff_me") return {data:MODE==="admin"?{role:"admin",outlets:[],email:"boss@x"}:{role:"manager",outlets:[0],email:"pj@x"}}; return {data:null}; },
 functions:{invoke:async(n,o)=>{ __log.push(["fn",n,o&&o.body]); if(n==="web-delyva") return {data:{configured:false}};
   if(o.body.action==="refund"){ if(o.body.amount===13.13) return {error:{message:"x",context:{json:async()=>({error:"HitPay 没有接受这笔退款：cannot be refunded"})}}}; refunds.push({id:5,order_id:o.body.id,amount:o.body.amount,reason:o.body.reason,mode:o.body.mode,status:o.body.mode==="manual"?"manual":"done",created_at:new Date().toISOString(),created_by:"boss@x"}); return {data:{ok:true,status:"done",hitpay:"succeeded"}}; } return {data:{}}; }},
 storage:{from:()=>({upload:async(p,b)=>{ __log.push(["upload",p,b.size,b.type]); return {error:null}; }, createSignedUrls:async(ps)=>({data:ps.map(p=>({path:p,signedUrl:TINY}))}) })},
 from:(t)=>Q(t)})};
})();`;
(async()=>{const b=await chromium.launch(); let bad=0; const ck=(c,m)=>{ console.log((c?"✅ ":"❌ ")+m); if(!c) bad++; };
for(const [mode,w] of [["admin",1280],["mgr",393]]){
  const ctx=await b.newContext({viewport:{width:w,height:1000},timezoneId:"Asia/Kuala_Lumpur"}); const p=await ctx.newPage(); const errs=[], dlg=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>{ dlg.push(d.message()); d.accept(); });
  await p.route('**/supabase.js',r=>r.fulfill({contentType:'application/javascript',body:MOCK}));
  await p.route('**/admin.html',async r=>{const res=await r.fetch();let t=await res.text();t=t.replace(/ integrity="[^"]*"/,'');r.fulfill({response:res,body:t});});
  await p.goto('http://localhost:8765/admin.html#'+mode); await p.waitForTimeout(1500);
  await p.click('#tabs button[data-k=paid]'); await p.waitForTimeout(300);
  console.log('---',mode,w);
  const card=(ref)=>p.locator('.ord',{hasText:ref});
  ck(await card('MK1101-1111').locator('.proof.need').count()===1,'没拍照的单 → 红框「📸 出餐拍照（必须）」');
  ck(await card('MK1101-2222').locator('.proof.need .err').count()===1,'外送单骑手已取餐但没照片 → 红字警告');
  ck(await card('MK1101-3333').locator('.proof.ok .pth').count()===1,'有照片的单 → 绿框 + 缩图');
  ck(/已退款 RM 5\.00/.test(await card('MK1101-3333').innerText()),'已部分退款的单 → 标签「已退款 RM 5.00」+ 退款记录');
  ck((await card('MK1101-1111').locator('button[data-refund]').count())===(mode==="admin"?1:0),'退款按钮：管理员有、分店经理没有');
  // 没拍照按完成 → 挡下
  await card('MK1101-1111').locator('button[data-done]').click(); await p.waitForTimeout(300);
  ck(dlg.some(x=>/先拍照/.test(x)),'没拍照按「完成」→ 提示先拍照（没有送出更新）');
  ck(!(await p.evaluate(()=>__log.some(x=>x[0]==="web_orders"&&x[1]==="update"))),'  ……也没有送去数据库');
  // 拍照上传
  const png=await p.evaluate(()=>{const c=document.createElement("canvas");c.width=640;c.height=480;const x=c.getContext("2d");x.fillStyle="#c33";x.fillRect(0,0,640,480);return c.toDataURL("image/png").split(",")[1];});
  await p.evaluate(()=>{}); await card('MK1101-1111').locator('button[data-shot]').evaluate(el=>{ window.__noop=1; });
  await p.setInputFiles('#shotIn',{name:'a.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')}); await p.waitForTimeout(1500);
  // 上传是在选了档案（change 事件）才触发；需要先按过按钮设定 shotFor，所以补按一次再选
  let up=await p.evaluate(()=>__log.filter(x=>x[0]==="upload"));
  if(!up.length){ await card('MK1101-1111').locator('button[data-shot]').evaluate(el=>{ el.onclick&&0; }); }
  await p.evaluate(()=>{ document.querySelector('.ord button[data-shot="11"]').dispatchEvent(new MouseEvent('click',{bubbles:true})); });
  await p.waitForTimeout(100);
  await p.setInputFiles('#shotIn',{name:'a.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')}); await p.waitForTimeout(1800);
  up=await p.evaluate(()=>__log.filter(x=>x[0]==="upload"));
  ck(up.length===1&&/^11\/\d+_\w+\.jpg$/.test(up[0][1])&&up[0][3]==="image/jpeg"&&up[0][2]>500,'拍照上传 → Storage 路径「订单id/时间_随机.jpg」、JPEG、有内容（'+(up[0]?up[0][2]+' bytes':'没上传')+'）');
  ck(await p.evaluate(()=>__log.some(x=>x[0]==="web_order_proofs"&&x[1]==="insert")),'  ……并登记到 web_order_proofs');
  ck(await card('MK1101-1111').locator('.proof.ok').count()===1,'  ……上传后这张单变绿框「已拍照 1 张」');
  await p.screenshot({path:`/tmp/vr-${mode}-1.png`,fullPage:true});
  if(mode==="admin"){
    await card('MK1101-1111').locator('button[data-refund]').click(); await p.waitForTimeout(300);
    ck(await p.locator('#rf_amt').inputValue()==="40.30",'退款窗：预设金额 = 还能退的全额 40.30');
    await p.screenshot({path:`/tmp/vr-refund.png`});
    await p.fill('#rf_amt','13.13'); await p.click('#rf_go'); await p.waitForTimeout(500);
    ck(/cannot be refunded/.test(await p.textContent('#rf_err')),'HitPay 拒绝 → 退款窗里显示原因，窗口不关');
    await p.fill('#rf_amt','10.50'); await p.selectOption('#rf_rs','品质问题'); await p.fill('#rf_note','汤太咸'); await p.click('#rf_go'); await p.waitForTimeout(900);
    const fl=await p.evaluate(()=>__log.filter(x=>x[0]==="fn"&&x[2]&&x[2].action==="refund").pop());
    ck(fl&&fl[2].amount===10.5&&fl[2].mode==="hitpay"&&fl[2].id===11&&/品质问题：汤太咸/.test(fl[2].reason),'退款 RM10.50 → 送出正确的订单、金额、方式、原因');
    ck(/已退款 RM 10\.50/.test(await card('MK1101-1111').innerText()),'  ……刷新后订单出现「已退款 RM 10.50」');
    await card('MK1101-1111').locator('button[data-refund]').click(); await p.waitForTimeout(200);
    ck(/最多还能退 RM 29\.80/.test(await p.textContent('.ibox')),'再开退款窗：最多还能退 29.80');
    await p.click('#rf_x');
  }
  ck(errs.length===0,'没有 JS 错误 '+JSON.stringify(errs));
  await ctx.close();
}
await b.close(); console.log(bad?`\n${bad} 项失败`:'\n全部通过'); process.exit(bad?1:0); })();
