// ─── MAIN APP ────────────────────────────────────────────────────────────────
import {J, p, yc} from './vendor/vendor-react.js';
import {Zd} from './translations.js';
import {ze, bd, ep, tp, np, rp, S, applyTheme} from './constants.js';
import {qd, fmtEGP, sanitizeText, showToast} from './helpers.js';
import {ToastContainer, le, ao, He, ct, Lt, WarnBanner, qt} from './components/common.js';
import {EmojiPicker} from './components/EmojiPicker.js';
import {SteepTimer} from './components/SteepTimer.js';
import {RecipeChart} from './components/RecipeChart.js';
import {QRModal} from './components/QRModal.js';
import {SavedRecipesPanel} from './components/SavedRecipesPanel.js';
import {exportPDF} from './components/pdfExport.js';

function op(){
  // Persist lang preference
  const[lang,setLang]=J.useState(()=>localStorage.getItem("epp_lang")||"ar");
  const[theme,setTheme]=J.useState(()=>localStorage.getItem("epp_theme")||"dark");
  const toggleTheme=()=>{
    const next=theme==="dark"?"light":"dark";
    applyTheme(next);
    setTheme(next);
  };
  J.useEffect(()=>{localStorage.setItem("epp_lang",lang)},[lang]);
  const n=Zd[lang],r=n.dir,l=r==="rtl";
  const fontFamily=l?"'Segoe UI','Arial','Tahoma',sans-serif":"system-ui,-apple-system,sans-serif";

  // FIX: تحديث عنوان الصفحة ديناميكيًا عند تغيير اللغة
  J.useEffect(()=>{
    document.title=n.appTitle+" — "+(lang==="ar"?"حاسبة السوائل الإلكترونية":"E-Liquid Calculator");
  },[lang,n]);

  // State
  const[volPreset,setVolPreset]=J.useState(100);
  const[customVol,setCustomVol]=J.useState(100);
  const[pgRatio,setPgRatio]=J.useState(0.3);
  const[pgPreset,setPgPreset]=J.useState("30/70");
  const[targetNic,setTargetNic]=J.useState(3);
  const[stockStr,setStockStr]=J.useState(72);
  const[nicType,setNicType]=J.useState("freebase");
  const[nicCarrierPg,setNicCarrierPg]=J.useState(1);
  const[waterPct,setWaterPct]=J.useState(0);
  const[alcPct,setAlcPct]=J.useState(0);
  const[pgBottlePrice,setPgBottlePrice]=J.useState(60);
  const[pgBottleSize,setPgBottleSize]=J.useState(1000);
  const[vgBottlePrice,setVgBottlePrice]=J.useState(80);
  const[vgBottleSize,setVgBottleSize]=J.useState(1000);
  const[nicBottlePrice,setNicBottlePrice]=J.useState(350);
  const[nicBottleSize,setNicBottleSize]=J.useState(30);
  const[bottleCost,setBottleCost]=J.useState(5);
  const pgCost=pgBottleSize>0?pgBottlePrice/pgBottleSize:0;
  const vgCost=vgBottleSize>0?vgBottlePrice/vgBottleSize:0;
  const nicCost=nicBottleSize>0?nicBottlePrice/nicBottleSize:0;
  // currency system removed — EGP only
  const[display,setDisplay]=J.useState("volume");
  const[flavors,setFlavors]=J.useState([{id:1,name:"Strawberry",mfr:"TPA/TFA",pct:6,pgRatio:1,flavorBottlePrice:80,flavorBottleSize:30,emoji:"🍓"},{id:2,name:"Fresh Cream",mfr:"Capella",pct:3,pgRatio:1,flavorBottlePrice:100,flavorBottleSize:30,emoji:"🍦"}]);
  const[activeTab,setActiveTab]=J.useState("basics");
  // Custom densities
  const[customPgDens,setCustomPgDens]=J.useState(ze.PG);
  const[customVgDens,setCustomVgDens]=J.useState(ze.VG);
  const[customFlavDens,setCustomFlavDens]=J.useState({});
  // Steeping
  const[steepDays,setSteepDays]=J.useState(0);
  const[showChart,setShowChart]=J.useState(false);
  const[showQR,setShowQR]=J.useState(false);
  const[emojiPickerForId,setEmojiPickerForId]=J.useState(null);
  const[alarmDate,setAlarmDate]=J.useState(()=>localStorage.getItem("epp_alarm_date")||"");
  const alarmIntervalRef=J.useRef(null);

  // ── Alarm checker ─────────────────────────────────────────────────────────
  J.useEffect(()=>{
    if(!alarmDate) return;
    // FIX: إلغاء أي مؤقت سابق قبل إنشاء مؤقت جديد لتجنب تراكم المؤقتات
    if(alarmIntervalRef.current){
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current=null;
    }
    const check=()=>{
      const now=new Date();
      const target=new Date(alarmDate);
      if(now>=target){
        // Fire notification
        if(Notification&&Notification.permission==="granted"){
          new Notification(n.alarmTitle,{body:n.alarmMsg,icon:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E⏰%3C/text%3E%3C/svg%3E"});
        }else{
          alert(n.alarmMsg);
        }
        localStorage.removeItem("epp_alarm_date");
        setAlarmDate("");
        clearInterval(alarmIntervalRef.current);
      }
    };
    check();
    alarmIntervalRef.current=setInterval(check,30000);
    return ()=>{
      if(alarmIntervalRef.current){
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current=null;
      }
    };
  },[alarmDate,n]);

  const setAlarm=(readyDate)=>{
    const d=readyDate.toISOString();
    localStorage.setItem("epp_alarm_date",d);
    setAlarmDate(d);
    if(Notification&&Notification.permission==="default"){
      Notification.requestPermission();
    }
  };
  const clearAlarm=()=>{
    localStorage.removeItem("epp_alarm_date");
    setAlarmDate("");
    clearInterval(alarmIntervalRef.current);
  };
  const[mixedOn,setMixedOn]=J.useState("");
  // UX modals
  const[showSaved,setShowSaved]=J.useState(false);
  const[confirmDel,setConfirmDel]=J.useState(null); // {id}
  const[recipeName,setRecipeName]=J.useState("");

  const targetMl=volPreset==="custom"?customVol:volPreset;

  const flavorsWithCost=flavors.map(f=>({...f,costPerMl:f.flavorBottleSize>0?f.flavorBottlePrice/f.flavorBottleSize:0,displayName:(f.emoji?f.emoji+" ":"")+f.name}));
  const res=qd({targetVolumeMl:targetMl,pgRatio,nicCarrierPgRatio:nicCarrierPg,targetNicStrength:targetNic,nicStockStrength:stockStr,nicType,flavors:flavorsWithCost,waterPct,alcoholPct:alcPct,pgCostPerMl:pgCost,vgCostPerMl:vgCost,nicCostPerMl:nicCost,bottleCost,customPgDensity:customPgDens,customVgDensity:customVgDens,customFlavDensities:customFlavDens},n);

  // Add overflow-100% warning
  // FIX: حساب دقيق للتجاوز باستخدام الأحجام الفعلية (مل) بدلاً من جمع النسب المئوية
  const totalUsedMl=(res.nicotine?.ml||0)+(res.pg?.ml||0)+(res.vg?.ml||0)+
                    res.flavors.reduce((sum,f)=>sum+(f.ml||0),0)+
                    (res.water?.ml||0)+(res.alcohol?.ml||0);
  const totalExceeds100=totalUsedMl>targetMl+0.05; // هامش 0.05 مل
  const allWarns=[...(totalExceeds100?[{level:"error",code:"OVER_TOTAL",msg:n.overrideTotalWarning}]:[]  ),...res.warnings];

  // Helpers
  const addFlavor=()=>setFlavors(w=>[...w,{id:Date.now(),name:n.newFlavor,mfr:"TPA/TFA",pct:5,pgRatio:1,flavorBottlePrice:80,flavorBottleSize:30,emoji:"🍓"}]);
  const deleteFlavor=(id)=>{
    if(window.confirm(n.confirmDeleteFlavor)) setFlavors(w=>w.filter(f=>f.id!==id));
  };
  const updateFlavor=(id,key,val)=>setFlavors(w=>w.map(f=>f.id===id?{...f,[key]:val}:f));
  const applyPgPreset=(pr)=>{setPgPreset(pr.label);setPgRatio(pr.pg)};
  const btnStyle=(active,fg=S.accent,bg=S.accentSoft)=>({padding:"6px 14px",borderRadius:8,border:`1px solid ${active?fg:S.border}`,background:active?bg:"transparent",color:active?fg:S.dimmed,cursor:"pointer",fontSize:13,fontWeight:active?700:400});

  // ── Save/Load/Export/Import ──
  const getState=()=>({volPreset,customVol,pgRatio,pgPreset,targetNic,stockStr,nicType,nicCarrierPg,waterPct,alcPct,pgBottlePrice,pgBottleSize,vgBottlePrice,vgBottleSize,nicBottlePrice,nicBottleSize,bottleCost,flavors,customPgDens,customVgDens,customFlavDens,steepDays,mixedOn:new Date().toISOString().slice(0,10)});
  const applyState=(s)=>{
    // FIX: إضافة قيم افتراضية للحقول المفقودة لدعم تحميل الوصفات القديمة بدون أخطاء
    const defaultedState={
      ...s,
      mixedOn:s.mixedOn||new Date().toISOString().slice(0,10),
      steepDays:s.steepDays||0,
      customFlavDens:s.customFlavDens||{},
      flavors:(s.flavors||[]).map(f=>({
        ...f,
        flavorBottlePrice:f.flavorBottlePrice!==undefined?f.flavorBottlePrice:(f.costPerMl?f.costPerMl*30:80),
        flavorBottleSize:f.flavorBottleSize||30,
        emoji:f.emoji||"🍓"
      }))
    };
    s=defaultedState;
    if(s.volPreset!==undefined) setVolPreset(s.volPreset);
    if(s.customVol!==undefined) setCustomVol(s.customVol);
    if(s.pgRatio!==undefined) setPgRatio(s.pgRatio);
    if(s.pgPreset!==undefined) setPgPreset(s.pgPreset);
    if(s.targetNic!==undefined) setTargetNic(s.targetNic);
    if(s.stockStr!==undefined) setStockStr(s.stockStr);
    if(s.nicType!==undefined) setNicType(s.nicType);
    if(s.nicCarrierPg!==undefined) setNicCarrierPg(s.nicCarrierPg);
    if(s.waterPct!==undefined) setWaterPct(s.waterPct);
    if(s.alcPct!==undefined) setAlcPct(s.alcPct);
    // New bottle-based fields
    if(s.pgBottlePrice!==undefined) setPgBottlePrice(s.pgBottlePrice);
    if(s.pgBottleSize!==undefined) setPgBottleSize(s.pgBottleSize);
    if(s.vgBottlePrice!==undefined) setVgBottlePrice(s.vgBottlePrice);
    if(s.vgBottleSize!==undefined) setVgBottleSize(s.vgBottleSize);
    if(s.nicBottlePrice!==undefined) setNicBottlePrice(s.nicBottlePrice);
    if(s.nicBottleSize!==undefined) setNicBottleSize(s.nicBottleSize);
    if(s.bottleCost!==undefined) setBottleCost(s.bottleCost);
    if(s.flavors!==undefined){
      // Backward compat: if old flavors have costPerMl but no bottle fields, convert
      const migratedFlavors=s.flavors.map(f=>{
        if(f.costPerMl!==undefined&&f.flavorBottlePrice===undefined){
          return {...f,flavorBottlePrice:parseFloat((f.costPerMl*30).toFixed(2)),flavorBottleSize:30};
        }
        return f;
      });
      setFlavors(migratedFlavors);
    }
    if(s.customPgDens!==undefined) setCustomPgDens(s.customPgDens);
    if(s.customVgDens!==undefined) setCustomVgDens(s.customVgDens);
    if(s.customFlavDens!==undefined) setCustomFlavDens(s.customFlavDens);
    if(s.steepDays!==undefined) setSteepDays(s.steepDays);
    if(s.mixedOn!==undefined) setMixedOn(s.mixedOn);
  };
  const saveRecipe=()=>{
    const name=window.prompt(n.recipeName,recipeName||"My Recipe");
    if(!name) return;
    setRecipeName(name);
    const existing=JSON.parse(localStorage.getItem("epp_recipes")||"{}");
    existing[name]={...getState(),mixedOn:new Date().toISOString().slice(0,10)};
    localStorage.setItem("epp_recipes",JSON.stringify(existing));
  };
  const exportJson=()=>{
    const blob=new Blob([JSON.stringify(getState(),null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="epp-recipe.json";a.click();
  };
  const importJson=()=>{
    const inp=document.createElement("input");inp.type="file";inp.accept=".json";
    inp.onchange=e=>{const f=e.target.files[0];if(!f) return;const rd=new FileReader();rd.onload=ev=>{try{applyState(JSON.parse(ev.target.result))}catch{alert("Invalid JSON")}};rd.readAsText(f)};
    inp.click();
  };
  const copyList=()=>{
    const display2=n;
    const allItems=[res.nicotine,res.pg,res.vg,...res.flavors,res.water,res.alcohol].filter(x=>x&&x.ml>0);
    const lines=allItems.map(x=>`${x.displayName||x.name}: ${x.ml}${display2.displayVolume} / ${x.g}${display2.displayWeight} / ${x.drops}${display2.displayDrops}${x.cost>0?` / ${fmtEGP(x.cost,2)}`:""}`);
    lines.push(`---`);lines.push(`${n.totalCost}: ${fmtEGP(res.totalCost,2)}`);
    navigator.clipboard.writeText(lines.join("\n"))
      .then(()=>showToast(n.copySuccess||"✅ Copied!","success"))
      .catch(()=>showToast("Copy failed","error"));
  };
  const printRecipe=()=>{
    const el=document.getElementById("print-content");
    if(el){el.style.display="block";window.print();setTimeout(()=>{el.style.display="none"},500);}
    else window.print();
  };

  const tabs=["basics","nicotine","flavors","additives","costs"];
  const tabLabels={basics:n.tabBasics,nicotine:n.tabNicotine,flavors:n.tabFlavors,additives:n.tabAdditives,costs:n.tabCosts};

  // ─── PRINT SECTION — Full Details ─────────────────────────────────────────
  const today_print=new Date().toLocaleDateString(lang==="ar"?"ar-EG":"en-GB",{year:"numeric",month:"long",day:"numeric"});
  const allPrintItems=[res.nicotine,res.pg,res.vg,...res.flavors,res.water,res.alcohol].filter(x=>x&&x.ml>0);
  const readyDate_print=steepDays&&mixedOn?new Date(new Date(mixedOn).getTime()+steepDays*86400000):null;
  
  const catDotColor=(item)=>{
    if(item.name===n.nicotine||item.cat==="nicotine") return "#a78bfa";
    if(item.name==="PG"||item.name==="Propylene Glycol") return "#60a5fa";
    if(item.name==="VG"||item.name==="Vegetable Glycerin") return "#34d399";
    return "#f59e0b";
  };

  // FIX: جعل عمود الكمية في الطباعة يتوافق مع وحدة العرض المختارة (volume/weight/drops)
  const printAmountLabel=display==="weight"?`${n.displayWeight} / g`:display==="drops"?`${n.displayDrops} / Drops`:`${n.displayVolume} / ml`;
  const printAmountValue=(x)=>display==="weight"?x.g:display==="drops"?x.drops:x.ml;
  const printAmountTotal=display==="weight"?res.totalG:display==="drops"?"—":targetMl;

  const printSection=p.jsx("div",{className:"print-section",id:"print-content",style:{display:"none"},dir:r,children:
    p.jsxs("div",{className:"print-page",children:[
      /* ── Header ── */
      p.jsxs("div",{className:"print-header",children:[
        p.jsxs("div",{children:[
          p.jsx("div",{className:"print-recipe-title",children:recipeName||n.appTitle}),
          p.jsxs("div",{style:{fontSize:12,color:"#666",marginTop:4},children:["EPP Calculator — E-Liquid Recipe"]}),
        ]}),
        p.jsxs("div",{className:"print-meta",children:[
          p.jsxs("div",{children:[n.printDate," ",today_print]}),
          p.jsxs("div",{children:[n.printTotalVol," ",targetMl," مل"]}),
          p.jsxs("div",{children:[n.printActualRatio," PG ",res.actualPg,"% / VG ",res.actualVg,"%"]}),
          p.jsxs("div",{children:[n.printTargetNic," ",res.actualNic," ",n.mgml]}),
        ]})
      ]}),

      /* ── Composition Bar ── */
      p.jsx("div",{className:"print-section-title",children:n.printRatioTitle}),
      p.jsx("div",{className:"print-ratio-bar-wrap",children:
        p.jsxs("div",{style:{display:"flex",width:"100%",height:"100%"},children:[
          p.jsx("div",{style:{width:`${res.actualPg}%`,background:"#60a5fa",transition:"width 0.3s"}}),
          p.jsx("div",{style:{width:`${res.actualVg}%`,background:"#34d399"}}),
          res.flavors.filter(f=>f.ml>0).map((f,i)=>p.jsx("div",{key:i,style:{width:`${(f.ml/targetMl)*100}%`,background:"#f59e0b"}})),
        ]}),
      }),
      p.jsxs("div",{style:{display:"flex",gap:16,fontSize:10,color:"#555",marginTop:4,marginBottom:10},children:[
        p.jsxs("span",{children:[p.jsx("span",{className:"print-color-dot",style:{background:"#60a5fa"}}), "PG ",res.actualPg,"%"]}),
        p.jsxs("span",{children:[p.jsx("span",{className:"print-color-dot",style:{background:"#34d399"}}), "VG ",res.actualVg,"%"]}),
        p.jsxs("span",{children:[p.jsx("span",{className:"print-color-dot",style:{background:"#a78bfa"}}), n.nicotine," ",res.actualNic,n.mgml]}),
        res.flavors.filter(f=>f.ml>0).length>0&&p.jsxs("span",{children:[p.jsx("span",{className:"print-color-dot",style:{background:"#f59e0b"}}), n.tabFlavors]}),
      ]}),

      /* ── Ingredients Table ── */
      p.jsx("div",{className:"print-section-title",children:n.printIngredients}),
      p.jsxs("table",{className:"print-table",children:[
        p.jsx("thead",{children:
          p.jsxs("tr",{children:[
            p.jsx("th",{style:{width:"30%"},children:"المكوّن / Ingredient"}),
            p.jsx("th",{children:printAmountLabel}),
            p.jsx("th",{children:n.printFlavorPct}),
            p.jsx("th",{children:n.printCostPerMl+" (ج.م)"}),
            p.jsx("th",{children:"التكلفة / Cost (ج.م)"}),
          ]}),
        }),
        p.jsx("tbody",{children:allPrintItems.map((x,i)=>
          p.jsxs("tr",{key:i,children:[
            p.jsxs("td",{style:{fontWeight:600},children:[
              p.jsx("span",{className:"print-color-dot",style:{background:catDotColor(x)}}),
              x.name, x.mfr?p.jsxs("span",{style:{fontWeight:400,color:"#888",fontSize:10},children:[" — ",x.mfr]}):null
            ]}),
            p.jsx("td",{style:{textAlign:"center"},children:printAmountValue(x)}),
            p.jsx("td",{style:{textAlign:"center"},children:x.pct>0?`${x.pct}%`:"—"}),
            p.jsx("td",{style:{textAlign:"center"},children:x.cost>0?fmtEGP(x.cost/x.ml,4):"—"}),
            p.jsx("td",{style:{textAlign:"center",fontWeight:600},children:x.cost>0?fmtEGP(x.cost,2):"—"}),
          ]},i)
        )}),
        p.jsx("tfoot",{children:
          p.jsxs("tr",{style:{fontWeight:700,background:"#f0f4f8"},children:[
            p.jsx("td",{children:"الإجمالي / Total"}),
            p.jsx("td",{style:{textAlign:"center"},children:printAmountTotal}),
            p.jsx("td",{colSpan:2}),
            p.jsx("td",{style:{textAlign:"center",color:"#1a2540"},children:fmtEGP(res.totalCost,2)}),
          ]}),
        }),
      ]}),

      /* ── Nicotine Details ── */
      p.jsx("div",{className:"print-section-title",children:n.printNicotineSection}),
      p.jsxs("div",{style:{display:"flex",gap:24,fontSize:12,color:"#444",flexWrap:"wrap",marginBottom:10},children:[
        p.jsxs("span",{children:["Target: ",targetNic," ",n.mgml]}),
        p.jsxs("span",{children:["Stock: ",stockStr," ",n.mgml," (",nicType,")"]}),
        p.jsxs("span",{children:["Carrier: PG ",nicCarrierPg,"% / VG ",(100-nicCarrierPg),"%"]}),
        p.jsxs("span",{children:["Actual: ",res.actualNic," ",n.mgml]}),
        res.nicotine&&p.jsxs("span",{style:{fontWeight:700},children:["Volume: ",res.nicotine.ml," ml"]}),
      ]}),

      /* ── Flavors Details (if any) ── */
      res.flavors.filter(f=>f.ml>0).length>0&&p.jsxs("div",{children:[
        p.jsx("div",{className:"print-section-title",children:n.tabFlavors}),
        p.jsxs("table",{className:"print-table",children:[
          p.jsx("thead",{children:
            p.jsxs("tr",{children:[
              p.jsx("th",{children:"النكهة / Flavor"}),
              p.jsx("th",{children:"الشركة / Brand"}),
              p.jsx("th",{children:n.printFlavorPct}),
              p.jsx("th",{children:"Carrier PG%"}),
              p.jsx("th",{children:"سعر الزجاجة"}),
              p.jsx("th",{children:"حجم الزجاجة"}),
              p.jsx("th",{children:"ج.م / مل"}),
            ]})
          }),
          p.jsx("tbody",{children:
            res.flavors.filter(f=>f.ml>0).map((f,i)=>{
              const srcFlavor=flavors.find(x=>x.name===f.name)||{};
              const bPrice=srcFlavor.flavorBottlePrice||0;
              const bSize=srcFlavor.flavorBottleSize||30;
              return p.jsxs("tr",{key:i,children:[
                p.jsx("td",{style:{fontWeight:600},children:f.name}),
                p.jsx("td",{children:f.mfr||"—"}),
                p.jsx("td",{style:{textAlign:"center"},children:`${f.pct}%`}),
                p.jsx("td",{style:{textAlign:"center"},children:`${Math.round((srcFlavor.pgRatio||1)*100)}%`}),
                p.jsx("td",{style:{textAlign:"center"},children:fmtEGP(bPrice,2)}),
                p.jsx("td",{style:{textAlign:"center"},children:`${bSize} مل`}),
                p.jsx("td",{style:{textAlign:"center",fontWeight:600},children:fmtEGP(bSize>0?bPrice/bSize:0,4)}),
              ]})
            })
          }),
        ]}),
      ]}),

      /* ── Cost Breakdown ── */
      p.jsx("div",{className:"print-section-title",children:n.printCostSection}),
      p.jsxs("div",{className:"print-cost-grid",children:[
        p.jsxs("div",{className:"print-cost-card",children:[
          p.jsx("div",{children:"⚗ PG"}),
          p.jsxs("div",{className:"val",children:[fmtEGP(pgBottlePrice,2)," / ",pgBottleSize,"مل"]}),
          p.jsxs("div",{style:{color:"#888"},children:["≈ ",fmtEGP(pgCost,4)," ج.م/مل"]}),
        ]}),
        p.jsxs("div",{className:"print-cost-card",children:[
          p.jsx("div",{children:"🌿 VG"}),
          p.jsxs("div",{className:"val",children:[fmtEGP(vgBottlePrice,2)," / ",vgBottleSize,"مل"]}),
          p.jsxs("div",{style:{color:"#888"},children:["≈ ",fmtEGP(vgCost,4)," ج.م/مل"]}),
        ]}),
        p.jsxs("div",{className:"print-cost-card",children:[
          p.jsx("div",{children:"💉 Nicotine"}),
          p.jsxs("div",{className:"val",children:[fmtEGP(nicBottlePrice,2)," / ",nicBottleSize,"مل"]}),
          p.jsxs("div",{style:{color:"#888"},children:["≈ ",fmtEGP(nicCost,4)," ج.م/مل"]}),
        ]}),
        p.jsxs("div",{className:"print-cost-card",children:[
          p.jsx("div",{children:"📦 "+n.bottleCostLabel}),
          p.jsxs("div",{className:"val",children:[fmtEGP(bottleCost,2)]}),
        ]}),
        p.jsxs("div",{className:"print-cost-card",style:{gridColumn:"2 / 4",background:"#fef9c3"},children:[
          p.jsx("div",{style:{fontWeight:700},children:"💰 "+n.totalCost}),
          p.jsxs("div",{className:"val",style:{fontSize:20,color:"#92400e"},children:[fmtEGP(res.totalCost,2)]}),
          p.jsxs("div",{style:{color:"#888"},children:["(",fmtEGP(res.costPerMl,4)," ج.م/مل)"]}),
        ]}),
      ]}),

      /* ── Steeping ── */
      steepDays>0&&mixedOn&&p.jsxs("div",{children:[
        p.jsx("div",{className:"print-section-title",children:n.printSteepSection}),
        p.jsxs("div",{className:"print-steep-box",children:[
          p.jsxs("div",{style:{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8},children:[
            p.jsxs("div",{children:[
              p.jsxs("div",{children:[n.printSteepMixed," ",new Date(mixedOn).toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"})]}),
              readyDate_print&&p.jsxs("div",{style:{fontWeight:700,color:"#1e40af",marginTop:4},children:[n.printSteepReady," ",readyDate_print.toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"})]}),
            ]}),
            p.jsxs("div",{style:{textAlign:"center"},children:[
              p.jsx("div",{style:{fontSize:28},children:"🧪"}),
              p.jsxs("div",{style:{fontWeight:700},children:[steepDays," يوم"]}),
            ]})
          ]}),
          alarmDate&&p.jsxs("div",{style:{marginTop:6,color:"#b45309",fontSize:11},children:["⏰ ",n.alarmActive,": ",new Date(alarmDate).toLocaleDateString("ar-EG")]}),
        ]}),
      ]}),

      /* ── Footer ── */
      p.jsxs("div",{className:"print-footer",children:[
        p.jsx("span",{children:n.printFooter}),
        p.jsx("span",{children:today_print}),
      ]})
    ]})
  });

  return p.jsxs("div",{dir:r,style:{background:S.bg,minHeight:"100vh",fontFamily,color:S.text},children:[
    // Print styles override
    p.jsx("style",{children:`@media print { body > * { display:none!important; } #print-content { display:block!important; } .print-section,.print-page { display:block!important; } }`}),
    
    // ── HEADER ──────────────────────────────────────────────────────────────
    p.jsx("div",{className:"no-print",style:{background:"linear-gradient(135deg,#0f172a 0%,#1a2540 100%)",borderBottom:`1px solid ${S.border}`,padding:"16px 24px"},children:
      p.jsxs("div",{style:{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12},children:[
        p.jsxs("div",{children:[
          p.jsx("div",{style:{fontSize:11,color:S.muted,letterSpacing:l?0:3,textTransform:"uppercase"},children:n.platformName}),
          p.jsxs("div",{style:{fontSize:22,fontWeight:800,display:"flex",alignItems:"center",gap:10},children:[
            p.jsx("svg",{width:36,height:36,viewBox:"0 0 40 40",style:{flexShrink:0},children:p.jsxs(p.Fragment,{children:[
              p.jsx("defs",{children:p.jsxs("linearGradient",{id:"eppLogoGrad",x1:"0%",y1:"0%",x2:"100%",y2:"100%",children:[p.jsx("stop",{offset:"0%",stopColor:S.accent}),p.jsx("stop",{offset:"100%",stopColor:S.vg})]})}),
              p.jsx("circle",{cx:20,cy:20,r:19,fill:S.card,stroke:"url(#eppLogoGrad)",strokeWidth:1.5}),
              p.jsx("rect",{x:17,y:9,width:6,height:16,rx:2,fill:"url(#eppLogoGrad)"}),
              p.jsx("rect",{x:19,y:6,width:2,height:4,rx:1,fill:S.dimmed}),
              p.jsx("circle",{cx:13,cy:27,r:2.4,fill:S.accent,opacity:0.55}),
              p.jsx("circle",{cx:20,cy:30,r:3.2,fill:S.vg,opacity:0.5}),
              p.jsx("circle",{cx:27,cy:27,r:2.4,fill:"#38bdf8",opacity:0.55})
            ]})}),
            p.jsx("span",{style:{background:`linear-gradient(90deg,${S.accent},#38bdf8)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},children:n.appTitle})
          ]})
        ]}),
        p.jsxs("div",{style:{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"},children:[
          p.jsx("button",{onClick:()=>setLang(l2=>l2==="en"?"ar":"en"),style:{padding:"6px 16px",borderRadius:8,border:`1px solid ${S.green}`,background:S.greenSoft,color:S.green,cursor:"pointer",fontSize:13,fontWeight:700},children:lang==="en"?"🌐 العربية":"🌐 English"}),
          // Action buttons
          p.jsx("button",{onClick:saveRecipe,style:{padding:"6px 12px",borderRadius:8,border:`1px solid ${S.accent}`,background:S.accentSoft,color:S.accent,cursor:"pointer",fontSize:12,fontWeight:600},children:n.saveRecipe}),
          p.jsx("button",{onClick:()=>setShowSaved(true),style:{padding:"6px 12px",borderRadius:8,border:`1px solid ${S.border}`,background:S.surface,color:S.dimmed,cursor:"pointer",fontSize:12},children:n.loadRecipe}),
          p.jsx("button",{onClick:copyList,style:{padding:"6px 12px",borderRadius:8,border:`1px solid ${S.border}`,background:S.surface,color:S.dimmed,cursor:"pointer",fontSize:12},children:n.copyList}),
          p.jsx("button",{onClick:toggleTheme,style:{padding:"6px 12px",borderRadius:8,border:`1px solid ${S.border}`,background:S.surface,color:S.accent,cursor:"pointer",fontSize:12,fontWeight:700},children:theme==="dark"?n.themeToggleLight:n.themeToggle}),
          p.jsx("button",{onClick:()=>setShowChart(c=>!c),style:{padding:"6px 12px",borderRadius:8,border:`1px solid ${S.border}`,background:showChart?S.accentSoft:S.surface,color:S.accent,cursor:"pointer",fontSize:12},children:n.showChart}),
          p.jsx("button",{onClick:()=>setShowQR(true),style:{padding:"6px 12px",borderRadius:8,border:`1px solid ${S.border}`,background:S.surface,color:S.muted,cursor:"pointer",fontSize:12},children:n.showQR}),
          p.jsx("button",{onClick:()=>exportPDF({res,recipeName,targetMl,t:n,lang,fmtEGP,flavors,pgBottlePrice,pgBottleSize,vgBottlePrice,vgBottleSize,nicBottlePrice,nicBottleSize,bottleCost,pgCost,vgCost,nicCost,steepDays,mixedOn}),style:{padding:"6px 12px",borderRadius:8,border:`1px solid ${S.border}`,background:S.surface,color:S.yellow,cursor:"pointer",fontSize:12},children:n.exportPdf}),
          p.jsx("button",{onClick:printRecipe,style:{padding:"6px 12px",borderRadius:8,border:`1px solid ${S.border}`,background:S.surface,color:S.dimmed,cursor:"pointer",fontSize:12},children:n.printPdf}),
          p.jsx("button",{onClick:exportJson,style:{padding:"6px 12px",borderRadius:8,border:`1px solid ${S.border}`,background:S.surface,color:S.dimmed,cursor:"pointer",fontSize:12},children:n.exportJson}),
          p.jsx("button",{onClick:importJson,style:{padding:"6px 12px",borderRadius:8,border:`1px solid ${S.border}`,background:S.surface,color:S.dimmed,cursor:"pointer",fontSize:12},children:n.importJson}),
          // Display toggles (no currency toggle — EGP only)
          ...[{key:"volume",label:n.displayVolume},{key:"weight",label:n.displayWeight},{key:"drops",label:n.displayDrops}].map(w=>p.jsx("button",{onClick:()=>setDisplay(w.key),style:{...btnStyle(display===w.key),fontSize:12,fontWeight:600},children:w.label},w.key))
        ]})
      ]})
    }),

    // ── MAIN GRID ───────────────────────────────────────────────────────────
    p.jsxs("div",{className:"grid-main",style:{maxWidth:1100,margin:"0 auto",padding:"24px 16px",display:"grid",gridTemplateColumns:"1fr 340px",gap:20},children:[
      
      // ── LEFT PANEL ────────────────────────────────────────────────────────
      p.jsxs("div",{children:[
        p.jsx("div",{className:"tab-bar",style:{display:"flex",gap:4,marginBottom:16,overflowX:"auto"},children:
          tabs.map(w=>p.jsx("button",{onClick:()=>setActiveTab(w),style:{padding:"8px 14px",borderRadius:8,border:`1px solid ${activeTab===w?S.accent:S.border}`,background:activeTab===w?S.accentSoft:S.card,color:activeTab===w?S.accent:S.muted,cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap"},children:tabLabels[w]},w))
        }),

        // ── TAB: BASICS ──────────────────────────────────────────────────
        activeTab==="basics"&&p.jsxs(ct,{children:[
          p.jsx(Lt,{children:n.targetVolumeRatio}),
          p.jsx(le,{dir:r,children:n.targetVolume}),
          p.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16},children:[
            bd.map(w=>p.jsxs("button",{className:"preset-btn",onClick:()=>setVolPreset(w),style:btnStyle(volPreset===w),children:[w,lang==="ar"?"مل":"ml"]},w)),
            p.jsx("button",{className:"preset-btn",onClick:()=>setVolPreset("custom"),style:btnStyle(volPreset==="custom"),children:n.custom})
          ]}),
          volPreset==="custom"&&p.jsxs("div",{style:{marginBottom:16},children:[p.jsx(le,{dir:r,children:n.customVolumeMl}),p.jsx(He,{value:customVol,onChange:setCustomVol,min:1,max:10000,step:1})]}),
          p.jsx(le,{dir:r,children:n.pgVgRatio}),
          p.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12},children:np.map(w=>p.jsx("button",{className:"preset-btn",onClick:()=>applyPgPreset(w),style:btnStyle(pgPreset===w.label,S.green,S.greenSoft),children:w.label},w.label))}),
          p.jsxs("div",{className:"grid-2col",style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},children:[
            p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.pgPct}),p.jsx(He,{value:Math.round(pgRatio*100),onChange:w=>{setPgRatio(w/100);setPgPreset("custom")},min:0,max:100,step:1})]}),
            p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.vgPct}),p.jsx(He,{value:Math.round((1-pgRatio)*100),onChange:w=>{setPgRatio((100-w)/100);setPgPreset("custom")},min:0,max:100,step:1})]})
          ]}),
          // Custom densities section
          p.jsxs("div",{style:{marginTop:16,paddingTop:16,borderTop:`1px solid ${S.border}`},children:[
            p.jsxs("div",{style:{fontSize:11,color:S.muted,marginBottom:10},children:["⚙ ",n.customDensityLabel]}),
            p.jsxs("div",{className:"grid-2col",style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},children:[
              p.jsxs("div",{children:[p.jsx(le,{dir:r,children:`PG ${n.customDensityLabel}`}),p.jsx(He,{value:customPgDens,onChange:setCustomPgDens,min:0.9,max:1.2,step:0.001})]}),
              p.jsxs("div",{children:[p.jsx(le,{dir:r,children:`VG ${n.customDensityLabel}`}),p.jsx(He,{value:customVgDens,onChange:setCustomVgDens,min:1.1,max:1.4,step:0.001})]})
            ]})
          ]})
        ]}),

        // ── TAB: NICOTINE ────────────────────────────────────────────────
        activeTab==="nicotine"&&p.jsxs(ct,{children:[
          p.jsx(Lt,{children:n.nicotineSystem}),
          p.jsxs("div",{className:"grid-2col",style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14},children:[
            p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.nicotineType}),
              p.jsxs(ao,{value:nicType,onChange:setNicType,children:[
                p.jsx("option",{value:"freebase",children:n.freebase}),
                p.jsx("option",{value:"nic_salt_benz",children:n.nicSaltBenz}),
                p.jsx("option",{value:"nic_salt_sal",children:n.nicSaltSal}),
                p.jsx("option",{value:"nic_salt_lac",children:n.nicSaltLac}),
                p.jsx("option",{value:"nic_salt_mal",children:n.nicSaltMal}),
                p.jsx("option",{value:"nic_salt_hybrid",children:n.nicSaltHybrid})
              ]})
            ]}),
            p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.nicotineCarrier}),
              p.jsxs(ao,{value:nicCarrierPg,onChange:v=>setNicCarrierPg(parseFloat(v)),children:[
                p.jsx("option",{value:1,children:n.purePG}),
                p.jsx("option",{value:0,children:n.pureVG}),
                p.jsx("option",{value:0.5,children:"50/50"}),
                p.jsx("option",{value:0.6,children:"60PG/40VG"}),
                p.jsx("option",{value:0.7,children:"70PG/30VG"})
              ]})
            ]})
          ]}),
          p.jsx(le,{dir:r,children:n.stockStrength}),
          p.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14},children:ep.map(w=>p.jsxs("button",{className:"preset-btn",onClick:()=>setStockStr(w),style:btnStyle(stockStr===w),children:[w,lang==="ar"?"مجم":"mg"]},w))}),
          p.jsx(le,{dir:r,children:n.targetStrength}),
          p.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"},children:[
            tp.map(w=>p.jsxs("button",{className:"preset-btn",onClick:()=>setTargetNic(w),style:btnStyle(targetNic===w,S.green,S.greenSoft),children:[w,lang==="ar"?"مجم":"mg"]},w)),
            p.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6},children:[p.jsx("span",{style:{fontSize:12,color:S.muted},children:n.customLabel}),p.jsx(He,{value:targetNic,onChange:setTargetNic,min:0,max:60,step:0.5,style:{width:80}})]})
          ]}),
          nicType!=="freebase"&&targetNic<20&&p.jsx("div",{style:{marginTop:12,padding:"8px 12px",background:S.accentSoft,border:`1px solid ${S.accent}30`,borderRadius:8,fontSize:12,color:S.accent},children:n.nicSaltWarning})
        ]}),

        // ── TAB: FLAVORS ─────────────────────────────────────────────────
        activeTab==="flavors"&&p.jsxs(ct,{children:[
          p.jsxs(Lt,{children:[
            n.flavorIngredients,
            p.jsxs("span",{style:{fontSize:11,color:S.muted,marginInlineStart:"auto",fontWeight:400},children:[n.total," ",p.jsxs("span",{style:{color:res.totalFlavorPct>25?S.yellow:S.green,fontWeight:700},children:[res.totalFlavorPct,"%"]})]})
          ]}),
          flavors.map((w,idx)=>p.jsxs("div",{style:{background:S.surface,border:`1px solid ${S.border}`,borderRadius:10,padding:14,marginBottom:10},children:[
            p.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10},children:[
              p.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[
                p.jsx("button",{
                  onClick:()=>setEmojiPickerForId(w.id),
                  title:"Choose emoji",
                  style:{fontSize:22,lineHeight:1,padding:"2px 6px",borderRadius:8,border:`1px solid ${S.border}`,background:S.surface,cursor:"pointer",transition:"transform 0.15s"},
                  onMouseEnter:e=>e.currentTarget.style.transform="scale(1.2)",
                  onMouseLeave:e=>e.currentTarget.style.transform="scale(1)",
                  children:w.emoji||"🍓"
                }),
                p.jsxs("span",{style:{fontSize:12,fontWeight:700,color:S.flavor},children:["#",idx+1," ",sanitizeText(w.name)]})
              ]}),
              p.jsx("button",{onClick:()=>deleteFlavor(w.id),style:{background:S.redSoft,border:`1px solid ${S.red}30`,color:S.red,borderRadius:6,padding:"2px 8px",cursor:"pointer",fontSize:11},children:n.remove})
            ]}),
            p.jsxs("div",{className:"grid-2col",style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10},children:[
              p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.flavorName}),
                p.jsx("input",{value:w.name,onChange:e=>updateFlavor(w.id,"name",e.target.value||n.newFlavor),placeholder:n.newFlavor,style:{background:S.card,border:`1px solid ${S.border}`,color:S.text,borderRadius:8,padding:"7px 10px",fontSize:13,width:"100%",boxSizing:"border-box"}})
              ]}),
              p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.manufacturer}),
                p.jsx(ao,{value:w.mfr,onChange:v=>updateFlavor(w.id,"mfr",v),children:rp.map(m=>p.jsx("option",{value:m,children:m},m))})
              ]})
            ]}),
            p.jsxs("div",{className:"flavor-grid-3",style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10},children:[
              p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.usagePct}),p.jsx(He,{value:w.pct,onChange:v=>{if(v>=0)updateFlavor(w.id,"pct",v)},min:0,max:30,step:0.1})]}),
              p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.carrierPG}),p.jsx(He,{value:Math.round(w.pgRatio*100),onChange:v=>{if(v>=0&&v<=100)updateFlavor(w.id,"pgRatio",v/100)},min:0,max:100,step:5})]}),
              p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.bottlePrice}),p.jsx(He,{value:w.flavorBottlePrice||0,onChange:v=>{if(v>=0)updateFlavor(w.id,"flavorBottlePrice",v)},min:0,step:1})]})
            ]}),
            p.jsxs("div",{style:{marginTop:10,display:"flex",gap:10,alignItems:"center"},children:[
              p.jsxs("div",{style:{flex:1},children:[p.jsx(le,{dir:r,children:n.bottleSize}),p.jsx(He,{value:w.flavorBottleSize||30,onChange:v=>{if(v>0)updateFlavor(w.id,"flavorBottleSize",v)},min:1,step:1})]}),
              p.jsxs("div",{style:{fontSize:11,color:S.flavor,fontWeight:700,alignSelf:"flex-end",paddingBottom:6},children:["≈ ",fmtEGP(w.flavorBottleSize>0?(w.flavorBottlePrice||0)/w.flavorBottleSize:0,4),"/مل"]})
            ]}),
            // Per-flavor custom density
            p.jsxs("div",{style:{marginTop:10},children:[
              p.jsx(le,{dir:r,children:n.customDensityLabel}),
              p.jsx(He,{value:customFlavDens[w.id]||(w.pgRatio>=0.5?ze.FLAVOR_PG:ze.FLAVOR_VG),onChange:v=>setCustomFlavDens(prev=>({...prev,[w.id]:v})),min:0.9,max:1.4,step:0.001,style:{width:100}})
            ]})
          ]},w.id)),
          p.jsx("button",{onClick:addFlavor,style:{width:"100%",padding:"10px",borderRadius:10,border:`1px dashed ${S.accent}`,background:S.accentSoft,color:S.accent,cursor:"pointer",fontSize:13,fontWeight:600},children:n.addFlavor})
        ]}),

        // ── TAB: ADDITIVES ──────────────────────────────────────────────
        activeTab==="additives"&&p.jsxs(ct,{children:[
          p.jsx(Lt,{children:n.additives}),
          p.jsxs("div",{className:"grid-2col",style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16},children:[
            p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.distilledWater}),p.jsx(He,{value:waterPct,onChange:setWaterPct,min:0,max:10,step:0.5}),p.jsx("div",{style:{fontSize:11,color:S.muted,marginTop:4,textAlign:l?"right":"left"},children:n.waterHint})]}),
            p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.alcohol}),p.jsx(He,{value:alcPct,onChange:setAlcPct,min:0,max:10,step:0.5}),p.jsx("div",{style:{fontSize:11,color:S.muted,marginTop:4,textAlign:l?"right":"left"},children:n.alcoholHint})]})
          ]}),
          // Steeping timer section
          p.jsxs("div",{style:{marginTop:20,paddingTop:16,borderTop:`1px solid ${S.border}`},children:[
            p.jsx(Lt,{children:"⏱ "+n.steepingLabel}),
            p.jsxs("div",{className:"grid-2col",style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14},children:[
              p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.steepingLabel}),p.jsx(He,{value:steepDays,onChange:setSteepDays,min:0,max:90,step:1})]}),
              p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.mixedOn}),p.jsx("input",{type:"date",value:mixedOn,onChange:e=>setMixedOn(e.target.value),style:{background:S.surface,border:`1px solid ${S.border}`,color:S.text,borderRadius:8,padding:"8px 12px",fontSize:13,width:"100%",boxSizing:"border-box"}})]})
            ]}),
            steepDays>0&&mixedOn&&p.jsx(SteepTimer,{t:n,steepDays,mixedOn,alarmDate,onSetAlarm:setAlarm,onClearAlarm:clearAlarm})
          ]})
        ]}),

        // ── TAB: COSTS ──────────────────────────────────────────────────
        activeTab==="costs"&&p.jsxs(ct,{children:[
          p.jsx(Lt,{children:n.costConfig}),
          p.jsxs("div",{style:{background:S.surface,border:`1px solid ${S.border}`,borderRadius:10,padding:14,marginBottom:14},children:[
            p.jsxs("div",{style:{fontSize:12,fontWeight:700,color:S.pg,marginBottom:10},children:["⚗ PG"]}),
            p.jsxs("div",{className:"grid-2col",style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8},children:[
              p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.bottlePrice}),p.jsx(He,{value:pgBottlePrice,onChange:v=>{if(v>=0)setPgBottlePrice(v)},min:0,step:1})]}),
              p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.bottleSize}),p.jsx(He,{value:pgBottleSize,onChange:v=>{if(v>0)setPgBottleSize(v)},min:1,step:10})]}),
            ]}),
            p.jsxs("div",{style:{fontSize:11,color:S.pg,fontWeight:700},children:["≈ ",fmtEGP(pgCost,4),"/مل"]})
          ]}),
          p.jsxs("div",{style:{background:S.surface,border:`1px solid ${S.border}`,borderRadius:10,padding:14,marginBottom:14},children:[
            p.jsxs("div",{style:{fontSize:12,fontWeight:700,color:S.vg,marginBottom:10},children:["🌿 VG"]}),
            p.jsxs("div",{className:"grid-2col",style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8},children:[
              p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.bottlePrice}),p.jsx(He,{value:vgBottlePrice,onChange:v=>{if(v>=0)setVgBottlePrice(v)},min:0,step:1})]}),
              p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.bottleSize}),p.jsx(He,{value:vgBottleSize,onChange:v=>{if(v>0)setVgBottleSize(v)},min:1,step:10})]}),
            ]}),
            p.jsxs("div",{style:{fontSize:11,color:S.vg,fontWeight:700},children:["≈ ",fmtEGP(vgCost,4),"/مل"]})
          ]}),
          p.jsxs("div",{style:{background:S.surface,border:`1px solid ${S.border}`,borderRadius:10,padding:14,marginBottom:14},children:[
            p.jsxs("div",{style:{fontSize:12,fontWeight:700,color:S.nic,marginBottom:10},children:["💉 نيكوتين / Nicotine"]}),
            p.jsxs("div",{className:"grid-2col",style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8},children:[
              p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.bottlePrice}),p.jsx(He,{value:nicBottlePrice,onChange:v=>{if(v>=0)setNicBottlePrice(v)},min:0,step:1})]}),
              p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.bottleSize}),p.jsx(He,{value:nicBottleSize,onChange:v=>{if(v>0)setNicBottleSize(v)},min:1,step:1})]}),
            ]}),
            p.jsxs("div",{style:{fontSize:11,color:S.nic,fontWeight:700},children:["≈ ",fmtEGP(nicCost,4),"/مل"]})
          ]}),
          p.jsxs("div",{children:[p.jsx(le,{dir:r,children:n.bottleCostLabel}),p.jsx(He,{value:bottleCost,onChange:v=>{if(v>=0)setBottleCost(v)},min:0,step:0.5})]})
        ]})
      ]}),

      // ── RIGHT PANEL ───────────────────────────────────────────────────────
      p.jsxs("div",{className:"no-print",style:{display:"flex",flexDirection:"column",gap:14},children:[
        
        // Ratio bar
        p.jsxs(ct,{style:{padding:"14px 18px"},children:[
          p.jsxs("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:8},children:[p.jsx("span",{style:{fontSize:11,color:S.muted,fontWeight:700},children:n.actualRatio}),p.jsxs("span",{style:{fontSize:13,fontWeight:700,color:S.text},children:[res.actualPg,"PG / ",res.actualVg,"VG"]})]}),
          p.jsx("div",{style:{height:8,borderRadius:4,background:S.vgSoft,overflow:"hidden",display:"flex"},children:[p.jsx("div",{style:{height:"100%",width:`${res.actualPg}%`,background:S.pg}}),p.jsx("div",{style:{height:"100%",width:`${res.actualVg}%`,background:S.vg}})]}),
          p.jsxs("div",{style:{display:"flex",justifyContent:"space-between",marginTop:4},children:[p.jsxs("span",{style:{fontSize:10,color:S.pg,fontWeight:700},children:["PG ",res.actualPg,"%"]}),p.jsxs("span",{style:{fontSize:10,color:S.vg,fontWeight:700},children:["VG ",res.actualVg,"%"]})]})
        ]}),

        // Stats grid
        p.jsx("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:
          [{label:n.volume,value:`${res.totalMl} ${n.displayVolume}`,color:S.water},{label:n.weight,value:`${res.totalG} ${n.displayWeight}`,color:S.alcohol},{label:n.nicotine,value:`${res.actualNic} ${n.mgml}`,color:S.nic},{label:n.totalCost,value:fmtEGP(res.totalCost,2),color:S.yellow}].map(w=>
            p.jsxs("div",{key:w.label,style:{background:S.card,border:`1px solid ${S.border}`,borderRadius:10,padding:"12px 14px"},children:[p.jsx("div",{style:{fontSize:10,color:S.muted,textAlign:l?"right":"left"},children:w.label}),p.jsx("div",{style:{fontSize:18,fontWeight:800,color:w.color,marginTop:2},children:w.value})]})
          )
        }),

        // Cost/ml
        p.jsxs("div",{style:{background:S.card,border:`1px solid ${S.border}`,borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[p.jsx("span",{style:{fontSize:12,color:S.muted},children:n.costPerMl}),p.jsxs("span",{style:{fontSize:16,fontWeight:700,color:S.yellow},children:[fmtEGP(res.costPerMl,4),"/",n.displayVolume]})]}),

        // Overflow warning banner (prominent)
        totalExceeds100&&p.jsx("div",{style:{background:S.redSoft,border:`1px solid ${S.red}`,borderRadius:10,padding:"10px 14px",fontWeight:700,color:S.red,fontSize:13},children:n.overrideTotalWarning}),

        // All warnings
        allWarns.length>0&&p.jsx(WarnBanner,{warnings:allWarns}),

        // Breakdown
        p.jsxs(ct,{children:[
          p.jsx(Lt,{children:n.breakdown}),
          showChart&&p.jsx(RecipeChart,{res,t:n,lang}),
          p.jsx(qt,{item:res.nicotine,display,highlight:true,t:n,cat:"nicotine",currency:"egp",egpRate:1}),
          p.jsx(qt,{item:res.pg,display,highlight:true,t:n,cat:"pg",currency:"egp",egpRate:1}),
          p.jsx(qt,{item:res.vg,display,highlight:true,t:n,cat:"vg",currency:"egp",egpRate:1}),
          res.flavors.map((w,i)=>p.jsx(qt,{item:w,display,highlight:true,t:n,cat:"flavor",currency:"egp",egpRate:1},i)),
          p.jsx(qt,{item:res.water,display,t:n,cat:"water",currency:"egp",egpRate:1}),
          p.jsx(qt,{item:res.alcohol,display,t:n,cat:"alcohol",currency:"egp",egpRate:1}),
          p.jsxs("div",{style:{display:"flex",justifyContent:"space-between",paddingTop:10,marginTop:4},children:[p.jsx("span",{style:{fontSize:13,fontWeight:700,color:S.text},children:n.totalFlavoring}),p.jsxs("span",{style:{fontSize:13,fontWeight:700,color:res.totalFlavorPct>25?S.yellow:S.green},children:[res.totalFlavorPct,"%"]})]})
        ]}),

        // Device guide
        p.jsxs(ct,{children:[
          p.jsx(Lt,{children:n.deviceGuide}),
          n.devices.map(w=>p.jsxs("div",{key:w.label,style:{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${S.border}`,fontSize:12},children:[p.jsx("span",{style:{color:S.accent,fontWeight:700},children:w.label}),p.jsxs("span",{style:{color:S.dimmed},children:[n.devicePGLabel," ",w.pg,"% · ",w.nic]})]}))
        ]})
      ]})
    ]}),

    // ── MODALS ──────────────────────────────────────────────────────────────
    showSaved&&p.jsx(SavedRecipesPanel,{t:n,dir:r,onLoad:applyState,onClose:()=>setShowSaved(false)}),

    // Toast notifications
    p.jsx(ToastContainer,{}),
    // Emoji Picker modal
    emojiPickerForId!==null&&p.jsx(EmojiPicker,{
      current:flavors.find(f=>f.id===emojiPickerForId)?.emoji||"🍓",
      lang,
      onSelect:(em)=>updateFlavor(emojiPickerForId,"emoji",em),
      onClose:()=>setEmojiPickerForId(null)
    }),
    // QR Modal
    showQR&&p.jsx(QRModal,{data:JSON.stringify({name:recipeName,vol:targetMl,pg:res.actualPg,vg:res.actualVg,nic:res.actualNic,cost:res.totalCost,flavors:flavors.map(f=>({n:f.name,p:f.pct}))}),onClose:()=>setShowQR(false),lang}),
    // Print content (hidden, shown on print)
    printSection
  ]})
}

yc(document.getElementById("root")).render(p.jsx(J.StrictMode,{children:p.jsx(op,{})}));
