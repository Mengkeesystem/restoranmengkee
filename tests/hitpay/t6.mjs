// 手机通知（web-push）+ 付款成功/出问题时有没有通知员工 + 健康检查（2026-11-02）
// 跑法（在 tests/hitpay/）：FAKE_AT=2026-10-30T12:30:00+08:00 node --experimental-strip-types --import ./fakedate.mjs t6.mjs
import crypto from "node:crypto";
import { DB, HP, DV, ENV, call, addOrder, sign, rawGet } from "./harness.mjs";
let ok=0, bad=0; const t=(n,c,x)=>{ if(c){ ok++; console.log("✅",n); } else { bad++; console.log("❌",n,x===undefined?"":JSON.stringify(x)); } };
const SRK="Bearer "+ENV.SUPABASE_SERVICE_ROLE_KEY;

/* ---------- A. web-hitpay：付款成功 → 通知；出问题 → 提醒 ---------- */
const reqPay = async (o) => { const id=crypto.randomUUID(); HP.reqs[id]={id,reference_number:o.ref,amount:String(o.amount),currency:"MYR",status:"completed",payments:[{id:"p1",status:"succeeded",payment_type:"duitnow_qr",fees:"0.5"}]}; Object.assign(o,{pay_provider:"hitpay",pay_id:id,pay_acct:"d",pay_url:"https://securecheckout.hit-pay.com/x"}); return id; };
{ DB.push=[]; const o=addOrder({ref:"MK1102-1001",order_type:"pickup",amount:20,outlet:"OKR",outlet_idx:0,customer_phone:"0123456789"}); const id=await reqPay(o);
  const raw=JSON.stringify({payment_request_id:id,reference_number:o.ref,status:"completed"});
  const r=await call(JSON.parse(raw),{"hitpay-signature":sign(raw,ENV.WEB_HITPAY_WEBHOOK_SALT)},"?a=d");
  t("webhook 付款成功 → 订单变已收款", DB.orders.find(x=>x.id===o.id).status==="paid", r);
  t("付款成功 → 通知了员工一次（kind=paid，带 service role）", DB.push.length===1&&DB.push[0].kind==="paid"&&DB.push[0].id===o.id&&DB.push[0].auth===SRK&&DB.push[0].action==="notify", DB.push);
  await call({action:"check",ref:o.ref,token:o.token}); const raw2=raw; await call(JSON.parse(raw2),{"hitpay-signature":sign(raw2,ENV.WEB_HITPAY_WEBHOOK_SALT)},"?a=d");
  t("同一张单 webhook 又来一次 → 不会再通知（只通知一次）", DB.push.length===1, DB.push.length); }
{ DB.push=[]; const o=addOrder({ref:"MK1102-1002",order_type:"delivery",amount:30,outlet:"OKR",outlet_idx:0,dest:{lat:3.1,lng:101.6,address:"x"},customer_phone:"0123456789"}); const id=await reqPay(o);
  const raw=JSON.stringify({payment_request_id:id,reference_number:o.ref,status:"completed"});
  await call(JSON.parse(raw),{"hitpay-signature":sign(raw,ENV.WEB_HITPAY_WEBHOOK_SALT)},"?a=d");
  t("外送单付款成功 → 通知 + 叫骑手，没有多余的提醒", DB.push.length===1&&DB.push[0].kind==="paid"&&DV.dispatch.some(x=>x.id===o.id), {push:DB.push,dv:DV.dispatch}); }
{ DB.push=[]; const o=addOrder({ref:"MK1102-1003",order_type:"pickup",amount:20,outlet:"OKR",outlet_idx:0,customer_phone:"0123456789"}); const id=await reqPay(o); HP.reqs[id].amount="25.00";   // HitPay 实际收到的金额跟订单对不上
  const raw=JSON.stringify({payment_request_id:id,reference_number:o.ref,status:"completed"});
  await call(JSON.parse(raw),{"hitpay-signature":sign(raw,ENV.WEB_HITPAY_WEBHOOK_SALT)},"?a=d");
  t("付款金额对不上 → 订单不会变已收款", DB.orders.find(x=>x.id===o.id).status==="pending");
  t("付款金额对不上 → 提醒员工（kind=alert）", DB.push.length===1&&DB.push[0].kind==="alert"&&/对不上/.test(DB.push[0].text), DB.push);
  await call(JSON.parse(raw),{"hitpay-signature":sign(raw,ENV.WEB_HITPAY_WEBHOOK_SALT)},"?a=d");
  t("同一个问题重复通知 → 不会一直吵", DB.push.length===1, DB.push.length); }
{ DB.push=[]; const o=addOrder({ref:"MK1102-1004",order_type:"pickup",amount:20,outlet:"OKR",outlet_idx:0,status:"rejected",customer_phone:"0123456789"}); const id=await reqPay(o);
  const raw=JSON.stringify({payment_request_id:id,reference_number:o.ref,status:"completed"});
  await call(JSON.parse(raw),{"hitpay-signature":sign(raw,ENV.WEB_HITPAY_WEBHOOK_SALT)},"?a=d");
  t("订单已被取消但客人其实付了款 → 提醒员工核对退款", DB.push.length===1&&DB.push[0].kind==="alert"&&/退款/.test(DB.push[0].text), DB.push); }
{ DB.pushDown=true; DB.push=[]; const o=addOrder({ref:"MK1102-1005",order_type:"pickup",amount:20,outlet:"OKR",outlet_idx:0,customer_phone:"0123456789"}); const id=await reqPay(o);
  const raw=JSON.stringify({payment_request_id:id,reference_number:o.ref,status:"completed"});
  const r=await call(JSON.parse(raw),{"hitpay-signature":sign(raw,ENV.WEB_HITPAY_WEBHOOK_SALT)},"?a=d");
  t("web-push 当机 / 没部署 → 付款确认照样成功（通知失败不影响收款）", DB.orders.find(x=>x.id===o.id).status==="paid"&&r.ok!==false, r); DB.pushDown=false; }

/* ---------- B. web-hitpay 健康检查（给监控用） ---------- */
{ const r=await rawGet("?health=1"); t("GET ?health=1 → 200 + ok:true + 新版本号", r.status===200&&r.body.ok===true&&/2026-11-02/.test(r.body.version), r);
  const k=ENV.WEB_HITPAY_API_KEY; ENV.WEB_HITPAY_API_KEY=""; const r2=await rawGet("?health=1"); ENV.WEB_HITPAY_API_KEY=k;
  t("HitPay key 没设 → 503 + ok:false（监控会报警）", r2.status===503&&r2.body.ok===false&&r2.body.problems.length>0, r2);
  const r3=await rawGet(""); t("没带 ?health 的 GET 照旧拒绝（405）", r3.status===405, r3); }

console.log(`\n${ok} ✅ / ${bad} ❌`); process.exit(bad?1:0);
