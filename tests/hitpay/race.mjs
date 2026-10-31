import {call,addOrder,DB,HP} from "./harness.mjs";
const ok=(c,m)=>console.log((c?"✅ ":"❌ ")+m);
const tail="\n\n姓名: 测试\n电话: 0123456789";
let o=addOrder({ref:"MK1031-3001",outlet:"OKR",order_type:"pickup",customer_phone:"0123456789",amount:80.56,message:"x"+tail});
await call({action:"pay",ref:o.ref,token:o.token,oi:0,cart:{"A001|0|0":2}});
Object.assign(HP.reqs[o.pay_id],{status:"completed",amount:"80.56",currency:"MYR",payments:[{status:"succeeded",payment_type:"card",fees:"2.80"}]});
// 两边同时确认：check 和 webhook 一起跑
const crypto=await import("node:crypto");const raw=JSON.stringify({id:o.pay_id,status:"completed",reference_number:o.ref,amount:"80.56"});
const sig=crypto.createHmac("sha256","whsalt").update(raw).digest("hex");
const [a,b]=await Promise.all([call({action:"check",ref:o.ref,token:o.token}),call(raw,{"hitpay-signature":sig},"?a=d")]);
ok(o.status==="paid"&&o.pay_status==="completed","同时确认：订单 paid、pay_status=completed（没有误标 paid_pending） → "+o.status+"/"+o.pay_status+" "+JSON.stringify([a.body,b.body]));
// 店员先拒绝、客人后付款 → 照样标 paid_rejected
let o2=addOrder({ref:"MK1031-3002",outlet:"OKR",order_type:"pickup",customer_phone:"0123456789",amount:80.56,message:"x"+tail});
await call({action:"pay",ref:o2.ref,token:o2.token,oi:0,cart:{"A001|0|0":2}});
o2.status="rejected"; Object.assign(HP.reqs[o2.pay_id],{status:"completed",amount:"80.56",currency:"MYR",payments:[{status:"succeeded",payment_type:"card",fees:"2.80"}]});
const raw2=JSON.stringify({id:o2.pay_id,status:"completed",reference_number:o2.ref});
await call(raw2,{"hitpay-signature":crypto.createHmac("sha256","whsalt").update(raw2).digest("hex")},"?a=d");
ok(o2.status==="rejected"&&o2.pay_status==="paid_rejected","先拒绝后付款 → 仍然提醒店员退款（paid_rejected）");
