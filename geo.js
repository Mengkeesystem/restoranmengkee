/* 地址 → 坐标（免费 OpenStreetMap Nominatim），给外卖自动算距离用。index.html 和 check.html 共用。
 * - 在客人/店员自己的浏览器查，结果存 localStorage（同一个地址只查一次）。
 * - Nominatim 规定每秒最多 1 次、要缓存结果，所以一个一个查、间隔 1.1 秒。
 * - 地址查不到会逐步放宽：完整地址 → 去掉门牌/店名 → 只用邮区+城市（lvl 标示精度：exact / street / postcode）。
 * - 只接受马来西亚范围内的结果。 */
(function(){
  "use strict";
  const API = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=my&q=";
  const CK = "site_geo_cache_v1";
  const km = (a,b,c,d) => { const r=x=>x*Math.PI/180, h=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2; return 12742*Math.asin(Math.sqrt(h)); };
  const inMY = (lat,lng) => isFinite(lat)&&isFinite(lng)&&lat>0.5&&lat<7.6&&lng>99.5&&lng<119.5;
  const norm = a => String(a||"").replace(/\s+/g," ").trim();
  const LVLS = ["exact","street","postcode"];
  let mem = {};
  try{
    const c=JSON.parse(localStorage.getItem(CK)||"{}");
    if(c&&typeof c==="object"&&!Array.isArray(c)) Object.keys(c).slice(0,200).forEach(k=>{ const v=c[k];
      if(v&&inMY(v.lat,v.lng)&&LVLS.includes(v.lvl)) mem[k]={lat:+v.lat,lng:+v.lng,lvl:v.lvl,name:String(v.name||"").slice(0,200)}; });
  }catch(e){}
  const save = () => { try{ localStorage.setItem(CK,JSON.stringify(mem)); }catch(e){} };
  function candidates(addr){
    const a=norm(addr), out=[];
    const add=(q,lvl)=>{ q=norm(q).replace(/^[,\s]+|[,\s]+$/g,""); if(q.length>=4&&!out.some(x=>x.q===q)) out.push({q,lvl}); };
    add(a,"exact");
    const parts=a.split(",").map(s=>s.trim()).filter(Boolean);
    for(let i=1;i<parts.length-1&&out.length<4;i++) add(parts.slice(i).join(", "),"street");
    const pc=a.match(/\b\d{5}\b/); if(pc) add(a.slice(a.indexOf(pc[0])).split(",")[0],"postcode");
    return out.slice(0,5);
  }
  let last=0;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  async function geocode(addr){
    const key=norm(addr).toLowerCase(); if(key.length<4) return null;
    if(mem[key]) return mem[key];
    for(const c of candidates(addr)){
      const gap=1100-(Date.now()-last); if(gap>0) await wait(gap); last=Date.now();
      let j;
      try{ const r=await fetch(API+encodeURIComponent(c.q),{headers:{"Accept-Language":"en"}}); if(!r.ok) return null; j=await r.json(); }
      catch(e){ return null; }   /* 连不上就别再试，让客人自己选 */
      if(Array.isArray(j)&&j[0]){ const lat=+j[0].lat, lng=+j[0].lon;
        if(inMY(lat,lng)){ const v={lat,lng,lvl:c.lvl,name:String(j[0].display_name||"").slice(0,200)}; mem[key]=v; save(); return v; } }
    }
    return null;
  }
  window.MKGEO = { geocode, km };
})();
