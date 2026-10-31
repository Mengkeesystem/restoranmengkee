import {call,addOrder,HP} from "./harness.mjs";
const real=globalThis.fetch; globalThis.fetch=async(u,i={})=>{ if(String(u).includes("payment-requests")&&i.method==="POST"&&/payment_methods/.test(i.body||"")) return new Response(JSON.stringify({message:"The selected payment methods is invalid."}),{status:422}); return real(u,i); };
const o=addOrder({ref:"MK1031-4009",outlet:"OKR",order_type:"pickup",customer_phone:"0123456789",amount:80.56,message:"x\n\n姓名: A"});
const r=await call({action:"pay",ref:o.ref,token:o.token,oi:0,cart:{"A001|0|0":2},pm:"duitnow"});
console.log((r.status===200&&o.pay_url&&!/payment_methods/.test(HP.calls.at(-1).body)?"✅":"❌")+" HitPay 不接受 duitnow → 自动改成全部方式，客人照样能付 "+JSON.stringify(r.body).slice(0,60));
