/**
 * Simulation.jsx — AI Scenario Simulator (Light Theme Polish)
 *
 * Design:  Matches AgriTwin light theme (white/green).
 *          Glassmorphism cards on premium white background.
 *          Typography spec:
 *            Page title   → 34px / 800
 *            Section head → 22px / 700
 *            Slider label → 18px / 600
 *            Slider value → 26px / 800
 *            Pred value   → 40px / 900
 *            Rec text     → 17px / 500 / lh 1.78
 *            Buttons      → 17px / 700-800
 *
 * Backend: POST /simulate { temperature, humidity, soilMoisture, rainfall }
 *          → { healthScore, predictedYield, irrigationRequirement, recommendation }
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ActivitySquare,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  CloudRain,
  Droplets,
  FlaskConical,
  Gauge,
  Leaf,
  Loader2,
  RefreshCw,
  Sparkles,
  Thermometer,
  TrendingUp,
  Waves,
  Wheat,
  Wind,
  Zap,
} from "lucide-react";
import api from "../services/api";

/* ─── Presets ─────────────────────────────────────────────────────── */
const PRESETS = [
  { id: "heatwave",  emoji: "☀️",  label: "Heatwave",   values: { temperature: 42, humidity: 22, soilMoisture: 18, rainfall: 0  } },
  { id: "normal",    emoji: "🌤",  label: "Normal",      values: { temperature: 28, humidity: 65, soilMoisture: 55, rainfall: 8  } },
  { id: "heavyrain", emoji: "🌧",  label: "Heavy Rain",  values: { temperature: 21, humidity: 94, soilMoisture: 88, rainfall: 38 } },
  { id: "dryspell",  emoji: "💨",  label: "Dry Spell",   values: { temperature: 37, humidity: 28, soilMoisture: 22, rainfall: 2  } },
];

/* ─── Slider parameter config ─────────────────────────────────────── */
const PARAMS = [
  {
    key: "temperature", label: "Temperature", unit: "°C", min: 10, max: 50, step: 0.5,
    Icon: Thermometer, color: "#ea580c",
    track: "linear-gradient(to right, #60a5fa 0%, #fb923c 55%, #dc2626 100%)",
  },
  {
    key: "humidity", label: "Humidity", unit: "%", min: 10, max: 100, step: 1,
    Icon: Wind, color: "#0891b2",
    track: "linear-gradient(to right, #86efac 0%, #22d3ee 50%, #0369a1 100%)",
  },
  {
    key: "soilMoisture", label: "Soil Moisture", unit: "%", min: 0, max: 100, step: 1,
    Icon: Droplets, color: "#16a34a",
    track: "linear-gradient(to right, #fbbf24 0%, #22c55e 55%, #166534 100%)",
  },
  {
    key: "rainfall", label: "Rainfall", unit: "mm", min: 0, max: 50, step: 0.5,
    Icon: CloudRain, color: "#4f46e5",
    track: "linear-gradient(to right, #fde68a 0%, #818cf8 45%, #312e81 100%)",
  },
];

/* ─── Risk helper ─────────────────────────────────────────────────── */
function getRisk(healthScore) {
  if (healthScore >= 82) return { label: "Low",    color: "#16a34a", Icon: CheckCircle2,  bg: "rgba(22,163,74,0.08)",   border: "rgba(22,163,74,0.25)"   };
  if (healthScore >= 60) return { label: "Medium", color: "#d97706", Icon: AlertTriangle, bg: "rgba(217,119,6,0.08)",   border: "rgba(217,119,6,0.25)"   };
  return                         { label: "High",   color: "#dc2626", Icon: Gauge,         bg: "rgba(220,38,38,0.08)",   border: "rgba(220,38,38,0.25)"   };
}

/* ─── PremiumSlider ───────────────────────────────────────────────── */
function PremiumSlider({ param, value, onChange }) {
  const { key, label, unit, min, max, step, Icon, color, track } = param;
  const pct = ((value - min) / (max - min)) * 100;
  const displayVal = (step === 1 || step >= 1) ? value : Number(value).toFixed(1);

  return (
    <div className="flex flex-col gap-2.5">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${color}12`, border: `1.5px solid ${color}30` }}
          >
            <Icon size={18} style={{ color }} />
          </div>
          <span style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b" }}>
            {label}
          </span>
        </div>
        {/* Live badge */}
        <motion.div
          key={String(displayVal)}
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.08 }}
          className="flex items-baseline gap-1 rounded-xl px-4 py-1.5"
          style={{ background: `${color}10`, border: `2px solid ${color}30` }}
        >
          <span style={{ fontSize: "26px", fontWeight: "800", color, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {displayVal}
          </span>
          <span style={{ fontSize: "13px", fontWeight: "700", color: `${color}99`, marginBottom: "1px" }}>
            {unit}
          </span>
        </motion.div>
      </div>

      {/* Slider */}
      <div className="relative px-1 py-2">
        <div className="absolute inset-x-1 top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-slate-100" />
        <div
          className="absolute left-1 top-1/2 h-2.5 -translate-y-1/2 rounded-full"
          style={{ width: `calc(${pct}% - ${pct * 0.02}px)`, background: track }}
        />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(key, Number(e.target.value))}
          className="sim-range relative w-full cursor-pointer appearance-none bg-transparent"
          style={{ "--thumb-color": color }}
        />
      </div>

      {/* Range labels */}
      <div className="flex justify-between px-1">
        <span style={{ fontSize: "12px", fontWeight: "500", color: "#94a3b8" }}>{min}{unit}</span>
        <span style={{ fontSize: "12px", fontWeight: "500", color: "#94a3b8" }}>{max}{unit}</span>
      </div>
    </div>
  );
}

/* ─── PredictionCard ──────────────────────────────────────────────── */
function PredictionCard({ label, Icon, color, value, unit, sub, delay = 0, extra }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -3, scale: 1.015 }}
      className="flex flex-col gap-4 rounded-2xl p-6"
      style={{
        background:     "rgba(255,255,255,0.92)",
        border:         `1.5px solid ${color}25`,
        backdropFilter: "blur(20px)",
        boxShadow:      `0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px ${color}12, 0 2px 8px rgba(0,0,0,0.06)`,
      }}
    >
      {/* Icon + label */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: `${color}12`, border: `1.5px solid ${color}30` }}
        >
          <Icon size={22} style={{ color }} />
        </div>
        <span style={{ fontSize: "15px", fontWeight: "600", color: "#475569" }}>{label}</span>
      </div>

      {/* Value */}
      <div>
        <div className="flex items-end gap-1.5">
          <span style={{ fontSize: "40px", fontWeight: "900", color, lineHeight: 1, letterSpacing: "-0.03em" }}>
            {extra ?? value}
          </span>
          {unit && !extra && (
            <span style={{ fontSize: "18px", fontWeight: "700", color: `${color}80`, marginBottom: "4px" }}>
              {unit}
            </span>
          )}
        </div>
        {sub && (
          <p style={{ fontSize: "13px", fontWeight: "500", color: "#94a3b8", marginTop: "6px" }}>
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────── */
const DEFAULTS = { temperature: 30, humidity: 65, soilMoisture: 55, rainfall: 8 };

function Simulation() {
  const [params,       setParams]       = useState({ ...DEFAULTS });
  const [result,       setResult]       = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [activePreset, setActivePreset] = useState("normal");
  const [runCount,     setRunCount]     = useState(0);

  const handleChange = (key, val) => {
    setParams((p) => ({ ...p, [key]: val }));
    setActivePreset(null);
  };

  const applyPreset = (preset) => {
    setParams({ ...preset.values });
    setActivePreset(preset.id);
    setResult(null);
  };

  const handleReset = () => {
    setParams({ ...DEFAULTS });
    setActivePreset("normal");
    setResult(null);
  };

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await api.post("/simulate", {
        temperature:  params.temperature,
        humidity:     params.humidity,
        soilMoisture: params.soilMoisture,
        rainfall:     params.rainfall,
      });
      setResult(res.data);
      setRunCount((n) => n + 1);
    } catch {
      // Demo fallback when backend is offline
      const hs = Math.min(98, Math.max(30, Math.round(
        72 + (params.soilMoisture - 40) * 0.22 + (30 - params.temperature) * 0.15 + params.humidity * 0.05
      )));
      const py = parseFloat(Math.max(2, (6.2 + (params.soilMoisture - 40) * 0.03 + params.rainfall * 0.06)).toFixed(1));
      const ir = parseFloat(Math.max(0, (12 - params.soilMoisture * 0.08 - params.rainfall * 0.15)).toFixed(1));
      setResult({
        healthScore:           hs,
        predictedYield:        py,
        irrigationRequirement: ir,
        recommendation: `Under these simulated conditions (${params.temperature}°C, ${params.humidity}% humidity, ${params.soilMoisture}% soil moisture, ${params.rainfall} mm rainfall), crop health is expected to reach ${hs}%. ${ir > 6 ? `Apply approximately ${ir} mm of irrigation within the next 12 hours to maintain optimal growing conditions. ` : "Current moisture levels are adequate — no immediate irrigation is needed. "}${params.temperature > 36 ? "High temperature stress detected. Consider shade netting or adjusted irrigation timing. " : ""}Projected yield: ${py} t/ha.`,
      });
      setRunCount((n) => n + 1);
    } finally {
      setLoading(false);
    }
  };

  const risk    = result ? getRisk(result.healthScore) : null;
  const RiskIcon = risk?.Icon ?? CheckCircle2;

  return (
    <div
      className="relative -m-[25px] flex h-screen flex-col overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(84,33%,95%) 0%, hsl(0,0%,99%) 50%, hsl(148,25%,93%) 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute right-[-5rem] top-[-3rem] h-72 w-72 rounded-full bg-primary/6 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-5rem] left-[-4rem] h-80 w-80 rounded-full bg-agri-water/8 blur-3xl" />

      {/* ── Header strip ── */}
      <div
        className="relative z-10 shrink-0 flex items-center justify-between px-10 py-4"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "rgba(22,163,74,0.10)", border: "1.5px solid rgba(22,163,74,0.25)", boxShadow: "0 0 16px rgba(22,163,74,0.12)" }}
          >
            <FlaskConical size={22} className="text-primary" />
          </div>
          <div>
            <h1 style={{ fontSize: "34px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              AI Simulation Laboratory
            </h1>
            <p style={{ fontSize: "14px", fontWeight: "500", color: "#64748b", marginTop: "2px" }}>
              What-If Scenario Engine · AgriTwin Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {runCount > 0 && (
            <div
              className="flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{ background: "rgba(22,163,74,0.08)", border: "1.5px solid rgba(22,163,74,0.22)" }}
            >
              <Sparkles size={13} className="text-primary" />
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#16a34a" }}>
                {runCount} simulation{runCount > 1 ? "s" : ""} run
              </span>
            </div>
          )}
          <div
            className="flex items-center gap-2 rounded-full px-4 py-1.5"
            style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-success"
              style={{ boxShadow: "0 0 6px #22c55e" }}
            />
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>
              {loading ? "Model running…" : result ? "Predictions ready" : "Ready"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 min-h-0 flex-1 overflow-auto px-10 py-5">
        <div className="mx-auto flex h-full max-w-[1300px] flex-col gap-5">

          {/* ══════════════════════════════════════
              AI Scenario Builder card
          ══════════════════════════════════════ */}
          <div
            className="shrink-0 rounded-3xl px-10 py-7"
            style={{
              background:     "rgba(255,255,255,0.88)",
              border:         "1.5px solid rgba(255,255,255,0.98)",
              backdropFilter: "blur(24px)",
              boxShadow:      "0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)",
            }}
          >
            {/* Builder header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap size={20} className="text-primary" />
                <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a" }}>
                  AI Scenario Builder
                </h2>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 rounded-xl px-4 py-2 transition hover:bg-slate-100"
                style={{ border: "1px solid #e2e8f0", fontSize: "14px", fontWeight: "600", color: "#64748b" }}
              >
                <RefreshCw size={14} />
                Reset to Default
              </button>
            </div>

            {/* Sliders — 2×2 grid */}
            <div className="mb-7 grid grid-cols-2 gap-x-12 gap-y-6">
              {PARAMS.map((param) => (
                <PremiumSlider
                  key={param.key}
                  param={param}
                  value={params[param.key]}
                  onChange={handleChange}
                />
              ))}
            </div>

            {/* Preset buttons */}
            <div className="mb-7 flex items-center gap-4">
              <span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "0.18em", textTransform: "uppercase", color: "#94a3b8", whiteSpace: "nowrap" }}>
                Quick Presets
              </span>
              <div className="flex flex-wrap gap-3">
                {PRESETS.map((preset) => {
                  const active = activePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="flex items-center gap-2 rounded-xl transition-all duration-200 active:scale-95"
                      style={{
                        padding:     "10px 20px",
                        fontSize:    "15px",
                        fontWeight:  "700",
                        background:  active ? "#16a34a" : "rgba(255,255,255,0.7)",
                        border:      active ? "2px solid #15803d" : "1.5px solid #e2e8f0",
                        color:       active ? "white" : "#475569",
                        boxShadow:   active ? "0 4px 16px rgba(22,163,74,0.30)" : "0 1px 3px rgba(0,0,0,0.06)",
                        transform:   active ? "scale(1.04)" : "scale(1)",
                      }}
                    >
                      {preset.emoji} {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Run button */}
            <motion.button
              type="button"
              onClick={handleRun}
              disabled={loading}
              whileHover={{ scale: 1.005, y: -1 }}
              whileTap={{ scale: 0.995 }}
              className="flex w-full items-center justify-center gap-3 rounded-2xl disabled:opacity-50"
              style={{
                padding:     "18px 32px",
                background:  "linear-gradient(135deg, #16a34a 0%, #15803d 60%, #166534 100%)",
                border:      "1.5px solid rgba(22,163,74,0.4)",
                boxShadow:   "0 6px 28px rgba(22,163,74,0.40), 0 1px 0 rgba(255,255,255,0.15) inset",
                fontSize:    "17px",
                fontWeight:  "800",
                color:       "white",
                letterSpacing: "0.01em",
              }}
            >
              {loading ? (
                <><Loader2 size={22} className="animate-spin" /> Running AI Model…</>
              ) : (
                <><BrainCircuit size={22} /> 🚀 Run AI Simulation</>
              )}
            </motion.button>
          </div>

          {/* ══════════════════════════════════════
              Prediction cards
          ══════════════════════════════════════ */}
          <AnimatePresence>
            {(result || loading) && (
              <motion.div
                key="predictions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="shrink-0"
              >
                <div className="mb-3 flex items-center gap-2">
                  <ActivitySquare size={16} className="text-primary" />
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#94a3b8", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                    Predicted Outcomes
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-5">
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="animate-pulse rounded-2xl"
                          style={{ height: "160px", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.06)" }}
                        />
                      ))
                    : (
                      <>
                        <PredictionCard
                          label="Crop Health Score"  Icon={Leaf}          color="#16a34a"
                          value={result.healthScore} unit="%" sub="Simulated health index"  delay={0.04}
                        />
                        <PredictionCard
                          label="Predicted Yield"    Icon={Wheat}         color="#d97706"
                          value={result.predictedYield} unit="t/ha" sub="Expected harvest"  delay={0.10}
                        />
                        <PredictionCard
                          label="Irrigation Req."   Icon={Waves}         color="#0891b2"
                          value={result.irrigationRequirement} unit="mm" sub="Water input needed"  delay={0.16}
                        />
                        <PredictionCard
                          label="Risk Level"        Icon={RiskIcon}      color={risk.color}
                          extra={risk.label} sub={`Health score: ${result.healthScore}%`}  delay={0.22}
                        />
                      </>
                    )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══════════════════════════════════════
              AI Recommendation card
          ══════════════════════════════════════ */}
          <AnimatePresence>
            {result && !loading && (
              <motion.div
                key={`rec-${runCount}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.42, delay: 0.30, ease: [0.23, 1, 0.32, 1] }}
                className="shrink-0 rounded-3xl p-7"
                style={{
                  background:     "rgba(255,255,255,0.92)",
                  border:         "1.5px solid rgba(22,163,74,0.25)",
                  backdropFilter: "blur(20px)",
                  boxShadow:      "0 8px 32px rgba(22,163,74,0.10), 0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <div className="flex items-start gap-5">
                  {/* Icon */}
                  <div
                    className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{
                      background: "rgba(22,163,74,0.10)",
                      border:     "1.5px solid rgba(22,163,74,0.25)",
                      boxShadow:  "0 0 20px rgba(22,163,74,0.14)",
                    }}
                  >
                    <BrainCircuit size={26} className="text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <span style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                        🤖 AI Recommendation
                      </span>
                      <span
                        className="flex items-center gap-1.5 rounded-full px-3 py-1"
                        style={{ background: "rgba(22,163,74,0.10)", border: "1.5px solid rgba(22,163,74,0.25)", fontSize: "12px", fontWeight: "700", color: "#16a34a" }}
                      >
                        <TrendingUp size={11} />
                        High Confidence
                      </span>
                      <span
                        className="flex items-center gap-1.5 rounded-full px-3 py-1"
                        style={{ background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "600", color: "#64748b" }}
                      >
                        <Sparkles size={11} />
                        AI-generated
                      </span>
                    </div>

                    {/* Recommendation text */}
                    <p style={{ fontSize: "17px", fontWeight: "500", color: "#334155", lineHeight: "1.78" }}>
                      {result.recommendation}
                    </p>

                    {/* Suggested action pill */}
                    {result.irrigationRequirement > 6 && (
                      <div
                        className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2"
                        style={{ background: "rgba(22,163,74,0.08)", border: "1.5px solid rgba(22,163,74,0.22)" }}
                      >
                        <Waves size={15} className="text-primary" />
                        <span style={{ fontSize: "14px", fontWeight: "700", color: "#16a34a" }}>
                          Suggested Action: Apply {result.irrigationRequirement} mm irrigation within 12 hours
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Empty state */}
            {!result && !loading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-1 items-center justify-center py-6"
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <BrainCircuit size={36} className="text-primary/30" />
                  <p style={{ fontSize: "16px", fontWeight: "600", color: "#94a3b8" }}>
                    Set your environmental scenario above
                  </p>
                  <p style={{ fontSize: "15px", fontWeight: "700", color: "#16a34a" }}>
                    then click 🚀 Run AI Simulation
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* ── Slider thumb CSS ── */}
      <style>{`
        .sim-range { -webkit-appearance:none; appearance:none; height:10px; background:transparent; outline:none; }
        .sim-range::-webkit-slider-thumb {
          -webkit-appearance:none; appearance:none;
          width:24px; height:24px; border-radius:50%;
          background:white;
          border:3px solid var(--thumb-color,#16a34a);
          box-shadow:0 2px 8px rgba(0,0,0,0.18), 0 0 0 3px color-mix(in srgb, var(--thumb-color,#16a34a) 20%, transparent);
          cursor:pointer;
          transition:transform .12s, box-shadow .12s;
        }
        .sim-range::-webkit-slider-thumb:hover {
          transform:scale(1.2);
          box-shadow:0 4px 14px rgba(0,0,0,0.22), 0 0 0 6px color-mix(in srgb, var(--thumb-color,#16a34a) 15%, transparent);
        }
        .sim-range::-webkit-slider-thumb:active { transform:scale(1.08); }
        .sim-range::-moz-range-thumb {
          width:24px; height:24px; border-radius:50%;
          background:white; border:3px solid var(--thumb-color,#16a34a);
          box-shadow:0 2px 8px rgba(0,0,0,0.18); cursor:pointer;
        }
      `}</style>
    </div>
  );
}

export default Simulation;