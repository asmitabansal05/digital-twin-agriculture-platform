import { useEffect, useState } from "react";
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
} from "lucide-react";
import api from "../services/api";

import DashboardCard from "../components/DashboardCard";
import TemperatureChart from "../components/TemperatureChart";
import HumidityChart from "../components/HumidityChart";
import SoilMoistureChart from "../components/SoilMoistureChart";
import FarmSelector from "../components/FarmSelector";

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

function Dashboard() {
    const [selectedFarm, setSelectedFarm] = useState(1);
    const [selectedFarmName, setSelectedFarmName] = useState("Farm #1");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [data, setData] = useState(null);
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            api.get(`http://localhost:8081/dashboard/${selectedFarm}`),
            api.get(`http://localhost:8081/farms/${selectedFarm}/fields`),
        ])
            .then(([dashboardRes, fieldsRes]) => {
                if (cancelled) return;
                setData(dashboardRes.data);
                setFields(fieldsRes.data);
            })
            .catch(console.error)
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
            };
    }, [selectedFarm]);

    const handleFarmChange = (farmId) => {
        setIsLoading(true);
        setData(null);
        setFields([]);
        setSelectedFarm(farmId);
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
    const predictionConfidence = data ? `${Math.min(98, Math.max(86, Math.round(healthScore + 3)))}%` : "92%";

    const kpiCards = data ? [
        {
            title: "Temperature",
            value: Number(data.temperature).toFixed(2),
            unit: "C",
            icon: Thermometer,
            trend: "Stable",
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
    ] : [];

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
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    Monitoring <strong className="text-foreground">{selectedFarmName}</strong>
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <StatusBadge>AI Online</StatusBadge>
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

                {isLoading ? (
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
                ) : data && (
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
                                        : "Crop conditions are healthy. No irrigation is currently required."
                                    }
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
                                    <SummaryItem icon={BadgeCheck} label="Current status" value={priority === "Low" ? "Healthy" : "Needs attention"} />
                                    <SummaryItem icon={Satellite} label="Active sensors" value={`${Math.max(fields.length * 3, 3)} online`} />
                                    <SummaryItem icon={BrainCircuit} label="Prediction Confidence" value={predictionConfidence} />
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-3 lg:grid-cols-3">
                            <TemperatureChart farmId={selectedFarm} />
                            <HumidityChart farmId={selectedFarm} />
                            <SoilMoistureChart farmId={selectedFarm} />
                        </section>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
