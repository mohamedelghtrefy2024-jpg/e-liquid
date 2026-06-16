// ── RECIPE CHART (doughnut chart via Chart.js, loaded globally as window.Chart) ─
import {J, p} from '../vendor/vendor-react.js';
import {S} from '../constants.js';

export function RecipeChart({res,t,lang}){
  const canvasRef=J.useRef(null);
  const chartRef=J.useRef(null);
  // FIX: إعادة حساب الرسم البياني فقط عند تغيير البيانات الفعلية، لا عند كل تغيير في res
  const chartDataKey=J.useMemo(()=>JSON.stringify({
    pgMl:res.pg?.ml,
    vgMl:res.vg?.ml,
    nicMl:res.nicotine?.ml,
    flavorsMl:res.flavors.map(f=>({n:f.name,ml:f.ml}))
  }),[res]);
  J.useEffect(()=>{
    if(!canvasRef.current||!window.Chart)return;
    if(chartRef.current){chartRef.current.destroy();}
    const flavLabels=res.flavors.filter(f=>f.ml>0).map(f=>f.name);
    const flavVals=res.flavors.filter(f=>f.ml>0).map(f=>f.ml);
    const nicMl=res.nicotine?.ml||0;
    const labels=["PG","VG",...flavLabels,nicMl>0?"Nicotine":""].filter(Boolean);
    const vals=[res.pg?.ml||0,res.vg?.ml||0,...flavVals,nicMl>0?nicMl:0].filter((_,i)=>labels[i]);
    const colors=["#60a5fa","#34d399","#f59e0b","#fb923c","#e879f9","#38bdf8","#a78bfa","#fbbf24"];
    chartRef.current=new window.Chart(canvasRef.current,{
      type:"doughnut",
      data:{
        labels,
        datasets:[{data:vals,backgroundColor:colors.slice(0,labels.length),borderWidth:2,borderColor:S.card}]
      },
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{
          legend:{position:"bottom",labels:{color:S.text,font:{size:11},padding:8}},
          tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${ctx.raw?.toFixed?.(1)}ml`}}
        }
      }
    });
    return()=>{if(chartRef.current)chartRef.current.destroy();};
  },[chartDataKey]);
  return p.jsxs("div",{style:{background:S.card,border:`1px solid ${S.border}`,borderRadius:12,padding:14,marginBottom:14},children:[
    p.jsxs("div",{style:{fontSize:12,fontWeight:700,color:S.accent,marginBottom:10},children:["📊 ",(lang==="ar"?"توزيع المكونات":"Composition Chart")]}),
    p.jsx("div",{style:{height:200,position:"relative"},children:
      p.jsx("canvas",{ref:canvasRef})
    })
  ]});
}
