// web-delyva：骑手取消/失败 → 提醒员工；健康检查（2026-11-02）。跑法：node --experimental-strip-types t8.mjs
let ok=0, bad=0; const t=(n,c,x)=>{ if(c){ ok++; console.log("✅",n); } else { bad++; console.log("❌",n,x===undefined?"":JSON.stringify(x)); } };
const ENV={SUPABASE_URL:"https://p.supabase.co",SUPABASE_SERVICE_ROLE_KEY:"srk-test",WEB_DELYVA_API_KEY:"k",WEB_DELYVA_CUSTOMER_ID:"777",WEB_DELYVA_COMPANY_CODE:"trydx"};
let handler; globalThis.Deno={env:{get:k=>ENV[k]},serve:h=>{handler=h;}};
const J=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{"content-type":"application/json"}});
let row={id:5,courier_order_id:"D1",courier_status:100,completed_at:null}; const pushes=[]; let pushDown=false;
globalThis.fetch=async(u,init={})=>{ u=String(u); const m=(init.method||"GET").toUpperCase();
  if(u.endsWith("/functions/v1/web-push")){ pushes.push({...JSON.parse(init.body),auth:init.headers.Authorization}); return pushDown?J({error:"x"},503):J({ok:true}); }
  if(u.includes("/rest/v1/web_orders")){ if(m==="GET") return J([row]); if(m==="PATCH"){ Object.assign(row,JSON.parse(init.body)); return J([row]); } }
  throw new Error("unexpected "+m+" "+u); };
await import("../../supabase/functions/web-delyva/index.ts?x="+Math.random());
const hook=async(code)=>{ const r=await handler(new Request("https://p.supabase.co/functions/v1/web-delyva",{method:"POST",headers:{"content-type":"application/json","x-delyvax-event":"order_tracking.change"},body:JSON.stringify({orderId:"D1",statusCode:code,customerId:777,consignmentNo:"C1"})})); return {s:r.status,b:await r.json()}; };

let r=await hook(200); t("骑手接单(200) → 不吵员工", r.s===200&&!pushes.length, pushes);
r=await hook(900); t("骑手单被取消(900) → 提醒员工（带 service role、kind=alert）", pushes.length===1&&pushes[0].kind==="alert"&&pushes[0].id===5&&/取消/.test(pushes[0].text)&&pushes[0].auth==="Bearer srk-test"&&pushes[0].action==="notify", pushes);
r=await hook(900); t("同一个取消通知又来 → 不会再吵", pushes.length===1, pushes.length);
row.courier_status=100; r=await hook(475); t("取餐失败(475) → 提醒员工", pushes.length===2&&/取餐失败/.test(pushes[1].text), pushes);
row.courier_status=500; r=await hook(650); t("送达失败(650) → 提醒员工", pushes.length===3&&/送达失败/.test(pushes[2].text), pushes);
row.courier_status=900; r=await hook(650); t("员工自己已取消(900)后又收到失败通知 → 不吵", pushes.length===3, pushes.length);
row.courier_status=600; r=await hook(700); t("送达(700) → 不吵，订单自动完成", pushes.length===3&&row.completed_at, row);
pushDown=true; row.courier_status=100; r=await hook(900); t("web-push 当机 → 骑手状态照样更新、不报错", r.s===200&&row.courier_status===900, {r,row}); pushDown=false;
const g=await handler(new Request("https://p.supabase.co/functions/v1/web-delyva?health=1")); const gb=await g.json(); t("GET ?health=1 → 200 ok:true（测试账号）", g.status===200&&gb.ok===true&&gb.version==="2026-11-02a", gb);
const g2=await handler(new Request("https://p.supabase.co/functions/v1/web-delyva")); t("没带 ?health 的 GET 仍然 405", g2.status===405, g2.status);
console.log(`\n${ok} ✅ / ${bad} ❌`); process.exit(bad?1:0);
