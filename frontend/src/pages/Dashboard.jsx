import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
    BadgeCheck,
    BarChart3,
    BrainCircuit,
    CalendarClock,
    CloudRain,
    Droplets,
    HeartPulse,
    Radar,
    Satellite,
    Sprout,
    Thermometer,
    Tractor,
    Waves,
    AlertTriangle,
    RefreshCw,
} from "lucide-react";
import api from "../services/api";

import DashboardCard from "../components/DashboardCard";
import TemperatureChart from "../components/TemperatureChart";
import HumidityChart from "../components/HumidityChart";
import SoilMoistureChart from "../components/SoilMoistureChart";
import FarmSelector from "../components/FarmSelector";

// How often (ms) the dashboard polls the backend for new sensor/ML data
const POLL_INTERVAL_MS = 10000;

function SkeletonBlock({ className = "" }) {
    return (
        <div className={`animate-pulse rounded-lg bg-white/70 shadow-soft ${className}`}>
            <div className="h-full rounded-lg bg-gradient-to-r from-white/40 via-muted/60 to-white/40" />
        </div>
    );
}

function StatusBadge({ children, tone = "success" }) {
    const tones = {
        success: "border-success/20 bg-success/10 text-success",
        warning: "border-warning/30 bg-warning/15 text-warning-foreground",
        high: "border-destructive/20 bg-destructive/10 text-destructive",
    };

    return (
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${tones[tone]}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {children}
        </span>
    );
}

function SummaryItem({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-white/70 bg-white/70 p-3 shadow-soft backdrop-blur">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Icon size={17} />
            </div>
            <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-muted-foreground">{label}</p>
                <p className="truncate text-base font-bold text-foreground">{value}</p>
            </div>
        </div>
    );
}

/**
 * BackendErrorBanner
 * Shown when the backend is unreachable or returns an error.
 * Does NOT show any fake/stale data — informs the user clearly.
 */
function BackendErrorBanner({ onRetry, isRetrying }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-1 flex-col items-center justify-center gap-6 rounded-lg border border-destructive/20 bg-destructive/5 p-10 text-center"
        >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 text-destructive">
                <AlertTriangle size={32} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-foreground">Backend Unavailable</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Could not connect to the Spring Boot backend at{" "}
                    <code className="rounded bg-muted/60 px-1 py-0.5 font-mono text-xs">
                        http://localhost:8081
                    </code>
                    . Please make sure the backend is running.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    The dashboard will automatically retry every {POLL_INTERVAL_MS / 1000} seconds.
                </p>
            </div>
            <button
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
                <RefreshCw size={15} className={isRetrying ? "animate-spin" : ""} />
                {isRetrying ? "Retrying…" : "Retry Now"}
            </button>
        </motion.div>
    );
}

function Dashboard() {
    const [selectedFarm, setSelectedFarm] = useState(1);
    const [selectedFarmName, setSelectedFarmName] = useState("Farm #1");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [data, setData] = useState(null);
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    // null  = not yet attempted / initial
    // false = last fetch succeeded
    // true  = last fetch failed (backend unreachable / error)
    const [hasError, setHasError] = useState(null);
    const [isRetrying, setIsRetrying] = useState(false);

    // Clock — update every 30 s for the header timestamp
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    /**
     * fetchDashboardData
     * Calls /dashboard/{farmId} and /farms/{farmId}/fields.
     * On success: clears error state, updates data.
     * On failure: sets error state, does NOT touch existing data (avoids showing stale fake data).
     *
     * `silent` = true means we don't show the full-page loading skeleton (used for background polls).
     */
    const fetchDashboardData = useCallback(
        (farmId, silent = false) => {
            if (!silent) {
                setIsLoading(true);
            }

            return Promise.all([
                api.get(`/dashboard/${farmId}`),
                api.get(`/farms/${farmId}/fields`),
            ])
                .then(([dashboardRes, fieldsRes]) => {
                    setData(dashboardRes.data);
                    setFields(fieldsRes.data);
                    setHasError(false);
                })
                .catch((err) => {
                    console.error("[Dashboard] Backend request failed:", err.message ?? err);
                    // Do NOT keep stale data visible — clear it so the error state is shown
                    setData(null);
                    setFields([]);
                    setHasError(true);
                })
                .finally(() => {
                    if (!silent) {
                        setIsLoading(false);
                    }
                });
        },
        []
    );

    // Initial + farm-change fetch (shows full skeleton)
    useEffect(() => {
        setIsLoading(true);
        setData(null);
        setFields([]);
        setHasError(null);
        fetchDashboardData(selectedFarm, false);
    }, [selectedFarm, fetchDashboardData]);

    // Auto-refresh every POLL_INTERVAL_MS (silent — no skeleton flash)
    useEffect(() => {
        const interval = setInterval(() => {
            // Only poll if backend was previously reachable OR we want to retry after error
            fetchDashboardData(selectedFarm, true);
        }, POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [selectedFarm, fetchDashboardData]);

    const handleFarmChange = (farmId) => {
        setSelectedFarm(Number(farmId));
    };

    const handleRetry = () => {
        setIsRetrying(true);
        fetchDashboardData(selectedFarm, false).finally(() => setIsRetrying(false));
    };

    const formattedDate = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(currentTime);

    const waterRequirement = Number(data?.waterRequirement ?? 0);
    const healthScore = Number(data?.averageHealth ?? 0);
    const priority = waterRequirement > 20 ? "High" : waterRequirement > 0 ? "Medium" : "Low";
    const priorityTone = priority === "High" ? "high" : priority === "Medium" ? "warning" : "success";

    // Prediction confidence: The backend ML pipeline does not currently return a
    // confidence score. We display "N/A" rather than a fabricated value.
    // TODO: Add a `predictionConfidence` field to DashboardResponse once the ML
    //       models expose it, and pass it through the /dashboard/{farmId} endpoint.
    const predictionConfidence = "N/A";

    const kpiCards = data
        ? [
              {
                  title: "Temperature",
                  value: Number(data.temperature).toFixed(2),
                  unit: "C",
                  icon: Thermometer,
                  trend: "Live",
                  accent: "from-warning/20 to-warning/5",
              },
              {
                  title: "Humidity",
                  value: Number(data.humidity).toFixed(2),
                  unit: "%",
                  icon: Droplets,
                  trend: "Live",
                  accent: "from-agri-water/20 to-agri-water/5",
              },
              {
                  title: "Soil Moisture",
                  value: Number(data.soilMoisture).toFixed(2),
                  unit: "%",
                  icon: Sprout,
                  trend: "Tracked",
                  accent: "from-success/20 to-success/5",
              },
              {
                  title: "Health Score",
                  value: Number(data.averageHealth).toFixed(0),
                  unit: "%",
                  icon: HeartPulse,
                  trend: "AI scored",
                  accent: "from-primary/20 to-agri-mint/50",
              },
              {
                  title: "Rainfall",
                  value: Number(data.rainfall).toFixed(2),
                  unit: "mm",
                  icon: CloudRain,
                  trend: "Observed",
                  accent: "from-agri-water/20 to-white",
              },
              {
                  title: "Predicted Yield",
                  value: Number(data.predictedYield).toFixed(2),
                  unit: "tons/ha",
                  icon: BarChart3,
                  trend: "Forecast",
                  accent: "from-accent/20 to-agri-mint/35",
              },
              {
                  title: "Total Fields",
                  value: data.totalFields,
                  unit: "fields",
                  icon: Tractor,
                  trend: "Mapped",
                  accent: "from-agri-soil/20 to-agri-field/60",
              },
              {
                  title: "Irrigation Requirement",
                  value: Number(data.waterRequirement).toFixed(2),
                  unit: "mm",
                  icon: Waves,
                  trend: waterRequirement > 0 ? "Action needed" : "Optimized",
                  accent: "from-agri-water/20 to-agri-mint/35",
              },
          ]
        : [];

    return (
        <div className="relative -m-[25px] min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_0%,hsl(var(--agri-mint))_0,transparent_28%),linear-gradient(135deg,hsl(var(--background))_0%,white_45%,hsl(var(--agri-field))_100%)] px-4 py-4 sm:px-5">
            <div className="absolute right-[-7rem] top-16 h-80 w-80 rounded-full bg-agri-water/15 blur-3xl" />
            <div className="absolute bottom-20 left-[-8rem] h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1600px] flex-col gap-4">
                <header className="grid gap-3 xl:grid-cols-[1fr_0.75fr]">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="rounded-lg border border-white/70 bg-white/78 p-4 shadow-soft backdrop-blur"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                                    Operational Monitoring
                                </p>
                                <h1 className="mt-1 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                                    Digital Twin Dashboard
                                </h1>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Show AI Online only when backend is connected */}
                                {hasError === true ? (
                                    <span className="inline-flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">
                                        <span className="h-2 w-2 rounded-full bg-current" />
                                        Backend Offline
                                    </span>
                                ) : (
                                    <StatusBadge>AI Online</StatusBadge>
                                )}
                                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-bold text-muted-foreground">
                                    <CalendarClock size={14} />
                                    {formattedDate}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    <FarmSelector
                        selectedFarm={selectedFarm}
                        setSelectedFarm={handleFarmChange}
                        onSelectedFarmChange={setSelectedFarmName}
                    />
                </header>

                {/* ── Loading skeleton ── */}
                {isLoading && (
                    <div className="flex flex-1 flex-col gap-4">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <SkeletonBlock key={index} className="h-32" />
                            ))}
                        </div>
                        <div className="grid gap-3 xl:grid-cols-2">
                            <SkeletonBlock className="h-36" />
                            <SkeletonBlock className="h-36" />
                        </div>
                        <div className="grid gap-3 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <SkeletonBlock key={index} className="h-64" />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Backend error state ── */}
                {!isLoading && hasError === true && (
                    <BackendErrorBanner onRetry={handleRetry} isRetrying={isRetrying} />
                )}

                {/* ── Dashboard content (only when backend is available and data loaded) ── */}
                {!isLoading && hasError === false && data && (
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="flex flex-1 flex-col gap-4"
                    >
                        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {kpiCards.map((card) => (
                                <DashboardCard key={card.title} {...card} />
                            ))}
                        </section>

                        <section className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
                            <div className="rounded-lg border border-white/70 bg-white/82 p-4 shadow-soft backdrop-blur">
                                <div className="mb-3 flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                            <BrainCircuit size={21} />
                                        </span>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                                                AI Recommendation
                                            </p>
                                            <h2 className="text-xl font-bold text-foreground">
                                                Smart irrigation insight
                                            </h2>
                                        </div>
                                    </div>
                                    <StatusBadge tone={priorityTone}>{priority} Priority</StatusBadge>
                                </div>
                                <p className="text-base leading-7 text-muted-foreground">
                                    {waterRequirement > 0
                                        ? `Irrigation of approximately ${Number(data.waterRequirement).toFixed(2)} mm is recommended for the current farm conditions.`
                                        : "Crop conditions are healthy. No irrigation is currently required."}
                                </p>
                            </div>

                            <div className="rounded-lg border border-white/70 bg-primary p-4 text-primary-foreground shadow-panel">
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-75">
                                            Quick Summary
                                        </p>
                                        <h2 className="text-xl font-bold">Farm status</h2>
                                    </div>
                                    <Radar size={24} />
                                </div>
                                <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-1">
                                    <SummaryItem
                                        icon={BadgeCheck}
                                        label="Current status"
                                        value={priority === "Low" ? "Healthy" : "Needs attention"}
                                    />
                                    <SummaryItem
                                        icon={Satellite}
                                        label="Active sensors"
                                        value={`${Math.max(fields.length * 3, 3)} online`}
                                    />
                                    {/*
                                     * Prediction Confidence:
                                     * The ML pipeline does not currently return a confidence value.
                                     * Displaying "N/A" is intentional — do not replace with a
                                     * formula such as healthScore + 3 or similar fabrications.
                                     * TODO: Wire in backend-provided confidence once available.
                                     */}
                                    <SummaryItem
                                        icon={BrainCircuit}
                                        label="Prediction Confidence"
                                        value={predictionConfidence}
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-3 lg:grid-cols-3">
                            <TemperatureChart farmId={selectedFarm} pollInterval={POLL_INTERVAL_MS} />
                            <HumidityChart farmId={selectedFarm} pollInterval={POLL_INTERVAL_MS} />
                            <SoilMoistureChart farmId={selectedFarm} pollInterval={POLL_INTERVAL_MS} />
                        </section>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
