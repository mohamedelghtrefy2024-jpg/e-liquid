// ─── HELPERS (rounding, unit conversions, mixing calculation) ──────────────
import {ze, Jd, NIC_SALT_DENSITIES} from './constants.js';

export function I(e,t=3){return Math.round(e*Math.pow(10,t))/Math.pow(10,t)}
export function Ie(e,t){return I(e*t)}
export function Jt(e){return Math.round(e*Jd)}

// ─── COMPUTE ────────────────────────────────────────────────────────────────
export function qd(e,t){
  const n=[],r=e.targetVolumeMl;let l=0;
  const nicDensity = NIC_SALT_DENSITIES[e.nicType]||1.01;
  if(e.targetNicStrength>0&&e.nicStockStrength>0) l=e.targetNicStrength*r/e.nicStockStrength;
  if(e.targetNicStrength>0&&e.nicStockStrength<e.targetNicStrength) n.push({level:"error",code:"NIC_TOO_LOW",msg:t.warnNicTooLow(e.nicStockStrength,e.targetNicStrength)});
  if(e.targetNicStrength>0&&e.targetNicStrength<20&&e.nicType!=="freebase") n.push({level:"info",code:"NIC_SALT_LOW",msg:t.nicSaltWarning});
  const o=l*e.nicCarrierPgRatio,i=l*(1-e.nicCarrierPgRatio),u=I(e.waterPct/100*r),s=I(e.alcoholPct/100*r);
  const f=e.flavors.reduce((E,M)=>E+M.pct,0);
  if(f>25) n.push({level:"warning",code:"OVER_FLAVOR",msg:t.warnOverFlavor(I(f,1))});
  if(f<3&&e.flavors.length>0) n.push({level:"info",code:"UNDER_FLAVOR",msg:t.warnUnderFlavor(I(f,1))});
  let v=0,h=0;
  const m=e.flavors.map(E=>{
    const M=I(E.pct/100*r);v+=M*E.pgRatio;h+=M*(1-E.pgRatio);
    const dens=e.customFlavDensities&&e.customFlavDensities[E.id]?e.customFlavDensities[E.id]:(E.pgRatio>=0.5?ze.FLAVOR_PG:ze.FLAVOR_VG);
    return{name:E.name,mfr:E.mfr,ml:I(M),g:Ie(M,dens),drops:Jt(M),pct:E.pct,cost:I(M*E.costPerMl,4)}
  });
  const x=e.pgRatio*r,C=(1-e.pgRatio)*r;
  const k=Math.max(0,I(x-o-v-s)),F=Math.max(0,I(C-i-h-u));
  if(I(x-o-v-s)<-0.01) n.push({level:"warning",code:"EXCESS_PG",msg:t.warnExcessPG});
  const pgDens=e.customPgDensity||ze.PG;
  const vgDens=e.customVgDensity||ze.VG;
  const waterDens=e.customWaterDensity||ze.WATER;
  const alcDens=e.customAlcDensity||ze.ALCOHOL;
  const c=I(l+k+F+m.reduce((E,M)=>E+M.ml,0)+u+s);
  const a=c>0?I((o+v+s+k)/c*100,1):0,d=c>0?I((i+h+u+F)/c*100,1):0,g=c>0?I(l*e.nicStockStrength/c,2):0;
  const _=Ie(l,nicDensity)+Ie(k,pgDens)+Ie(F,vgDens)+m.reduce((E,M)=>E+M.g,0)+Ie(u,waterDens)+Ie(s,alcDens);
  const j=m.reduce((E,M)=>E+M.cost,0);
  const z=I(l*e.nicCostPerMl+k*e.pgCostPerMl+F*e.vgCostPerMl+j+e.bottleCost,3);
  // Volume drift check
  const drift=Math.abs(c-r);if(drift>r*0.01&&drift>0.5) n.push({level:"info",code:"VOLUME_DRIFT",msg:t.volumeDriftWarning(c,r)});
  // Total % overflow check
  const totalPct=(e.targetNicStrength>0&&e.nicStockStrength>0?I(l/r*100,2):0)+(I(k/r*100,2))+(I(F/r*100,2))+f+e.waterPct+e.alcoholPct;
  return{nicotine:{name:t.ingNicotineBase,ml:I(l),g:Ie(l,nicDensity),drops:Jt(l),pct:I(l/r*100,2),cost:I(l*e.nicCostPerMl,4)},pg:{name:t.ingPG,ml:I(k),g:Ie(k,pgDens),drops:Jt(k),pct:I(k/r*100,2),cost:I(k*e.pgCostPerMl,4)},vg:{name:t.ingVG,ml:I(F),g:Ie(F,vgDens),drops:Jt(F),pct:I(F/r*100,2),cost:I(F*e.vgCostPerMl,4)},water:{name:t.ingDistilledWater,ml:u,g:Ie(u,waterDens),drops:Jt(u),pct:e.waterPct,cost:0},alcohol:{name:t.ingAlcohol,ml:s,g:Ie(s,alcDens),drops:Jt(s),pct:e.alcoholPct,cost:0},flavors:m,totalFlavorPct:I(f,2),totalMl:I(c),totalG:I(_),totalCost:z,costPerMl:I(z/c,4),actualPg:a,actualVg:d,actualNic:g,warnings:n,totalPct:I(totalPct,1)}
}

// ─── CURRENCY (EGP) & TEXT SANITIZATION ─────────────────────────────────────
export function fmtEGP(val,decimals=2){
  if(val===undefined||val===null||isNaN(val)) return "0.00 ج.م";
  return `${I(val,decimals)} ج.م`;
}
// Alias for backward compat in copy/print helpers
export function fmtMoneyRaw(val,_c,_r,decimals=2){ return fmtEGP(val,decimals); }
// FIX: دالة تطهير النصوص لمنع XSS عند عرض أسماء النكهات/الشركات المصنعة
export function sanitizeText(text){
  if(!text) return '';
  return String(text).replace(/[<>]/g,'').substring(0,50);
}

// ─── TOAST SYSTEM ────────────────────────────────────────────────────────────
let _toastId=0;
export const _toastListeners=new Set();
export function showToast(msg,type="info",duration=3000){
  const id=++_toastId;
  _toastListeners.forEach(fn=>fn({id,msg,type,duration}));
}
