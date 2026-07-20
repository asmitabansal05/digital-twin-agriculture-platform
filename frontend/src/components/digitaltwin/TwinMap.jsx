import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck,
  CalendarClock,
  ChevronDown,
  CloudRain,
  Droplets,
  Expand,
  Eye,
  EyeOff,
  Focus,
  HeartPulse,
  Layers,
  Minimize2,
  RadioTower,
  Sprout,
  Thermometer,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { PLOT_DATA, SENSOR_NODES, HEALTH_CONFIG } from "./constants";

/* ─── SVG Defs ────────────────────────────────────────────────────────── */
function MapDefs() {
  return (
    <defs>
      {/* Generic glow for selected plot */}
      <filter id="glow-healthy" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="7" result="blur" />
        <feFlood floodColor="#16a34a" floodOpacity="0.45" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glow-warning" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="7" result="blur" />
        <feFlood floodColor="#d97706" floodOpacity="0.45" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glow-stress" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="7" result="blur" />
        <feFlood floodColor="#dc2626" floodOpacity="0.45" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* Soft ambient glow behind the farm area */}
      <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(52,211,153,0.14)" />
        <stop offset="100%" stopColor="rgba(52,211,153,0)" />
      </radialGradient>
    </defs>
  );
}

/* ─── Floating map control chips ──────────────────────────────────────── */
function MapChip({ icon: Icon, label, value, tone = "default" }) {
  const toneStyle =
    tone === "alert"
      ? "border-warning/30 bg-warning/15 text-warning-foreground"
      : "border-white/15 bg-black/25 text-white";
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold backdrop-blur ${toneStyle}`}
    >
      <Icon size={11} />
      <span className="opacity-70">{label}</span>
      <span>{value}</span>
    </div>
  );
}

/* ─── Layer toggle button ─────────────────────────────────────────────── */
function LayerToggle({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold backdrop-blur transition ${
        active
          ? "border-primary/60 bg-primary/25 text-white"
          : "border-white/15 bg-black/25 text-white/70 hover:bg-white/12"
      }`}
    >
      {active ? <Eye size={11} /> : <EyeOff size={11} />}
      {label}
    </button>
  );
}

/* ─── Main TwinMap component ──────────────────────────────────────────── */
/**
 * TwinMap — the hero SVG map component.
 *
 * GIS Readiness:
 *   All plot geometry comes from PLOT_DATA (constants.js).
 *   Each plot has `svgPoints` (placeholder) + `gisCoords`/`gisCenter` (null).
 *   When real PAU data arrives: update constants.js only.
 *   To swap SVG for Leaflet/MapLibre: replace the <svg> block below —
 *   the props interface (selectedPlot, onSelectPlot, liveData) stays the same.
 */
function TwinMap({ selectedPlot, onSelectPlot, liveData }) {
  const [zoom, setZoom] = useState(1);
  const [showHealth, setShowHealth] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredSensor, setHoveredSensor] = useState(null);

  const MIN_ZOOM = 0.75;
  const MAX_ZOOM = 3;

  const handleZoomIn = () =>
    setZoom((z) => Math.min(parseFloat((z * 1.3).toFixed(2)), MAX_ZOOM));
  const handleZoomOut = () =>
    setZoom((z) => Math.max(parseFloat((z / 1.3).toFixed(2)), MIN_ZOOM));
  const handleReset = () => setZoom(1);

  // Live data values (fall back to reasonable defaults when API is loading)
  const temp        = liveData?.temperature    ? `${Number(liveData.temperature).toFixed(1)}°C`   : "—";
  const humidity    = liveData?.humidity       ? `${Number(liveData.humidity).toFixed(0)}%`        : "—";
  const soilMoist   = liveData?.soilMoisture   ? `${Number(liveData.soilMoisture).toFixed(0)}%`    : "—";
  const rainfall    = liveData?.rainfall       ? `${Number(liveData.rainfall).toFixed(1)} mm`      : "—";
  const irrigation  = liveData?.waterRequirement > 0 ? "Active" : "Off";
  const healthScore = liveData?.averageHealth  ? `${Number(liveData.averageHealth).toFixed(0)}%`   : "—";

  const mapContent = (
    <div
      className={`relative overflow-hidden rounded-xl bg-[linear-gradient(145deg,#091a10_0%,#0e2719_40%,#0b2418_70%,#0a1e14_100%)] ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "h-full w-full"
      } shadow-panel`}
    >
      {/* CSS grid-line terrain overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      {/* Ambient light blob behind the farm */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(52,211,153,0.10)_0%,transparent_70%)]" />
      {/* Top edge accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-agri-mint/30 to-transparent" />

      {/* ── Floating: Layer Controls (top-left) ── */}
      <div className="absolute left-3 top-3 z-20 flex flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
          <Layers size={11} />
          <span>Layers</span>
          <ChevronDown size={10} className="opacity-60" />
        </div>
        <LayerToggle
          label="Health"
          active={showHealth}
          onClick={() => setShowHealth((v) => !v)}
        />
        <LayerToggle
          label="Sensors"
          active={showSensors}
          onClick={() => setShowSensors((v) => !v)}
        />
      </div>

      {/* ── Floating: Zoom + Fullscreen Controls (top-right) ── */}
      <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5">
        <div className="flex overflow-hidden rounded-lg border border-white/15 bg-black/30 text-white backdrop-blur">
          {[
            { Icon: ZoomIn,  action: handleZoomIn,  title: "Zoom in"  },
            { Icon: ZoomOut, action: handleZoomOut, title: "Zoom out" },
            { Icon: Focus,   action: handleReset,   title: "Reset view" },
          ].map(({ Icon, action, title }) => (
            <button
              key={title}
              type="button"
              title={title}
              onClick={action}
              className="flex h-9 w-9 items-center justify-center border-r border-white/10 text-white/80 transition hover:bg-white/14 hover:text-white last:border-r-0"
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
        <button
          type="button"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          onClick={() => setIsFullscreen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-black/30 text-white/80 backdrop-blur transition hover:bg-white/14 hover:text-white"
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Expand size={15} />}
        </button>
      </div>

      {/* ── SVG Map Canvas ── */}
      <svg
        viewBox="0 0 700 620"
        className="relative z-10 h-full w-full"
        role="img"
        aria-label="Digital twin farm map — PAU Research Station"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <MapDefs />

        {/* Ambient glow ellipse behind farm */}
        <ellipse cx="350" cy="310" rx="290" ry="260" fill="url(#ambientGlow)" />

        {/* Farm boundary */}
        <polygon
          points="78,48 612,78 660,492 424,594 104,548 42,236"
          className="fill-white/[0.03] stroke-white/25"
          strokeWidth="2"
          strokeDasharray="8 6"
        />

        {/* Irrigation channel — static base */}
        <path
          d="M88 288 C190 252, 294 250, 392 286 S560 348, 638 314"
          className="fill-none stroke-agri-water/30"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="14 18"
        />
        {/* Irrigation channel — animated flow */}
        <motion.path
          d="M88 288 C190 252, 294 250, 392 286 S560 348, 638 314"
          className="fill-none stroke-agri-water"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="22 26"
          animate={{ strokeDashoffset: [0, -120] }}
          transition={{ repeat: Infinity, duration: 3.2, ease: "linear" }}
        />

        {/* Plot polygons */}
        {PLOT_DATA.map((plot) => {
          const isSelected = selectedPlot?.id === plot.id;
          const cfg = HEALTH_CONFIG[plot.health] || HEALTH_CONFIG.Healthy;
          return (
            <motion.polygon
              key={plot.id}
              points={plot.svgPoints}
              className={`cursor-pointer ${
                showHealth
                  ? `${cfg.tailwindFill} ${cfg.tailwindStroke}`
                  : "fill-white/15 stroke-white/35"
              }`}
              strokeWidth={isSelected ? 3.5 : 1.8}
              filter={isSelected ? cfg.glowFilter : undefined}
              onClick={() => onSelectPlot(plot)}
              whileHover={{ scale: 1.008, brightness: 1.15 }}
              animate={
                isSelected
                  ? { opacity: [0.85, 1, 0.85] }
                  : { opacity: 1 }
              }
              transition={
                isSelected
                  ? { opacity: { repeat: Infinity, duration: 2.8, ease: "easeInOut" } }
                  : {}
              }
              style={{ cursor: "pointer" }}
            />
          );
        })}

        {/* Plot label badges */}
        {PLOT_DATA.map((plot) => {
          const isSelected = selectedPlot?.id === plot.id;
          return (
            <g key={`${plot.id}-label`} onClick={() => onSelectPlot(plot)} style={{ cursor: "pointer" }}>
              <rect
                x={plot.svgCenter.x - 52}
                y={plot.svgCenter.y - 14}
                width="104"
                height="24"
                rx="12"
                className={
                  isSelected
                    ? "fill-primary/80 stroke-white/50"
                    : "fill-black/35 stroke-white/20"
                }
                strokeWidth="1"
              />
              <text
                x={plot.svgCenter.x}
                y={plot.svgCenter.y + 3}
                textAnchor="middle"
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  fill: "white",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                {plot.name}
              </text>
            </g>
          );
        })}

        {/* Sensor nodes */}
        {showSensors &&
          SENSOR_NODES.map((sensor, idx) => (
            <g
              key={sensor.id}
              onMouseEnter={() => setHoveredSensor(sensor)}
              onMouseLeave={() => setHoveredSensor(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Pulse ring */}
              <motion.circle
                cx={sensor.x}
                cy={sensor.y}
                r="14"
                className="fill-white/8 stroke-white/25"
                animate={{ r: [12, 24, 12], opacity: [0.4, 0.05, 0.4] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.6,
                  delay: idx * 0.3,
                  ease: "easeInOut",
                }}
              />
              {/* Inner dot */}
              <circle
                cx={sensor.x}
                cy={sensor.y}
                r="7"
                className="fill-white stroke-primary"
                strokeWidth="2.5"
              />
              {/* Sensor ID label */}
              <text
                x={sensor.x}
                y={sensor.y + 26}
                textAnchor="middle"
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  fill: "rgba(255,255,255,0.75)",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                {sensor.id}
              </text>
              {/* Hover tooltip */}
              <AnimatePresence>
                {hoveredSensor?.id === sensor.id && (
                  <motion.g
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                  >
                    <rect
                      x={sensor.x - 36}
                      y={sensor.y - 46}
                      width="72"
                      height="22"
                      rx="7"
                      fill="rgba(10,24,16,0.9)"
                      stroke="rgba(255,255,255,0.15)"
                    />
                    <text
                      x={sensor.x}
                      y={sensor.y - 31}
                      textAnchor="middle"
                      style={{
                        fontSize: "10px",
                        fontWeight: "600",
                        fill: "white",
                        fontFamily: "Inter, system-ui, sans-serif",
                      }}
                    >
                      {sensor.type} Sensor
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>
            </g>
          ))}
      </svg>

      {/* ── Floating Bottom Bar — Live Status + Legend ── */}
      <div className="absolute inset-x-3 bottom-3 z-20 flex items-center justify-between gap-2 rounded-xl border border-white/12 bg-black/35 px-3 py-2 backdrop-blur-md">
        {/* Left: Legend */}
        <div className="flex items-center gap-3">
          {[
            { label: "Healthy", color: "#16a34a" },
            { label: "Watch",   color: "#d97706" },
            { label: "Stress",  color: "#dc2626" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1 text-[10px] font-bold text-white/80">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {label}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-white/15" />

        {/* Right: Live sensor chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <MapChip icon={Thermometer}   label="Temp"     value={temp} />
          <MapChip icon={Droplets}      label="Humidity" value={humidity} />
          <MapChip icon={Sprout}        label="Soil"     value={soilMoist} />
          <MapChip icon={CloudRain}     label="Rain"     value={rainfall} />
          <MapChip
            icon={RadioTower}
            label="Irrig"
            value={irrigation}
            tone={irrigation === "Active" ? "alert" : "default"}
          />
          <MapChip icon={HeartPulse}    label="Health"   value={healthScore} />
        </div>

        {/* Right-most: selected plot context */}
        {selectedPlot && (
          <>
            <div className="h-4 w-px bg-white/15" />
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/90">
              <BadgeCheck size={12} className="text-success" />
              {selectedPlot.name}
              <CalendarClock size={10} className="opacity-50" />
              <span className="opacity-60">{selectedPlot.lastSync || "Live"}</span>
            </div>
          </>
        )}
      </div>

      {/* Fullscreen ESC hint */}
      {isFullscreen && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-[10px] font-bold tracking-widest text-white/20">
          ESC TO EXIT
        </div>
      )}
    </div>
  );

  // When fullscreen: render a portal-like fixed overlay
  return isFullscreen ? (
    <>
      {/* Placeholder to maintain layout space */}
      <div className="h-full w-full rounded-xl bg-[#0e2719]/60" />
      {mapContent}
    </>
  ) : (
    mapContent
  );
}

export default TwinMap;
