import {call,addOrder,DB,HP,DV,sign} from "./harness.mjs";
const ok=(c,m)=>console.log((c?"✅ ":"❌ ")+m);
const tail="\n\n姓名: 测试\n电话: 0123456789\n• A001 假菜 x9 = RM 1.00\n合计: RM 1.00\n自取日期: 2026-10-30";
// 1) 自取 OKR：A001 RM35 x2 + 打包盒 RM3x2(鱼类) → 70+6=76，SST 6% = 4.56 → 80.56
let o=addOrder({ref:"MK1030-1001",outlet:"OKR",order_type:"pickup",customer_name:"测试",customer_phone:"0123456789",amount:80.56,message:"旧标题\n• A001 招牌蒸松鱼头 x2 = RM 1.00"+tail});
let r=await call({action:"pay",ref:o.ref,token:o.token,oi:0,cart:{"A001|0|0":2}});
ok(r.status===200&&/securecheckout/.test(r.body.url), "自取正确金额 → 建 HitPay 付款单 "+JSON.stringify(r.body).slice(0,80));
const hpReq=HP.reqs[o.pay_id]; ok(hpReq&&hpReq.amount==="80.56"&&hpReq.currency==="MYR"&&hpReq.reference_number===o.ref&&/\?hp=MK1030-1001$/.test(hpReq.redirect_url), "HitPay 金额/币别/参考号/回网址对");
ok(o.message.startsWith("【网上点餐 - 自取】\n分店: OKR\n• A001 招牌蒸松鱼头 x2 = RM 70.00")&&/SST 6%: RM 4.56/.test(o.message)&&/合计: RM 80.56/.test(o.message), "订单讯息菜品/金额段由后台重写");
ok(!/假菜/.test(o.message)&&!/合计: RM 1.00/.test(o.message)&&/姓名: 测试/.test(o.message)&&/付款方式: HitPay/.test(o.message), "客人段的假菜品/假合计被去掉，姓名留着");
// 再按一次 → 同一个付款单
const n0=HP.calls.length; r=await call({action:"pay",ref:o.ref,token:o.token,oi:0,cart:{"A001|0|0":2}}); ok(r.body.url===o.pay_url&&HP.calls.length===n0,"按两次不会重复建付款单");
// 2) 改金额
let o2=addOrder({ref:"MK1030-1002",outlet:"OKR",order_type:"pickup",customer_phone:"0123",amount:1.00,message:"x"+tail});
r=await call({action:"pay",ref:o2.ref,token:o2.token,oi:0,cart:{"A001|0|0":2}}); ok(r.status===400&&/金额/.test(r.body.error)&&o2.status==="rejected", "客人改金额 → 拒绝、订单作废："+r.body.error);
// 3) 错 token / 别的分店（没开 hitpay）/ 假菜 id
let o3=addOrder({ref:"MK1030-1003",outlet:"Kelana Jaya (PJ)",order_type:"pickup",customer_phone:"0123",amount:80.56,message:"x"+tail});
r=await call({action:"pay",ref:o3.ref,token:o.token,oi:2,cart:{"A001|0|0":2}}); ok(r.status===400&&/找不到/.test(r.body.error),"token 不对 → 拒绝");
r=await call({action:"pay",ref:o3.ref,token:o3.token,oi:2,cart:{"A001|0|0":2}}); ok(r.status===200&&HP.reqs[o3.pay_id]&&HP.calls.at(-1).key==="hpkey","PJ（没有自己账号）→ 用共用账号收款");
r=await call({action:"pay",ref:o.ref.replace("1001","1009"),token:o.token,oi:0,cart:{}}); ok(r.status===400,"不存在的单 → 拒绝");
let o4=addOrder({ref:"MK1030-1004",outlet:"OKR",order_type:"pickup",customer_phone:"0123",amount:80.56,message:"x"+tail});
r=await call({action:"pay",ref:o4.ref,token:o4.token,oi:0,cart:{"__proto__|0|0":2}}); ok(r.status===400&&/菜品资料/.test(r.body.error),"假菜 id → 拒绝");
r=await call({action:"pay",ref:o4.ref,token:o4.token,oi:0,cart:{"A001|0|0":0.5}}); ok(r.status===400,"数量 0.5 → 拒绝");
// 4) 优惠码（新客 RM10，满 100）：A001 x3 = 105 + box 9 = 114 −10 → SST (105-10+9)*.06=6.24 → 110.24
const code=process.env.VCODE||""; console.log("（优惠码原码不在仓库，跳过优惠码实测）");
// 5) 客制化 + 备注：A001|0|0|0.2|<hash>
const nh=s=>{let h=5381;for(const c of s)h=((h*33)^c.codePointAt(0))>>>0;return"n"+h.toString(36);};
const k5="A001|0|0|0.2|"+nh("鱼头要大"); let o5=addOrder({ref:"MK1030-1005",outlet:"OKR",order_type:"pickup",customer_phone:"0123",amount:40.28,message:"x"+tail});
r=await call({action:"pay",ref:o5.ref,token:o5.token,oi:0,cart:{[k5]:1},notes:{[k5]:"鱼头要大"}}); ok(r.status===200&&/• A001 招牌蒸松鱼头 \[不要葱, 不要芫荽; 其他要求: 鱼头要大\] x1 = RM 35.00/.test(o5.message),"客制化+备注写进讯息："+(o5.message.split("\n")[2]||r.body.error));
r=await call({action:"pay",ref:"MK1030-1006",token:o5.token,oi:0,cart:{}});
let o6=addOrder({ref:"MK1030-1006",outlet:"OKR",order_type:"pickup",customer_phone:"0123",amount:40.28,message:"x"+tail});
r=await call({action:"pay",ref:o6.ref,token:o6.token,oi:0,cart:{[k5]:1},notes:{[k5]:"别的字"}}); ok(r.status===400,"备注跟代号对不上 → 拒绝");
// 6) Scott Garden 对面（不收 SST）外送：A001 x1 35 + box 3 = 38 + 运费 9.5 = 47.5
DV.fee=9.5; let o7=addOrder({ref:"MK1030-1007",outlet:"OKR (Scott Garden 对面)",order_type:"delivery",outlet_idx:1,dest:{lat:3.06,lng:101.67,address:"Jalan Kinrara 4/11, 47190 Puchong",unit:"",items:1},customer_phone:"0123",amount:47.5,message:"x"+tail});
r=await call({action:"pay",ref:o7.ref,token:o7.token,oi:1,cart:{"A001|0|0":1},qaddr:"Jalan Kinrara 4/11, 47190 Puchong"});
ok(r.status===200&&/运费: RM 9.50/.test(o7.message)&&!/SST/.test(o7.message.split("\n\n")[0]),"Scott 外送（不收 SST）→ 金额对、建付款单 "+(r.body.error||""));
const cfgFix=true;
// 7) OKR 外送：35+3=38 + SST (38*.06=2.28) + 运费 9.5 = 49.78
let o8=addOrder({ref:"MK1030-1008",outlet:"OKR",order_type:"delivery",outlet_idx:0,dest:{lat:3.06,lng:101.67,address:"Jalan Kinrara 4/11, 47190 Puchong",unit:"",items:1},customer_phone:"0123",amount:49.78,message:"x"+tail});
r=await call({action:"pay",ref:o8.ref,token:o8.token,oi:0,cart:{"A001|0|0":1},qaddr:"Jalan Kinrara 4/11, 47190 Puchong"});
ok(r.status===200&&/运费: RM 9.50(?!.*Delyva)/.test(o8.message)&&/Bearer srk-test/.test(DV.lastAuth||""),"外送：后台重新问 Delyva、运费写进讯息、用内部身份 "+(r.body.error||""));
// 运费比客人看到的高 RM0.80（容许 RM1 内）
DV.fee=10.3; let o9=addOrder({ref:"MK1030-1009",outlet:"OKR",order_type:"delivery",outlet_idx:0,dest:{lat:3.06,lng:101.67,address:"x 47190",unit:"",items:1},customer_phone:"0123",amount:49.78,message:"x"+tail});
r=await call({action:"pay",ref:o9.ref,token:o9.token,oi:0,cart:{"A001|0|0":1}}); ok(r.status===200&&!/Delyva/.test(o9.message)&&HP.reqs[o9.pay_id]&&HP.reqs[o9.pay_id].amount==="49.78","运费涨 RM0.80（在容许内）→ 照客人看到的收，讯息不写 Delyva（2026-10-31 起不再写现价）");
DV.fee=12; let o10=addOrder({ref:"MK1030-1010",outlet:"OKR",order_type:"delivery",outlet_idx:0,dest:{lat:3.06,lng:101.67,address:"x 47190",unit:"",items:1},customer_phone:"0123",amount:49.78,message:"x"+tail});
r=await call({action:"pay",ref:o10.ref,token:o10.token,oi:0,cart:{"A001|0|0":1}}); ok(r.status===400&&/运费有变动/.test(r.body.error),"运费涨超过 RM1 → 请客人重新下单");
DV.ok=false; let o11=addOrder({ref:"MK1030-1011",outlet:"OKR",order_type:"delivery",outlet_idx:0,dest:{lat:3.06,lng:101.67,address:"x 47190",unit:"",items:1},customer_phone:"0123",amount:49.78,message:"x"+tail});
r=await call({action:"pay",ref:o11.ref,token:o11.token,oi:0,cart:{"A001|0|0":1}}); ok(r.status===400&&/拿不到外送运费/.test(r.body.error),"Delyva 报不到价 → 不建付款单"); DV.ok=true;
// 外送份数不对
DV.fee=9.5; let o12=addOrder({ref:"MK1030-1012",outlet:"OKR",order_type:"delivery",outlet_idx:0,dest:{lat:3.06,lng:101.67,address:"x 47190",unit:"",items:5},customer_phone:"0123",amount:49.78,message:"x"+tail});
r=await call({action:"pay",ref:o12.ref,token:o12.token,oi:0,cart:{"A001|0|0":1}}); ok(r.status===400&&/份数/.test(r.body.error),"外送份数跟购物车不一样 → 拒绝");
// 8) check：HitPay 还没付 → pending；付了 → paid + 外送自动叫骑手
r=await call({action:"check",ref:o8.ref,token:o8.token}); ok(r.body.status==="pending"&&o8.status==="pending","还没付款 → 还是待付款");
HP.reqs[o8.pay_id].status="completed"; HP.reqs[o8.pay_id].payments=[{status:"succeeded",payment_type:"fpx",fees:"1.30",amount:"49.78"}]; HP.reqs[o8.pay_id].amount="49.78"; HP.reqs[o8.pay_id].currency="myr";
await new Promise(r=>setTimeout(r,4100));
r=await call({action:"check",ref:o8.ref,token:o8.token}); ok(r.body.status==="paid"&&o8.status==="paid"&&o8.confirmed_by==="HitPay"&&o8.pay_method==="fpx"&&o8.pay_fees===1.3,"付款了 → 已收款、记下 FPX 和手续费");
ok(DV.dispatch.length===1&&DV.dispatch[0].id===o8.id&&/srk-test/.test(DV.dispatch[0].auth),"外送单自动叫骑手（内部呼叫 web-delyva）");
// 9) webhook
HP.reqs[o.pay_id].status="completed"; HP.reqs[o.pay_id].amount="80.56"; HP.reqs[o.pay_id].currency="MYR"; HP.reqs[o.pay_id].payments=[{status:"succeeded",payment_type:"card",fees:"1.97"}];
const raw=JSON.stringify({id:o.pay_id,status:"completed",reference_number:o.ref,amount:"80.56"});
r=await call(raw,{"hitpay-signature":"deadbeef"},"?a=d"); ok(r.status===401&&o.status==="pending","假签名 → 401，不改订单");
r=await call(raw,{"hitpay-signature":sign(raw,"whsalt")},"?a=0"); ok(r.status===401,"用没设定的账号 ?a=0 → 401");
r=await call(raw,{"hitpay-signature":sign(raw,"whsalt")},"?a=d"); ok(r.status===200&&o.status==="paid"&&o.pay_method==="card"&&DV.dispatch.length===1,"真签名 → 向 HitPay 查过才改已收款；自取不叫骑手");
r=await call(raw,{"hitpay-signature":sign(raw,"whsalt")},"?a=d"); ok(r.status===200&&o.status==="paid","同一个通知来两次 → 没问题");
// 伪造：签名对但 HitPay 查到还没付
HP.reqs[o5.pay_id].status="pending"; const raw5=JSON.stringify({id:o5.pay_id,status:"completed"});
r=await call(raw5,{"hitpay-signature":sign(raw5,"whsalt")},"?a=d"); ok(o5.status==="pending","通知说付了但 HitPay 查到没付 → 不改");
// HitPay 金额跟订单不一样
HP.reqs[o5.pay_id].status="completed"; HP.reqs[o5.pay_id].amount="1.00"; HP.reqs[o5.pay_id].currency="MYR";
r=await call(raw5,{"hitpay-signature":sign(raw5,"whsalt")},"?a=d"); ok(o5.status==="pending"&&o5.pay_status==="mismatch","HitPay 金额对不上 → 不改、标记人工核对");
// 已被拒绝后才付款
let o13=addOrder({ref:"MK1030-1013",outlet:"OKR",order_type:"pickup",customer_phone:"0123",amount:80.56,message:"x"+tail});
await call({action:"pay",ref:o13.ref,token:o13.token,oi:0,cart:{"A001|0|0":2}}); o13.status="rejected";
Object.assign(HP.reqs[o13.pay_id],{status:"completed",amount:"80.56",currency:"MYR"}); const raw13=JSON.stringify({id:o13.pay_id});
r=await call(raw13,{"hitpay-signature":sign(raw13,"whsalt")},"?a=d"); ok(o13.status==="rejected"&&o13.pay_status==="paid_rejected","店员先拒绝、客人后付款 → 标记 paid_rejected 给店员处理");
// 10) 过期
let o14=addOrder({ref:"MK1030-1014",outlet:"OKR",order_type:"pickup",customer_phone:"0123",amount:80.56,message:"x",created_at:new Date(Date.now()-40*60000).toISOString()});
r=await call({action:"pay",ref:o14.ref,token:o14.token,oi:0,cart:{"A001|0|0":2}}); ok(r.status===400&&/过期/.test(r.body.error),"超过 30 分钟 → 不建付款单");
// 11) 内部错误不外泄
r=await call({action:"status"}); ok(r.body.version&&!JSON.stringify(r.body).includes("hpkey"),"status 不带 key："+JSON.stringify(r.body));
console.log("HitPay key 只出现在 header：",HP.calls.every(c=>c.key==="hpkey"&&!String(c.body||"").includes("hpkey")));
