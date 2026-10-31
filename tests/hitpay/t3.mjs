// 待付款订单：继续付款（换付款方式）、客人取消、逾期（2026-10-31）。用真 config.js；跑法见 tests/README.md
import {call,addOrder,DB,HP,DV} from "./harness.mjs";
const ok=(c,m)=>console.log((c?"✅ ":"❌ ")+m);
const tail="\n\n姓名: 测试\n电话: 0123456789\n• A001 招牌蒸松鱼头 x1 = RM 35.00\n合计: RM 40.28\n自取日期: 2026-10-30";
const mk=(ref)=>addOrder({ref,outlet:"OKR",order_type:"pickup",customer_name:"测试",customer_phone:"0123456789",amount:40.28,message:"x"+tail});
// 1) 先付：选 DuitNow
let o=mk("MK1031-2001");
let r=await call({action:"pay",ref:o.ref,token:o.token,oi:0,cart:{"A001|0|0":1},pm:"duitnow"});
ok(r.status===200&&/securecheckout/.test(r.body.url),"第一次付款 → 建 HitPay 付款单（DuitNow） "+JSON.stringify(r.body).slice(0,60));
const id1=o.pay_id, url1=o.pay_url;
ok(HP.reqs[id1]&&HP.reqs[id1]["payment_methods[]"]==="duitnow","第一张付款单只限 DuitNow");
// 2) 继续付款：换成 FPX（不用再给 cart）
r=await call({action:"pay",ref:o.ref,token:o.token,oi:0,cart:{},pm:"fpx",repay:true});
ok(r.status===200&&r.body.url&&r.body.url!==url1&&o.pay_id!==id1,"继续付款换 FPX → 新付款单、新网址");
ok(HP.reqs[id1].status==="deleted","旧付款单已作废（客人不能再用旧网址付）");
ok(HP.reqs[o.pay_id]["payment_methods[]"]==="fpx"&&HP.reqs[o.pay_id].amount==="40.28"&&HP.reqs[o.pay_id].reference_number===o.ref,"新付款单：FPX、金额和参考号不变");
// 3) 继续付款但没选方式 → 照旧网址
const url2=o.pay_url; r=await call({action:"pay",ref:o.ref,token:o.token,oi:0,cart:{},repay:true});
ok(r.status===200&&r.body.url===url2,"继续付款没选方式 → 还是同一个网址");
// 4) 旧付款单删不掉 → 不建新的（免得重复付款）
HP.noDelete=true; const n0=Object.keys(HP.reqs).length; r=await call({action:"pay",ref:o.ref,token:o.token,oi:0,cart:{},pm:"card",repay:true});
ok(r.status===200&&r.body.url===url2&&Object.keys(HP.reqs).length===n0,"旧付款单作废不了 → 照旧用旧网址，不建新单"); HP.noDelete=false;
// 5) 错 token 不能换
r=await call({action:"pay",ref:o.ref,token:"11111111-2222-3333-4444-555555555555",oi:0,cart:{},pm:"card",repay:true});
ok(r.status===400,"错 token → 拒绝");
// 6) 取消（还没付款）
const idNow=o.pay_id; r=await call({action:"cancel",ref:o.ref,token:o.token});
ok(r.status===200&&r.body.ok&&o.status==="rejected"&&o.confirmed_by==="客人取消（未付款）","客人取消 → 订单已拒绝（客人取消）");
ok(HP.reqs[idNow].status==="deleted","取消 → HitPay 付款单也作废");
r=await call({action:"pay",ref:o.ref,token:o.token,oi:0,cart:{},pm:"card",repay:true}); ok(r.status===400&&/已取消/.test(r.body.error),"取消后不能再付款");
r=await call({action:"cancel",ref:o.ref,token:o.token}); ok(r.status===200&&r.body.ok,"重复取消 → 没事");
// 7) 取消的时候其实已经付了 → 不能取消
let o2=mk("MK1031-2002"); await call({action:"pay",ref:o2.ref,token:o2.token,oi:0,cart:{"A001|0|0":1},pm:"duitnow"});
HP.reqs[o2.pay_id].status="completed"; HP.reqs[o2.pay_id].payments=[{status:"succeeded",payment_type:"duitnow",fees:"0.48",amount:"40.28"}]; HP.reqs[o2.pay_id].amount="40.28"; HP.reqs[o2.pay_id].currency="MYR";
r=await call({action:"cancel",ref:o2.ref,token:o2.token});
ok(r.body.paid===true&&o2.status==="paid","取消时发现其实已付款 → 不取消，订单变已收款");
// 8) 逾期没付：check 时作废
let o3=mk("MK1031-2003"); await call({action:"pay",ref:o3.ref,token:o3.token,oi:0,cart:{"A001|0|0":1},pm:"duitnow"});
o3.created_at=new Date(Date.now()-40*60000).toISOString(); const idE=o3.pay_id;
r=await call({action:"check",ref:o3.ref,token:o3.token});
ok(r.body.status==="rejected"&&o3.confirmed_by==="系统：逾期未付款"&&HP.reqs[idE].status==="deleted","超过 35 分钟没付 → check 时作废订单和付款单");
// 9) 逾期但其实付了 → 照样收款
let o4=mk("MK1031-2004"); await call({action:"pay",ref:o4.ref,token:o4.token,oi:0,cart:{"A001|0|0":1},pm:"duitnow"});
o4.created_at=new Date(Date.now()-40*60000).toISOString();
HP.reqs[o4.pay_id].status="completed"; HP.reqs[o4.pay_id].payments=[{status:"succeeded",payment_type:"duitnow",fees:"0.48",amount:"40.28"}]; HP.reqs[o4.pay_id].amount="40.28"; HP.reqs[o4.pay_id].currency="MYR";
r=await call({action:"check",ref:o4.ref,token:o4.token}); ok(r.body.status==="paid"&&o4.status==="paid","逾期但其实已付款 → 照样确认已收款，不作废");
// 10) 还没建付款单的待付订单（关网页时 pay 还没完成）也能取消
let o5=mk("MK1031-2005"); r=await call({action:"cancel",ref:o5.ref,token:o5.token}); ok(r.body.ok&&o5.status==="rejected","没建过付款单的待付订单 → 也能取消");
