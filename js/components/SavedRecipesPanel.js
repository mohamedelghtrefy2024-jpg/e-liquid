// ─── SAVED RECIPES PANEL ─────────────────────────────────────────────────────
import {J, p} from '../vendor/vendor-react.js';
import {S} from '../constants.js';

export function SavedRecipesPanel({t,dir,onLoad,onClose}){
  // FIX: تحميل الوصفات عبر useEffect مرة واحدة عند فتح اللوحة
  const [recipes,setRecipes]=J.useState({});
  const [loading,setLoading]=J.useState(true);
  J.useEffect(()=>{
    try{
      const saved=JSON.parse(localStorage.getItem("epp_recipes")||"{}");
      setRecipes(saved);
    }catch(e){
      console.error("Failed to load recipes",e);
    }finally{
      setLoading(false);
    }
  },[]);
  const names=Object.keys(recipes).sort();
  const del=(name)=>{const r={...recipes};delete r[name];localStorage.setItem("epp_recipes",JSON.stringify(r));setRecipes(r)};
  return p.jsx("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"},onClick:onClose,children:
    p.jsxs("div",{onClick:e=>e.stopPropagation(),dir,style:{background:S.card,border:`1px solid ${S.border}`,borderRadius:16,padding:24,minWidth:320,maxWidth:480,maxHeight:"80vh",overflowY:"auto"},children:[
      p.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16},children:[p.jsx("span",{style:{fontSize:16,fontWeight:700,color:S.text},children:t.savedRecipes}),p.jsx("button",{onClick:onClose,style:{background:"transparent",border:"none",color:S.muted,cursor:"pointer",fontSize:18},children:"✕"})]}),
      loading?p.jsx("div",{style:{color:S.muted,textAlign:"center",padding:20},children:"…"}):
      names.length===0?p.jsx("div",{style:{color:S.muted,textAlign:"center",padding:20},children:t.noSavedRecipes}):
      names.map(name=>p.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${S.border}`},children:[
        p.jsxs("div",{children:[p.jsx("div",{style:{fontSize:13,fontWeight:600,color:S.text},children:name}),recipes[name].steepDays&&p.jsxs("div",{style:{fontSize:11,color:S.muted},children:[t.steepingLabel,": ",recipes[name].steepDays,"d"]})]
        }),
        p.jsxs("div",{style:{display:"flex",gap:8},children:[
          p.jsx("button",{onClick:()=>{onLoad(recipes[name]);onClose()},style:{background:S.accentSoft,border:`1px solid ${S.accent}`,color:S.accent,borderRadius:6,padding:"4px 12px",cursor:"pointer",fontSize:12},children:t.loadBtn}),
          p.jsx("button",{onClick:()=>del(name),style:{background:S.redSoft,border:`1px solid ${S.red}30`,color:S.red,borderRadius:6,padding:"4px 12px",cursor:"pointer",fontSize:12},children:t.deleteRecipe})
        ]})]},name))
    ]})
  })
}
