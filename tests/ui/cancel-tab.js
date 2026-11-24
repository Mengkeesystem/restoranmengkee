// 后台「已取消」分页（客人自己取消）。用法：`python3 -m http.server 8765 &` 再 `node tests/ui/cancel-tab.js`
const {chromium}=require('playwright');
const NOW=new Date().toISOString();
const O=(id,ref,status,by,ps,extra)=>Object.assign({id,ref,outlet:"OKR",order_type:"pickup",customer_name:"Chong",customer_phone:"+60111",amount:20.1,message:"x",status,created_at:NOW,confirmed_at:NOW,confirmed_by:by,pay_provider:"hitpay",pay_status:ps,pay_method:null,pay_fees:null,paid_amount:null,paid_at:null},extra||{});
const ROWS=[O(1,"MK-C1","rejected","客人取消（未付款）","cancelled"),O(2,"MK-R1","rejected","boss@x.com","pending"),O(3,"MK-E1","rejected","系统：逾期未付款","expired"),O(4,"MK-P1","paid","HitPay","completed",{paid_amount:20.1,paid_at:NOW,pay_method:"duitnow"})];
const MOCK=`(()=>{const ROWS=${JSON.stringify(ROWS)};
function Q(t){const q={select:()=>q,gte:()=>q,lt:()=>q,order:()=>q,limit:()=>q,range:()=>q,in:()=>q,eq:()=>q,update:()=>q,insert:()=>q,then:(a,b)=>Promise.resolve({data:t==="web_orders"?ROWS:[],error:null}).then(a,b)};return q;}
window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{user:{email:"boss@x.com"}}}}),onAuthStateChange(){},signOut:async()=>{}},
 rpc:async(n)=>n==="is_web_staff"?{data:true}:n==="web_staff_me"?{data:{role:"admin",outlets:[],email:"boss@x.com"}}:{data:null},
 functions:{invoke:async()=>({data:{configured:false}})},storage:{from:()=>({})},from:t=>Q(t)})};})();`;
(async()=>{const b=await chromium.launch();let bad=0;const ck=(c,m)=>{console.log((c?"✅ ":"❌ ")+m);if(!c)bad++;};
for(const w of [1280,393]){const p=await (await b.newContext({viewport:{width:w,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/supabase.js',r=>r.fulfill({contentType:'application/javascript',body:MOCK}));
await p.route('**/admin.html',async r=>{const res=await r.fetch();let t=await res.text();t=t.replace(/ integrity="[^"]*"/,'');r.fulfill({response:res,body:t});});
await p.goto('http://localhost:8765/admin.html');await p.waitForTimeout(1500);
const tabs=await p.locator('#tabs').innerText();console.log(w,tabs.replace(/\n/g,' '));
ck(/已取消\s*1/.test(tabs),'已取消 = 1（只算客人取消）');ck(/已拒绝\s*2/.test(tabs),'已拒绝 = 2（店员拒绝 + 系统逾期）');
await p.click('#tabs button:has-text("已取消")');await p.waitForTimeout(400);
const l=await p.locator('#list').innerText();ck(/MK-C1/.test(l)&&!/MK-R1/.test(l),'已取消页只有客人取消的单');ck(/客人已取消/.test(l)&&/客人没有付款/.test(l)&&!/HitPay 已付款/.test(l),'标签正确、不再写「已付款」');
await p.screenshot({path:`/tmp/cancel-${w}.png`});
ck(errs.length===0,'无 JS 错误 '+errs.join('|'));}
await b.close();process.exit(bad?1:0);})();
