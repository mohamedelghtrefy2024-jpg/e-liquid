// ─── NIC SALT DENSITIES ─────────────────────────────────────────────────────
export const NIC_SALT_DENSITIES={freebase:1.01,nic_salt_benz:1.013,nic_salt_sal:1.012,nic_salt_lac:1.011,nic_salt_mal:1.011,nic_salt_hybrid:1.012};

// ─── DENSITIES ──────────────────────────────────────────────────────────────
export const ze={PG:1.036,VG:1.261,WATER:1,ALCOHOL:0.789,FLAVOR_PG:1.04,FLAVOR_VG:1.2};
export const Jd=20;

// ─── VOLUME / STRENGTH PRESETS ──────────────────────────────────────────────
export const bd=[10,30,60,100,120,250,500,1000],ep=[18,24,36,48,72,100],tp=[0,1,3,6,9,12,18,20,25,35,50];

// ─── PG/VG RATIO PRESETS & FLAVOR MANUFACTURERS ─────────────────────────────
export const np=[{label:"100VG",pg:0},{label:"20/80",pg:0.2},{label:"30/70",pg:0.3},{label:"50/50",pg:0.5},{label:"60/40",pg:0.6},{label:"70/30",pg:0.7},{label:"100PG",pg:1}];
export const rp=["TPA/TFA","Capella","FlavorArt","Inawera","Flavorah","Wonder Flavours","Purilum","SSA","Real Flavors","OOO","Medicine Flower","Vape Train","Molinberry","Flavor West","Custom"];

// ─── COLORS — Dynamic Theme System ──────────────────────────────────────────
const DARK_THEME={bg:"#0b1120",surface:"#111827",card:"#1a2235",border:"#1e2d45",accent:"#3b82f6",accentSoft:"#1d3a6e",green:"#10b981",greenSoft:"#063827",yellow:"#f59e0b",yellowSoft:"#3d2a00",red:"#ef4444",redSoft:"#3d0f0f",text:"#e2e8f0",muted:"#64748b",dimmed:"#94a3b8",nic:"#f472b6",nicSoft:"#3d1a30",pg:"#3b82f6",pgSoft:"#1d3a6e",vg:"#10b981",vgSoft:"#063827",flavor:"#fb923c",flavorSoft:"#3d2410",water:"#38bdf8",waterSoft:"#0c2d3d",alcohol:"#a78bfa",alcoholSoft:"#2a1f4d"};
const LIGHT_THEME={bg:"#f0f4f8",surface:"#f8fafc",card:"#ffffff",border:"#cbd5e1",accent:"#2563eb",accentSoft:"#dbeafe",green:"#059669",greenSoft:"#d1fae5",yellow:"#d97706",yellowSoft:"#fef3c7",red:"#dc2626",redSoft:"#fee2e2",text:"#1e293b",muted:"#94a3b8",dimmed:"#475569",nic:"#db2777",nicSoft:"#fce7f3",pg:"#2563eb",pgSoft:"#dbeafe",vg:"#059669",vgSoft:"#d1fae5",flavor:"#d97706",flavorSoft:"#fef3c7",water:"#0284c7",waterSoft:"#e0f2fe",alcohol:"#7c3aed",alcoholSoft:"#ede9fe"};
let _currentThemeKey=localStorage.getItem("epp_theme")||"dark";

// Live theme color palette (mutated in place by applyTheme, never reassigned)
export const S=Object.assign({},DARK_THEME);

// ─── INGREDIENT CATEGORY COLORS ─────────────────────────────────────────────
// NOTE: declared before applyTheme() is called below so the initial
// "if(_currentThemeKey==='light') applyTheme('light')" call can safely
// mutate it (this also fixes the original file's TDZ ordering issue).
export const CAT_COLORS={nicotine:{fg:S.nic,bg:S.nicSoft,icon:"💉"},pg:{fg:S.pg,bg:S.pgSoft,icon:"⚗"},vg:{fg:S.vg,bg:S.vgSoft,icon:"🌿"},flavor:{fg:S.flavor,bg:S.flavorSoft,icon:"🍓"},water:{fg:S.water,bg:S.waterSoft,icon:"💧"},alcohol:{fg:S.alcohol,bg:S.alcoholSoft,icon:"🥃"}};

export function applyTheme(key){
  _currentThemeKey=key;
  const t=key==="light"?LIGHT_THEME:DARK_THEME;
  Object.assign(S,t);
  localStorage.setItem("epp_theme",key);
  // Update CAT_COLORS live
  CAT_COLORS.nicotine={fg:S.nic,bg:S.nicSoft,icon:"💉"};
  CAT_COLORS.pg={fg:S.pg,bg:S.pgSoft,icon:"⚗"};
  CAT_COLORS.vg={fg:S.vg,bg:S.vgSoft,icon:"🌿"};
  CAT_COLORS.flavor={fg:S.flavor,bg:S.flavorSoft,icon:"🍓"};
  CAT_COLORS.water={fg:S.water,bg:S.waterSoft,icon:"💧"};
  CAT_COLORS.alcohol={fg:S.alcohol,bg:S.alcoholSoft,icon:"🥃"};
}
// Apply saved theme on load
if(_currentThemeKey==="light") applyTheme("light");
