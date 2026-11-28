// web-delyva 2026-11-28：只选即时骑手（J&T/Skynet 这类快递不选）、同样快就优先 Grab、没登录的人不能把错误写到订单、health 带 testMode。跑法：node --experimental-strip-types t11.mjs
let ok=0,bad=0; const t=(n,c,x)=>{ if(c){ok++;console.log("✅",n);} else {bad++;console.log("❌",n,x===undefined?"":JSON.stringify(x));} };
const ENV={SUPABASE_URL:"https://p.supabase.co",SUPABASE_SERVICE_ROLE_KEY:"srk-test",WEB_DELYVA_API_KEY:"k",WEB_DELYVA_CUSTOMER_ID:"777",WEB_DELYVA_COMPANY_CODE:"trydx"};
let handler; globalThis.Deno={env:{get:k=>ENV[k]},serve:h=>{handler=h;}};
const J=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{"content-type":"application/json"}});
let SERVICES=[]; let dvFail=false; const patches=[];
const svc=(name,price,dur=-1)=>({service:{name,code:name.replace(/\W/g,"").toUpperCase()},serviceCompany:{name:name.split(" ")[0],companyCode:name.split(" ")[0].toUpperCase()},price:{amount:price},duration:dur});
globalThis.fetch=async(u,init={})=>{ u=String(u); const m=(init.method||"GET").toUpperCase();
  if(u.includes("/rest/v1/web_outlets")) return J([{idx:0,delivery:true,address:"x",postcode:"58000",state:"KUL",lat:3.07,lng:101.67,phone:"0123456789",name:"OKR"}]);
  if(u.includes("/rest/v1/web_orders")){ if(m==="PATCH"){ patches.push(JSON.parse(init.body)); return J([{}]); } return J([{}]); }
  if(u.includes("instantQuote")){ if(dvFail) return J({message:"secret internal detail"},400); return J({data:{services:SERVICES}}); }
  throw new Error("unexpected "+m+" "+u); };
await import("../../supabase/functions/web-delyva/index.ts?x="+Math.random());
let n=0; const quote=async(extra={})=>{ n++; const r=await handler(new Request("https://p.supabase.co/functions/v1/web-delyva",{method:"POST",headers:{"content-type":"application/json","x-forwarded-for":"1.2.3."+n},body:JSON.stringify({action:"quote",idx:0,lat:3.07+n*0.0001,lng:101.67,address:"No 1 Jalan Test 58000 Kuala Lumpur",items:2,...extra})})); return {s:r.status,b:await r.json()}; };
SERVICES=[svc("J&T Express Parcel",5),svc("Skynet Express",4),svc("Lalamove Motorcycle",8),svc("GrabExpress Motorcycle",9)];
let r=await quote(); t("J&T / Skynet 这类快递不选；都不知道送达时间 → 优先 GrabExpress（RM9）", r.b.ok&&r.b.fee===9, r.b);
SERVICES=[svc("Lalamove Motorcycle",8,1200),svc("GrabExpress Motorcycle",9,1800)];
r=await quote(); t("Lalamove 送达时间明显更短 → 选 Lalamove（最快优先）", r.b.ok&&r.b.fee===8, r.b);
SERVICES=[svc("J&T Express Parcel",5),svc("Skynet Express",4)];
r=await quote(); t("只有快递没有即时骑手 → 报不到价（不会把热食交给快递）", r.b.ok===false, r.b);
// 没登录的人让 Delyva 出错：不能写到订单、不能看到原始错误
dvFail=true; patches.length=0;
r=await quote({id:12345,action:"quote"}); t("匿名报价遇到 Delyva 错误 → 订单没被写入 courier_error", patches.length===0, patches);
t("匿名的人看不到 Delyva 的原始错误内容", !/secret internal/.test(JSON.stringify(r.b)), r.b);
dvFail=false;
// health
const h=await handler(new Request("https://p.supabase.co/functions/v1/web-delyva?health=1",{method:"GET"})); const hb=await h.json();
t("health 带 testMode=true（trydx）和新版本号", hb.testMode===true&&/2026-11-28a/.test(hb.version), hb);
console.log(`\n${ok} ✅ / ${bad} ❌`);
