// ─── EMOJI PICKER ─────────────────────────────────────────────────────────────
import {J, p} from '../vendor/vendor-react.js';
import {S} from '../constants.js';

const EMOJI_CATEGORIES = [
  {
    id:"fruits", label:"🍓 فواكه / Fruits",
    emojis:["🍓","🍒","🍑","🥭","🍍","🥝","🍋","🍊","🍇","🍈","🍉","🍌","🍐","🍎","🍏","🍆","🫐","🫒","🍅","🥑","🥥","🍠","🌽"]
  },
  {
    id:"berries", label:"🫐 توت / Berries & Citrus",
    emojis:["🫐","🍇","🍓","🍒","🍋","🍊","🍈","🟡","🟠","🔴","🫑","🌿","🍃","🍀"]
  },
  {
    id:"drinks", label:"🧃 مشروبات / Drinks",
    emojis:["🧃","🥤","🍹","🍸","🍺","🧋","☕","🍵","🥛","🍶","🧊","🫖","🍷","🍾","🥂","🍫","🧁","🍰","🎂"]
  },
  {
    id:"tobacco", label:"🚬 توباكو / Tobacco & Pipe",
    emojis:["🚬","🪵","🌰","🍂","🍁","🪨","🌾","🏺","🧱","🎩","🪶","🌿","🍃","🫚","🫙","🍯","🌲","🌳","🌴","🎋","🎍"]
  },
  {
    id:"sweets", label:"🍬 حلويات / Sweets & Bakery",
    emojis:["🍬","🍭","🍫","🍩","🍪","🎂","🍰","🧁","🍦","🍧","🍨","🍡","🍮","🧇","🥞","🍯","🍮","🧃","🫙","🍶"]
  },
  {
    id:"mint_herbs", label:"🌱 نعناع وأعشاب / Mint & Herbs",
    emojis:["🌱","🌿","🍃","🍀","🌾","🌵","🪴","🌸","🌺","🌻","🌼","🌷","🪷","🌹","🌲","🎄","🎋","🎍","🍁","🍂","🍄"]
  },
  {
    id:"vape", label:"💨 فيب / Vape & Industry",
    emojis:["💨","🌬️","⚗️","🧪","🔬","💉","🧴","🫙","🫗","💧","❄️","🔥","⚡","✨","💫","🌊","🌀","🫧","🧊","🌡️","⚖️","🔮"]
  },
  {
    id:"misc", label:"🎯 متنوعة / Misc",
    emojis:["🍕","🍔","🌮","🌯","🥙","🍜","🍝","🍲","🥘","🍛","🍣","🦋","🐝","🌙","⭐","🎵","🎶","💎","👑","🔑","🎯","🎪"]
  }
];

export function EmojiPicker({current, onSelect, onClose, lang}){
  const [activecat, setActivecat] = J.useState("fruits");
  const isAr = lang==="ar";
  const cat = EMOJI_CATEGORIES.find(c=>c.id===activecat)||EMOJI_CATEGORIES[0];
  return p.jsx("div",{
    style:{position:"fixed",inset:0,zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)"},
    onClick:onClose,
    children: p.jsxs("div",{
      style:{background:S.card,border:`1px solid ${S.border}`,borderRadius:16,padding:16,width:320,maxHeight:"80vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"},
      onClick:e=>e.stopPropagation(),
      children:[
        // Header
        p.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12},children:[
          p.jsx("div",{style:{fontSize:13,fontWeight:700,color:S.accent},children:isAr?"اختر إيموجي للنكهة":"Choose Flavor Emoji"}),
          p.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[
            p.jsx("div",{style:{fontSize:24},children:current||"🍓"}),
            p.jsx("button",{onClick:onClose,style:{background:"transparent",border:"none",color:S.muted,cursor:"pointer",fontSize:18,lineHeight:1},children:"✕"})
          ]})
        ]}),
        // Category tabs — scrollable row
        p.jsx("div",{style:{display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:8,scrollbarWidth:"none"},children:
          EMOJI_CATEGORIES.map(c=>p.jsx("button",{
            key:c.id,
            onClick:()=>setActivecat(c.id),
            style:{
              padding:"4px 10px",borderRadius:20,border:`1px solid ${activecat===c.id?S.accent:S.border}`,
              background:activecat===c.id?S.accentSoft:"transparent",
              color:activecat===c.id?S.accent:S.muted,
              cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",flexShrink:0
            },
            children:c.label.split(" ")[0]+" "+c.label.split(" / ")[isAr?0:1]
          },c.id))
        }),
        // Category label
        p.jsx("div",{style:{fontSize:11,color:S.muted,marginBottom:8,textAlign:isAr?"right":"left"},children:cat.label}),
        // Emoji grid
        p.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:4,overflowY:"auto",maxHeight:220,paddingRight:4},children:
          cat.emojis.map((em,i)=>p.jsx("button",{
            key:i,
            onClick:()=>{onSelect(em);onClose();},
            style:{
              fontSize:22,padding:4,borderRadius:8,border:`2px solid ${current===em?S.accent:"transparent"}`,
              background:current===em?S.accentSoft:"transparent",
              cursor:"pointer",lineHeight:1.2,
              transition:"transform 0.1s",
            },
            onMouseEnter:e=>e.currentTarget.style.transform="scale(1.3)",
            onMouseLeave:e=>e.currentTarget.style.transform="scale(1)",
            title:em,
            children:em
          },i))
        }),
        // Remove emoji option
        p.jsx("button",{
          onClick:()=>{onSelect("");onClose();},
          style:{marginTop:10,padding:"6px",borderRadius:8,border:`1px dashed ${S.border}`,background:"transparent",color:S.muted,cursor:"pointer",fontSize:11},
          children:isAr?"بدون إيموجي ✕":"No emoji ✕"
        })
      ]
    })
  });
}
