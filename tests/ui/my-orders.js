// 「我的订单」隐私（2026-11-02）：按电话查只显示状态；金额/明细/收据只在下单的那部手机。模拟 Supabase 回应。
// 用法：在同一条命令里 `python3 -m http.server 8765 --directory <仓库根目录> &` 再 `node tests/ui/my-orders.js`
const {chromium}=require('playwright');
(async()=>{ const b=await chromium.launch(); let bad=0; const ck=(c,m)=>{ console.log((c?"✅ ":"❌ ")+m); if(!c) bad++; };
const TOKEN="11111111-2222-4333-8444-555555555555";
for(const [w,lang] of [[393,"zh"],[1280,"zh"],[393,"en"]]){
  const ctx=await b.newContext({viewport:{width:w,height:900},timezoneId:"Asia/Kuala_Lumpur"}); const p=await ctx.newPage(); const errs=[], calls=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(([tok,lang])=>{ localStorage.setItem("site_lang",lang); localStorage.setItem("site_my_orders",JSON.stringify([{ref:"MK1102-0001",token:tok,t0:Date.now()-3600e3,type:"pickup",oi:0,amount:40.3}])); },[TOKEN,lang]);
  await p.route(/maps\.googleapis|gstatic|fonts\.g/,r=>r.abort());
  await p.route("**/rest/v1/rpc/**",async r=>{ const fn=r.request().url().split("/").pop(), a=JSON.parse(r.request().postData()||"{}"); calls.push([fn,a]);
    const J=x=>r.fulfill({status:200,contentType:"application/json",body:JSON.stringify(x),headers:{"access-control-allow-origin":"*"}});
    if(r.request().method()==="OPTIONS") return r.fulfill({status:200,headers:{"access-control-allow-origin":"*","access-control-allow-headers":"*"}});
    if(fn==="web_my_orders"){ const at=new Date().toISOString();   // 故意连金额/明细一起回（模拟还没跑新 SQL 的旧函数）：网页也不该把别人手机下的单的金额显示出来
      return J([{ref:"MK1102-0001",at,outlet:"OKR",type:"pickup",status:"paid",courier:null,done:false,amount:99,detail:"旧函数的明细"},{ref:"MK1102-0002",at,outlet:"Kajang",type:"delivery",status:"paid",courier:600,done:false,amount:88.8,detail:"【网上点餐】\n• A001 别人的菜 x1 = RM 88.80\n合计: RM 88.80"}]); }
    if(fn==="web_my_order_detail") return J(a.p_token===TOKEN&&a.p_ref==="MK1102-0001"?{amount:40.3,detail:"【网上点餐 - 自取】\n分店: OKR\n• A001 招牌蒸松鱼头 x1 = RM 38.00\n小计: RM 38.00\nSST 6%: RM 2.28\n合计: RM 40.30"}:null);
    return J({});
  });
  await p.goto("http://localhost:8765/index.html"); await p.waitForTimeout(1200);
  await p.evaluate(()=>{ localStorage.setItem("site_od_draft",JSON.stringify({phone:"0123456789"})); __site.myOpen(); }); await p.waitForTimeout(1200);
  console.log("---",w,lang);
  const mine=p.locator('.moitem',{hasText:'MK1102-0001'}), other=p.locator('.moitem',{hasText:'MK1102-0002'});
  ck(await mine.count()===1&&await other.count()===1,'两笔订单都列出来（状态）');
  ck(/40\.30/.test(await mine.innerText())&&!/99/.test(await mine.innerText()),'这部手机下的单 → 显示向服务器用 token 要来的金额 RM 40.30');
  ck(await mine.locator('details.modet').count()===1&&/招牌蒸松鱼头/.test(await mine.innerText().then(()=>mine.locator('details').innerHTML())),'  ……有可展开的订单明细');
  ck(await mine.locator('button[onclick*=myRcpt]').count()===1,'  ……有「下载收据」按钮');
  const o=await other.innerText();
  ck(!/88\.8|RM 88/.test(o),'别人手机下的单 → 不显示金额（就算服务器回传了）');
  ck(await other.locator('details').count()===0&&!/别人的菜/.test(await other.innerHTML()),'  ……不显示订单明细');
  ck(await other.locator('button[onclick*=myRcpt]').count()===0,'  ……没有收据按钮');
  ck(/🔒/.test(o)&&/(只能看状态|only the status)/.test(o),'  ……显示「只能看状态，请用下单的那部手机」');
  ck(/Kajang/.test(o),'  ……状态、分店、自取/外送照常显示');
  const det=calls.filter(c=>c[0]==="web_my_order_detail");
  ck(det.length===1&&det[0][1].p_ref==="MK1102-0001"&&det[0][1].p_token===TOKEN,'只为这部手机的单向服务器要明细（别人的单没有 token，根本不会去要）');
  ck(errs.length===0,'没有 JS 错误 '+JSON.stringify(errs));
  ck(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),'没有横向溢出');
  await p.screenshot({path:`/tmp/myord-${w}-${lang}.png`}); await ctx.close();
}
await b.close(); console.log(bad?`\n❌ ${bad} 项不对`:"\n全部通过"); process.exit(bad?1:0); })();
