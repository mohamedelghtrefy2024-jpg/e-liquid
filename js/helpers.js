// ─── HELPERS (rounding, unit conversions, mixing calculation) ──────────────
import {ze, Jd, NIC_SALT_DENSITIES} from './constants.js';

export function I(e,t=3){return Math.round(e*Math.pow(10,t))/Math.pow(10,t)}
export function Ie(e,t){return I(e*t)}
export function Jt(e){return Math.round(e*Jd)}

// ─── PRECISION (CRITICAL-08) ────────────────────────────────────────────────
export function roundTo(value, decimals = 3) {
  if (!Number.isFinite(value)) return 0;
  return I(value, decimals);
}

// ─── SAFE DIVIDE (FIX-10) ────────────────────────────────────────────────────
// يمنع NaN و Infinity في أي عملية قسمة داخل المحرك.
// safeDivide(a, b, fallback=0): إذا كان b=0 أو غير محدد → fallback
export function safeDivide(a, b, fallback = 0) {
  if (!b || !Number.isFinite(b) || b === 0) return fallback;
  const result = a / b;
  return Number.isFinite(result) ? result : fallback;
}

// ─── COMPUTE ────────────────────────────────────────────────────────────────
// TASK-3: المنطق الأصلي الكامل لم يُغيَّر إطلاقاً — تم فقط تسميته _qdImpl ليُستدعى من داخل غلاف try/catch (qd) أدناه
function _qdImpl(e,t){
  const n=[],r=e.targetVolumeMl;let l=0;

  // FIX-5 / FIX-6: حماية من r=0 أو r غير صالح — كل حسابات النسب (l/r*100 إلخ)
  // تنتج Infinity لو r=0، و I() لا تحمي من Infinity. نُعيد نتيجة آمنة فارغة.
  if(!r||!Number.isFinite(r)||r<=0){
    return{nicotine:{name:t.ingNicotineBase,ml:0,g:0,drops:0,pct:0,cost:0},
      pg:{name:t.ingPG,ml:0,g:0,drops:0,pct:0,cost:0},
      vg:{name:t.ingVG,ml:0,g:0,drops:0,pct:0,cost:0},
      water:{name:t.ingDistilledWater,ml:0,g:0,drops:0,pct:0,cost:0},
      alcohol:{name:t.ingAlcohol,ml:0,g:0,drops:0,pct:0,cost:0},
      flavors:[],totalFlavorPct:0,totalMl:0,totalG:0,totalCost:0,
      costPerMl:0,actualPg:0,actualVg:0,actualNic:0,actualPgPct:0,actualVgPct:0,actualWaterPct:0,actualAlcoholPct:0,warnings:[]}
  }

  const nicDensity = e.customNicDensity||NIC_SALT_DENSITIES[e.nicType]||1.01;
  if(e.targetNicStrength>0&&e.nicStockStrength>0) l=e.targetNicStrength*r/e.nicStockStrength;
  if(e.targetNicStrength>0&&e.nicStockStrength<e.targetNicStrength) n.push({level:"error",code:"NIC_TOO_LOW",msg:t.warnNicTooLow(e.nicStockStrength,e.targetNicStrength)});
  if(e.targetNicStrength>0&&e.targetNicStrength<20&&e.nicType!=="freebase") n.push({level:"info",code:"NIC_SALT_LOW",msg:t.nicSaltWarning});

  // FIX-8: تحذير تجاوز حجم النيكوتين 90% من الحجم الكلي
  if(l>0&&l>r*0.9) n.push({level:"error",code:"NIC_VOL_LIMIT",msg:t.warnNicVolLimit||"Nicotine volume exceeds 90% of total volume"});

  // REMAINING-03: Dynamic Nicotine Warnings based on deviceType
  const _deviceType = e.deviceType||"mtl";
  if(e.nicType!=="freebase"&&e.targetNicStrength>20&&_deviceType==="subohm")
    n.push({level:"error",code:"NIC_SALT_SUBOHM",msg:t.warnNicSaltSubohm||"Nic salt >20mg/ml in sub-ohm device — risk of overdose"});
  if(e.nicType!=="freebase"&&e.targetNicStrength>50&&_deviceType==="subohm")
    n.push({level:"error",code:"NIC_SALT_EXTREME",msg:t.warnNicSaltExtreme||"Nic salt >50mg/ml in sub-ohm — extreme concentration, not recommended"});
  if(e.nicType==="freebase"&&e.targetNicStrength>20&&_deviceType==="pod")
    n.push({level:"warning",code:"FREEBASE_POD_HIGH",msg:t.warnFreebasePodHigh||"Freebase >20mg/ml in pod — consider nic salt instead"});
  if(e.targetNicStrength<6&&e.targetNicStrength>0&&_deviceType==="mtl")
    n.push({level:"info",code:"NIC_LOW_MTL",msg:t.warnNicLowMtl||"Nicotine <6mg/ml in MTL device — may feel too light"});

  let o=l*e.nicCarrierPgRatio,i=l*(1-e.nicCarrierPgRatio),u=I(e.waterPct/100*r),s=I(e.alcoholPct/100*r);
  const f=e.flavors.reduce((E,M)=>E+M.pct,0);
  if(f>25) n.push({level:"warning",code:"OVER_FLAVOR",msg:t.warnOverFlavor(I(f,1))});
  if(f<3&&e.flavors.length>0) n.push({level:"info",code:"UNDER_FLAVOR",msg:t.warnUnderFlavor(I(f,1))});
  // TASK-2: تحذيرات ديناميكية إضافية تعتمد على flavorCount و averageFlavorPct (بجانب التحذيرات القديمة أعلاه)
  const flavorCount=e.flavors.length;
  const averageFlavorPct=flavorCount>0?safeDivide(f,flavorCount):0;
  if(flavorCount>=6&&f>18) n.push({level:"warning",code:"FLAVOR_MUTING_RISK",msg:t.warnFlavorMuting||"Total flavor percentage may cause muting with 6+ flavors"});
  if(flavorCount>=8&&averageFlavorPct<1) n.push({level:"info",code:"FLAVOR_NEGLIGIBLE",msg:t.warnFlavorNegligible||"Many low-percentage flavors may have negligible impact"});
  if(flavorCount<=2&&f>25) n.push({level:"warning",code:"FLAVOR_HIGH_SIMPLE",msg:t.warnFlavorHighSimple||"High flavor load for a simple recipe"});
  let v=0,h=0;
  let m=e.flavors.map(E=>{
    const M=I(E.pct/100*r);v+=M*E.pgRatio;h+=M*(1-E.pgRatio);
    const dens=e.customFlavDensities&&e.customFlavDensities[E.id]?e.customFlavDensities[E.id]:(E.pgRatio>=0.5?ze.FLAVOR_PG:ze.FLAVOR_VG);
    return{name:E.name,mfr:E.mfr,ml:I(M),g:Ie(M,dens),drops:Jt(M),pct:E.pct,cost:I(M*E.costPerMl,4)}
  });
  const x=e.pgRatio*r,C=(1-e.pgRatio)*r;

  // REMAINING-01: Water & Alcohol threshold warnings
  // احسب ميزانية VG وPG الحقيقية قبل خصم الناقلات
  const vgBudget=C, pgBudget=x;
  if(u>0&&vgBudget>0&&u>vgBudget*0.3) n.push({level:"warning",code:"WATER_HEAVY",msg:t.warnWaterHeavy(I(safeDivide(u,vgBudget)*100,1))});
  if(s>0&&pgBudget>0&&s>pgBudget*0.3) n.push({level:"warning",code:"ALCOHOL_HEAVY",msg:t.warnAlcoholHeavy(I(safeDivide(s,pgBudget)*100,1))});

  // FIX-1 / FIX-2: حساب العجز الحقيقي — لا نخفيه بـ Math.max(0)
  // pgRaw: ما تبقى من PG بعد خصم ناقل النيكوتين + نكهات PG + كحول
  // vgRaw: ما تبقى من VG بعد خصم ناقل النيكوتين + نكهات VG + ماء
  const pgRaw=I(x-o-v-s), vgRaw=I(C-i-h-u);
  let k=pgRaw<0?0:pgRaw, F=vgRaw<0?0:vgRaw;

  // FIX-1: تحذير عجز PG (الناقلات تستهلك أكثر من PG المتاح)
  if(pgRaw<-0.01) n.push({level:"warning",code:"PG_SHORTAGE",msg:t.warnPgShortage?t.warnPgShortage(I(Math.abs(pgRaw),2)):t.warnExcessPG});
  // FIX-3: تحذير عجز VG (غير موجود في الإصدار السابق)
  if(vgRaw<-0.01) n.push({level:"warning",code:"VG_SHORTAGE",msg:t.warnVgShortage?t.warnVgShortage(I(Math.abs(vgRaw),2)):"VG shortage: carriers/water consume more VG than available"});

  // FIX-VOLUME-OVERFLOW: عند عجز PG/VG فعلي (pgRaw<0 أو vgRaw<0)، الناقلات (نيكوتين+نكهات+ماء+كحول)
  // تستهلك أكثر من ميزانية PG أو VG المتاحة، فيتضخم الحجم الكلي الفعلي فوق الهدف r
  // (مثال حقيقي: طلب 1000مل ينتج 1333.333مل). نطبّق معامل تصغير نسبي واحد على كل المكونات
  // معاً (PG, VG, ماء, كحول, نيكوتين, كل النكهات) دون تغيير أي نسبة بينها، فيرجع الحجم الكلي = r بالضبط.
  // التحذيرات PG_SHORTAGE/VG_SHORTAGE أعلاه تبقى كما هي لتوضيح السبب للمستخدم.
  const cBeforeScale=l+k+F+m.reduce((E,M)=>E+M.ml,0)+u+s;
  if(cBeforeScale>r&&(pgRaw<-0.01||vgRaw<-0.01)){
    const scale=r/cBeforeScale;
    l=I(l*scale); k=I(k*scale); F=I(F*scale); u=I(u*scale); s=I(s*scale);
    o=l*e.nicCarrierPgRatio; i=l*(1-e.nicCarrierPgRatio);
    v=v*scale; h=h*scale;
    m=m.map(fl=>({...fl,ml:I(fl.ml*scale),g:I(fl.g*scale),drops:Jt(fl.ml*scale)}));
    n.push({level:"warning",code:"VOLUME_AUTO_SCALED",msg:t.warnVolumeAutoScaled?t.warnVolumeAutoScaled(I((1-scale)*100,1)):"Recipe components were scaled down proportionally to match the target volume"});
  }

  const pgDens=e.customPgDensity||ze.PG;
  const vgDens=e.customVgDensity||ze.VG;
  const waterDens=e.customWaterDensity||ze.WATER;
  const alcDens=e.customAlcDensity||ze.ALCOHOL;
  const c=I(l+k+F+m.reduce((E,M)=>E+M.ml,0)+u+s);
  const a=c>0?I((o+v+s+k)/c*100,1):0,d=c>0?I((i+h+u+F)/c*100,1):0,g=c>0?I(l*e.nicStockStrength/c,2):0;
  // TASK-1: نسب مستقلة حقيقية (PG/VG/Water/Alcohol) من إجمالي الحجم الفعلي c — بدون دمج Water/Alcohol داخل PG/VG
  const actualPgPct=I(safeDivide(k,c)*100,2), actualVgPct=I(safeDivide(F,c)*100,2),
        actualWaterPct=I(safeDivide(u,c)*100,2), actualAlcoholPct=I(safeDivide(s,c)*100,2);
  const _=Ie(l,nicDensity)+Ie(k,pgDens)+Ie(F,vgDens)+m.reduce((E,M)=>E+M.g,0)+Ie(u,waterDens)+Ie(s,alcDens);
  const j=m.reduce((E,M)=>E+M.cost,0);
  const z=I(l*e.nicCostPerMl+k*e.pgCostPerMl+F*e.vgCostPerMl+j+e.bottleCost,3);
  // Volume drift check
  const drift=Math.abs(c-r);if(drift>r*0.01&&drift>0.5) n.push({level:"info",code:"VOLUME_DRIFT",msg:t.volumeDriftWarning(c,r)});
  // FIX-7: costPerMl محمي من c=0 عبر safeDivide
  // FIX-9: حذف totalPct — كان يُحسب ولا يُستهلك في أي مكان (Dead Code)
  return{nicotine:{name:t.ingNicotineBase,ml:I(l),g:Ie(l,nicDensity),drops:Jt(l),pct:I(safeDivide(l,r)*100,2),cost:I(l*e.nicCostPerMl,4)},pg:{name:t.ingPG,ml:I(k),g:Ie(k,pgDens),drops:Jt(k),pct:I(safeDivide(k,r)*100,2),cost:I(k*e.pgCostPerMl,4)},vg:{name:t.ingVG,ml:I(F),g:Ie(F,vgDens),drops:Jt(F),pct:I(safeDivide(F,r)*100,2),cost:I(F*e.vgCostPerMl,4)},water:{name:t.ingDistilledWater,ml:u,g:Ie(u,waterDens),drops:Jt(u),pct:e.waterPct,cost:0},alcohol:{name:t.ingAlcohol,ml:s,g:Ie(s,alcDens),drops:Jt(s),pct:e.alcoholPct,cost:0},flavors:m,totalFlavorPct:I(f,2),totalMl:I(c),totalG:I(_),totalCost:z,costPerMl:safeDivide(z,c,0),actualPg:a,actualVg:d,actualNic:g,actualPgPct,actualVgPct,actualWaterPct,actualAlcoholPct,warnings:n}
}

// TASK-3: qd() Hardening — غلاف try/catch شامل حول _qdImpl بالكامل.
// يمنع Crash عند: undefined في translations (t)، density lookups، custom density access، أو reduce()/map() على بيانات غير متوقعة.
// عند الخطأ: لا Crash إطلاقاً — يُرجَع Safe Result Object كامل البنية (نفس شكل الناتج الطبيعي) مع valid:false و error:true،
// ليبقى متوافقاً مع كل أماكن استخدام res.* في الواجهة دون الحاجة لتعديلها.
export function qd(e,t){
  try{
    const safeT = t || {};
    return {..._qdImpl(e, safeT), valid:true, error:false};
  }catch(error){
    console.error("[qd] Calculation error:", error);
    const safeT = t || {};
    return{
      nicotine:{name:safeT.ingNicotineBase||"Nicotine",ml:0,g:0,drops:0,pct:0,cost:0},
      pg:{name:safeT.ingPG||"PG",ml:0,g:0,drops:0,pct:0,cost:0},
      vg:{name:safeT.ingVG||"VG",ml:0,g:0,drops:0,pct:0,cost:0},
      water:{name:safeT.ingDistilledWater||"Water",ml:0,g:0,drops:0,pct:0,cost:0},
      alcohol:{name:safeT.ingAlcohol||"Alcohol",ml:0,g:0,drops:0,pct:0,cost:0},
      flavors:[],totalFlavorPct:0,totalMl:0,totalG:0,totalCost:0,
      costPerMl:0,actualPg:0,actualVg:0,actualNic:0,
      actualPgPct:0,actualVgPct:0,actualWaterPct:0,actualAlcoholPct:0,
      valid:false,error:true,
      warnings:[{level:"error",code:"CALC_ERROR",msg:(safeT.calcError||"Calculation error — please check your inputs")}]
    };
  }
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
