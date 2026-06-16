// ── QR CODE MODAL (QRCode.js, loaded globally as window.QRCode) ─────────────────
import {J, p} from '../vendor/vendor-react.js';
import {S} from '../constants.js';

export function QRModal({data,onClose,lang}){
  const ref=J.useRef(null);
  J.useEffect(()=>{
    if(!ref.current||!window.QRCode)return;
    ref.current.innerHTML="";
    new window.QRCode(ref.current,{text:data,width:200,height:200,colorDark:"#1a2540",colorLight:"#ffffff"});
  },[data]);
  return p.jsx("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"},onClick:onClose,children:
    p.jsxs("div",{style:{background:S.card,borderRadius:16,padding:24,textAlign:"center"},onClick:e=>e.stopPropagation(),children:[
      p.jsx("div",{style:{fontSize:13,fontWeight:700,color:S.text,marginBottom:12},children:lang==="ar"?"QR Code الخلطة":"Recipe QR Code"}),
      p.jsx("div",{ref,style:{display:"inline-block"}}),
      p.jsx("div",{style:{fontSize:11,color:S.muted,marginTop:8},children:lang==="ar"?"امسح لمشاركة الخلطة":"Scan to share recipe"}),
      p.jsx("button",{onClick:onClose,style:{marginTop:12,padding:"6px 16px",borderRadius:8,border:`1px solid ${S.border}`,background:"transparent",color:S.dimmed,cursor:"pointer"},children:"✕"})
    ]})
  });
}
