import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require=createRequire(import.meta.url); const {chromium}=require("playwright");
process.env.HP_CFG=new URL("./cfg-test.js",import.meta.url).pathname;
const H=await import("./harness.mjs");
const R="/home/user/restoranmengkee", CFG=fs.readFileSync(process.env.HP_CFG,"utf8");
const ok=(c,m)=>console.log((c?"✅ ":"❌ ")+m);
const nh=s=>{let h=5381;for(const c of s)h=((h*33)^c.codePointAt(0))>>>0;return"n"+h.toString(36);};
async function run(name, setup){
  const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:393,height:852},timezoneId:"Asia/Kuala_Lumpur"}); const p=await ctx.newPage();
  await p.clock.setFixedTime(new Date("2026-10-29T12:30:00+08:00"));
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.route("https://restoranmengkee.com.my/**",r=>{ let u=new URL(r.request().url()).pathname; if(u==="/") u="/index.html"; if(u==="/config.js") return r.fulfill({body:CFG,contentType:"application/javascript"}); const f=path.join(R,decodeURIComponent(u)); fs.existsSync(f)?r.fulfill({path:f}):r.fulfill({status:404,body:""}); });
  await p.route("**/rest/v1/rpc/**",async r=>{ const fn=r.request().url().split("/").pop(), a=JSON.parse(r.request().postData()||"{}"), J=x=>r.fulfill({status:200,contentType:"application/json",body:JSON.stringify(x),headers:{"access-control-allow-origin":"*"}});
    if(r.request().method()==="OPTIONS") return r.fulfill({status:200,headers:{"access-control-allow-origin":"*","access-control-allow-headers":"*"}});
    if(fn==="create_web_order"){ const o=H.addOrder({ref:a.p_ref,outlet:a.p_outlet,order_type:a.p_type,customer_name:a.p_name,customer_phone:a.p_phone,amount:Math.round(a.p_amount*100)/100,message:a.p_message,outlet_idx:a.p_dest?a.p_dest.oi:null,dest:a.p_dest?{...a.p_dest}:null}); return J(o.token); }
    if(fn==="web_order_track"){ const o=H.DB.orders.find(x=>x.ref===a.p_ref&&x.token===a.p_token); return J(o?{status:o.status,type:o.order_type,done:false,pay:{provider:"hitpay",status:o.pay_status},courier:null}:{status:"notfound"}); }
    return J(null); });
  await p.route("**/functions/v1/web-delyva",r=>{ if(r.request().method()==="OPTIONS") return r.fulfill({status:200,headers:{"access-control-allow-origin":"*","access-control-allow-headers":"*"}}); r.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({ok:true,fee:9.5,service:"Instant Delivery"})}); });
  await p.route("**/functions/v1/web-hitpay",async r=>{ if(r.request().method()==="OPTIONS") return r.fulfill({status:200,headers:{"access-control-allow-origin":"*","access-control-allow-headers":"*"}});
    const res=await H.call(r.request().postData()); r.fulfill({status:res.status,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify(res.body)}); });
  await p.route("https://securecheckout.hit-pay.com/**",r=>r.fulfill({contentType:"text/html",body:"<h1>HitPay 模拟付款页</h1>"}));
  await p.goto("https://restoranmengkee.com.my/?hptest=1"); await setup(p); await p.reload(); await p.waitForTimeout(700);
  await p.click("#cartBtn"); await p.waitForTimeout(name.includes("外送")?9000:1200);
  const bill=await p.evaluate(()=>[...document.querySelectorAll(".tot")].map(x=>x.textContent.replace(/\s+/g," ").trim()).join(" | "));
  await p.fill("#od_name","测试客人"); await p.fill("#od_phone","0123456789");
  await p.check("#od_agree").catch(()=>{}); await p.click("#od_send"); await p.waitForTimeout(500);
  const err1=await p.$eval("#od_err",e=>e.textContent).catch(()=>"");
  const psText=await p.$eval("#paystep",e=>e.innerText.replace(/\s+/g," ")).catch(()=>"");
  await p.click('#paystep button:has-text("前往付款")').catch(e=>console.log("  （没有前往付款按钮）",err1));
  await p.waitForURL(/securecheckout/,{timeout:8000}).catch(()=>{});
  const o=H.DB.orders[H.DB.orders.length-1], onHp=/securecheckout/.test(p.url());
  console.log(`\n== ${name}\n  购物车：${bill}\n  付款视窗：${psText.slice(0,120)}`);
  ok(onHp&&o&&o.pay_url, `${name}：网页金额 RM ${o&&o.amount} = 后台重算 → 跳到 HitPay 付款页 ${o&&!o.pay_url?(o.status+" "+(o.confirmed_by||"")):""}`);
  if(onHp){
    ok(await p.evaluate(()=>{ try{ return JSON.parse(localStorage.getItem("site_cart")||"{}"); }catch(e){ return {x:1}; } }).then(c=>Object.keys(c).length===0),"跳走前购物车已清空");
    Object.assign(H.HP.reqs[o.pay_id],{status:"completed",currency:"MYR",payments:[{status:"succeeded",payment_type:"fpx",fees:"1.2"}]});
    await p.goto(H.HP.reqs[o.pay_id].redirect_url+"&reference="+o.pay_id+"&status=completed"); await p.waitForTimeout(3500);
    const trk=await p.$eval("#trkbox",e=>e.innerText.replace(/\s+/g," ")).catch(()=>"");
    ok(o.status==="paid"&&o.confirmed_by==="HitPay","回到网站后向 HitPay 查到已付款 → 订单已收款");
    ok(/付款成功/.test(trk)&&!/[?&]hp=/.test(p.url()),"进度视窗显示「付款成功」、网址参数已去掉："+trk.slice(0,90));
    console.log("  后台重写的讯息：\n    "+o.message.split("\n\n")[0].replace(/\n/g,"\n    "));
  }
  ok(!errs.length,"没有 JS 错误 "+errs.join(";"));
  await b.close(); return o;
}
// A. 自取 OKR：两份松鱼头（一份客制化+备注）+ 一份饭 + 优惠码 TEST10
const k1="A001|0|0|0.2|"+nh("鱼头要大");
await run("自取 + 客制化 + 优惠码", p=>p.evaluate(([k1])=>{ localStorage.setItem("site_otype",'"pickup"'); localStorage.setItem("site_outlet",'"0"'); localStorage.setItem("site_cart",JSON.stringify({[k1]:1,"A001|0|0":1,"R002|3|0":2})); localStorage.setItem("site_cart_notes",JSON.stringify({[k1]:"鱼头要大"})); localStorage.setItem("site_voucher",'"TEST10"'); },[k1]));
// B. 外送 OKR（Delyva 运费 9.5）
await run("外送 OKR", p=>p.evaluate(()=>{ localStorage.setItem("site_otype",'"delivery"'); localStorage.setItem("site_outlet",'"0"'); localStorage.setItem("site_cart",JSON.stringify({"A001|0|0":1,"B001|0|0":2})); localStorage.setItem("site_voucher",'""');
  localStorage.setItem("site_od_draft",JSON.stringify({geo:{lat:3.1150,lng:101.6800},addr:"Jalan Syed Putra, 58000 Kuala Lumpur",name:"测试客人",phone:"0123456789"})); }));
