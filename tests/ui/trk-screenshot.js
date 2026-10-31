const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const tag=process.argv[2]||'a';
for(const [w,h,n] of [[393,852,'m'],[1280,900,'d']]){
const p=await b.newPage({viewport:{width:w,height:h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/supabase\.co/,r=>{const u=r.request().url();
  if(/web_order_track/.test(u)) return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:'paid',type:'delivery',done:false,courier:{status:500,service:'Instant',track:'https://trydx.delyva.app/customer/strack?trackingNo=1',rider:{name:'Ali',phone:'0123',plate:'W1234'}}})});
  r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});});
await p.route(/googleapis|gstatic|fonts\./,r=>r.abort());
await p.addInitScript(()=>{ localStorage.setItem('site_last_order',JSON.stringify({ref:'MK1031-7452',token:'11111111-2222-3333-4444-555555555555',amount:50,type:'delivery',oi:0,t0:Date.now()-60000,paidAt:Date.now()-30000,st:'paid',hp:true,eta:{all:[25,40],ride:[12,20]}})); });
await p.goto('http://localhost:8765/');await p.waitForTimeout(800);
await p.evaluate(()=>window.__site.trkOpen());await p.waitForTimeout(9500);
await p.screenshot({path:`trk-${tag}-${n}.png`});console.log(n,errs);await p.close();}
await b.close();})();
