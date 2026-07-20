import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Droplets,
  ExternalLink,
  FlaskConical,
  Leaf,
  ShieldAlert,
  Sprout,
  Zap,
} from "lucide-react";
import { SCENARIO_OPTIONS, SCENARIO_PREVIEWS } from "./constants";

/* ─── Sub-components ─────────────────────────────────────────────────── */
function InsightRow({ icon: Icon, label, value, progress, tone }) {
  const toneStyles = {
    success: { bar: "bg-success", badge: "text-success bg-success/10 border-success/25" },
    warning: { bar: "bg-warning", badge: "text-warning-foreground bg-warning/15 border-warning/30" },
    danger:  { bar: "bg-destructive", badge: "text-destructive bg-destructive/10 border-destructive/25" },
  };
  const s = toneStyles[tone] || toneStyles.success;

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-white/65 px-3 py-2">
      <Icon size={13} className="shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
          <motion.div
            className={`h-full rounded-full ${s.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
        <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${s.badge}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function TabButton({ id, label, icon: Icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold transition-colors ${
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon size={12} />
      {label}
      {active && (
        <motion.div
          layoutId="ai-tab-indicator"
          className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"
        />
      )}
    </button>
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */
/**
 * AiInsightsTabs — tabbed panel:
 *   Tab 1 → AI Insights (disease risk, water stress, nutrient, growth + recommendation)
 *   Tab 2 → Scenario Preview (lightweight selector + Open Full Simulation button)
 */
function AiInsightsTabs({ healthScore, waterRequirement, confidence }) {
  const [activeTab, setActiveTab] = useState("insights");
  const [selectedScenario, setSelectedScenario] = useState("normal");
  const navigate = useNavigate();

  // Derive insight values from live data
  const hs = Number(healthScore) || 75;
  const wr = Number(waterRequirement) || 0;

  const diseaseRisk   = hs >= 80 ? "Low"      : hs >= 60 ? "Medium" : "High";
  const waterStress   = wr > 20  ? "High"     : wr > 0   ? "Moderate" : "Low";
  const nutrientStatus = hs >= 75 ? "Balanced" : "Review";
  const growthCond    = hs >= 80 ? "On Track" : "Monitor";

  const diseaseProgress = diseaseRisk === "Low" ? 20 : diseaseRisk === "Medium" ? 52 : 84;
  const waterProgress   = waterStress === "Low" ? 18 : waterStress === "Moderate" ? 56 : 88;
  const nutrientProgress = hs >= 75 ? 76 : 44;
  const growthProgress  = hs;

  const actionText =
    wr > 0
      ? `Irrigate ~${Number(wr).toFixed(1)} mm · Confidence: ${confidence}`
      : `Conditions optimal · No irrigation required · Confidence: ${confidence}`;

  const preview = SCENARIO_PREVIEWS[selectedScenario];

  const severityStyles = {
    success: "border-success/25 bg-success/8 text-success",
    warning: "border-warning/30 bg-warning/8 text-warning-foreground",
    danger:  "border-destructive/25 bg-destructive/8 text-destructive",
  };

  return (
    <div className="flex shrink-0 flex-col overflow-hidden rounded-xl border border-white/70 bg-white/84 shadow-panel backdrop-blur-md">
      {/* Tab strip */}
      <div className="flex items-center border-b border-border px-2">
        <TabButton
          id="insights"
          label="AI Insights"
          icon={BrainCircuit}
          active={activeTab === "insights"}
          onClick={setActiveTab}
        />
        <TabButton
          id="scenario"
          label="Scenario"
          icon={FlaskConical}
          active={activeTab === "scenario"}
          onClick={setActiveTab}
        />
        {/* Inference indicator */}
        <div className="ml-auto mr-2 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Inference Layer
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-hidden p-3">
        <AnimatePresence mode="wait">
          {activeTab === "insights" ? (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-2"
            >
              <InsightRow
                icon={ShieldAlert}
                label="Disease risk"
                value={diseaseRisk}
                progress={diseaseProgress}
                tone={diseaseRisk === "High" ? "danger" : diseaseRisk === "Medium" ? "warning" : "success"}
              />
              <InsightRow
                icon={Droplets}
                label="Water stress"
                value={waterStress}
                progress={waterProgress}
                tone={waterStress === "High" ? "danger" : waterStress === "Moderate" ? "warning" : "success"}
              />
              <InsightRow
                icon={Leaf}
                label="Nutrient status"
                value={nutrientStatus}
                progress={nutrientProgress}
                tone={nutrientStatus === "Balanced" ? "success" : "warning"}
              />
              <InsightRow
                icon={Sprout}
                label="Growth condition"
                value={growthCond}
                progress={growthProgress}
                tone={growthCond === "On Track" ? "success" : "warning"}
              />

              {/* Recommended action */}
              <div className="rounded-lg border border-primary/15 bg-primary/6 px-3 py-2.5">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                  Recommended Action
                </p>
                <p className="text-xs font-semibold leading-relaxed text-foreground">
                  {actionText}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="scenario"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-2.5"
            >
              {/* Scenario chips */}
              <div className="grid grid-cols-3 gap-1.5">
                {SCENARIO_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedScenario(opt.id)}
                    className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-[10px] font-bold transition hover:-translate-y-0.5 ${
                      selectedScenario === opt.id
                        ? "border-primary bg-primary text-primary-foreground shadow-soft"
                        : "border-border bg-white text-muted-foreground hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    <span className="text-base leading-none">{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div
                className={`rounded-lg border px-3 py-2.5 ${
                  severityStyles[preview.severity] || severityStyles.success
                }`}
              >
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">
                  Scenario Preview
                </p>
                <p className="text-xs font-bold">{preview.headline}</p>
                <p className="mt-0.5 text-[10px] leading-relaxed opacity-80">
                  {preview.detail}
                </p>
              </div>

              {/* Open Simulation CTA */}
              <button
                type="button"
                onClick={() => navigate("/simulation")}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:bg-agri-canopy/90"
              >
                <Zap size={13} />
                Open Full Simulation
                <ArrowRight size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AiInsightsTabs;
