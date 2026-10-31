import {call,addOrder,DB} from "./harness.mjs";
const ok=(c,m)=>console.log((c?"✅ ":"❌ ")+m);
const tail="\n\n姓名: 测试\n电话: 0123456789";
const o=addOrder({ref:"MK1030-2101",outlet:"OKR",order_type:"pickup",customer_phone:"0123456789",amount:80.56,message:"x"+tail});
const r=await call({action:"pay",ref:o.ref,token:o.token,oi:0,cart:{"A001|0|0":2}});
console.log(process.env.FAKE_AT, r.status, JSON.stringify(r.body).slice(0,90), o.status, o.confirmed_by||"");
