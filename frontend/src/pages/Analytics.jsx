/**
 * Analytics.jsx — Digital Twin Analytics Dashboard
 *
 * LAYOUT  (h-screen, no scroll):
 *   Header 52px  — [Farm ▾] [Field ▾]  · pills
 *   Body  flex-1 — flex-row, p-3.5, gap-3
 *     Left  60%  flex-col gap-3
 *       └─ Trend chart card      flex-1
 *       └─ Reports row           h-[82px]   ← 2 buttons side-by-side
 *     Right 40%  flex-col gap-3
 *       └─ Row-1  flex-1         AI Confidence | Yield Distribution
 *       └─ Row-2  flex-1         Risk Analysis  | Seasonal Yield
 *
 * Dropdowns:  document-click + stopPropagation (no z-index overlay).
 * Charts:     key={fieldId+metric} forces full remount on every selection.
 * Reports:    PDF opens a formatted printable tab; CSV downloads field+metric data.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  ChevronDown,
  Download,
  FileText,
  MapPin,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  Legend,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { FARMS_DATA } from "../components/digitaltwin/constants";

/* ─────────────────────────────────────────────────────────────
   METRIC DEFINITIONS
───────────────────────────────────────────────────────────── */
const METRICS = [
  { key: "Crop Health",   label: "Crop Health Index",  unit: "%",  color: "#16a34a", sensorType: null,           domain: [50, 100] },
  { key: "Temperature",   label: "Temperature",         unit: "°C", color: "#f97316", sensorType: "Temperature",  domain: [20, 42]  },
  { key: "Humidity",      label: "Relative Humidity",   unit: "%",  color: "#0891b2", sensorType: "Humidity",     domain: [30, 100] },
  { key: "Soil Moisture", label: "Soil Moisture",       unit: "%",  color: "#2563eb", sensorType: "SoilMoisture", domain: [10, 100] },
  { key: "Rainfall",      label: "Daily Rainfall",      unit: "mm", color: "#7c3aed", sensorType: "Rainfall",     domain: [0, 25]   },
];

/* ─────────────────────────────────────────────────────────────
   DATA HELPERS
───────────────────────────────────────────────────────────── */
function buildDayLabels() {
  const labels = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }));
  }
  return labels;
}
const DAY_LABELS = buildDayLabels();

function seededRand(seed) {
  let s = seed | 0;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function makeHistory(current, variance, seed) {
  const rand  = seededRand(seed);
  const start = current * (0.88 + rand() * 0.12);
  return DAY_LABELS.map((day, i) => {
    const t    = i / (DAY_LABELS.length - 1);
    const base = start + (current - start) * t;
    const noise = (rand() - 0.48) * variance;
    return { day, value: Math.round((base + noise) * 10) / 10 };
  });
}

function sensorAvg(field, sensorType) {
  const online = field.sensors.filter(s => s.type === sensorType && s.status === "online");
  if (!online.length) return null;
  return online.reduce((sum, s) => sum + parseFloat(s.value), 0) / online.length;
}

function healthScore(health) {
  return { Healthy: 88, Watch: 71, Stress: 52 }[health] ?? 70;
}

function buildHistories(field) {
  const variance = { "Crop Health": 3, Temperature: 2.5, Humidity: 5, "Soil Moisture": 4, Rainfall: 3 };
  const out = {};
  METRICS.forEach(({ key, sensorType }, idx) => {
    const current = sensorType
      ? (sensorAvg(field, sensorType) ?? 20)
      : healthScore(field.health);
    out[key] = makeHistory(current, variance[key], field.fieldId * 100 + idx * 17);
  });
  return out;
}

function makeSeasonalData(field) {
  const base = 6.4 + (field.fieldId % 5) * 0.35;
  return [
    { month: "Apr", current: +(base - 0.5 + (field.fieldId % 3) * 0.1).toFixed(1),  previous: +(base - 1.0).toFixed(1) },
    { month: "May", current: +(base - 0.2 + (field.fieldId % 4) * 0.1).toFixed(1),  previous: +(base - 0.6).toFixed(1) },
    { month: "Jun", current: +(base + 0.1 + (field.fieldId % 2) * 0.15).toFixed(1), previous: +(base - 0.3).toFixed(1) },
    { month: "Jul", current: +(base + 0.5 + (field.fieldId % 3) * 0.12).toFixed(1), previous: +(base + 0.0).toFixed(1) },
  ];
}

/* ─────────────────────────────────────────────────────────────
   REPORTS
───────────────────────────────────────────────────────────── */
function openPDFReport({ farm, field, metaCfg, trendPoints, confidence, yieldDonut, riskData }) {
  const ts = new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" });
  const trendRows   = trendPoints.map(p => `<tr><td>${p.day}</td><td><b>${p.value}</b></td><td>${metaCfg.unit}</td></tr>`).join("");
  const yieldRows   = yieldDonut.map(y => `<tr><td>${y.name}</td><td style="color:${y.color};font-weight:700">${y.value}%</td></tr>`).join("");
  const riskRows    = riskData.map(r  => `<tr><td>${r.label}</td><td style="color:${r.color};font-weight:700">${r.value}%</td></tr>`).join("");

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Report — ${field.fieldName} · ${farm.farmName}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',sans-serif;color:#0f172a;background:#fff;padding:40px 48px}
header{display:flex;align-items:center;justify-content:space-between;padding-bottom:18px;border-bottom:2.5px solid #16a34a;margin-bottom:24px}
h1{font-size:22px;font-weight:800;color:#16a34a}
.badge{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700;color:#16a34a}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px}
.card{border:1.5px solid #e2e8f0;border-radius:12px;padding:16px 20px}
.card h3{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8;margin-bottom:8px}
.kpi{font-size:30px;font-weight:900;color:#16a34a;line-height:1}
table{width:100%;border-collapse:collapse}
th{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;padding:6px 10px;border-bottom:1px solid #f1f5f9;text-align:left}
td{font-size:13px;padding:6px 10px;border-bottom:1px solid #f8fafc;color:#334155}
.sec{font-size:14px;font-weight:700;color:#0f172a;margin:20px 0 10px;padding-bottom:5px;border-bottom:1px solid #f1f5f9}
.rec{background:#f0fdf4;border-left:4px solid #16a34a;border-radius:0 8px 8px 0;padding:14px 18px;font-size:14px;color:#166534;line-height:1.6}
footer{margin-top:28px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between}
@media print{body{padding:20px 28px}}
</style></head><body>
<header>
  <div><h1>🌾 Digital Twin Analytics Report</h1><p style="font-size:12px;color:#64748b;margin-top:3px">Generated: ${ts}</p></div>
  <span class="badge">AI-POWERED</span>
</header>
<div class="g2">
  <div class="card">
    <h3>Farm &amp; Field</h3>
    <p style="font-size:18px;font-weight:800">${farm.farmName}</p>
    <p style="font-size:13px;color:#64748b;margin-top:4px">📍 ${farm.location}</p>
    <p style="font-size:13px;color:#64748b;margin-top:3px">Field: <b>${field.fieldName}</b> · ${field.crop} (${field.variety})</p>
    <p style="font-size:13px;color:#64748b;margin-top:3px">Area: ${field.area} · Stage: ${field.stage} · Health: ${field.health}</p>
  </div>
  <div class="card">
    <h3>Analysis Summary</h3>
    <p class="kpi">${confidence}%</p>
    <p style="font-size:13px;color:#64748b;margin-top:4px">AI Prediction Confidence</p>
    <p style="font-size:13px;color:#64748b;margin-top:8px">Metric: <b>${metaCfg.key}</b></p>
    <p style="font-size:13px;color:#64748b;margin-top:3px">Active sensors: ${field.sensors.filter(s=>s.status==="online").length}/${field.sensors.length}</p>
  </div>
</div>
<div class="g2">
  <div class="card"><h3>Yield Distribution</h3><table><thead><tr><th>Category</th><th>Share</th></tr></thead><tbody>${yieldRows}</tbody></table></div>
  <div class="card"><h3>Risk Analysis</h3><table><thead><tr><th>Category</th><th>Level</th></tr></thead><tbody>${riskRows}</tbody></table></div>
</div>
<p class="sec">14-Day Trend — ${metaCfg.key}</p>
<div class="card" style="padding:0"><table><thead><tr><th>Date</th><th>Value</th><th>Unit</th></tr></thead><tbody>${trendRows}</tbody></table></div>
<p class="sec">AI Recommendation</p>
<div class="rec">${field.aiRecommendation}</div>
<footer><span>Digital Twin Agriculture · ${farm.farmName} · ${field.fieldName}</span><span>${ts}</span></footer>
<script>window.onload=()=>window.print()<\/script>
</body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

function downloadCSV({ farm, field, metaCfg, trendPoints }) {
  const header = "Farm,Field,Crop,Metric,Unit,Date,Value\n";
  const rows   = trendPoints.map(p =>
    `"${farm.farmName}","${field.fieldName}","${field.crop}","${metaCfg.key}","${metaCfg.unit}","${p.day}",${p.value}`
  ).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${farm.farmName.replace(/\s+/g,"_")}_${field.fieldName.replace(/\s+/g,"_")}_${metaCfg.key.replace(/\s+/g,"_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────────────────────
   REUSABLE DROPDOWN HOOK
   Tracks the trigger button's screen rect so the portal
   dropdown can be positioned with position:fixed, bypassing
   any overflow:hidden ancestor (including the Analytics wrapper).
───────────────────────────────────────────────────────────── */
function useDropdown() {
  const [open, setOpen]    = useState(false);
  const [rect, setRect]    = useState(null);
  const triggerRef         = useRef(null);   // attached to the trigger <button>
  const containerRef       = useRef(null);   // attached to the outer wrapper <div>
  const dropdownRef        = useRef(null);   // attached to the portal dropdown <div>

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    function handleDoc(e) {
      const inTrigger  = containerRef.current?.contains(e.target);
      const inDropdown = dropdownRef.current?.contains(e.target);
      if (!inTrigger && !inDropdown) setOpen(false);
    }
    document.addEventListener("mousedown", handleDoc);
    return () => document.removeEventListener("mousedown", handleDoc);
  }, [open]);

  /* Recompute rect on open and on scroll/resize while open */
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    function update() {
      if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    }
    update();
    window.addEventListener("scroll",  update, true);
    window.addEventListener("resize",  update);
    return () => {
      window.removeEventListener("scroll",  update, true);
      window.removeEventListener("resize",  update);
    };
  }, [open]);

  return { open, setOpen, rect, triggerRef, containerRef, dropdownRef };
}

/* ─────────────────────────────────────────────────────────────
   SHARED UI
───────────────────────────────────────────────────────────── */
function Card({ children, className = "", style = {} }) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl ${className}`}
      style={{
        background:     "rgba(255,255,255,0.93)",
        border:         "1.5px solid rgba(255,255,255,0.98)",
        backdropFilter: "blur(20px)",
        boxShadow:      "0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <p style={{ fontSize:"11px", fontWeight:"700", letterSpacing:"0.16em", textTransform:"uppercase", color:"#94a3b8", flexShrink:0 }}>
      {children}
    </p>
  );
}

function ChartTip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"rgba(15,23,42,0.94)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px", padding:"10px 16px", boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
      <p style={{ fontSize:"11px", fontWeight:"600", color:"rgba(255,255,255,0.45)", marginBottom:"4px" }}>{label}</p>
      <p style={{ fontSize:"24px", fontWeight:"800", color:"white", lineHeight:1 }}>
        {payload[0].value}<span style={{ fontSize:"13px", marginLeft:"3px", color:"rgba(255,255,255,0.45)" }}>{unit}</span>
      </p>
    </div>
  );
}

/* SVG confidence ring */
function ConfGauge({ value }) {
  const r = 46, cx = 60, cy = 60;
  const c = 2 * Math.PI * r;
  const d = (value / 100) * c;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 min-h-0">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="cg-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(22,163,74,0.1)" strokeWidth={10} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#cg-grad)" strokeWidth={10}
          strokeDasharray={`${d} ${c-d}`} strokeDashoffset={c/4} strokeLinecap="round" />
        <text x={cx} y={cy-4}  textAnchor="middle" fill="#0f172a" fontSize="23" fontWeight="900">{value}%</text>
        <text x={cx} y={cy+15} textAnchor="middle" fill="#64748b" fontSize="8.5" fontWeight="700" letterSpacing="0.8">CONFIDENCE</text>
      </svg>
      <p style={{ fontSize:"13px", fontWeight:"700", color:"#16a34a" }}>AI Prediction</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   INLINE SELECTOR
   The dropdown is rendered via createPortal at document.body so
   it is never clipped by an overflow:hidden ancestor.
───────────────────────────────────────────────────────────── */
function Selector({ triggerLabel, triggerValue, dropdownWidth, items, renderItem }) {
  const { open, setOpen, rect, triggerRef, containerRef, dropdownRef } = useDropdown();
  const close = () => setOpen(false);

  const dropdownStyle = {
    position: "fixed",
    top:  rect ? rect.bottom + 4 : 0,
    left: rect ? rect.left       : 0,
    zIndex: 99999,
    background: "white",
    border: "1.5px solid #e2e8f0",
    borderRadius: "16px",
    padding: "6px 0",
    boxShadow: "0 20px 60px rgba(0,0,0,0.16)",
    minWidth: dropdownWidth ?? "160px",
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition hover:bg-slate-100"
        style={{ border: "1.5px solid #e2e8f0" }}
      >
        <span style={{ fontSize:"12px", fontWeight:"500", color:"#64748b" }}>{triggerLabel}</span>
        <span style={{ fontSize:"14px", fontWeight:"700", color:"#0f172a" }}>{triggerValue}</span>
        <ChevronDown size={13} style={{ color:"#94a3b8", transform:open?"rotate(180deg)":"none", transition:"transform .2s", flexShrink:0 }} />
      </button>
      {open && rect && createPortal(
        <div ref={dropdownRef} style={dropdownStyle}>
          {items.map(item => <div key={item.key}>{renderItem(item, close)}</div>)}
        </div>,
        document.body
      )}
    </div>
  );
}

/* Metric dropdown (right-aligned, inside chart card) */
function MetricSelector({ metric, setMetric }) {
  const { open, setOpen, rect, triggerRef, containerRef, dropdownRef } = useDropdown();
  const metaCfg = METRICS.find(m => m.key === metric);
  const DROPDOWN_W = 195;

  const dropdownStyle = {
    position: "fixed",
    top:  rect ? rect.bottom + 4 : 0,
    left: rect ? Math.max(0, rect.right - DROPDOWN_W) : 0,
    zIndex: 99999,
    background: "white",
    border: "1.5px solid #e2e8f0",
    borderRadius: "16px",
    padding: "6px 0",
    boxShadow: "0 20px 60px rgba(0,0,0,0.16)",
    minWidth: `${DROPDOWN_W}px`,
  };

  return (
    <div ref={containerRef} style={{ position:"relative" }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 transition hover:bg-slate-50"
        style={{ border:"1.5px solid #e2e8f0", fontSize:"14px", fontWeight:"700", color:"#334155" }}
      >
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor:metaCfg.color, boxShadow:`0 0 6px ${metaCfg.color}70`, flexShrink:0 }} />
        {metric}
        <ChevronDown size={13} style={{ color:"#94a3b8", transform:open?"rotate(180deg)":"none", transition:"transform .2s" }} />
      </button>
      {open && rect && createPortal(
        <div ref={dropdownRef} style={dropdownStyle}>
          {METRICS.map(m => (
            <button
              key={m.key}
              type="button"
              onClick={() => { setMetric(m.key); setOpen(false); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 transition hover:bg-slate-50 text-left"
              style={{ fontSize:"14px", fontWeight:m.key===metric?"700":"500", color:m.key===metric?m.color:"#475569" }}
            >
              <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor:m.color }} />
              {m.key}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function Analytics() {
  /* ── state ── */
  const [farmId,  setFarmId]  = useState(FARMS_DATA[0].farmId);
  const [fieldId, setFieldId] = useState(FARMS_DATA[0].fields[0].fieldId);
  const [metric,  setMetric]  = useState("Crop Health");

  /* ── derived: farm → fields → field ── */
  const farm   = FARMS_DATA.find(f => f.farmId  === farmId)  ?? FARMS_DATA[0];
  const fields = farm.fields;
  const field  = fields.find(f => f.fieldId === fieldId) ?? fields[0];

  /* ── keep fieldId valid whenever the farm changes ── */
  useEffect(() => {
    const currentFarm = FARMS_DATA.find(f => f.farmId === farmId) ?? FARMS_DATA[0];
    const isValid = currentFarm.fields.some(f => f.fieldId === fieldId);
    if (!isValid) {
      setFieldId(currentFarm.fields[0].fieldId);
    }
  }, [farmId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── analytics derived from field ── */
  const histories   = useMemo(() => buildHistories(field),     [field]);
  const metaCfg     = METRICS.find(m => m.key === metric);
  const trendPoints = histories[metric];
  const latestVal   = trendPoints[trendPoints.length - 1]?.value ?? "—";
  const confidence  = { Healthy:94, Watch:78, Stress:61 }[field.health] ?? 75;

  const hs = healthScore(field.health);
  const yieldDonut = useMemo(() => ([
    { name:"Healthy",  value: Math.round(hs * 0.72), color:"#16a34a" },
    { name:"Moderate", value: Math.round(hs * 0.19), color:"#f59e0b" },
    { name:"Low",      value: Math.max(0, 100 - Math.round(hs * 0.91)), color:"#ef4444" },
  ]), [hs]);

  const riskData = useMemo(() => {
    const lo = Math.round(hs * 0.76);
    const md = Math.round((100 - lo) * 0.68);
    return [
      { label:"Low Risk",    value:lo,                         color:"#16a34a" },
      { label:"Medium Risk", value:md,                         color:"#f59e0b" },
      { label:"High Risk",   value:Math.max(0,100 - lo - md),  color:"#ef4444" },
    ];
  }, [hs]);

  const seasonalData = useMemo(() => makeSeasonalData(field), [field]);

  /* health badge colour */
  const hc = field.health === "Healthy" ? "#16a34a" : field.health === "Watch" ? "#d97706" : "#dc2626";

  /* gradient id — changes with metric to force SVG defs refresh */
  const gradId = `ag-${metric.replace(/\s+/g,"").toLowerCase()}-${field.fieldId}`;

  /* chart remount key */
  const chartKey = `${field.fieldId}-${metric}`;

  /* ── farm items for Selector ── */
  const farmItems = useMemo(() =>
    FARMS_DATA.map(f => ({ key: f.farmId, f })),
  []);

  /* ── field items for Selector — updates whenever farm changes ── */
  const fieldItems = useMemo(() =>
    fields.map(f => ({ key: f.fieldId, f })),
  [fields]);

  /* ── handlers ── */
  const handleFarmSelect = useCallback((fid, closeFn) => {
    const nf = FARMS_DATA.find(f => f.farmId === fid) ?? FARMS_DATA[0];
    setFarmId(nf.farmId);
    setFieldId(nf.fields[0].fieldId);
    closeFn();
  }, []);

  const handleFieldSelect = useCallback((fid, closeFn) => {
    setFieldId(fid);
    closeFn();
  }, []);

  /* ── render ── */
  return (
    <div
      className="relative -m-[25px] flex h-screen flex-col"
      style={{ background:"linear-gradient(135deg,hsl(84,33%,95%) 0%,hsl(0,0%,99%) 50%,hsl(148,25%,93%) 100%)", overflow:"hidden" }}
    >
      {/* ambient blobs */}
      <div className="pointer-events-none absolute right-[-5rem] top-[-3rem] h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-4rem] left-[-4rem] h-80 w-80 rounded-full bg-agri-water/6 blur-3xl" />

      {/* ══════ HEADER ══════ */}
      <div
        className="relative shrink-0 flex items-center justify-between px-5 gap-3"
        style={{ height:"52px", borderBottom:"1px solid rgba(0,0,0,0.07)", background:"rgba(255,255,255,0.62)", backdropFilter:"blur(14px)" }}
      >
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-primary" />
          <span style={{ fontSize:"13px", fontWeight:"600", color:"#64748b" }}>Analytics</span>
          <span style={{ color:"#cbd5e1", fontSize:"16px", marginInline:"2px" }}>·</span>

          {/* FARM SELECTOR */}
          <Selector
            triggerLabel="Farm"
            triggerValue={farm.farmName}
            dropdownWidth="240px"
            items={farmItems}
            renderItem={(item, close) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleFarmSelect(item.f.farmId, close)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 transition hover:bg-slate-50 text-left"
                style={{ fontSize:"14px", fontWeight:item.f.farmId===farmId?"700":"500", color:item.f.farmId===farmId?"#16a34a":"#334155", whiteSpace:"nowrap" }}
              >
                <MapPin size={12} style={{ color:item.f.farmId===farmId?"#16a34a":"#94a3b8", flexShrink:0 }} />
                {item.f.farmName}
                <span style={{ fontSize:"12px", color:"#94a3b8", fontWeight:400, marginLeft:"2px" }}>{item.f.location}</span>
              </button>
            )}
          />

          {/* FIELD SELECTOR */}
          <Selector
            triggerLabel="Field"
            triggerValue={field.fieldName}
            dropdownWidth="210px"
            items={fieldItems}
            renderItem={(item, close) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleFieldSelect(item.f.fieldId, close)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 transition hover:bg-slate-50 text-left"
                style={{ fontSize:"14px", fontWeight:item.f.fieldId===fieldId?"700":"500", color:item.f.fieldId===fieldId?"#16a34a":"#334155", whiteSpace:"nowrap" }}
              >
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor:item.f.fieldId===fieldId?"#16a34a":"#cbd5e1" }} />
                {item.f.fieldName}
                <span style={{ fontSize:"12px", color:"#94a3b8", fontWeight:400, marginLeft:"4px" }}>{item.f.crop}</span>
              </button>
            )}
          />
        </div>

        {/* right pills */}
        <div className="flex items-center gap-2.5">
          <span style={{ fontSize:"12px", color:"#94a3b8" }}>14-day window</span>
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1"
               style={{ background:"rgba(22,163,74,0.08)", border:"1px solid rgba(22,163,74,0.2)" }}>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            <span style={{ fontSize:"12px", fontWeight:"600", color:"#16a34a" }}>
              {field.sensors.filter(s=>s.status==="online").length}/{field.sensors.length} sensors
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1"
               style={{ background:`${hc}12`, border:`1px solid ${hc}30` }}>
            <Activity size={11} style={{ color:hc }} />
            <span style={{ fontSize:"12px", fontWeight:"600", color:hc }}>{field.health}</span>
          </div>
        </div>
      </div>

      {/* ══════ BODY ══════ */}
      <div className="relative flex-1 min-h-0 flex gap-3 p-3.5">

        {/* ═══ LEFT COLUMN: Trend Chart + Reports ═══ */}
        <div className="flex flex-col gap-3" style={{ flex:"0 0 60%" }}>

          {/* ── Trend Chart Card ── */}
          <Card className="px-5 py-4" style={{ flex:"1 1 0", display:"flex", flexDirection:"column" }}>
            {/* chart header */}
            <div className="mb-3 flex items-start justify-between shrink-0">
              <div>
                <Label>14-Day Historical Trend</Label>
                <div className="flex items-end gap-3 mt-2">
                  <span style={{ fontSize:"42px", fontWeight:"900", color:metaCfg.color, letterSpacing:"-0.03em", lineHeight:1 }}>
                    {latestVal}
                  </span>
                  <span style={{ fontSize:"17px", fontWeight:"700", color:`${metaCfg.color}99`, marginBottom:"5px" }}>
                    {metaCfg.unit}
                  </span>
                  <span style={{ fontSize:"13px", fontWeight:"500", color:"#94a3b8", marginBottom:"7px" }}>
                    {metaCfg.label} · {field.fieldName}
                  </span>
                </div>
              </div>
              <MetricSelector metric={metric} setMetric={setMetric} />
            </div>

            {/* Chart — key forces remount on metric or field change */}
            <div className="flex-1 min-h-0" key={chartKey}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendPoints} margin={{ top:10, right:16, left:2, bottom:0 }}>
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={metaCfg.color} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={metaCfg.color} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 4" stroke="rgba(0,0,0,0.05)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize:12, fill:"#94a3b8", fontWeight:500 }}
                    tickLine={false} axisLine={false} interval={1}
                  />
                  <YAxis
                    domain={metaCfg.domain}
                    tick={{ fontSize:12, fill:"#94a3b8", fontWeight:500 }}
                    tickLine={false} axisLine={false} width={52}
                    tickFormatter={v => metaCfg.unit==="mm" ? `${v}mm` : `${v}${metaCfg.unit}`}
                  />
                  <Tooltip content={<ChartTip unit={metaCfg.unit} />} />
                  <Area
                    type="monotone" dataKey="value"
                    stroke={metaCfg.color} strokeWidth={3}
                    fill={`url(#${gradId})`}
                    dot={false}
                    activeDot={{ r:6, fill:metaCfg.color, stroke:"white", strokeWidth:2.5 }}
                    isAnimationActive
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* ── Reports Row (below trend chart) ── */}
          <div className="flex gap-3 shrink-0" style={{ height:"82px" }}>
            {/* PDF */}
            <motion.button
              type="button"
              whileHover={{ y:-2, boxShadow:"0 8px 28px rgba(22,163,74,0.22)" }}
              whileTap={{ scale:0.98 }}
              onClick={() => openPDFReport({ farm, field, metaCfg, trendPoints, confidence, yieldDonut, riskData })}
              className="flex flex-1 items-center gap-3 rounded-2xl px-5 py-3 text-left"
              style={{
                background:"linear-gradient(135deg,rgba(22,163,74,0.10),rgba(22,163,74,0.05))",
                border:"1.5px solid rgba(22,163,74,0.28)",
                backdropFilter:"blur(12px)",
                boxShadow:"0 2px 12px rgba(22,163,74,0.08)",
              }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                   style={{ background:"rgba(22,163,74,0.15)", border:"1px solid rgba(22,163,74,0.3)" }}>
                <FileText size={19} style={{ color:"#16a34a" }} />
              </div>
              <div>
                <p style={{ fontSize:"14px", fontWeight:"800", color:"#0f172a" }}>📄 Generate PDF Report</p>
                <p style={{ fontSize:"11px", color:"#94a3b8" }}>{field.fieldName} · {farm.farmName} · {metric}</p>
              </div>
            </motion.button>

            {/* CSV */}
            <motion.button
              type="button"
              whileHover={{ y:-2, boxShadow:"0 8px 28px rgba(8,145,178,0.18)" }}
              whileTap={{ scale:0.98 }}
              onClick={() => downloadCSV({ farm, field, metaCfg, trendPoints })}
              className="flex flex-1 items-center gap-3 rounded-2xl px-5 py-3 text-left"
              style={{
                background:"linear-gradient(135deg,rgba(8,145,178,0.09),rgba(8,145,178,0.04))",
                border:"1.5px solid rgba(8,145,178,0.25)",
                backdropFilter:"blur(12px)",
                boxShadow:"0 2px 12px rgba(8,145,178,0.06)",
              }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                   style={{ background:"rgba(8,145,178,0.13)", border:"1px solid rgba(8,145,178,0.25)" }}>
                <Download size={19} style={{ color:"#0891b2" }} />
              </div>
              <div>
                <p style={{ fontSize:"14px", fontWeight:"800", color:"#0f172a" }}>📊 Export CSV Data</p>
                <p style={{ fontSize:"11px", color:"#94a3b8" }}>14-day {metric} · {field.fieldName}</p>
              </div>
            </motion.button>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN: 4 charts ═══ */}
        <div className="flex flex-col gap-3" style={{ flex:"0 0 40%" }}>

          {/* Row 1: AI Confidence + Yield Distribution */}
          <div className="flex gap-3" style={{ flex:"1 1 0" }}>

            {/* AI Confidence */}
            <Card className="p-4" style={{ flex:"1 1 0", minWidth:0 }}>
              <Label>AI Confidence</Label>
              <ConfGauge key={field.fieldId} value={confidence} />
            </Card>

            {/* Yield Donut */}
            <Card className="p-4" style={{ flex:"1 1 0", minWidth:0 }}>
              <Label>Yield Distribution</Label>
              <div className="relative flex-1 min-h-0 mt-1" key={`yd-${field.fieldId}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={yieldDonut} cx="50%" cy="46%"
                      innerRadius="42%" outerRadius="68%"
                      paddingAngle={3} dataKey="value"
                      startAngle={90} endAngle={-270} stroke="none"
                      isAnimationActive
                    >
                      {yieldDonut.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length
                          ? <div style={{ background:"rgba(15,23,42,0.9)", borderRadius:"10px", padding:"8px 12px", border:"1px solid rgba(255,255,255,0.1)" }}>
                              <p style={{ fontSize:"13px", fontWeight:700, color:payload[0]?.payload?.color }}>
                                {payload[0]?.name}: {payload[0]?.value}%
                              </p>
                            </div>
                          : null
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" style={{ paddingBottom:"8%" }}>
                  <span style={{ fontSize:"22px", fontWeight:"900", color:"#16a34a", lineHeight:1 }}>{yieldDonut[0].value}%</span>
                  <span style={{ fontSize:"9px", fontWeight:"700", color:"#94a3b8", letterSpacing:"0.1em", textTransform:"uppercase" }}>Healthy</span>
                </div>
              </div>
              <div className="shrink-0 flex justify-center gap-3 mt-1.5">
                {yieldDonut.map(({ name, color }) => (
                  <div key={name} className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor:color }} />
                    <span style={{ fontSize:"11px", fontWeight:"600", color:"#64748b" }}>{name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Row 2: Risk Analysis + Seasonal Yield */}
          <div className="flex gap-3" style={{ flex:"1 1 0" }}>

            {/* Risk Analysis */}
            <Card className="p-4" style={{ flex:"1 1 0", minWidth:0 }}>
              <Label>Risk Analysis</Label>
              <div className="flex flex-1 flex-col justify-center gap-4 min-h-0 pt-3">
                {riskData.map(({ label, value, color }) => (
                  <div key={label} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span style={{ fontSize:"13px", fontWeight:"600", color:"#475569" }}>{label}</span>
                      <span style={{ fontSize:"16px", fontWeight:"800", color }}>{value}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        key={`${field.fieldId}-${label}`}
                        initial={{ width:0 }}
                        animate={{ width:`${value}%` }}
                        transition={{ duration:0.85, delay:0.1, ease:"easeOut" }}
                        className="h-full rounded-full"
                        style={{ background:`linear-gradient(90deg,${color}80,${color})`, boxShadow:`0 0 6px ${color}50` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Seasonal Yield */}
            <Card className="p-4" style={{ flex:"1 1 0", minWidth:0 }}>
              <Label>Seasonal Yield (t/ha)</Label>
              <p style={{ fontSize:"11px", fontWeight:"500", color:"#94a3b8", marginTop:"3px", marginBottom:"6px" }}>
                Current vs Previous Season
              </p>
              <div className="flex-1 min-h-0" key={`sy-${field.fieldId}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seasonalData} margin={{ top:4, right:4, left:-22, bottom:0 }} barSize={22} barGap={4} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="month" tick={{ fontSize:12, fill:"#94a3b8", fontWeight:500 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[5,9]} tick={{ fontSize:11, fill:"#94a3b8" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) =>
                        active && payload?.length
                          ? <div style={{ background:"rgba(15,23,42,0.9)", borderRadius:"10px", padding:"8px 14px", border:"1px solid rgba(255,255,255,0.1)" }}>
                              <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.4)", marginBottom:"4px" }}>{label}</p>
                              {payload.map(p => <p key={p.name} style={{ fontSize:"13px", fontWeight:700, color:p.fill }}>{p.name}: {p.value} t/ha</p>)}
                            </div>
                          : null
                      }
                    />
                    <Legend wrapperStyle={{ fontSize:"12px", color:"#64748b" }} iconSize={10} />
                    <Bar dataKey="current"  name="Current"  fill="#16a34a" radius={[4,4,0,0]} isAnimationActive />
                    <Bar dataKey="previous" name="Previous" fill="#94a3b8" radius={[4,4,0,0]} isAnimationActive />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}