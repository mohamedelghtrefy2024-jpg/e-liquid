// ─── STEEPING TIMER ──────────────────────────────────────────────────────────
import {p} from '../vendor/vendor-react.js';
import {S} from '../constants.js';

export function SteepTimer({t,steepDays,mixedOn,alarmDate,onSetAlarm,onClearAlarm}){
  if(!steepDays||!mixedOn) return null;
  const today=new Date();const mixed=new Date(mixedOn);
  const elapsed=Math.floor((today-mixed)/(1000*60*60*24));
  const remaining=steepDays-elapsed;
  const readyDate=new Date(mixed.getTime()+steepDays*86400000);
  const readyStr=readyDate.toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"});
  const done=remaining<=0;
  const hasAlarm=!!alarmDate;
  // Progress bar
  const pct=Math.min(100,Math.round(((steepDays-remaining)/steepDays)*100));
  return p.jsxs("div",{style:{background:S.surface,border:`2px solid ${done?S.green:hasAlarm?"#f59e0b":S.border}`,borderRadius:10,padding:"12px 14px",marginTop:8,fontSize:12},children:[
    p.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8},children:[
      p.jsxs("div",{children:[
        p.jsxs("div",{style:{color:S.muted,marginBottom:2},children:[t.mixedOn," ",mixed.toLocaleDateString("ar-EG")]}),
        p.jsxs("div",{style:{color:S.dimmed},children:[t.steepingReady," ",readyStr]})
      ]}),
      p.jsx("div",{style:{fontSize:28,lineHeight:1},children:done?"🎉":"🧪"})
    ]}),
    p.jsx("div",{style:{height:8,background:done?`${S.green}30`:"rgba(255,255,255,0.08)",borderRadius:4,overflow:"hidden",marginBottom:8},children:
      p.jsx("div",{style:{width:`${pct}%`,height:"100%",background:done?S.green:`linear-gradient(90deg,${S.accent},#f59e0b)`,borderRadius:4,transition:"width 0.5s"}})
    }),
    p.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[
      p.jsx("div",{style:{color:done?S.green:S.yellow,fontWeight:700,fontSize:13},children:done?t.steepingDone:t.steepingRemaining(remaining)}),
      !done&&p.jsx("button",{
        onClick:()=>hasAlarm?onClearAlarm():onSetAlarm(readyDate),
        style:{padding:"4px 10px",borderRadius:6,border:`1px solid ${hasAlarm?"#ef4444":"#f59e0b"}`,background:"transparent",color:hasAlarm?"#ef4444":"#f59e0b",cursor:"pointer",fontSize:11,fontWeight:600},
        children:hasAlarm?t.alarmClear:t.alarmSet
      })
    ]}),
    hasAlarm&&p.jsxs("div",{style:{marginTop:6,fontSize:11,color:"#f59e0b",display:"flex",alignItems:"center",gap:4},children:["⏰ ",t.alarmActive," — ",new Date(alarmDate).toLocaleDateString("ar-EG")]})
  ]})
}
