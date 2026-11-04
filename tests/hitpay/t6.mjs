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

/* ---------- A2. 付款失败：HitPay 付款单还是 pending 但有一笔失败的付款 → pay_status=failed（客人网页会提示重试） ---------- */
{ DB.push=[]; const o=addOrder({ref:"MK1102-1006",order_type:"pickup",amount:20,outlet:"OKR",outlet_idx:0,customer_phone:"0123456789"}); const id=crypto.randomUUID();
  HP.reqs[id]={id,reference_number:o.ref,amount:"20.00",currency:"MYR",status:"pending",payments:[{id:"p1",status:"failed",payment_type:"card",fees:"0"}]};
  Object.assign(o,{pay_provider:"hitpay",pay_id:id,pay_acct:"d",pay_url:"https://securecheckout.hit-pay.com/x"});
  const r=await call({action:"check",ref:o.ref,token:o.token});
  t("付款失败（付款单 pending + 有失败的付款）→ check 回报 pay:failed", r.body.pay==="failed"&&r.body.status==="pending", r);
  t("  ……记进订单 pay_status=failed，订单仍是待付款（客人可以重试）", DB.orders.find(x=>x.id===o.id).pay_status==="failed"&&DB.orders.find(x=>x.id===o.id).status==="pending");
  t("  ……不会误当成已收款、也不会通知员工新订单", DB.push.length===0, DB.push);
  await new Promise(r=>setTimeout(r,4200));   // check 同一张单 4 秒内只查一次
  HP.reqs[id].payments=[{id:"p1",status:"failed",payment_type:"card"},{id:"p2",status:"succeeded",payment_type:"duitnow_qr",fees:"0.3"}]; HP.reqs[id].status="completed";
  const r2=await call({action:"check",ref:o.ref,token:o.token});
  t("客人重试后付款成功 → 照常变已收款 + 通知员工", r2.body.status==="paid"&&DB.orders.find(x=>x.id===o.id).status==="paid"&&DB.push.length===1&&DB.push[0].kind==="paid", {r2,push:DB.push}); }
{ const o=addOrder({ref:"MK1102-1007",order_type:"pickup",amount:20,outlet:"OKR",outlet_idx:0,customer_phone:"0123456789"}); const id=crypto.randomUUID();
  HP.reqs[id]={id,reference_number:o.ref,amount:"20.00",currency:"MYR",status:"pending",payments:[]};
  Object.assign(o,{pay_provider:"hitpay",pay_id:id,pay_acct:"d",pay_url:"https://securecheckout.hit-pay.com/x"});
  const r=await call({action:"check",ref:o.ref,token:o.token}); t("还没付款（没有失败记录）→ 还是 pending，不会误报失败", r.body.pay==="pending"&&DB.orders.find(x=>x.id===o.id).pay_status!=="failed", r); }

/* ---------- B. web-hitpay 健康检查（给监控用） ---------- */
{ const r=await rawGet("?health=1"); t("GET ?health=1 → 200 + ok:true + 新版本号", r.status===200&&r.body.ok===true&&/2026-11-0[24]/.test(r.body.version), r);
  t("health 带 mode / currency（正式 = live + MYR）", r.body.mode==="live"&&r.body.currency==="MYR", r.body);
  const k=ENV.WEB_HITPAY_API_KEY; ENV.WEB_HITPAY_API_KEY=""; const r2=await rawGet("?health=1"); ENV.WEB_HITPAY_API_KEY=k;
  t("HitPay key 没设 → 503 + ok:false（监控会报警）", r2.status===503&&r2.body.ok===false&&r2.body.problems.length>0, r2);
  const r3=await rawGet(""); t("没带 ?health 的 GET 照旧拒绝（405）", r3.status===405, r3); }

console.log(`\n${ok} ✅ / ${bad} ❌`); process.exit(bad?1:0);
