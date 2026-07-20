import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CalendarClock,
  HeartPulse,
  Leaf,
  MapPin,
  RadioTower,
  Ruler,
  Sprout,
} from "lucide-react";
import { HEALTH_STYLES, AI_PRIORITY_STYLES, SENSOR_CONFIG } from "./constants";

/* ─── HealthBadge ────────────────────────────────────────────────────── */
function HealthBadge({ health }) {
  const s = HEALTH_STYLES[health] || HEALTH_STYLES.Healthy;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${s.badge}`}>
      <span className={`h-2 w-2 animate-pulse rounded-full ${s.dot}`} />
      {health}
    </span>
  );
}

/* ─── InfoRow ─────────────────────────────────────────────────────────── */
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/70 px-4 py-3.5">
      <span className="flex shrink-0 items-center gap-2.5 text-[13px] font-medium text-slate-500">
        <Icon size={14} className="text-primary/65 shrink-0" />
        {label}
      </span>
      <span className="text-right text-[14px] font-semibold text-slate-800 leading-snug">{value}</span>
    </div>
  );
}

/* ─── Interactive sensor type chips ─────────────────────────────────── */
/**
 * SensorTypeRow — clicking a chip activates/deactivates the heatmap overlay.
 * The active chip glows and has a thicker border.
 */
function SensorTypeRow({ sensors, activeOverlay, onOverlayChange }) {
  const counts = {};
  sensors.forEach((s) => { counts[s.type] = (counts[s.type] || 0) + 1; });

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(counts).map(([type, count]) => {
        const cfg      = SENSOR_CONFIG[type];
        if (!cfg) return null;
        const isActive = activeOverlay === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onOverlayChange(isActive ? null : type)}
            title={isActive ? `Deactivate ${cfg.label} overlay` : `Show ${cfg.label} heatmap on map`}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all duration-200 active:scale-95"
            style={{
              color:       cfg.hex,
              borderColor: isActive ? cfg.hex : `${cfg.hex}40`,
              background:  isActive ? `${cfg.hex}22` : cfg.bgAlpha,
              boxShadow:   isActive ? `0 0 14px ${cfg.hex}35, inset 0 0 8px ${cfg.hex}12` : "none",
              transform:   isActive ? "scale(1.04)" : "scale(1)",
            }}
          >
            <span
              className={`h-2 w-2 rounded-full ${isActive ? "animate-pulse" : ""}`}
              style={{ backgroundColor: cfg.hex }}
            />
            {count}× {cfg.label}
            {isActive && (
              <span className="ml-1 rounded-full bg-current/20 px-1.5 py-0.5 text-[10px] font-bold">
                ON
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Main panel ─────────────────────────────────────────────────────── */
/**
 * FieldInfoPanel — right panel.
 * No KPI cards, no charts, no dashboard data.
 *
 * Typography scale:
 *   Field name      28px / bold
 *   Farm name       15px / semibold
 *   Section labels  11px / uppercase / tracking-wide
 *   Row label       13px / medium
 *   Row value       14px / semibold
 *   AI text         15px / medium / leading-7
 *   Button          15px / bold
 */
function FieldInfoPanel({ field, farm, liveData, activeOverlay, onOverlayChange }) {
  const navigate = useNavigate();

  if (!field || !farm) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-base text-slate-400">Select a field to view details</p>
      </div>
    );
  }

  const aiStyle = AI_PRIORITY_STYLES[field.aiPriority] || AI_PRIORITY_STYLES.low;
  const priorityBg =
    field.aiPriority === "critical" ? "#dc2626"
    : field.aiPriority === "warning" ? "#d97706"
    : "#15803d";

  const recommendation =
    liveData?.waterRequirement > 0
      ? `Soil moisture is decreasing. Irrigation of approximately ${Number(liveData.waterRequirement).toFixed(1)} mm is recommended within the next 6 hours.`
      : field.aiRecommendation;

  const activeSensors = field.sensors.filter((s) => s.status === "online").length;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={field.fieldId}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="flex h-full flex-col gap-3.5 overflow-y-auto rounded-2xl border border-white/80 bg-white/94 px-5 py-5 shadow-xl backdrop-blur-md"
      >
        {/* ── Field Identity ── */}
        <div className="shrink-0">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
            Selected Field
          </p>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900">
                {field.fieldName}
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-[15px] font-semibold text-slate-500">
                <MapPin size={14} className="shrink-0" />
                {farm.farmName}
              </p>
            </div>
            <div className="mt-1.5 shrink-0">
              <HealthBadge health={field.health} />
            </div>
          </div>
        </div>

        <div className="h-px shrink-0 bg-slate-200" />

        {/* ── Field Information ── */}
        <div className="shrink-0">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Field Information
          </p>
          <div className="flex flex-col gap-1.5">
            <InfoRow icon={Leaf}          label="Crop"          value={`${field.crop} · ${field.variety}`} />
            <InfoRow icon={Ruler}         label="Area"          value={field.area} />
            <InfoRow icon={Sprout}        label="Growth Stage"  value={field.stage} />
            <InfoRow icon={HeartPulse}    label="Health"        value={field.health} />
            <InfoRow icon={CalendarClock} label="Last Updated"  value={field.lastUpdated} />
          </div>
        </div>

        {/* ── Active Sensors (interactive chips) ── */}
        <div className="shrink-0 rounded-xl border border-slate-200 bg-white/60 px-4 py-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
              <RadioTower size={14} className="text-primary/65" />
              Active Sensors
            </span>
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700">
              <span className="h-2 w-2 animate-ping rounded-full bg-success" />
              {activeSensors} / {field.sensors.length} online
            </span>
          </div>
          {/* Interactive chips — click to show map overlay */}
          <SensorTypeRow
            sensors={field.sensors}
            activeOverlay={activeOverlay}
            onOverlayChange={onOverlayChange}
          />
          {activeOverlay && (
            <p className="mt-2 text-[11px] font-medium text-slate-400">
              Tap the active chip to dismiss the overlay.
            </p>
          )}
        </div>

        {/* ── GPS Coordinates ── */}
        {field.gisCenter && (
          <div className="shrink-0 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5">
            <MapPin size={13} className="shrink-0 text-slate-400" />
            <span className="text-[12px] font-semibold text-slate-500">
              {field.gisCenter[0].toFixed(5)}°N,&nbsp;{field.gisCenter[1].toFixed(5)}°E
            </span>
            <span className="ml-auto text-[10px] text-slate-400/60">PAU placeholder</span>
          </div>
        )}

        <div className="h-px shrink-0 bg-slate-200" />

        {/* ── AI Recommendation ── */}
        <div className={`shrink-0 flex flex-col gap-3 rounded-xl border p-4 ${aiStyle.container}`}>
          <div className="flex items-center gap-2.5">
            <BrainCircuit size={16} className="shrink-0 text-primary" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              AI Recommendation
            </p>
            <span
              className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
              style={{ background: priorityBg }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
              {aiStyle.label}
            </span>
          </div>
          <p className="text-[15px] font-medium leading-[1.75] text-slate-800">
            {recommendation}
          </p>
        </div>

        {/* ── Run Simulation CTA ── */}
        <div className="mt-auto shrink-0">
          <button
            type="button"
            onClick={() => navigate("/simulation")}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 py-4 text-[15px] font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl hover:bg-agri-canopy/90 active:translate-y-0 active:shadow-md"
          >
            <Activity size={19} />
            Run Simulation
            <ArrowRight size={17} />
          </button>
          <p className="mt-2 text-center text-[12px] font-medium text-slate-400">
            Simulate weather scenarios and predict crop outcomes
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default FieldInfoPanel;
