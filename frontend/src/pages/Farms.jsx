import { useEffect, useState, useCallback } from "react";
import { useNavigate }                        from "react-router-dom";
import { ChevronDown }                        from "lucide-react";
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    BrainCircuit,
    CalendarClock,
    CloudRain,
    Droplets,
    HeartPulse,
    Leaf,
    MapPin,
    RadioTower,
    Ruler,
    Sprout,
    Thermometer,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api                         from "../services/api";
import FarmMap                     from "../components/FarmMap";

/* ─────────────────────────────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────────────────────────────── */
const POLL_INTERVAL_MS = 10000;   /* 10-second live refresh */
const SENSOR_COUNT     = 4;       /* exactly 4 sensor types */

/* ─────────────────────────────────────────────────────────────────────
   Health / AI helpers  (derived from live sensor reading — no hardcoding)
   ──────────────────────────────────────────────────────────────────── */
function deriveHealth(reading) {
    if (!reading) return "Healthy";
    const soil = reading.soilMoisture ?? 60;
    const temp = reading.temperature  ?? 25;
    if (soil < 30 || temp > 42) return "Stress";
    if (soil < 45 || temp > 37) return "Watch";
    return "Healthy";
}

function deriveAIPriority(reading) {
    const h = deriveHealth(reading);
    if (h === "Stress") return "critical";
    if (h === "Watch")  return "warning";
    if (reading && (reading.soilMoisture ?? 60) < 55) return "medium";
    return "low";
}

function generateRecommendation(reading, field) {
    if (!reading) return `Awaiting sensor data for ${field?.field_name ?? "selected field"}…`;
    const soil = reading.soilMoisture ?? 60;
    const temp = reading.temperature  ?? 25;
    const hum  = reading.humidity     ?? 60;
    const rain = reading.rainfall     ?? 0;
    const crop = field?.crop_type     ?? "crop";

    if (soil < 30) {
        const mm = ((55 - soil) * 0.30).toFixed(0);
        return `CRITICAL: Soil moisture critically low at ${soil.toFixed(1)}% for ${crop}. Emergency irrigation of approximately ${mm} mm recommended immediately. Prolonged water stress will impact yield.`;
    }
    if (soil < 45) {
        const mm = ((55 - soil) * 0.25).toFixed(1);
        return `Soil moisture is decreasing (${soil.toFixed(1)}%). Irrigation of approximately ${mm} mm is recommended within the next 6 hours to maintain optimal growing conditions for ${crop}.`;
    }
    if (temp > 37) {
        return `High temperature detected (${temp.toFixed(1)}°C). Heat stress risk is elevated for ${crop}. Ensure adequate soil moisture and consider scheduling irrigation during cooler morning hours.`;
    }
    if (hum > 85) {
        return `High humidity detected (${hum.toFixed(1)}%). Monitor ${crop} for signs of fungal disease. Reduce irrigation frequency temporarily and ensure adequate canopy ventilation.`;
    }
    if (rain > 10) {
        return `Significant rainfall recorded (${rain.toFixed(1)} mm). Defer scheduled irrigation for the next 24–48 hours. Monitor soil drainage and watch for waterlogging in low-lying areas.`;
    }
    return `Field conditions are optimal. Soil moisture at ${soil.toFixed(1)}% and temperature at ${temp.toFixed(1)}°C are within the ideal range for ${crop} growth. Maintain current irrigation schedule and monitor crop development.`;
}

/* AI priority → visual config */
const PRIORITY_CFG = {
    critical: {
        badgeBg:   "#dc2626",
        label:     "Critical",
        container: "border-red-200 bg-red-50/60",
    },
    warning: {
        badgeBg:   "#d97706",
        label:     "Warning",
        container: "border-amber-200 bg-amber-50/60",
    },
    medium: {
        badgeBg:   "#15803d",
        label:     "Action needed",
        container: "border-primary/20 bg-primary/5",
    },
    low: {
        badgeBg:   "#15803d",
        label:     "All clear",
        container: "border-success/20 bg-success/5",
    },
};

/* Health → visual config */
const HEALTH_CFG = {
    Healthy: { badge: "text-success border-success/25 bg-success/10", dot: "bg-success" },
    Watch:   { badge: "text-amber-600 border-amber-300/40 bg-amber-50", dot: "bg-amber-500" },
    Stress:  { badge: "text-red-600 border-red-300/40 bg-red-50",     dot: "bg-red-500" },
};

/* Relative timestamp */
function relativeTime(dateStr) {
    if (!dateStr) return "—";
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    const diffMin = Math.floor(diffSec / 60);
    if (diffSec < 60)  return "just now";
    if (diffMin < 60)  return `${diffMin} min ago`;
    return `${Math.floor(diffMin / 60)} hr ago`;
}

/* ─────────────────────────────────────────────────────────────────────
   SelectorDropdown — compact dark-theme used in top header strip
   ──────────────────────────────────────────────────────────────────── */
function SelectorDropdown({ id, label, value, onChange, options }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
            <label
                htmlFor={id}
                style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.5)",
                }}
            >
                {label}
            </label>
            <div style={{ position: "relative" }}>
                <select
                    id={id}
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    style={{
                        height: "36px",
                        width: "100%",
                        appearance: "none",
                        WebkitAppearance: "none",
                        paddingLeft: "12px",
                        paddingRight: "32px",
                        borderRadius: "10px",
                        border: "1.5px solid rgba(255,255,255,0.22)",
                        background: "rgba(10,50,25,0.92)",
                        color: "white",
                        fontSize: "13px",
                        fontWeight: "600",
                        fontFamily: "inherit",
                        outline: "none",
                        cursor: "pointer",
                        backdropFilter: "blur(8px)",
                    }}
                >
                    {options.map((opt) => (
                        <option
                            key={opt.value}
                            value={opt.value}
                            style={{ background: "#0a2814", color: "white" }}
                        >
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    size={13}
                    style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                        color: "rgba(255,255,255,0.45)",
                    }}
                />
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────
   InfoRow — used inside Field Information section
   ──────────────────────────────────────────────────────────────────── */
function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/70 px-4 py-3.5">
            <span className="flex shrink-0 items-center gap-2 text-[13px] font-medium text-slate-500">
                <Icon size={14} className="shrink-0 text-primary/65" />
                {label}
            </span>
            <span className="text-right text-[13px] font-semibold text-slate-800">{value}</span>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────
   FieldInfoPanel
   Right-side panel restoring the old design:
     • Field name + Health badge
     • Farm name
     • Field Information (Crop, Area, Growth Stage, Health, Last Updated)
     • Active Sensors 4/4 with 4 chips
     • GPS coordinates
     • AI Recommendation (dynamic, derived from live reading)
     • Run Simulation button → /simulation
   ──────────────────────────────────────────────────────────────────── */
function FieldInfoPanel({ field, farmName, reading }) {
    const navigate = useNavigate();

    if (!field) {
        return (
            <div className="flex h-full items-center justify-center rounded-2xl border border-white/80 bg-white/94 p-6 shadow-xl">
                <p className="text-base text-slate-400">Select a field to view details</p>
            </div>
        );
    }

    const health       = deriveHealth(reading);
    const priority     = deriveAIPriority(reading);
    const healthCfg    = HEALTH_CFG[health]    ?? HEALTH_CFG.Healthy;
    const priorityCfg  = PRIORITY_CFG[priority] ?? PRIORITY_CFG.low;
    const recommendation = generateRecommendation(reading, field);
    const activeSensors  = reading ? SENSOR_COUNT : 0;
    const lastUpdated    = relativeTime(reading?.readingTime);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={field.field_id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="flex h-full flex-col gap-3 overflow-y-auto rounded-2xl border border-white/80 bg-white/94 px-5 py-5 shadow-xl backdrop-blur-md"
            >
                {/* ── SELECTED FIELD header ── */}
                <div className="shrink-0">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                        Selected Field
                    </p>
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h2 className="text-[26px] font-bold leading-tight tracking-tight text-slate-900">
                                {field.field_name}
                            </h2>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[14px] font-semibold text-slate-500">
                                <MapPin size={13} className="shrink-0" />
                                {farmName ?? "—"}
                            </p>
                        </div>
                        {/* Health badge — dynamic */}
                        <span
                            className={`mt-1.5 shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-bold ${healthCfg.badge}`}
                        >
                            <span className={`h-2 w-2 animate-pulse rounded-full ${healthCfg.dot}`} />
                            {health}
                        </span>
                    </div>
                </div>

                <div className="h-px shrink-0 bg-slate-200" />

                {/* ── FIELD INFORMATION ── */}
                <div className="shrink-0">
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Field Information
                    </p>
                    <div className="flex flex-col gap-1.5">
                        <InfoRow icon={Leaf}          label="Crop"         value={field.crop_type ?? "—"} />
                        <InfoRow icon={Ruler}         label="Area"         value={field.area != null ? `${field.area} ha` : "—"} />
                        <InfoRow icon={Sprout}        label="Growth Stage" value="—" />
                        <InfoRow icon={HeartPulse}    label="Health"       value={health} />
                        <InfoRow icon={CalendarClock} label="Last Updated" value={lastUpdated} />
                    </div>
                </div>

                {/* ── ACTIVE SENSORS — always exactly 4 ── */}
                <div className="shrink-0 rounded-xl border border-slate-200 bg-white/60 px-4 py-3.5">
                    <div className="mb-2.5 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
                            <RadioTower size={14} className="shrink-0 text-primary/65" />
                            Active Sensors
                        </span>
                        <span className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700">
                            {reading ? (
                                <span className="h-2 w-2 animate-ping rounded-full bg-success" />
                            ) : (
                                <AlertTriangle size={12} className="text-warning" />
                            )}
                            {activeSensors} / {SENSOR_COUNT} online
                        </span>
                    </div>

                    {/* Exactly 4 sensor type chips */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            { type: "Temperature",   color: "#f59e0b", bg: "rgba(245,158,11,0.14)" },
                            { type: "Soil Moisture", color: "#3b82f6", bg: "rgba(59,130,246,0.14)" },
                            { type: "Humidity",      color: "#14b8a6", bg: "rgba(20,184,166,0.14)" },
                            { type: "Rainfall",      color: "#0ea5e9", bg: "rgba(14,165,233,0.14)" },
                        ].map(({ type, color, bg }) => (
                            <span
                                key={type}
                                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold"
                                style={{ color, borderColor: `${color}40`, background: bg }}
                            >
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                                1× {type}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── GPS COORDINATES ── */}
                {field.latitude != null && field.longitude != null && (
                    <div className="shrink-0 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5">
                        <MapPin size={13} className="shrink-0 text-slate-400" />
                        <span className="font-mono text-[12px] font-semibold text-slate-500">
                            {Number(field.latitude).toFixed(5)}°N,&nbsp;{Number(field.longitude).toFixed(5)}°E
                        </span>
                    </div>
                )}

                <div className="h-px shrink-0 bg-slate-200" />

                {/* ── AI RECOMMENDATION ── */}
                <div className={`shrink-0 flex flex-col gap-3 rounded-xl border p-4 ${priorityCfg.container}`}>
                    <div className="flex items-center gap-2">
                        <BrainCircuit size={15} className="shrink-0 text-primary" />
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                            AI Recommendation
                        </p>
                        <span
                            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                            style={{ background: priorityCfg.badgeBg }}
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                            {priorityCfg.label}
                        </span>
                    </div>
                    <p className="text-[14px] font-medium leading-[1.7] text-slate-700">
                        {recommendation}
                    </p>
                </div>

                {/* ── RUN SIMULATION ── */}
                <div className="mt-auto shrink-0 pb-1">
                    <button
                        type="button"
                        onClick={() => navigate("/simulation")}
                        className="group flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 py-4 text-[15px] font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md"
                    >
                        <Activity size={18} className="transition-transform group-hover:scale-110" />
                        Run Simulation
                        <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <p className="mt-2 text-center text-[12px] font-medium text-slate-400">
                        Simulate weather scenarios and predict crop outcomes
                    </p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ─────────────────────────────────────────────────────────────────────
   Farms  (page)

   Visual: restored old full-screen design
     • Dark-green compact top strip  (SELECT FARM → SELECT FIELD · live indicator)
     • 65% Leaflet map (left)  — satellite/dark/terrain controls via FarmMap
     • 35% FieldInfoPanel (right) — the full old panel restored above

   Data: live backend, no hardcoded values
     • GET /farms                  → farm dropdown
     • GET /farms/{id}/fields      → field dropdown
     • GET /sensor-readings/{id}   → latest reading, polled every 10 s
   ──────────────────────────────────────────────────────────────────── */
function Farms() {
    const [farms,            setFarms]           = useState([]);
    const [selectedFarm,     setSelectedFarm]    = useState(null);
    const [selectedFarmName, setSelectedFarmName] = useState("");
    const [fields,           setFields]          = useState([]);
    const [selectedField,    setSelectedField]   = useState(null);
    const [reading,          setReading]         = useState(null);
    const [isConnecting,     setIsConnecting]    = useState(false);

    /* ── 1. Load all farms on mount ── */
    useEffect(() => {
        api.get("/farms")
            .then((res) => {
                setFarms(res.data);
                if (res.data.length > 0) {
                    const first = res.data[0];
                    setSelectedFarm(String(first.farm_id));
                    setSelectedFarmName(first.farm_name);
                }
            })
            .catch((err) => console.error("Error loading farms:", err));
    }, []);

    /* ── 2. Load fields when farm changes ── */
    useEffect(() => {
        if (!selectedFarm) return;

        // Keep farm name in sync when selectedFarm state changes
        const farm = farms.find((f) => String(f.farm_id) === String(selectedFarm));
        if (farm) setSelectedFarmName(farm.farm_name);

        api.get(`/farms/${selectedFarm}/fields`)
            .then((res) => {
                setFields(res.data);
                setSelectedField(res.data.length > 0 ? String(res.data[0].field_id) : null);
                setReading(null);
            })
            .catch((err) => {
                console.error("Error loading fields:", err);
                setFields([]);
                setSelectedField(null);
            });
    }, [selectedFarm]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── 3. Fetch latest sensor reading + 10-second polling ── */
    const fetchReading = useCallback(() => {
        if (!selectedField) return;
        setIsConnecting(true);
        api.get(`/sensor-readings/${selectedField}`)
            .then((res) => setReading(res.data))
            .catch((err) => console.error("Sensor read failed:", err.message ?? err))
            /* Keep stale reading on transient error — do not flash "--" */
            .finally(() => setIsConnecting(false));
    }, [selectedField]);

    useEffect(() => {
        setReading(null);
        fetchReading();
        const interval = setInterval(fetchReading, POLL_INTERVAL_MS);
        return () => clearInterval(interval);  /* Clean up on field change / unmount */
    }, [fetchReading]);

    /* ── Derived values ── */
    const currentField = fields.find(
        (f) => String(f.field_id) === String(selectedField)
    );
    const farmOptions  = farms.map((f)  => ({ value: String(f.farm_id),  label: f.farm_name }));
    const fieldOptions = fields.map((f) => ({ value: String(f.field_id), label: f.field_name }));
    const liveLabel    = isConnecting ? "Connecting…" : reading ? "Live" : "No data";

    return (
        /* Full-screen layout — negative margin removes the main layout padding */
        <div
            className="relative -m-[25px] h-screen overflow-hidden"
            style={{ background: "#f0f4f0" }}
        >
            {/* 65% map / 35% info panel */}
            <div
                className="relative h-full"
                style={{ display: "grid", gridTemplateColumns: "65% 35%" }}
            >
                {/* ═══════════════════════════════════════════
                    LEFT  — dark header strip + Leaflet map
                ═══════════════════════════════════════════ */}
                <div
                    className="flex min-h-0 flex-col"
                    style={{ background: "linear-gradient(180deg, #091810 0%, #0e2318 100%)" }}
                >
                    {/* Compact top selector strip */}
                    <div
                        className="relative z-10 flex items-center gap-3 px-4 py-3"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                    >
                        {/* Farm */}
                        <div style={{ width: "210px", flexShrink: 0 }}>
                            <SelectorDropdown
                                id="farm-select"
                                label="Select Farm"
                                value={selectedFarm ?? ""}
                                onChange={(v) => setSelectedFarm(v)}
                                options={farmOptions}
                            />
                        </div>

                        <span
                            style={{
                                color: "rgba(255,255,255,0.25)",
                                fontSize: "18px",
                                userSelect: "none",
                                flexShrink: 0,
                            }}
                        >
                            →
                        </span>

                        {/* Field */}
                        <div style={{ width: "210px", flexShrink: 0 }}>
                            <SelectorDropdown
                                id="field-select"
                                label="Select Field"
                                value={selectedField ?? ""}
                                onChange={(v) => setSelectedField(v)}
                                options={fieldOptions}
                            />
                        </div>

                        <div style={{ flex: 1 }} />

                        {/* Live status pill */}
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                            </span>
                            <span
                                style={{
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    color: "rgba(255,255,255,0.55)",
                                }}
                            >
                                {liveLabel}
                            </span>
                        </div>

                        {/* Active field name + area */}
                        {currentField && (
                            <div
                                style={{
                                    marginLeft: "12px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    color: "rgba(255,255,255,0.35)",
                                    letterSpacing: "0.08em",
                                }}
                            >
                                {currentField.field_name} · {currentField.area} ha
                            </div>
                        )}
                    </div>

                    {/* Map area — fills remaining height */}
                    <div className="min-h-0 flex-1 p-2.5 pt-2">
                        {selectedFarm && selectedField && currentField ? (
                            <motion.div
                                key={selectedField}
                                className="h-full"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.35 }}
                            >
                                {/*
                                  FarmMap with compact=true:
                                    • Fills the container (no card chrome)
                                    • Satellite / Dark / Terrain controls overlaid top-left
                                    • Green field polygon (hexagonal, PAU/Ludhiana coords)
                                    • Exactly 4 sensor markers inside polygon
                                    • Live values from `reading` prop
                                    • key={selectedField} → clean Leaflet remount on field change
                                */}
                                <FarmMap
                                    key={selectedField}
                                    field={currentField}
                                    reading={reading}
                                    compact
                                />
                            </motion.div>
                        ) : (
                            <div className="flex h-full items-center justify-center rounded-2xl bg-[#0a1f14]">
                                <p className="text-sm font-semibold text-white/35">
                                    {farms.length === 0
                                        ? "Loading farms…"
                                        : "Select a farm and field"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════════════════════════════════════
                    RIGHT — Field Information Panel (35%)
                ═══════════════════════════════════════════ */}
                <div className="min-h-0 p-2.5 pl-1.5">
                    <FieldInfoPanel
                        field={currentField}
                        farmName={selectedFarmName}
                        reading={reading}
                    />
                </div>
            </div>
        </div>
    );
}

export default Farms;