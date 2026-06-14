import { useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────
const DENSITIES = { PG: 1.036, VG: 1.261, WATER: 1.0, ALCOHOL: 0.789, NIC: 1.01, FLAVOR_PG: 1.04, FLAVOR_VG: 1.2 };
const DROPS_PER_ML = 20;

function r(v, d = 3) { return Math.round(v * 10 ** d) / 10 ** d; }
function mlToG(ml, density) { return r(ml * density); }
function mlToDrops(ml) { return Math.round(ml * DROPS_PER_ML); }

// ─── Engine ──────────────────────────────────────────────────
function calculate(inp) {
  const warnings = [];
  const V = inp.targetVolumeMl;

  // Nicotine
  let nicMl = 0;
  if (inp.targetNicStrength > 0 && inp.nicStockStrength > 0) {
    nicMl = (inp.targetNicStrength * V) / inp.nicStockStrength;
  }
  if (inp.targetNicStrength > 0 && inp.nicStockStrength < inp.targetNicStrength) {
    warnings.push({ level: "error", code: "NIC_TOO_LOW", msg: `Stock ${inp.nicStockStrength}mg/ml < target ${inp.targetNicStrength}mg/ml — impossible` });
  }

  const nicPg = nicMl * inp.nicCarrierPgRatio;
  const nicVg = nicMl * (1 - inp.nicCarrierPgRatio);

  // Additives
  const waterMl = r((inp.waterPct / 100) * V);
  const alcMl = r((inp.alcoholPct / 100) * V);

  // Flavors
  const totalFlavorPct = inp.flavors.reduce((s, f) => s + f.pct, 0);
  if (totalFlavorPct > 25) warnings.push({ level: "warning", code: "OVER_FLAVOR", msg: `Total flavor ${r(totalFlavorPct, 1)}% may cause over-flavoring` });
  if (totalFlavorPct < 3 && inp.flavors.length > 0) warnings.push({ level: "info", code: "UNDER_FLAVOR", msg: `Total flavor ${r(totalFlavorPct, 1)}% may be under-flavored` });

  let flavorPg = 0, flavorVg = 0;
  const flavorResults = inp.flavors.map(f => {
    const fml = r((f.pct / 100) * V);
    flavorPg += fml * f.pgRatio;
    flavorVg += fml * (1 - f.pgRatio);
    const d = f.pgRatio >= 0.5 ? DENSITIES.FLAVOR_PG : DENSITIES.FLAVOR_VG;
    return { name: f.name, mfr: f.mfr, ml: r(fml), g: mlToG(fml, d), drops: mlToDrops(fml), pct: f.pct, cost: r(fml * f.costPerMl, 4) };
  });

  // Base PG/VG needed
  const targetPgMl = inp.pgRatio * V;
  const targetVgMl = (1 - inp.pgRatio) * V;
  const pgMl = Math.max(0, r(targetPgMl - nicPg - flavorPg - alcMl));
  const vgMl = Math.max(0, r(targetVgMl - nicVg - flavorVg - waterMl));

  if (r(targetPgMl - nicPg - flavorPg - alcMl) < -0.01)
    warnings.push({ level: "warning", code: "EXCESS_PG", msg: "Carriers exceed target PG — actual ratio will differ" });

  // Totals
  const totalMl = r(nicMl + pgMl + vgMl + flavorResults.reduce((s, f) => s + f.ml, 0) + waterMl + alcMl);
  const actualPg = totalMl > 0 ? r((nicPg + flavorPg + alcMl + pgMl) / totalMl * 100, 1) : 0;
  const actualVg = totalMl > 0 ? r((nicVg + flavorVg + waterMl + vgMl) / totalMl * 100, 1) : 0;
  const actualNic = totalMl > 0 ? r((nicMl * inp.nicStockStrength) / totalMl, 2) : 0;

  const totalG =
    mlToG(nicMl, DENSITIES.NIC) + mlToG(pgMl, DENSITIES.PG) +
    mlToG(vgMl, DENSITIES.VG) + flavorResults.reduce((s, f) => s + f.g, 0) +
    mlToG(waterMl, DENSITIES.WATER) + mlToG(alcMl, DENSITIES.ALCOHOL);

  const flavorCost = flavorResults.reduce((s, f) => s + f.cost, 0);
  const totalCost = r(nicMl * inp.nicCostPerMl + pgMl * inp.pgCostPerMl + vgMl * inp.vgCostPerMl + flavorCost + inp.bottleCost, 3);

  return {
    nicotine: { name: "Nicotine Base", ml: r(nicMl), g: mlToG(nicMl, DENSITIES.NIC), drops: mlToDrops(nicMl), pct: r(nicMl / V * 100, 2), cost: r(nicMl * inp.nicCostPerMl, 4) },
    pg: { name: "PG", ml: r(pgMl), g: mlToG(pgMl, DENSITIES.PG), drops: mlToDrops(pgMl), pct: r(pgMl / V * 100, 2), cost: r(pgMl * inp.pgCostPerMl, 4) },
    vg: { name: "VG", ml: r(vgMl), g: mlToG(vgMl, DENSITIES.VG), drops: mlToDrops(vgMl), pct: r(vgMl / V * 100, 2), cost: r(vgMl * inp.vgCostPerMl, 4) },
    water: { name: "Distilled Water", ml: waterMl, g: mlToG(waterMl, DENSITIES.WATER), drops: mlToDrops(waterMl), pct: inp.waterPct, cost: 0 },
    alcohol: { name: "Alcohol", ml: alcMl, g: mlToG(alcMl, DENSITIES.ALCOHOL), drops: mlToDrops(alcMl), pct: inp.alcoholPct, cost: 0 },
    flavors: flavorResults,
    totalFlavorPct: r(totalFlavorPct, 2),
    totalMl: r(totalMl), totalG: r(totalG), totalCost,
    costPerMl: r(totalCost / totalMl, 4),
    actualPg, actualVg, actualNic,
    warnings,
  };
}

// ─── Colours / tokens ────────────────────────────────────────
const C = {
  bg: "#0b1120",
  surface: "#111827",
  card: "#1a2235",
  border: "#1e2d45",
  accent: "#3b82f6",
  accentSoft: "#1d3a6e",
  green: "#10b981",
  greenSoft: "#063827",
  yellow: "#f59e0b",
  yellowSoft: "#3d2a00",
  red: "#ef4444",
  redSoft: "#3d0f0f",
  text: "#e2e8f0",
  muted: "#64748b",
  dimmed: "#94a3b8",
};

const VOLUMES = [10, 30, 60, 100, 120, 250, 500, 1000];
const NIC_STOCKS = [18, 24, 36, 48, 72, 100];
const NIC_TARGETS = [0, 1, 3, 6, 9, 12, 18, 20, 25, 35, 50];
const PG_PRESETS = [
  { label: "100VG", pg: 0 },
  { label: "20/80", pg: 0.2 },
  { label: "30/70", pg: 0.3 },
  { label: "50/50", pg: 0.5 },
  { label: "60/40", pg: 0.6 },
  { label: "70/30", pg: 0.7 },
  { label: "100PG", pg: 1 },
];

const MFR_LIST = ["TPA/TFA", "Capella", "FlavorArt", "Inawera", "Flavorah", "Wonder Flavours", "Purilum", "SSA", "Real Flavors", "OOO", "Medicine Flower", "Vape Train", "Molinberry", "Flavor West", "Custom"];

// ─── Sub-components ──────────────────────────────────────────
function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{children}</div>;
}

function Select({ value, onChange, children, style = {} }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "8px 12px", fontSize: 13, width: "100%", ...style }}>
      {children}
    </select>
  );
}

function NumberInput({ value, onChange, min = 0, max, step = 0.1, style = {} }) {
  return (
    <input type="number" value={value} min={min} max={max} step={step}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "8px 12px", fontSize: 13, width: "100%", boxSizing: "border-box", ...style }} />
  );
}

function Card({ children, style = {} }) {
  return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", ...style }}>{children}</div>;
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>{children}</div>;
}

function WarnBadge({ w }) {
  const colors = { error: [C.red, C.redSoft], warning: [C.yellow, C.yellowSoft], info: [C.accent, C.accentSoft] };
  const [fg, bg] = colors[w.level] || colors.info;
  const icons = { error: "✕", warning: "⚠", info: "ℹ" };
  return (
    <div style={{ background: bg, border: `1px solid ${fg}30`, borderRadius: 8, padding: "8px 12px", display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
      <span style={{ color: fg, fontSize: 12, marginTop: 1, flexShrink: 0 }}>{icons[w.level]}</span>
      <span style={{ color: fg, fontSize: 12 }}>{w.msg}</span>
    </div>
  );
}

function ResultRow({ item, display, highlight = false }) {
  if (!item || item.ml === 0) return null;
  const value = display === "volume" ? `${item.ml} ml`
    : display === "weight" ? `${item.g} g`
    : `${item.drops} drops`;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
      <div>
        <div style={{ fontSize: 13, color: highlight ? C.text : C.dimmed, fontWeight: highlight ? 600 : 400 }}>{item.name}</div>
        {item.mfr && <div style={{ fontSize: 11, color: C.muted }}>{item.mfr}</div>}
        {item.pct > 0 && <div style={{ fontSize: 11, color: C.muted }}>{item.pct}%</div>}
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>{value}</div>
        {item.cost > 0 && <div style={{ fontSize: 11, color: C.muted }}>${item.cost.toFixed(3)}</div>}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function EPPCalculator() {
  const [vol, setVol] = useState(100);
  const [customVol, setCustomVol] = useState(100);
  const [pgRatio, setPgRatio] = useState(0.3);
  const [customPg, setCustomPg] = useState(30);
  const [pgPreset, setPgPreset] = useState("30/70");
  const [targetNic, setTargetNic] = useState(3);
  const [stockNic, setStockNic] = useState(72);
  const [nicType, setNicType] = useState("freebase");
  const [nicCarrierPg, setNicCarrierPg] = useState(1);
  const [waterPct, setWaterPct] = useState(0);
  const [alcoholPct, setAlcoholPct] = useState(0);
  const [pgCost, setPgCost] = useState(0.003);
  const [vgCost, setVgCost] = useState(0.002);
  const [nicCost, setNicCost] = useState(0.05);
  const [bottleCost, setBottleCost] = useState(0.15);
  const [display, setDisplay] = useState("volume");
  const [flavors, setFlavors] = useState([
    { id: 1, name: "Strawberry", mfr: "TPA/TFA", pct: 6, pgRatio: 1, costPerMl: 0.08 },
    { id: 2, name: "Fresh Cream", mfr: "Capella", pct: 3, pgRatio: 1, costPerMl: 0.10 },
  ]);
  const [activeTab, setActiveTab] = useState("basics");

  const targetVolumeMl = vol === "custom" ? customVol : vol;

  const result = calculate({
    targetVolumeMl, pgRatio, nicCarrierPgRatio: nicCarrierPg,
    targetNicStrength: targetNic, nicStockStrength: stockNic,
    nicotineType: nicType, nicDensity: 1.01,
    flavors, waterPct, alcoholPct,
    pgCostPerMl: pgCost, vgCostPerMl: vgCost,
    nicCostPerMl: nicCost, bottleCost,
  });

  const addFlavor = () => setFlavors(prev => [...prev, { id: Date.now(), name: "New Flavor", mfr: "TPA/TFA", pct: 5, pgRatio: 1, costPerMl: 0.08 }]);
  const removeFlavor = id => setFlavors(prev => prev.filter(f => f.id !== id));
  const updateFlavor = (id, key, val) => setFlavors(prev => prev.map(f => f.id === id ? { ...f, [key]: val } : f));

  const handlePgPreset = (p) => {
    setPgPreset(p.label);
    setPgRatio(p.pg);
    setCustomPg(Math.round(p.pg * 100));
  };

  const TABS = ["basics", "nicotine", "flavors", "additives", "costs"];
  const TAB_LABELS = { basics: "⚗ Basics", nicotine: "💉 Nicotine", flavors: "🍓 Flavors", additives: "💧 Additives", costs: "💰 Costs" };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif", color: C.text }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1a2540 100%)", borderBottom: `1px solid ${C.border}`, padding: "20px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 3, textTransform: "uppercase" }}>E-Liquid Professional Platform</div>
            <div style={{ fontSize: 22, fontWeight: 800, background: `linear-gradient(90deg, ${C.accent}, #38bdf8)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              EPP Calculator
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["volume", "weight", "drops"].map(d => (
              <button key={d} onClick={() => setDisplay(d)}
                style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${display === d ? C.accent : C.border}`, background: display === d ? C.accentSoft : "transparent", color: display === d ? C.accent : C.muted, cursor: "pointer", fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>
                {d === "volume" ? "ml" : d === "weight" ? "g" : "drops"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>

        {/* LEFT — Inputs */}
        <div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 16, overflowX: "auto" }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${activeTab === t ? C.accent : C.border}`, background: activeTab === t ? C.accentSoft : C.card, color: activeTab === t ? C.accent : C.muted, cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          {/* BASICS TAB */}
          {activeTab === "basics" && (
            <Card>
              <SectionTitle>⚗ Target Volume & PG/VG Ratio</SectionTitle>
              <Label>Target Volume</Label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {VOLUMES.map(v => (
                  <button key={v} onClick={() => setVol(v)}
                    style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${vol === v ? C.accent : C.border}`, background: vol === v ? C.accentSoft : "transparent", color: vol === v ? C.accent : C.dimmed, cursor: "pointer", fontSize: 13, fontWeight: vol === v ? 700 : 400 }}>
                    {v}ml
                  </button>
                ))}
                <button onClick={() => setVol("custom")}
                  style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${vol === "custom" ? C.accent : C.border}`, background: vol === "custom" ? C.accentSoft : "transparent", color: vol === "custom" ? C.accent : C.dimmed, cursor: "pointer", fontSize: 13, fontWeight: vol === "custom" ? 700 : 400 }}>
                  Custom
                </button>
              </div>
              {vol === "custom" && (
                <div style={{ marginBottom: 16 }}>
                  <Label>Custom Volume (ml)</Label>
                  <NumberInput value={customVol} onChange={setCustomVol} min={1} max={10000} step={1} />
                </div>
              )}

              <Label>PG/VG Ratio</Label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {PG_PRESETS.map(p => (
                  <button key={p.label} onClick={() => handlePgPreset(p)}
                    style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${pgPreset === p.label ? C.green : C.border}`, background: pgPreset === p.label ? C.greenSoft : "transparent", color: pgPreset === p.label ? C.green : C.dimmed, cursor: "pointer", fontSize: 12, fontWeight: pgPreset === p.label ? 700 : 400 }}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <Label>PG %</Label>
                  <NumberInput value={Math.round(pgRatio * 100)} onChange={v => { setPgRatio(v / 100); setCustomPg(v); setPgPreset("custom"); }} min={0} max={100} step={1} />
                </div>
                <div>
                  <Label>VG %</Label>
                  <NumberInput value={Math.round((1 - pgRatio) * 100)} onChange={v => { setPgRatio((100 - v) / 100); setCustomPg(100 - v); setPgPreset("custom"); }} min={0} max={100} step={1} />
                </div>
              </div>
            </Card>
          )}

          {/* NICOTINE TAB */}
          {activeTab === "nicotine" && (
            <Card>
              <SectionTitle>💉 Nicotine System</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <Label>Nicotine Type</Label>
                  <Select value={nicType} onChange={setNicType}>
                    <option value="freebase">Freebase</option>
                    <option value="nic_salt_benz">Nic Salt — Benzoate</option>
                    <option value="nic_salt_sal">Nic Salt — Salicylate</option>
                    <option value="nic_salt_lac">Nic Salt — Lactate</option>
                    <option value="nic_salt_mal">Nic Salt — Malate</option>
                    <option value="nic_salt_hybrid">Nic Salt — Hybrid</option>
                  </Select>
                </div>
                <div>
                  <Label>Nicotine Carrier</Label>
                  <Select value={nicCarrierPg} onChange={v => setNicCarrierPg(parseFloat(v))}>
                    <option value={1}>Pure PG</option>
                    <option value={0}>Pure VG</option>
                    <option value={0.5}>50/50</option>
                    <option value={0.6}>60PG/40VG</option>
                    <option value={0.7}>70PG/30VG</option>
                  </Select>
                </div>
              </div>

              <Label>Stock Strength (mg/ml)</Label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {NIC_STOCKS.map(s => (
                  <button key={s} onClick={() => setStockNic(s)}
                    style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${stockNic === s ? C.accent : C.border}`, background: stockNic === s ? C.accentSoft : "transparent", color: stockNic === s ? C.accent : C.dimmed, cursor: "pointer", fontSize: 13, fontWeight: stockNic === s ? 700 : 400 }}>
                    {s}mg
                  </button>
                ))}
              </div>

              <Label>Target Strength (mg/ml)</Label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {NIC_TARGETS.map(s => (
                  <button key={s} onClick={() => setTargetNic(s)}
                    style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${targetNic === s ? C.green : C.border}`, background: targetNic === s ? C.greenSoft : "transparent", color: targetNic === s ? C.green : C.dimmed, cursor: "pointer", fontSize: 13, fontWeight: targetNic === s ? 700 : 400 }}>
                    {s}mg
                  </button>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Custom:</span>
                  <NumberInput value={targetNic} onChange={setTargetNic} min={0} max={60} step={0.5} style={{ width: 80 }} />
                </div>
              </div>
            </Card>
          )}

          {/* FLAVORS TAB */}
          {activeTab === "flavors" && (
            <Card>
              <SectionTitle>
                🍓 Flavor Ingredients
                <span style={{ fontSize: 11, color: C.muted, marginLeft: "auto", fontWeight: 400 }}>
                  Total: <span style={{ color: result.totalFlavorPct > 25 ? C.yellow : C.green, fontWeight: 700 }}>{result.totalFlavorPct}%</span>
                </span>
              </SectionTitle>

              {flavors.map((f, idx) => (
                <div key={f.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>#{idx + 1}</span>
                    <button onClick={() => removeFlavor(f.id)} style={{ background: C.redSoft, border: `1px solid ${C.red}30`, color: C.red, borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 11 }}>✕ Remove</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <Label>Flavor Name</Label>
                      <input value={f.name} onChange={e => updateFlavor(f.id, "name", e.target.value)}
                        style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "7px 10px", fontSize: 13, width: "100%", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <Label>Manufacturer</Label>
                      <Select value={f.mfr} onChange={v => updateFlavor(f.id, "mfr", v)}>
                        {MFR_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                      </Select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div>
                      <Label>Usage %</Label>
                      <NumberInput value={f.pct} onChange={v => updateFlavor(f.id, "pct", v)} min={0} max={30} step={0.1} />
                    </div>
                    <div>
                      <Label>Carrier PG %</Label>
                      <NumberInput value={Math.round(f.pgRatio * 100)} onChange={v => updateFlavor(f.id, "pgRatio", v / 100)} min={0} max={100} step={5} />
                    </div>
                    <div>
                      <Label>Cost/ml ($)</Label>
                      <NumberInput value={f.costPerMl} onChange={v => updateFlavor(f.id, "costPerMl", v)} min={0} step={0.01} />
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={addFlavor} style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px dashed ${C.accent}`, background: C.accentSoft, color: C.accent, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                + Add Flavor
              </button>
            </Card>
          )}

          {/* ADDITIVES TAB */}
          {activeTab === "additives" && (
            <Card>
              <SectionTitle>💧 Additives</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <Label>Distilled Water %</Label>
                  <NumberInput value={waterPct} onChange={setWaterPct} min={0} max={10} step={0.5} />
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Thins VG — counted on VG side</div>
                </div>
                <div>
                  <Label>Alcohol (SD40B) %</Label>
                  <NumberInput value={alcoholPct} onChange={setAlcoholPct} min={0} max={10} step={0.5} />
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Fast wick — counted on PG side</div>
                </div>
              </div>
            </Card>
          )}

          {/* COSTS TAB */}
          {activeTab === "costs" && (
            <Card>
              <SectionTitle>💰 Cost Configuration</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  ["PG Cost ($/ml)", pgCost, setPgCost],
                  ["VG Cost ($/ml)", vgCost, setVgCost],
                  ["Nicotine Cost ($/ml)", nicCost, setNicCost],
                  ["Bottle Cost ($)", bottleCost, setBottleCost],
                ].map(([label, val, setter]) => (
                  <div key={label}>
                    <Label>{label}</Label>
                    <NumberInput value={val} onChange={setter} min={0} step={0.001} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT — Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Ratio summary bar */}
          <Card style={{ padding: "14px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>ACTUAL RATIO</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{result.actualPg}PG / {result.actualVg}VG</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: C.border, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${result.actualPg}%`, background: `linear-gradient(90deg, ${C.accent}, #38bdf8)`, borderRadius: 4 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: C.accent }}>PG {result.actualPg}%</span>
              <span style={{ fontSize: 10, color: C.green }}>VG {result.actualVg}%</span>
            </div>
          </Card>

          {/* Key stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Volume", value: `${result.totalMl} ml`, color: C.accent },
              { label: "Weight", value: `${result.totalG} g`, color: "#38bdf8" },
              { label: "Nicotine", value: `${result.actualNic} mg/ml`, color: C.green },
              { label: "Total Cost", value: `$${result.totalCost}`, color: C.yellow },
            ].map(s => (
              <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Cost per ml */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: C.muted }}>Cost per ml</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.yellow }}>${result.costPerMl}/ml</span>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div>
              {result.warnings.map((w, i) => <WarnBadge key={i} w={w} />)}
            </div>
          )}

          {/* Breakdown */}
          <Card>
            <SectionTitle>📊 Breakdown</SectionTitle>
            <ResultRow item={result.nicotine} display={display} highlight />
            <ResultRow item={result.pg} display={display} highlight />
            <ResultRow item={result.vg} display={display} highlight />
            {result.flavors.map((f, i) => <ResultRow key={i} item={f} display={display} highlight />)}
            <ResultRow item={result.water} display={display} />
            <ResultRow item={result.alcohol} display={display} />

            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, marginTop: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Total Flavoring</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: result.totalFlavorPct > 25 ? C.yellow : C.green }}>{result.totalFlavorPct}%</span>
            </div>
          </Card>

          {/* Device Guide */}
          <Card>
            <SectionTitle>🔌 Device Guide</SectionTitle>
            {[
              { label: "MTL", pg: "50–70", nic: "6–18mg" },
              { label: "Pod", pg: "30–50", nic: "20–50mg salt" },
              { label: "RDL", pg: "30–50", nic: "3–9mg" },
              { label: "DTL", pg: "10–30", nic: "0–6mg" },
            ].map(d => (
              <div key={d.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                <span style={{ color: C.accent, fontWeight: 700 }}>{d.label}</span>
                <span style={{ color: C.dimmed }}>PG {d.pg}% · {d.nic}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
