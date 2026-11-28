// 2026-11-28 加固：同一张单同时按两次付款只建一张 HitPay 付款单；逾期清理遇到查不到的单不会卡住。跑法同 t3
import {call,addOrder,DB,HP} from "./harness.mjs";
const ok=(c,m)=>console.log((c?"✅ ":"❌ ")+m);
const tail="\n\n姓名: 测试\n电话: 0123456789\n• A001 招牌蒸松鱼头 x1 = RM 35.00\n合计: RM 40.30\n自取日期: 2026-10-30";
const mk=(ref)=>addOrder({ref,outlet:"OKR",order_type:"pickup",customer_name:"测试",customer_phone:"0123456789",amount:40.30,message:"x"+tail});
// 1) 同时两个请求
const o=mk("MK1128-3001"); const before=Object.keys(HP.reqs).length;
const [a,b]=await Promise.all([call({action:"pay",ref:o.ref,token:o.token,oi:0,cart:{"A001|0|0":1},pm:"duitnow"}),call({action:"pay",ref:o.ref,token:o.token,oi:0,cart:{"A001|0|0":1},pm:"duitnow"})]);
ok(Object.keys(HP.reqs).length===before+1,"同时按两次 → 只建 1 张 HitPay 付款单（实际新增 "+(Object.keys(HP.reqs).length-before)+"）");
ok(a.status===200&&b.status===200&&a.body.url&&a.body.url===b.body.url&&a.body.url===o.pay_url,"两个请求拿到同一个付款网址");
// 2) 建单失败要放掉占位，客人可以再按
const o2=mk("MK1128-3002"); HP.failCreate=true; const orig=globalThis.fetch;
globalThis.fetch=async(u,init={})=>{ if(HP.failCreate&&String(u).startsWith("https://api.hit-pay.com/v1/payment-requests")&&(init.method||"GET")==="POST") return new Response(JSON.stringify({message:"boom"}),{status:500}); return orig(u,init); };
let r=await call({action:"pay",ref:o2.ref,token:o2.token,oi:0,cart:{"A001|0|0":1},pm:"duitnow"});
ok(r.status>=400&&o2.pay_status==null&&o2.pay_provider==null,"HitPay 建单失败 → 占位被放掉（pay_status 回到空）");
HP.failCreate=false; r=await call({action:"pay",ref:o2.ref,token:o2.token,oi:0,cart:{"A001|0|0":1},pm:"duitnow"});
ok(r.status===200&&/securecheckout/.test(r.body.url),"再按一次 → 成功建单");
// 3) 逾期清理：第一张在 HitPay 查不到（换账号后的旧单），不能卡住后面的
const s1=mk("MK1128-3003"), s2=mk("MK1128-3004");
for(const x of [s1,s2]) x.created_at=new Date(Date.now()-40*60000).toISOString();
s1.pay_provider="hitpay"; s1.pay_acct="d"; s1.pay_id="gone-from-hitpay-0001"; s1.pay_url="https://securecheckout.hit-pay.com/x"; s1.pay_status="pending";
r=await call({action:"sweep"});
ok(s1.status==="rejected"&&s2.status==="rejected","逾期清理：HitPay 查不到的旧单不卡住，后面的单也照样作废 "+s1.status+"/"+s2.status);
