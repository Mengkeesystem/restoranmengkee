// 付款失败提示（2026-11-02）：回到网站时，HitPay 回报「付款没有成功」→ 进度视窗要说清楚 + 可以继续付款。模拟 Supabase / web-hitpay。
// 用法：在同一条命令里 `python3 -m http.server 8765 --directory <仓库根目录> &` 再 `node tests/ui/pay-fail.js`
const {chromium}=require('playwright');
(async()=>{ const b=await chromium.launch(); let bad=0; const ck=(c,m)=>{ console.log((c?"✅ ":"❌ ")+m); if(!c) bad++; };
const TOKEN="11111111-2222-4333-8444-555555555555";
for(const [w,lang] of [[393,"zh"],[1280,"zh"],[393,"en"]]){
  const ctx=await b.newContext({viewport:{width:w,height:900},timezoneId:"Asia/Kuala_Lumpur"}); const p=await ctx.newPage(); const errs=[]; let PAYST="failed";
  p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(([tok,lang])=>{ localStorage.setItem("site_lang",lang); localStorage.setItem("site_last_order",JSON.stringify({ref:"MK1102-0001",token:tok,amount:40.3,type:"pickup",oi:0,t0:Date.now()-60e3,st:"pending",courier:null,fb:false,done:false,hp:true,payUrl:"https://securecheckout.hit-pay.com/payment-request/abc12345"})); },[TOKEN,lang]);
  await p.route(/maps\.googleapis|gstatic|fonts\.g/,r=>r.abort());
  const CORS={"access-control-allow-origin":"*","access-control-allow-headers":"*"};
  await p.route("**/rest/v1/rpc/**",async r=>{ if(r.request().method()==="OPTIONS") return r.fulfill({status:200,headers:CORS}); const fn=r.request().url().split("/").pop();
    r.fulfill({status:200,contentType:"application/json",headers:CORS,body:JSON.stringify(fn==="web_order_track"?{status:"pending",type:"pickup",done:false,pay:{provider:"hitpay",status:PAYST,method:null},courier:null}:{})}); });
  await p.route("**/functions/v1/web-hitpay",async r=>{ if(r.request().method()==="OPTIONS") return r.fulfill({status:200,headers:CORS}); r.fulfill({status:200,contentType:"application/json",headers:CORS,body:JSON.stringify({status:"pending",pay:PAYST})}); });
  await p.goto("http://localhost:8765/index.html"); await p.waitForTimeout(1800);
  await p.evaluate(()=>__site.trkOpen()); await p.waitForTimeout(1200);
  console.log("---",w,lang);
  const box=p.locator("#trkbox"); let txt=await box.innerText();
  ck(/(付款没有成功|Payment was not successful)/.test(txt),'付款失败 → 标题明确写「付款没有成功」');
  ck(/(继续付款|Continue payment)/.test(txt)&&await box.locator('button[onclick*=pdPay]').count()===1,'  ……有「继续付款」按钮');
  ck(/(再试一次|try again)/.test(txt)&&/(扣款|charge)/.test(txt),'  ……说明可以重试，并提醒「已扣款要 WhatsApp 联系我们」');
  ck(await box.locator('.pswait.bad').count()===1&&await box.locator('.pswait .spin').count()===0,'  ……红色提示框，不再转圈等待');
  ck(await box.locator('a[href*="wa.me"]').count()>=1,'  ……有联系店家（WhatsApp）按钮');
  ck(/(付款没有成功|Payment failed)/.test(await p.locator("#trkchip").innerText()),'  ……左下角小按钮也写「付款没有成功 · 点这里重试」');
  await p.screenshot({path:`/tmp/payfail-${w}-${lang}.png`});
  // 客人重试：HitPay 又回「pending」（没有失败记录）→ 回到「等待付款确认」
  PAYST="pending"; await p.waitForTimeout(5600); txt=await box.innerText();
  ck(/(付款完成后会自动确认|usually within seconds)/.test(txt)&&!/(付款没有成功|Payment was not successful)/.test(txt),'重试后状态变回 pending → 回到「付款完成后会自动确认…」，不再显示失败');
  ck(await box.locator('.pswait .spin').count()===1,'  ……又开始转圈等待');
  ck(errs.length===0,'没有 JS 错误 '+JSON.stringify(errs));
  ck(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),'没有横向溢出');
  await ctx.close();
}
await b.close(); console.log(bad?`\n❌ ${bad} 项不对`:"\n全部通过"); process.exit(bad?1:0); })();
