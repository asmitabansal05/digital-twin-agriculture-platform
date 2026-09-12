/**
 * Analytics.jsx — Digital Twin Analytics Dashboard
 *
 * DATA FLOW:
 *   PostgreSQL sensor_readings
 *       → GET /analytics/{backendFieldId}
 *       → AnalyticsService (up to 14 readings × 3 ML models)
 *       → React state
 *       → charts + insights
 *
 * POLLING:
 *   Fetches once on mount / field-change (shows loading skeleton).
 *   Then silently refreshes every POLL_INTERVAL_MS (no skeleton flash).
 *   Interval is cleared on unmount.
 *
 * FRONTEND FIELD → BACKEND DB ID MAPPING:
 *   101 (Wheat)     → 1
 *   102 (Rice)      → 2
 *   201 (Cotton)    → 3
 *   301 (Maize)     → 4
 *   302 (Sunflower) → 4  (shares Maize DB record)
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
  Loader2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Droplets,
  Thermometer,
  Leaf,
  CloudRain,
  Sprout,
  Clock,
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
  ReferenceLine,
} from "recharts";
import { FARMS_DATA } from "../components/digitaltwin/constants";
import api from "../services/api";

/* ─── CONSTANTS ────────────────────────────────────────────────── */

/** How often the analytics data is silently refreshed (mirrors Dashboard) */
const POLL_INTERVAL_MS = 10_000;

/** Frontend field IDs → backend DB field IDs */
const FIELD_ID_MAP = {
  101: 1,
  102: 2,
  201: 3,
  301: 4,
  302: 4,
};

function toBackendFieldId(frontendFieldId) {
  return FIELD_ID_MAP[frontendFieldId] ?? 1;
}

/* ─── METRIC DEFINITIONS ───────────────────────────────────────── */
const METRICS = [
  {
    key: "Crop Health",
    label: "Crop Health Index",
    unit: "%",
    color: "#16a34a",
    dataKey: "healthScore",
    domain: [40, 100],
    Icon: Leaf,
  },
  {
    key: "Temperature",
    label: "Temperature",
    unit: "°C",
    color: "#f97316",
    dataKey: "temperature",
    domain: [18, 45],
    Icon: Thermometer,
  },
  {
    key: "Humidity",
    label: "Relative Humidity",
    unit: "%",
    color: "#0891b2",
    dataKey: "humidity",
    domain: [20, 100],
    Icon: Droplets,
  },
  {
    key: "Soil Moisture",
    label: "Soil Moisture",
    unit: "%",
    color: "#2563eb",
    dataKey: "soilMoisture",
    domain: [5, 100],
    Icon: Sprout,
  },
  {
    key: "Rainfall",
    label: "Daily Rainfall",
    unit: "mm",
    color: "#7c3aed",
    dataKey: "rainfall",
    domain: [0, 30],
    Icon: CloudRain,
  },
];

/* ─── HEALTH CLASSIFICATION ────────────────────────────────────── */
const HEALTH_HEALTHY_MIN = 80;
const HEALTH_MODERATE_MIN = 60;

function classifyHealth(score) {
  if (score >= HEALTH_HEALTHY_MIN) return "Healthy";
  if (score >= HEALTH_MODERATE_MIN) return "Moderate";
  return "Stressed";
}

/* ─── TREND DIRECTION ──────────────────────────────────────────── */
/**
 * Compares the mean of the first N readings vs the last N readings.
 * Returns "up" | "down" | "stable" | null (if not enough data).
 */
function calcTrend(values, n = 3) {
  if (!values || values.length < n * 2) return null;
  const first = values.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const last = values.slice(-n).reduce((s, v) => s + v, 0) / n;
  const delta = last - first;
  if (Math.abs(delta) < 0.5) return "stable";
  return delta > 0 ? "up" : "down";
}

/* ─── REPORTS ───────────────────────────────────────────────────── */
function openPDFReport({ farm, field, metaCfg, analyticsData, healthDist }) {
  const ts = new Date().toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const trendRows = analyticsData
    .map(
      (d) =>
        `<tr><td>${d.date}</td><td><b>${d[metaCfg.dataKey]}</b></td><td>${metaCfg.unit}</td></tr>`
    )
    .join("");

  const distRows = [
    { name: "Healthy", value: healthDist.healthy, color: "#16a34a" },
    { name: "Moderate", value: healthDist.moderate, color: "#f59e0b" },
    { name: "Stressed", value: healthDist.stressed, color: "#ef4444" },
  ]
    .map(
      (r) =>
        `<tr><td>${r.name}</td><td style="color:${r.color};font-weight:700">${r.value} readings</td></tr>`
    )
    .join("");

  const latestReading = analyticsData[analyticsData.length - 1];
  const latestYield = latestReading?.predictedYield ?? "N/A";
  const latestIrrigation = latestReading?.irrigationRequirement ?? "N/A";
  const latestRainfall = latestReading?.rainfall ?? "N/A";

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Report - ${field.fieldName} - ${farm.farmName}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',sans-serif;color:#0f172a;background:#fff;padding:40px 48px}
header{display:flex;align-items:center;justify-content:space-between;padding-bottom:18px;border-bottom:2.5px solid #16a34a;margin-bottom:24px}
h1{font-size:22px;font-weight:800;color:#16a34a}
.badge{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700;color:#16a34a}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px}
.card{border:1.5px solid #e2e8f0;border-radius:12px;padding:16px 20px}
.card h3{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8;margin-bottom:8px}
.kpi{font-size:24px;font-weight:800;color:#0f172a}
.kpi-unit{font-size:13px;color:#94a3b8;margin-left:4px}
table{width:100%;border-collapse:collapse}
th{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;padding:6px 10px;border-bottom:1px solid #f1f5f9;text-align:left}
td{font-size:13px;padding:6px 10px;border-bottom:1px solid #f8fafc;color:#334155}
.sec{font-size:14px;font-weight:700;color:#0f172a;margin:20px 0 10px;padding-bottom:5px;border-bottom:1px solid #f1f5f9}
.rec{background:#f0fdf4;border-left:4px solid #16a34a;border-radius:0 8px 8px 0;padding:14px 18px;font-size:14px;color:#166534;line-height:1.6}
.note{font-size:11px;color:#94a3b8;font-style:italic;margin-top:8px}
footer{margin-top:28px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between}
@media print{body{padding:20px 28px}}
</style></head><body>
<header>
  <div><h1>Digital Twin Analytics Report</h1><p style="font-size:12px;color:#64748b;margin-top:3px">Generated: ${ts}</p></div>
  <span class="badge">REAL DATA · ML-POWERED</span>
</header>
<div class="g2">
  <div class="card">
    <h3>Farm and Field</h3>
    <p style="font-size:18px;font-weight:800">${farm.farmName}</p>
    <p style="font-size:13px;color:#64748b;margin-top:4px">${farm.location}</p>
    <p style="font-size:13px;color:#64748b;margin-top:3px">Field: <b>${field.fieldName}</b> — ${field.crop} (${field.variety})</p>
    <p style="font-size:13px;color:#64748b;margin-top:3px">Area: ${field.area} · Stage: ${field.stage} · Health: ${field.health}</p>
  </div>
  <div class="card">
    <h3>Crop Health Distribution (${analyticsData.length} readings)</h3>
    <table><thead><tr><th>Category</th><th>Count</th></tr></thead><tbody>${distRows}</tbody></table>
  </div>
</div>
<div class="g3">
  <div class="card">
    <h3>Latest Predicted Yield</h3>
    <p class="kpi">${latestYield}<span class="kpi-unit">t/ha</span></p>
    <p class="note">Per ML run (yield_model.pkl)</p>
  </div>
  <div class="card">
    <h3>Latest Irrigation Req.</h3>
    <p class="kpi">${latestIrrigation}<span class="kpi-unit">mm</span></p>
    <p class="note">Per ML run (irrigation_model.pkl)</p>
  </div>
  <div class="card">
    <h3>Latest Rainfall</h3>
    <p class="kpi">${latestRainfall}<span class="kpi-unit">mm</span></p>
    <p class="note">Actual sensor reading</p>
  </div>
</div>
<p class="sec">${analyticsData.length}-Reading Trend — ${metaCfg.key}</p>
<div class="card" style="padding:0"><table><thead><tr><th>Reading</th><th>Value</th><th>Unit</th></tr></thead><tbody>${trendRows}</tbody></table></div>
<p class="sec">AI Field Recommendation</p>
<div class="rec">${field.aiRecommendation}</div>
<footer><span>Digital Twin Agriculture — ${farm.farmName} — ${field.fieldName}</span><span>${ts}</span></footer>
<script>window.onload=()=>window.print()<\/script>
</body></html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

function downloadCSV({ farm, field, metaCfg, analyticsData }) {
  const header =
    "Farm,Field,Crop,Date,Metric,Unit,Value,Temperature(°C),Humidity(%),SoilMoisture(%),Rainfall(mm),HealthScore(%),PredictedYield(t/ha),IrrigationReq(mm)\n";
  const rows = analyticsData
    .map(
      (d) =>
        `"${farm.farmName}","${field.fieldName}","${field.crop}","${d.date}","${metaCfg.key}","${metaCfg.unit}",${d[metaCfg.dataKey]},${d.temperature},${d.humidity},${d.soilMoisture},${d.rainfall},${d.healthScore},${d.predictedYield},${d.irrigationRequirement}`
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${farm.farmName.replace(/\s+/g, "_")}_${field.fieldName.replace(/\s+/g, "_")}_${metaCfg.key.replace(/\s+/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── DROPDOWN HOOK ─────────────────────────────────────────────── */
function useDropdown() {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleDoc(e) {
      const inTrigger = containerRef.current?.contains(e.target);
      const inDropdown = dropdownRef.current?.contains(e.target);
      if (!inTrigger && !inDropdown) setOpen(false);
    }
    document.addEventListener("mousedown", handleDoc);
    return () => document.removeEventListener("mousedown", handleDoc);
  }, [open]);

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    function update() {
      if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return { open, setOpen, rect, triggerRef, containerRef, dropdownRef };
}

/* ─── SHARED UI ──────────────────────────────────────────────────── */
function Card({ children, className = "", style = {} }) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl ${className}`}
      style={{
        background: "rgba(255,255,255,0.93)",
        border: "1.5px solid rgba(255,255,255,0.98)",
        backdropFilter: "blur(20px)",
        boxShadow:
          "0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p
      style={{
        fontSize: "10px",
        fontWeight: "700",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "#94a3b8",
        flexShrink: 0,
      }}
    >
      {children}
    </p>
  );
}

function ChartTip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(15,23,42,0.94)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "12px",
        padding: "10px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: "600",
          color: "rgba(255,255,255,0.45)",
          marginBottom: "4px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "24px",
          fontWeight: "800",
          color: "white",
          lineHeight: 1,
        }}
      >
        {payload[0].value}
        <span
          style={{
            fontSize: "13px",
            marginLeft: "3px",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          {unit}
        </span>
      </p>
    </div>
  );
}

function ChartLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 min-h-0">
      <Loader2
        size={22}
        className="animate-spin"
        style={{ color: "#16a34a" }}
      />
      <p style={{ fontSize: "12px", color: "#94a3b8" }}>
        Loading data from backend…
      </p>
    </div>
  );
}

function ChartError({ msg, onRetry }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 min-h-0 px-4">
      <AlertTriangle size={22} style={{ color: "#f59e0b" }} />
      <p
        style={{
          fontSize: "12px",
          color: "#94a3b8",
          textAlign: "center",
          maxWidth: "240px",
        }}
      >
        {msg}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
          style={{
            background: "rgba(22,163,74,0.12)",
            border: "1px solid rgba(22,163,74,0.3)",
            color: "#16a34a",
            marginTop: "2px",
          }}
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  );
}

/* ─── SELECTORS ─────────────────────────────────────────────────── */
function Selector({ triggerLabel, triggerValue, dropdownWidth, items, renderItem }) {
  const { open, setOpen, rect, triggerRef, containerRef, dropdownRef } =
    useDropdown();
  const close = () => setOpen(false);

  const dropdownStyle = {
    position: "fixed",
    top: rect ? rect.bottom + 4 : 0,
    left: rect ? rect.left : 0,
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
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition hover:bg-slate-100"
        style={{ border: "1.5px solid #e2e8f0" }}
      >
        <span style={{ fontSize: "12px", fontWeight: "500", color: "#64748b" }}>
          {triggerLabel}
        </span>
        <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
          {triggerValue}
        </span>
        <ChevronDown
          size={13}
          style={{
            color: "#94a3b8",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .2s",
            flexShrink: 0,
          }}
        />
      </button>
      {open &&
        rect &&
        createPortal(
          <div ref={dropdownRef} style={dropdownStyle}>
            {items.map((item) => (
              <div key={item.key}>{renderItem(item, close)}</div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

function MetricSelector({ metric, setMetric }) {
  const { open, setOpen, rect, triggerRef, containerRef, dropdownRef } =
    useDropdown();
  const metaCfg = METRICS.find((m) => m.key === metric);
  const DROPDOWN_W = 200;

  const dropdownStyle = {
    position: "fixed",
    top: rect ? rect.bottom + 4 : 0,
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
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl px-4 py-2 transition hover:bg-slate-50"
        style={{
          border: "1.5px solid #e2e8f0",
          fontSize: "13px",
          fontWeight: "700",
          color: "#334155",
        }}
      >
        <span
          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: metaCfg.color,
            boxShadow: `0 0 6px ${metaCfg.color}70`,
          }}
        />
        {metric}
        <ChevronDown
          size={13}
          style={{
            color: "#94a3b8",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .2s",
          }}
        />
      </button>
      {open &&
        rect &&
        createPortal(
          <div ref={dropdownRef} style={dropdownStyle}>
            {METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  setMetric(m.key);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 transition hover:bg-slate-50 text-left"
                style={{
                  fontSize: "13px",
                  fontWeight: m.key === metric ? "700" : "500",
                  color: m.key === metric ? m.color : "#475569",
                }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: m.color }}
                />
                {m.key}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

/* ─── CHART A: Rainfall vs Irrigation Requirement ───────────────── */
function RainfallVsIrrigationChart({ analyticsData, loading, error, onRetry }) {
  if (loading) return <ChartLoading />;
  if (error) return <ChartError msg={error} onRetry={onRetry} />;
  if (!analyticsData?.length)
    return <ChartError msg="No data available for this field." />;

  const chartData = analyticsData.map((d) => ({
    day: d.date,
    rainfall: d.rainfall,
    irrigation: d.irrigationRequirement,
  }));

  return (
    <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 4, left: -18, bottom: 0 }}
          barSize={8}
          barGap={2}
          barCategoryGap="28%"
        >
          <CartesianGrid strokeDasharray="3 4" stroke="rgba(0,0,0,0.05)" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}mm`}
          />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div
                  style={{
                    background: "rgba(15,23,42,0.92)",
                    borderRadius: "10px",
                    padding: "8px 14px",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.4)",
                      marginBottom: "4px",
                    }}
                  >
                    {label}
                  </p>
                  {payload.map((p) => (
                    <p
                      key={p.name}
                      style={{ fontSize: "13px", fontWeight: 700, color: p.fill }}
                    >
                      {p.name}: {p.value} mm
                    </p>
                  ))}
                </div>
              ) : null
            }
          />
          <Legend
            wrapperStyle={{ fontSize: "10px", color: "#64748b" }}
            iconSize={8}
          />
          <Bar
            dataKey="rainfall"
            name="Rainfall (mm)"
            fill="#7c3aed"
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="irrigation"
            name="Irrigation req."
            fill="#0891b2"
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── CHART B: Predicted Yield per ML Run ───────────────────────── */
function PredictedYieldChart({ analyticsData, loading, error, onRetry }) {
  if (loading) return <ChartLoading />;
  if (error) return <ChartError msg={error} onRetry={onRetry} />;
  if (!analyticsData?.length)
    return <ChartError msg="No data available for this field." />;

  const chartData = analyticsData.map((d) => ({
    day: d.date,
    yield: d.predictedYield,
  }));

  const latestYield = chartData[chartData.length - 1]?.yield ?? 0;
  const avgYield =
    chartData.reduce((s, d) => s + d.yield, 0) / chartData.length;
  const maxVal = Math.max(...chartData.map((d) => d.yield));
  const maxY = Math.ceil(maxVal * 1.2) || 10;

  return (
    <>
      {/* KPI headline */}
      <div className="flex items-center gap-3 mb-2 shrink-0">
        <div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: "900",
              color: "#16a34a",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {latestYield.toFixed(2)}
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: "700",
              color: "#94a3b8",
              marginLeft: "4px",
            }}
          >
            t/ha
          </span>
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#64748b",
            borderLeft: "1.5px solid #e2e8f0",
            paddingLeft: "10px",
          }}
        >
          <div>Latest prediction</div>
          <div style={{ color: "#94a3b8" }}>
            Avg: {avgYield.toFixed(2)} t/ha
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 2, right: 4, left: -18, bottom: 0 }}
            barSize={12}
            barCategoryGap="32%"
          >
            <CartesianGrid strokeDasharray="3 4" stroke="rgba(0,0,0,0.05)" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, maxY]}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
            />
            <ReferenceLine
              y={avgYield}
              stroke="#16a34a"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: "avg",
                position: "right",
                fontSize: 9,
                fill: "#16a34a",
              }}
            />
            <Tooltip
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div
                    style={{
                      background: "rgba(15,23,42,0.92)",
                      borderRadius: "10px",
                      padding: "8px 14px",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.4)",
                        marginBottom: "4px",
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#16a34a",
                      }}
                    >
                      Yield: {payload[0].value} t/ha
                    </p>
                    <p
                      style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}
                    >
                      ML prediction per reading
                    </p>
                  </div>
                ) : null
              }
            />
            <Bar
              dataKey="yield"
              name="Predicted Yield (t/ha)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            >
              {chartData.map((_, i) => (
                <Cell
                  key={i}
                  fill={`hsl(${140 - i * 5}, 60%, ${44 + i * 1.2}%)`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

/* ─── CHART C: Crop Health Distribution Donut ───────────────────── */
function CropHealthDonut({ analyticsData, loading, error, onRetry }) {
  if (loading) return <ChartLoading />;
  if (error) return <ChartError msg={error} onRetry={onRetry} />;
  if (!analyticsData?.length)
    return <ChartError msg="No data available for this field." />;

  const counts = { Healthy: 0, Moderate: 0, Stressed: 0 };
  analyticsData.forEach((d) => {
    counts[classifyHealth(d.healthScore)]++;
  });

  const donutData = [
    { name: "Healthy", value: counts.Healthy, color: "#16a34a" },
    { name: "Moderate", value: counts.Moderate, color: "#f59e0b" },
    { name: "Stressed", value: counts.Stressed, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const dominant =
    donutData.length > 0
      ? donutData.reduce((a, b) => (a.value > b.value ? a : b))
      : { name: "N/A", value: 0, color: "#94a3b8" };

  const total = analyticsData.length;

  return (
    <>
      <div className="relative flex-1 min-h-0 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={donutData}
              cx="50%"
              cy="46%"
              innerRadius="42%"
              outerRadius="68%"
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {donutData.map((e, i) => (
                <Cell key={i} fill={e.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div
                    style={{
                      background: "rgba(15,23,42,0.9)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: payload[0]?.payload?.color,
                      }}
                    >
                      {payload[0]?.name}: {payload[0]?.value} of {total} readings
                    </p>
                  </div>
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
          style={{ paddingBottom: "8%" }}
        >
          <span
            style={{
              fontSize: "18px",
              fontWeight: "900",
              color: dominant.color,
              lineHeight: 1,
            }}
          >
            {dominant.value}
          </span>
          <span
            style={{
              fontSize: "9px",
              fontWeight: "700",
              color: "#94a3b8",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {dominant.name}
          </span>
        </div>
      </div>
      <div className="shrink-0 flex justify-center gap-3 mt-1.5">
        {[
          { name: "Healthy", color: "#16a34a", val: counts.Healthy },
          { name: "Moderate", color: "#f59e0b", val: counts.Moderate },
          { name: "Stressed", color: "#ef4444", val: counts.Stressed },
        ].map(({ name, color, val }) => (
          <div key={name} className="flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span
              style={{ fontSize: "10px", fontWeight: "600", color: "#64748b" }}
            >
              {name} ({val})
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── INSIGHTS PANEL ────────────────────────────────────────────── */
/**
 * All observations are derived purely from analyticsData returned by the backend.
 * No values are fabricated. If data is insufficient, the insight is omitted.
 */
function InsightsPanel({ analyticsData, field, metric }) {
  const insights = useMemo(() => {
    if (!analyticsData?.length) return [];

    const items = [];
    const latest = analyticsData[analyticsData.length - 1];
    const n = analyticsData.length;

    /* 1. Field condition based on latest health score */
    const healthCat = classifyHealth(latest.healthScore);
    const healthColor =
      healthCat === "Healthy"
        ? "#16a34a"
        : healthCat === "Moderate"
        ? "#d97706"
        : "#dc2626";
    items.push({
      id: "health",
      icon: Leaf,
      color: healthColor,
      bg: `${healthColor}10`,
      border: `${healthColor}25`,
      label: "Field Condition",
      value: healthCat,
      detail: `Latest crop health score: ${latest.healthScore}%`,
    });

    /* 2. Trend direction of currently selected metric */
    const metaCfg = METRICS.find((m) => m.key === metric);
    if (metaCfg && n >= 6) {
      const values = analyticsData.map((d) => d[metaCfg.dataKey]);
      const trend = calcTrend(values, 3);
      if (trend !== null) {
        const TrendIcon =
          trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
        const trendColor =
          trend === "stable"
            ? "#64748b"
            : metric === "Crop Health" || metric === "Soil Moisture" || metric === "Humidity"
            ? trend === "up"
              ? "#16a34a"
              : "#dc2626"
            : metric === "Temperature"
            ? trend === "up"
              ? "#dc2626"
              : "#16a34a"
            : "#0891b2";
        const trendLabel =
          trend === "up" ? "Increasing" : trend === "down" ? "Decreasing" : "Stable";
        items.push({
          id: "trend",
          icon: TrendIcon,
          color: trendColor,
          bg: `${trendColor}10`,
          border: `${trendColor}25`,
          label: `${metric} Trend`,
          value: trendLabel,
          detail: `Based on comparing first 3 vs last 3 of ${n} readings`,
        });
      }
    }

    /* 3. Irrigation observation: compare avg irrigation vs avg rainfall */
    const avgIrrigation =
      analyticsData.reduce((s, d) => s + d.irrigationRequirement, 0) / n;
    const avgRainfall =
      analyticsData.reduce((s, d) => s + d.rainfall, 0) / n;
    const deficit = avgIrrigation - avgRainfall;
    if (deficit > 2) {
      items.push({
        id: "irrigation",
        icon: Droplets,
        color: "#0891b2",
        bg: "#0891b210",
        border: "#0891b225",
        label: "Irrigation Observation",
        value: `${deficit.toFixed(1)} mm deficit`,
        detail: `Avg irrigation req. (${avgIrrigation.toFixed(1)} mm) exceeds avg rainfall (${avgRainfall.toFixed(1)} mm)`,
      });
    } else if (avgRainfall > avgIrrigation + 2) {
      items.push({
        id: "irrigation",
        icon: CloudRain,
        color: "#7c3aed",
        bg: "#7c3aed10",
        border: "#7c3aed25",
        label: "Irrigation Observation",
        value: "Rainfall surplus",
        detail: `Avg rainfall (${avgRainfall.toFixed(1)} mm) exceeds irrigation requirement (${avgIrrigation.toFixed(1)} mm)`,
      });
    } else {
      items.push({
        id: "irrigation",
        icon: Droplets,
        color: "#16a34a",
        bg: "#16a34a10",
        border: "#16a34a25",
        label: "Irrigation Observation",
        value: "Balanced",
        detail: `Rainfall and irrigation requirement are approximately balanced`,
      });
    }

    /* 4. Latest predicted yield from ML */
    items.push({
      id: "yield",
      icon: BarChart3,
      color: "#16a34a",
      bg: "#16a34a10",
      border: "#16a34a25",
      label: "Yield Prediction",
      value: `${latest.predictedYield.toFixed(2)} t/ha`,
      detail: `Latest ML prediction from yield_model.pkl`,
    });

    return items;
  }, [analyticsData, metric]);

  if (!insights.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {insights.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            className="flex items-start gap-2.5 rounded-xl p-3"
            style={{
              background: item.bg,
              border: `1.5px solid ${item.border}`,
            }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{ background: item.color, marginTop: "1px" }}
            >
              <Icon size={13} color="white" />
            </div>
            <div className="min-w-0">
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#94a3b8",
                  lineHeight: 1.2,
                }}
              >
                {item.label}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: "800",
                  color: item.color,
                  marginTop: "2px",
                  lineHeight: 1.2,
                }}
              >
                {item.value}
              </p>
              <p
                style={{
                  fontSize: "10px",
                  color: "#94a3b8",
                  marginTop: "3px",
                  lineHeight: 1.3,
                }}
              >
                {item.detail}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── MAIN ANALYTICS COMPONENT ──────────────────────────────────── */
export default function Analytics() {
  /* ── Selection state ── */
  const [farmId, setFarmId] = useState(FARMS_DATA[0].farmId);
  const [fieldId, setFieldId] = useState(FARMS_DATA[0].fields[0].fieldId);
  const [metric, setMetric] = useState("Crop Health");

  /* ── Backend data ── */
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  /* ── Derived ── */
  const farm = FARMS_DATA.find((f) => f.farmId === farmId) ?? FARMS_DATA[0];
  const fields = farm.fields;
  const field = fields.find((f) => f.fieldId === fieldId) ?? fields[0];

  /* ── Keep fieldId valid when farm changes ── */
  useEffect(() => {
    const currentFarm =
      FARMS_DATA.find((f) => f.farmId === farmId) ?? FARMS_DATA[0];
    const isValid = currentFarm.fields.some((f) => f.fieldId === fieldId);
    if (!isValid) setFieldId(currentFarm.fields[0].fieldId);
  }, [farmId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── In-flight guard (req 9): prevents silent polls from stacking ── */
  const isFetchingRef = useRef(false);

  /**
   * fetchAnalytics
   * - silent=false → show loading skeleton (initial / field-change / retry)
   *                  always fires, resets isFetchingRef so recovery works
   * - silent=true  → background poll, no skeleton flash
   *                  SKIPPED if a request is already in progress
   */
  const fetchAnalytics = useCallback((fid, silent = false) => {
    // Silent polls are skipped while a request is in flight.
    // This prevents stacking 10-second polls when the backend is slow.
    if (silent && isFetchingRef.current) return;

    isFetchingRef.current = true;

    const backendId = toBackendFieldId(fid);
    if (!silent) {
      setLoading(true);
      setFetchError(null);
      setAnalyticsData([]);
    }
    api
      .get(`/analytics/${backendId}`)
      .then((res) => {
        setAnalyticsData(res.data ?? []);
        setFetchError(null);
        setLastRefreshed(new Date());
      })
      .catch((err) => {
        console.error("[Analytics] Backend fetch error:", err);
        if (!silent) {
          setFetchError(
            "Backend unavailable. Start the Spring Boot server at localhost:8081."
          );
          setAnalyticsData([]);
        }
        // On silent poll failure, keep existing data visible; just don't update timestamp
      })
      .finally(() => {
        isFetchingRef.current = false;
        if (!silent) setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Initial + field-change fetch (shows skeleton) */
  useEffect(() => {
    fetchAnalytics(fieldId, false);
  }, [fieldId, fetchAnalytics]);

  /* Silent 10-second polling — mirrors Dashboard pattern */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics(fieldId, true);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fieldId, fetchAnalytics]);

  /* ── Derived chart data ── */
  const metaCfg = METRICS.find((m) => m.key === metric);

  const trendPoints = useMemo(
    () =>
      analyticsData.map((d) => ({
        day: d.date,
        value: d[metaCfg.dataKey] ?? 0,
      })),
    [analyticsData, metaCfg.dataKey]
  );

  const latestVal =
    trendPoints.length > 0
      ? trendPoints[trendPoints.length - 1].value
      : null;

  const healthDist = useMemo(() => {
    const counts = { healthy: 0, moderate: 0, stressed: 0 };
    analyticsData.forEach((d) => {
      const cat = classifyHealth(d.healthScore);
      if (cat === "Healthy") counts.healthy++;
      else if (cat === "Moderate") counts.moderate++;
      else counts.stressed++;
    });
    return counts;
  }, [analyticsData]);

  /* ── UI helpers ── */
  const hc =
    field.health === "Healthy"
      ? "#16a34a"
      : field.health === "Watch"
      ? "#d97706"
      : "#dc2626";
  const gradId = `ag-${metric.replace(/\s+/g, "").toLowerCase()}-${field.fieldId}`;
  const chartKey = `${field.fieldId}-${metric}`;

  const farmItems = useMemo(
    () => FARMS_DATA.map((f) => ({ key: f.farmId, f })),
    []
  );
  const fieldItems = useMemo(
    () => fields.map((f) => ({ key: f.fieldId, f })),
    [fields]
  );

  const handleFarmSelect = useCallback((fid, closeFn) => {
    const nf = FARMS_DATA.find((f) => f.farmId === fid) ?? FARMS_DATA[0];
    setFarmId(nf.farmId);
    setFieldId(nf.fields[0].fieldId);
    closeFn();
  }, []);

  const handleFieldSelect = useCallback((fid, closeFn) => {
    setFieldId(fid);
    closeFn();
  }, []);

  const handleRetry = useCallback(() => {
    fetchAnalytics(fieldId, false);
  }, [fieldId, fetchAnalytics]);

  const onlineSensors = field.sensors.filter((s) => s.status === "online").length;
  const totalSensors = field.sensors.length;
  const readingCount = analyticsData.length;

  const lastRefreshedStr = lastRefreshed
    ? lastRefreshed.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  /* ── Render ── */
  return (
    <div
      className="relative -m-[25px] flex h-screen flex-col"
      style={{
        background:
          "linear-gradient(135deg,hsl(84,33%,95%) 0%,hsl(0,0%,99%) 50%,hsl(148,25%,93%) 100%)",
        overflow: "hidden",
      }}
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute right-[-5rem] top-[-3rem] h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-4rem] left-[-4rem] h-80 w-80 rounded-full bg-agri-water/6 blur-3xl" />

      {/* ─── HEADER ─── */}
      <div
        className="relative shrink-0 flex items-center justify-between px-5 gap-3"
        style={{
          height: "52px",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          background: "rgba(255,255,255,0.62)",
          backdropFilter: "blur(14px)",
        }}
      >
        {/* Left: page label + selectors */}
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-primary" />
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>
            Analytics
          </span>
          <span style={{ color: "#cbd5e1", fontSize: "16px", marginInline: "2px" }}>
            ·
          </span>

          {/* Farm selector */}
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
                style={{
                  fontSize: "13px",
                  fontWeight: item.f.farmId === farmId ? "700" : "500",
                  color: item.f.farmId === farmId ? "#16a34a" : "#334155",
                  whiteSpace: "nowrap",
                }}
              >
                <MapPin
                  size={12}
                  style={{
                    color: item.f.farmId === farmId ? "#16a34a" : "#94a3b8",
                    flexShrink: 0,
                  }}
                />
                {item.f.farmName}
                <span
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                    fontWeight: 400,
                    marginLeft: "2px",
                  }}
                >
                  {item.f.location}
                </span>
              </button>
            )}
          />

          {/* Field selector */}
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
                style={{
                  fontSize: "13px",
                  fontWeight: item.f.fieldId === fieldId ? "700" : "500",
                  color: item.f.fieldId === fieldId ? "#16a34a" : "#334155",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      item.f.fieldId === fieldId ? "#16a34a" : "#cbd5e1",
                  }}
                />
                {item.f.fieldName}
                <span
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                    fontWeight: 400,
                    marginLeft: "4px",
                  }}
                >
                  {item.f.crop}
                </span>
              </button>
            )}
          />
        </div>

        {/* Right: status pills */}
        <div className="flex items-center gap-2.5">
          {/* Last refresh time */}
          {lastRefreshedStr && (
            <div className="flex items-center gap-1.5">
              <Clock size={11} style={{ color: "#94a3b8" }} />
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                {lastRefreshedStr}
              </span>
            </div>
          )}

          {/* Reading count */}
          {readingCount > 0 && (
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              {readingCount} readings
            </span>
          )}

          {/* Sensor status */}
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{
              background: "rgba(22,163,74,0.08)",
              border: "1px solid rgba(22,163,74,0.2)",
            }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#16a34a" }}>
              {onlineSensors}/{totalSensors} sensors
            </span>
          </div>

          {/* Field health */}
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{ background: `${hc}12`, border: `1px solid ${hc}30` }}
          >
            <Activity size={11} style={{ color: hc }} />
            <span style={{ fontSize: "12px", fontWeight: "600", color: hc }}>
              {field.health}
            </span>
          </div>
        </div>
      </div>

      {/* ─── BODY ─── */}
      <div className="relative flex-1 min-h-0 flex gap-3 p-3.5">

        {/* ── LEFT COLUMN (60%) ── */}
        <div className="flex flex-col gap-3" style={{ flex: "0 0 60%" }}>

          {/* Main Historical Trend Chart */}
          <Card
            className="px-5 py-4"
            style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}
          >
            {/* Card header */}
            <div className="mb-3 flex items-start justify-between shrink-0">
              <div>
                <SectionLabel>
                  Historical Trend · Real Backend Data · {field.fieldName}
                </SectionLabel>
                <div className="flex items-end gap-3 mt-2">
                  <span
                    style={{
                      fontSize: "42px",
                      fontWeight: "900",
                      color: metaCfg.color,
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                    }}
                  >
                    {loading ? "…" : latestVal !== null ? latestVal : "—"}
                  </span>
                  <span
                    style={{
                      fontSize: "17px",
                      fontWeight: "700",
                      color: `${metaCfg.color}99`,
                      marginBottom: "5px",
                    }}
                  >
                    {metaCfg.unit}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#94a3b8",
                      marginBottom: "7px",
                    }}
                  >
                    {metaCfg.label} · latest reading
                  </span>
                </div>
              </div>
              <MetricSelector metric={metric} setMetric={setMetric} />
            </div>

            {/* Chart area */}
            <div className="flex-1 min-h-0" key={chartKey}>
              {loading ? (
                <ChartLoading />
              ) : fetchError ? (
                <ChartError msg={fetchError} onRetry={handleRetry} />
              ) : trendPoints.length === 0 ? (
                <ChartError
                  msg="No readings found for this field in the database."
                  onRetry={handleRetry}
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendPoints}
                    margin={{ top: 10, right: 16, left: 2, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={metaCfg.color}
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="100%"
                          stopColor={metaCfg.color}
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 4"
                      stroke="rgba(0,0,0,0.05)"
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={metaCfg.domain}
                      tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                      width={52}
                      tickFormatter={(v) =>
                        metaCfg.unit === "mm"
                          ? `${v}mm`
                          : `${v}${metaCfg.unit}`
                      }
                    />
                    <Tooltip content={<ChartTip unit={metaCfg.unit} />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={metaCfg.color}
                      strokeWidth={2.5}
                      fill={`url(#${gradId})`}
                      dot={false}
                      activeDot={{
                        r: 6,
                        fill: metaCfg.color,
                        stroke: "white",
                        strokeWidth: 2.5,
                      }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* ── Reports Row ── */}
          <div className="flex gap-3 shrink-0" style={{ height: "78px" }}>
            <motion.button
              type="button"
              whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(22,163,74,0.22)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                openPDFReport({ farm, field, metaCfg, analyticsData, healthDist })
              }
              disabled={loading || !analyticsData.length}
              className="flex flex-1 items-center gap-3 rounded-2xl px-5 py-3 text-left disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(135deg,rgba(22,163,74,0.10),rgba(22,163,74,0.05))",
                border: "1.5px solid rgba(22,163,74,0.28)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 2px 12px rgba(22,163,74,0.08)",
              }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(22,163,74,0.15)",
                  border: "1px solid rgba(22,163,74,0.3)",
                }}
              >
                <FileText size={18} style={{ color: "#16a34a" }} />
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>
                  Generate PDF Report
                </p>
                <p style={{ fontSize: "10px", color: "#94a3b8" }}>
                  {field.fieldName} · {farm.farmName} · {metric}
                </p>
              </div>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(8,145,178,0.18)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                downloadCSV({ farm, field, metaCfg, analyticsData })
              }
              disabled={loading || !analyticsData.length}
              className="flex flex-1 items-center gap-3 rounded-2xl px-5 py-3 text-left disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(135deg,rgba(8,145,178,0.09),rgba(8,145,178,0.04))",
                border: "1.5px solid rgba(8,145,178,0.25)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 2px 12px rgba(8,145,178,0.06)",
              }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(8,145,178,0.13)",
                  border: "1px solid rgba(8,145,178,0.25)",
                }}
              >
                <Download size={18} style={{ color: "#0891b2" }} />
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>
                  Export CSV Data
                </p>
                <p style={{ fontSize: "10px", color: "#94a3b8" }}>
                  {readingCount > 0 ? `${readingCount} readings` : "…"} · {metric} · {field.fieldName}
                </p>
              </div>
            </motion.button>
          </div>
        </div>

        {/* ── RIGHT COLUMN (40%) ── */}
        <div className="flex flex-col gap-3" style={{ flex: "0 0 40%" }}>

          {/* Rainfall vs Irrigation — largest right card */}
          <Card
            className="px-4 py-3"
            style={{ flex: "1.4 1 0", display: "flex", flexDirection: "column" }}
          >
            <SectionLabel>Rainfall vs Irrigation Requirement</SectionLabel>
            <p
              style={{
                fontSize: "10px",
                fontWeight: "500",
                color: "#94a3b8",
                marginTop: "2px",
                marginBottom: "4px",
              }}
            >
              {readingCount > 0 ? `${readingCount} readings` : "…"} · mm · irrigation_model.pkl
            </p>
            <RainfallVsIrrigationChart
              analyticsData={analyticsData}
              loading={loading}
              error={fetchError}
              onRetry={handleRetry}
            />
          </Card>

          {/* Predicted Yield */}
          <Card
            className="px-4 py-3"
            style={{ flex: "1.1 1 0", display: "flex", flexDirection: "column" }}
          >
            <SectionLabel>Predicted Yield (t/ha)</SectionLabel>
            <p
              style={{
                fontSize: "10px",
                fontWeight: "500",
                color: "#94a3b8",
                marginTop: "2px",
                marginBottom: "4px",
              }}
            >
              Per-reading ML prediction · yield_model.pkl
            </p>
            <PredictedYieldChart
              analyticsData={analyticsData}
              loading={loading}
              error={fetchError}
              onRetry={handleRetry}
            />
          </Card>

          {/* Crop Health Distribution + Insights stacked */}
          <Card
            className="px-4 py-3"
            style={{ flex: "1.5 1 0", display: "flex", flexDirection: "column" }}
          >
            <SectionLabel>Crop Health Distribution</SectionLabel>
            <p
              style={{
                fontSize: "10px",
                fontWeight: "500",
                color: "#94a3b8",
                marginTop: "2px",
              }}
            >
              Healthy ≥80 · Moderate 60–79 · Stressed &lt;60
            </p>

            {/* Donut — fixed height */}
            <div style={{ flex: "0 0 140px", display: "flex", flexDirection: "column" }}>
              <CropHealthDonut
                analyticsData={analyticsData}
                loading={loading}
                error={fetchError}
                onRetry={handleRetry}
              />
            </div>

            {/* Separator */}
            {analyticsData.length > 0 && !loading && !fetchError && (
              <>
                <div
                  style={{
                    borderTop: "1px solid rgba(0,0,0,0.06)",
                    margin: "8px 0 6px",
                    flexShrink: 0,
                  }}
                />
                <SectionLabel>Data-Driven Insights</SectionLabel>
                <div className="mt-2 flex-1 min-h-0 overflow-auto">
                  <InsightsPanel
                    analyticsData={analyticsData}
                    field={field}
                    metric={metric}
                  />
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
