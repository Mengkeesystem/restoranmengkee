// 模拟环境：内存订单表 + 网站 config.js + Delyva 报价 + HitPay API；export 给测试用
import fs from "node:fs"; import crypto from "node:crypto";
export const ENV={SUPABASE_URL:"https://p.supabase.co",SUPABASE_SERVICE_ROLE_KEY:"srk-test",WEB_HITPAY_API_KEY:"hpkey",WEB_HITPAY_WEBHOOK_SALT:"whsalt",WEB_HITPAY_CURRENCY:"MYR"};
export const DB={orders:[],seq:1}; export const HP={reqs:{},calls:[]}; export const DV={fee:9.5,calls:0,dispatch:[],ok:true};
let handler; globalThis.Deno={env:{get:k=>ENV[k]},serve:h=>{handler=h;}};
const CFG=fs.readFileSync(process.env.HP_CFG||"/home/user/restoranmengkee/config.js","utf8");
const J=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{"content-type":"application/json"}});
function q(u){ const url=new URL(u); const f={}; url.searchParams.forEach((v,k)=>{ if(k!=="select") f[k]=v; }); return f; }
function match(o,f){ return Object.entries(f).every(([k,v])=>{ const m=v.match(/^eq\.(.*)$/); return m?String(o[k])===decodeURIComponent(m[1]):true; }); }
const realFetch=globalThis.fetch;
export const mockFetch=async(u,init={})=>{ u=String(u); const m=(init.method||"GET").toUpperCase();
  if(u.startsWith("https://restoranmengkee.com.my/config.js")) return new Response(CFG,{status:200});
  if(u.includes("/rest/v1/web_orders")){ const f=q(u);
    if(m==="GET") return J(DB.orders.filter(o=>match(o,f)));
    if(m==="PATCH"){ const p=JSON.parse(init.body); const rows=DB.orders.filter(o=>match(o,f)); rows.forEach(o=>Object.assign(o,p)); return J(rows); } }
  if(u.endsWith("/functions/v1/web-delyva")){ const b=JSON.parse(init.body);
    if(b.action==="quote"){ DV.calls++; DV.lastQuote=b; DV.lastAuth=init.headers&&init.headers.Authorization; return J(DV.ok?{ok:true,fee:DV.fee,service:"Instant Delivery"}:{ok:false,error:"no service"}); }
    if(b.action==="dispatch"){ DV.dispatch.push({id:b.id,auth:init.headers.Authorization}); return J({ok:true}); } }
  if(u.startsWith("https://api.hit-pay.com/v1/payment-requests")){ HP.calls.push({m,u,key:init.headers["X-BUSINESS-API-KEY"],body:init.body});
    if(m==="POST"){ const b=Object.fromEntries(new URLSearchParams(init.body)); const id=crypto.randomUUID(); HP.reqs[id]={id,...b,status:"pending",url:`https://securecheckout.hit-pay.com/payment-request/@mk/${id}/checkout`}; return J(HP.reqs[id]); }
    const id=u.split("/").pop(); if(m==="DELETE"){ if(HP.noDelete) return J({message:"cannot delete"},422); const r0=HP.reqs[id]; if(!r0) return J({message:"not found"},404); r0.status="deleted"; HP.deleted=(HP.deleted||[]).concat(id); return J({success:true}); } const r=HP.reqs[id]; return r?J(r):J({message:"not found"},404); }
  throw new Error("unexpected fetch "+m+" "+u); };
globalThis.fetch=mockFetch;
await import("../../supabase/functions/web-hitpay/index.ts?"+Math.random());
export const call=async(body,headers={},qs="")=>{ const r=await handler(new Request("https://p.supabase.co/functions/v1/web-hitpay"+qs,{method:"POST",headers:{"content-type":"application/json",origin:"https://restoranmengkee.com.my",...headers},body:typeof body==="string"?body:JSON.stringify(body)})); return {status:r.status, body:await r.json()}; };
export function addOrder(o){ const row={id:DB.seq++,token:crypto.randomUUID(),status:"pending",created_at:new Date().toISOString(),outlet_idx:null,dest:null,...o}; DB.orders.push(row); return row; }
export const sign=(raw,salt)=>crypto.createHmac("sha256",salt).update(raw).digest("hex");
