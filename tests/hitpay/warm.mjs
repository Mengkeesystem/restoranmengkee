import {call} from "./harness.mjs";
for(const b of [{action:"warm"},{action:"warm",del:true}]){ const t=Date.now(); const r=await call(b); console.log(JSON.stringify(b),r.status,JSON.stringify(r.body),Date.now()-t,"ms"); }
let last; for(let i=0;i<25;i++) last=await call({action:"warm"},{"x-forwarded-for":"9.9.9.9"}); console.log("限次后",last.status,JSON.stringify(last.body));
