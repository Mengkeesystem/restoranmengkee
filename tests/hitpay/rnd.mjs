// 凑整：config 的 roundSen 公式单测（网页 / 服务器同一套）
const roundSen=(x,up=7)=>{ const c=Math.round(x*100), d=((c%10)+10)%10; return (d>=up?c-d+10:c-d)/100; };
const cases=[[12.30,12.30],[12.31,12.30],[12.36,12.30],[12.37,12.40],[12.39,12.40],[12.45,12.40],[12.47,12.50],[0.06,0],[0.07,0.10],[99.99,100],[40.28,40.30],[40.26,40.20],[1234.5600000001,1234.50]];
let bad=0; for(const [i,o] of cases){ const r=Math.round(roundSen(i)*100)/100; const ok=Math.abs(r-o)<1e-9; if(!ok)bad++; console.log(ok?"✅":"❌",i,"→",r,"(应为",o+")"); }
process.exit(bad?1:0);
