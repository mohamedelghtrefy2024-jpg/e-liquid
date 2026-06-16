// ─── COMMON UI COMPONENTS ────────────────────────────────────────────────────
// ToastContainer, labels/inputs/cards, warning banner, ingredient row (qt) and
// the simple confirmation dialog.
import {J, p} from '../vendor/vendor-react.js';
import {S, CAT_COLORS} from '../constants.js';
import {fmtEGP, sanitizeText, _toastListeners} from '../helpers.js';

export function ToastContainer(){
  const[toasts,setToasts]=J.useState([]);
  J.useEffect(()=>{
    const fn=(t)=>{
      setToasts(prev=>[...prev,t]);
      setTimeout(()=>setToasts(prev=>prev.filter(x=>x.id!==t.id)),t.duration||3000);
    };
    _toastListeners.add(fn);
    return()=>_toastListeners.delete(fn);
  },[]);
  const colors={success:S.green,error:S.red,info:S.accent,warning:S.yellow};
  return p.jsx("div",{style:{position:"fixed",top:20,right:20,zIndex:9999,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"},children:
    toasts.map(t=>p.jsxs("div",{key:t.id,style:{
      background:S.card,border:`1px solid ${colors[t.type]||S.border}`,
      color:S.text,borderRadius:10,padding:"10px 16px",fontSize:13,fontWeight:600,
      boxShadow:`0 4px 20px rgba(0,0,0,0.4)`,minWidth:200,
      borderLeft:`4px solid ${colors[t.type]||S.accent}`,
      animation:"slideIn 0.3s ease"
    },children:[
      p.jsx("span",{style:{marginLeft:8},children:t.type==="success"?"✅":t.type==="error"?"❌":t.type==="warning"?"⚠️":"ℹ️"}),
      t.msg
    ]},t.id))
  });
}

export function le({children,dir}){return p.jsx("div",{style:{fontSize:11,fontWeight:700,color:S.muted,letterSpacing:dir==="rtl"?0:1,marginBottom:6,textAlign:dir==="rtl"?"right":"left"},children})}
export function ao({value,onChange,children,style={}}){return p.jsx("select",{value,onChange:l=>onChange(l.target.value),style:{background:S.surface,border:`1px solid ${S.border}`,color:S.text,borderRadius:8,padding:"8px 12px",fontSize:13,width:"100%",...style},children})}
export function He({value,onChange,min=0,max,step=0.1,style={},error}){
  const handleChange=(i)=>{const v=parseFloat(i.target.value);if(!isNaN(v)&&v>=0)onChange(v);};
  return p.jsxs("div",{children:[p.jsx("input",{type:"number",value,min,max,step,onChange:handleChange,style:{background:S.surface,border:`1px solid ${error?S.red:S.border}`,color:S.text,borderRadius:8,padding:"8px 12px",fontSize:13,width:"100%",boxSizing:"border-box",...style}}),error&&p.jsx("div",{style:{fontSize:11,color:S.red,marginTop:3},children:error})]})}
export function ct({children,style={}}){return p.jsx("div",{style:{background:S.card,border:`1px solid ${S.border}`,borderRadius:12,padding:"18px 20px",...style},children})}
export function Lt({children}){return p.jsx("div",{style:{fontSize:13,fontWeight:700,color:S.accent,marginBottom:14,display:"flex",alignItems:"center",gap:8},children})}
export function WarnBanner({warnings}){
  if(!warnings||warnings.length===0) return null;
  const hasOver=warnings.some(w=>w.code==="OVER_TOTAL");
  return p.jsx("div",{children:warnings.map((w,i)=>{const cols={error:[S.red,S.redSoft],warning:[S.yellow,S.yellowSoft],info:[S.accent,S.accentSoft]};const[fg,bg]=cols[w.level]||cols.info;const ico={error:"✕",warning:"⚠",info:"ℹ"};return p.jsxs("div",{style:{background:bg,border:`1px solid ${fg}30`,borderRadius:8,padding:"8px 12px",display:"flex",gap:8,alignItems:"flex-start",marginBottom:6},children:[p.jsx("span",{style:{color:fg,fontSize:12,marginTop:1,flexShrink:0},children:ico[w.level]}),p.jsx("span",{style:{color:fg,fontSize:12},children:w.msg})]},i)})})
}
export function qt({item,display,highlight=false,t,cat}){
  // FIX: إزالة معاملي currency و egpRate غير المستخدمين بعد إصلاح استدعاء fmtMoneyRaw
  if(!item||item.ml===0) return null;
  const lbl=display==="volume"?`${item.ml} ${t.displayVolume}`:display==="weight"?`${item.g} ${t.displayWeight}`:`${item.drops} ${t.displayDrops}`;
  const displayNameStr=item.displayName||item.name;
  const c=CAT_COLORS[cat]||{fg:S.accent,bg:S.accentSoft,icon:"●"};
  return p.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${S.border}`},children:[p.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[p.jsx("div",{style:{width:30,height:30,borderRadius:8,background:c.bg,border:`1px solid ${c.fg}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0},children:c.icon}),p.jsxs("div",{children:[p.jsx("div",{style:{fontSize:13,color:highlight?S.text:S.dimmed,fontWeight:highlight?600:400},children:sanitizeText(item.name)}),item.mfr&&p.jsx("div",{style:{fontSize:11,color:S.muted},children:sanitizeText(item.mfr)}),item.pct>0&&p.jsxs("div",{style:{fontSize:11,color:c.fg,fontWeight:600},children:[item.pct,"%"]})]})]}),p.jsxs("div",{style:{textAlign:"right"},children:[p.jsx("div",{style:{fontSize:15,fontWeight:700,color:c.fg},children:lbl}),
    // FIX: استخدام fmtEGP مباشرة بدلاً من fmtMoneyRaw غير المعرف بشكل صحيح
    item.cost>0&&p.jsx("div",{style:{fontSize:11,color:S.muted},children:item.cost>0?fmtEGP(item.cost,2):"0.00 ج.م"})]})]})
}

// ─── CONFIRM DIALOG ──────────────────────────────────────────────────────────
export function ConfirmDialog({msg,onYes,onNo,dir}){
  return p.jsx("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1001,display:"flex",alignItems:"center",justifyContent:"center"},children:
    p.jsxs("div",{dir,style:{background:S.card,border:`1px solid ${S.border}`,borderRadius:12,padding:24,minWidth:280,textAlign:"center"},children:[
      p.jsx("div",{style:{fontSize:14,color:S.text,marginBottom:20},children:msg}),
      p.jsxs("div",{style:{display:"flex",gap:12,justifyContent:"center"},children:[
        p.jsx("button",{onClick:onYes,style:{background:S.redSoft,border:`1px solid ${S.red}`,color:S.red,borderRadius:8,padding:"8px 24px",cursor:"pointer",fontSize:13},children:"✓"}),
        p.jsx("button",{onClick:onNo,style:{background:S.surface,border:`1px solid ${S.border}`,color:S.muted,borderRadius:8,padding:"8px 24px",cursor:"pointer",fontSize:13},children:"✕"})
      ]})
    ]})
  })
}
