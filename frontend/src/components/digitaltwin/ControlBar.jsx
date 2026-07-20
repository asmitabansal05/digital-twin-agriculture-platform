import { CalendarClock, LocateFixed } from "lucide-react";
import FarmSelector from "../FarmSelector";

function LiveDot({ isLoading }) {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      {!isLoading && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
      )}
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
          isLoading ? "bg-warning animate-pulse" : "bg-success"
        }`}
      />
    </span>
  );
}

function StatusPill({ children, tone = "success" }) {
  const tones = {
    success: "border-success/25 bg-success/10 text-success",
    warning: "border-warning/35 bg-warning/15 text-warning-foreground",
    neutral: "border-border bg-white/80 text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${tones[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

/**
 * ControlBar — slim 52px page-top strip.
 * Replaces the Navbar on the Digital Twin route.
 */
function ControlBar({
  selectedFarm,
  setSelectedFarm,
  onSelectedFarmChange,
  selectedFarmName,
  syncedFields,
  currentTime,
  isLoading,
}) {
  return (
    <header className="flex items-center gap-3 border-b border-white/60 bg-white/80 px-4 shadow-soft backdrop-blur-md">
      {/* Left — Identity */}
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
          <LocateFixed size={16} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight text-foreground">
            Live Farm Twin
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {selectedFarmName}&nbsp;·&nbsp;{syncedFields} plots synced
          </p>
        </div>
        <LiveDot isLoading={isLoading} />
      </div>

      {/* Divider */}
      <div className="mx-1 h-7 w-px shrink-0 bg-border" />

      {/* Center — Farm selector (compact) */}
      <div className="flex-1">
        <FarmSelector
          selectedFarm={selectedFarm}
          setSelectedFarm={setSelectedFarm}
          onSelectedFarmChange={onSelectedFarmChange}
          compact
        />
      </div>

      {/* Divider */}
      <div className="mx-1 h-7 w-px shrink-0 bg-border" />

      {/* Right — Status badges */}
      <div className="flex shrink-0 items-center gap-2">
        <StatusPill tone="success">AI Online</StatusPill>
        <StatusPill tone={isLoading ? "warning" : "success"}>
          {isLoading ? "Syncing…" : "Twin Live"}
        </StatusPill>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/80 px-2.5 py-1 text-xs font-bold text-muted-foreground">
          <CalendarClock size={12} />
          {currentTime}
        </span>
      </div>
    </header>
  );
}

export default ControlBar;
