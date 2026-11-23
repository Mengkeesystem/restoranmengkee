// 做法加价（2026-11-23）：金凤鱼 A008 各做法 × 份量，服务器要按 optPrices 算（自取 OKR：菜价 + 打包盒 3 + SST 6%，再凑整）。跑法同 t3
import {call,addOrder} from "./harness.mjs";
const ok=(c,m)=>console.log((c?"✅ ":"❌ ")+m);
const tail="\n\n姓名: 测试\n电话: 0123456789\n合计: RM 0\n自取日期: 2026-10-30";
let n=3000;
const run=async(key,amount)=>{ const o=addOrder({ref:"MK1123-"+(n++),outlet:"OKR",order_type:"pickup",customer_name:"测试",customer_phone:"0123456789",amount,message:"x"+tail});
  return call({action:"pay",ref:o.ref,token:o.token,oi:0,cart:{[key]:1},pm:"duitnow"}); };
const cases=[["A008|0|0",54,"招牌蒸 小 48"],["A008|2|0",61.5,"招牌蒸 大 55"],["A008|0|4",57.2,"酱蒸 小 51"],["A008|2|6",64.6,"娘惹炸 大 58"],["A008|0|7",61.5,"炒 小 55"],["A008|2|7",61.5,"炒 大 55（不分大小）"],["A008|1|8",66.8,"咖喱 中 60"]];
for(const [k,a,l] of cases){ const r=await run(k,a); ok(r.status===200&&r.body.url,l+" → 金额对，建付款单"); }
let r=await run("A008|0|4",54); ok(r.status===400,"酱蒸 小 却按招牌蒸价钱(54) → 拒绝");
r=await run("A008|0|9",54); ok(r.status===400,"做法序号超出范围 → 拒绝");
