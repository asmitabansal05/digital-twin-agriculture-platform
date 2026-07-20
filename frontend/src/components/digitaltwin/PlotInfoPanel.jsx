import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Crosshair,
  Droplets,
  MapPin,
  RadioTower,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { HEALTH_CONFIG } from "./constants";

/* ─── Utility: smooth sparkline path ─────────────────────────────────── */
function buildSparklinePaths(data, width = 130, height = 34) {
  if (!data || data.length < 2) return { line: "", area: "" };

  const min = Math.min(...data) - 2;
  const max = Math.max(...data) + 2;
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * height,
  }));

  // Smooth cubic bezier
  let line = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const c = pts[i];
    const cp1x = p.x + (c.x - p.x) / 2.5;
    const cp2x = c.x - (c.x - p.x) / 2.5;
    line += ` C ${cp1x} ${p.y}, ${cp2x} ${c.y}, ${c.x} ${c.y}`;
  }

  const area =
    line +
    ` L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;

  return { line, area };
}

/* ─── Sub-components ─────────────────────────────────────────────────── */
function HealthBadge({ health }) {
  const cfg = HEALTH_CONFIG[health] || HEALTH_CONFIG.Healthy;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${
        health === "Healthy"
          ? "border-success/25 bg-success/10 text-success"
          : health === "Watch"
          ? "border-warning/35 bg-warning/15 text-warning-foreground"
          : "border-destructive/25 bg-destructive/10 text-destructive"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 animate-pulse rounded-full ${
          health === "Healthy"
            ? "bg-success"
            : health === "Watch"
            ? "bg-warning"
            : "bg-destructive"
        }`}
      />
      {health}
    </span>
  );
}

function InfoCell({ label, value, icon: Icon }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-white/70 px-2.5 py-2">
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {Icon && <Icon size={10} />}
        {label}
      </span>
      <span className="truncate text-xs font-bold text-foreground">{value}</span>
    </div>
  );
}

function ConfidenceBar({ confidence }) {
  const pct = parseInt(confidence, 10) || 0;
  return (
    <div className="rounded-lg border border-primary/15 bg-primary/6 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <BrainCircuit size={12} />
          AI Confidence
        </span>
        <span className="text-primary">{confidence}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-primary/12">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function Sparkline({ data, health }) {
  const cfg = HEALTH_CONFIG[health] || HEALTH_CONFIG.Healthy;
  const { line, area } = buildSparklinePaths(data);
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const trend = last > prev ? "↑" : last < prev ? "↓" : "→";
  const trendColor =
    health === "Healthy"
      ? "text-success"
      : health === "Watch"
      ? "text-warning"
      : "text-destructive";

  return (
    <div className="rounded-lg border border-border bg-white/60 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <TrendingUp size={11} />
          7-Day Health Trend
        </span>
        <span className={`font-bold ${trendColor}`}>
          {trend} {last}%
        </span>
      </div>
      <svg viewBox="0 0 130 34" className="h-8 w-full overflow-visible">
        <defs>
          <linearGradient id="sparkAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cfg.hexColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={cfg.hexColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#sparkAreaGrad)" />
        <path
          d={line}
          fill="none"
          stroke={cfg.hexColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End dot */}
        <circle
          cx={(130 / 6) * 6}
          cy={
            34 -
            ((data[6] - (Math.min(...data) - 2)) /
              (Math.max(...data) + 2 - (Math.min(...data) - 2))) *
              34
          }
          r="3"
          fill={cfg.hexColor}
        />
      </svg>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────── */
/**
 * PlotInfoPanel — contextual details about the currently selected plot.
 * Animates in/out whenever `plot` changes.
 */
function PlotInfoPanel({ plot, confidence, currentTime }) {
  const navigate = useNavigate();

  if (!plot) return null;

  const coordDisplay = plot.gisCenter
    ? `${plot.gisCenter[0].toFixed(5)}°N, ${plot.gisCenter[1].toFixed(5)}°E`
    : `${(30.901 + plot.svgCenter.y / 10000).toFixed(5)}°N, ${(75.857 + plot.svgCenter.x / 10000).toFixed(5)}°E`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={plot.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overflow-x-hidden rounded-xl border border-white/70 bg-white/84 p-4 shadow-panel backdrop-blur-md"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Field Lens
            </p>
            <h2 className="truncate text-xl font-bold leading-tight text-foreground">
              {plot.name}
            </h2>
            <p className="text-sm font-semibold text-muted-foreground">
              {plot.crop}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Crosshair size={16} />
            </div>
            <HealthBadge health={plot.health} />
          </div>
        </div>

        {/* 2×2 Info grid */}
        <div className="grid grid-cols-2 gap-1.5">
          <InfoCell label="Area" value={plot.area} />
          <InfoCell label="Growth Stage" value={plot.stage} />
          <InfoCell
            label="Active Sensors"
            icon={RadioTower}
            value={`${plot.sensors} online`}
          />
          <InfoCell
            label="Last Sync"
            icon={RefreshCw}
            value={plot.lastSync || currentTime}
          />
        </div>

        {/* Coordinates */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <MapPin size={12} className="shrink-0 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">
            {coordDisplay}
          </span>
        </div>

        {/* AI Confidence */}
        <ConfidenceBar confidence={confidence} />

        {/* Sparkline */}
        <Sparkline data={plot.healthHistory} health={plot.health} />

        {/* AI Recommendation */}
        <div className="rounded-lg border border-primary/15 bg-primary/6 p-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            AI Recommendation
          </p>
          <p className="text-xs font-semibold leading-relaxed text-foreground">
            {plot.recommendation}
          </p>
          {plot.nextAction && (
            <p className="mt-1.5 text-[10px] font-bold text-muted-foreground">
              Next: {plot.nextAction}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => navigate("/analytics")}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2.5 text-xs font-bold text-muted-foreground shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
          >
            <BarChart3 size={13} />
            Analytics
          </button>
          <button
            type="button"
            onClick={() => navigate("/simulation")}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:bg-agri-canopy/90"
          >
            <Activity size={13} />
            Simulate
            <ArrowRight size={11} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PlotInfoPanel;
