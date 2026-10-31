// 菜单开关 86 + 10 分钟逾期 + 继续付款时外送运费实时再报价（2026-10-31）。用真 config.js；跑法见 tests/README.md
import {call,addOrder,DB,HP,DV} from "./harness.mjs";
const ok=(c,m)=>console.log((c?"✅ ":"❌ ")+m);
const tail="\n\n姓名: 测试\n电话: 0123456789\n• A001 招牌蒸松鱼头 x1 = RM 35.00\n合计: RM 40.28\n自取日期: 2026-10-30";
const mk=(ref,extra={})=>addOrder({ref,outlet:"OKR",order_type:"pickup",customer_name:"测试",customer_phone:"0123456789",amount:40.28,message:"x"+tail,...extra});
// 86：OKR(0) 关掉 A001 → OKR 不能下；别的分店（Scott 1）不受影响
DB.m86=[{oi:0,item:"A001",off:true}];
let o=mk("MK1031-3001");
let r=await call({action:"pay",ref:o.ref,token:o.token,oi:0,cart:{"A001|0|0":1},pm:"duitnow"});
ok(r.status===400&&/售完/.test(r.body.error)&&/招牌蒸松鱼头/.test(r.body.error)&&!o.pay_id,"OKR 关掉 A001 → 服务器拒绝，不建付款单："+(r.body.error||""));
DB.m86=[{oi:0,item:"A001",off:false}];
await new Promise(x=>setTimeout(x,15100));   // 服务器缓存 15 秒
r=await call({action:"pay",ref:o.ref,token:o.token,oi:0,cart:{"A001|0|0":1},pm:"duitnow"});
ok(r.status===200&&o.pay_id,"恢复有货（off=false）→ 可以下单");
// 10 分钟逾期
let o2=mk("MK1031-3002"); await call({action:"pay",ref:o2.ref,token:o2.token,oi:0,cart:{"A001|0|0":1},pm:"duitnow"});
o2.created_at=new Date(Date.now()-9*60000).toISOString();
r=await call({action:"check",ref:o2.ref,token:o2.token}); ok(r.body.status==="pending","9 分钟还没付 → 还在等");
r=await call({action:"pay",ref:o2.ref,token:o2.token,oi:0,cart:{},pm:"fpx",repay:true}); ok(r.status===200&&r.body.url,"9 分钟时继续付款（换 FPX）→ 可以");
o2.created_at=new Date(Date.now()-12*60000).toISOString();
r=await call({action:"pay",ref:o2.ref,token:o2.token,oi:0,cart:{},pm:"fpx",repay:true}); ok(r.status===400&&/10 分钟/.test(r.body.error),"12 分钟 → 继续付款被拒：说超过 10 分钟");
await new Promise(x=>setTimeout(x,4100));   // check 有 4 秒限频
r=await call({action:"check",ref:o2.ref,token:o2.token}); ok(r.body.status==="rejected"&&o2.confirmed_by==="系统：逾期未付款","超过 11 分钟没付 → check 自动取消订单");
// sweep（定时任务）：逾期没付款的会被清；其实已付的不动
let o3=mk("MK1031-3003"); await call({action:"pay",ref:o3.ref,token:o3.token,oi:0,cart:{"A001|0|0":1},pm:"duitnow"}); o3.created_at=new Date(Date.now()-13*60000).toISOString();
let o4=mk("MK1031-3004"); await call({action:"pay",ref:o4.ref,token:o4.token,oi:0,cart:{"A001|0|0":1},pm:"duitnow"}); o4.created_at=new Date(Date.now()-13*60000).toISOString();
HP.reqs[o4.pay_id].status="completed"; HP.reqs[o4.pay_id].payments=[{status:"succeeded",payment_type:"duitnow",fees:"0.48",amount:"40.28"}]; HP.reqs[o4.pay_id].amount="40.28"; HP.reqs[o4.pay_id].currency="MYR";
let o5=mk("MK1031-3005"); o5.created_at=new Date(Date.now()-13*60000).toISOString();   // 没建过付款单
r=await call({action:"sweep"}); ok(r.status===200,"sweep 可以叫");
ok(o3.status==="rejected"&&o3.confirmed_by==="系统：逾期未付款","sweep：逾期没付 → 取消");
ok(o4.status==="paid","sweep：逾期但其实已付 → 照收，不取消");
ok(o5.status==="rejected","sweep：没建过付款单的逾期订单 → 取消");
// 外送：继续付款时运费实时再报价
const del=(ref,fee)=>addOrder({ref,outlet:"OKR",order_type:"delivery",outlet_idx:0,dest:{lat:3.06,lng:101.67,address:"x 47190",unit:"",items:1},customer_phone:"0123",amount:49.78,message:"x\n运费: RM "+fee+"\n合计: RM 49.78"+tail});
DV.fee=9.5; let d1=del("MK1031-3011","9.50");
// 手动给它一张付款单，模拟已经走过第一次 pay
const id0=crypto.randomUUID(); HP.reqs[id0]={id:id0,status:"pending",amount:"49.78",url:"https://securecheckout.hit-pay.com/payment-request/@mk/"+id0+"/checkout"}; Object.assign(d1,{pay_provider:"hitpay",pay_acct:"d",pay_id:id0,pay_url:HP.reqs[id0].url,pay_status:"pending"});
r=await call({action:"pay",ref:d1.ref,token:d1.token,oi:0,cart:{},pm:"fpx",repay:true}); ok(r.status===200&&r.body.url,"外送：运费没变 → 继续付款可以");
DV.fee=10.3; r=await call({action:"pay",ref:d1.ref,token:d1.token,oi:0,cart:{},pm:"fpx",repay:true}); ok(r.status===200&&Math.abs(r.body.amount-50.58)<0.01&&Math.abs(Number(d1.amount)-50.58)<0.01&&/运费: RM 10\.30/.test(d1.message)&&/合计: RM 50\.58/.test(d1.message)&&!HP.reqs[id0]?.url?.includes("zzz")&&Object.values(HP.reqs).some(x=>Number(x.amount)===50.58),"外送：运费涨 RM0.80（容许内）→ 订单金额跟着变 50.58、讯息同步、新付款单金额 50.58");
DV.fee=9.0; r=await call({action:"pay",ref:d1.ref,token:d1.token,oi:0,cart:{},pm:"fpx",repay:true}); ok(r.status===200&&Math.abs(Number(d1.amount)-50.58)<0.01,"外送：运费变便宜 → 照原金额收（不变）");
DV.fee=9.5; d1.message=d1.message.replace("RM 10.30","RM 9.50");
DV.fee=11.0; r=await call({action:"pay",ref:d1.ref,token:d1.token,oi:0,cart:{},pm:"fpx",repay:true}); ok(r.status===400&&/运费有变动/.test(r.body.error)&&/RM ?11/.test(r.body.error),"外送：运费涨 RM1.50 → 不让付，说现价，要重新下单："+(r.body.error||""));
DV.ok=false; r=await call({action:"pay",ref:d1.ref,token:d1.token,oi:0,cart:{},pm:"fpx",repay:true}); ok(r.status===400&&/拿不到.*运费/.test(r.body.error),"外送：报不到价 → 不让付"); DV.ok=true;
