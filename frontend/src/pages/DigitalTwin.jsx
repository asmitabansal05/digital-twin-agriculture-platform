import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import api from "../services/api";

import FieldMap       from "../components/digitaltwin/FieldMap";
import FieldInfoPanel from "../components/digitaltwin/FieldInfoPanel";
import { FARMS_DATA } from "../components/digitaltwin/constants";

/* ─── Fixed dropdown — explicit inline styles to override browser defaults ── */
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
          value={value}
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

/* ─── Loading skeleton ───────────────────────────────────────────────── */
function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-white/30 ${className}`}>
      <div className="h-full rounded-2xl bg-gradient-to-r from-white/20 via-muted/30 to-white/20" />
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────── */
/**
 * DigitalTwin — showcase page.
 *
 * Layout: 65% map / 35% info panel (CSS grid, no scroll)
 *
 * State:
 *   activeOverlay  — null | 'Temperature' | 'SoilMoisture' | 'Humidity' | 'Rainfall'
 *   Lifted here so both FieldMap (layer toggle) and FieldInfoPanel (chip highlight)
 *   share the same source of truth.
 */
function DigitalTwin() {
  const [selectedFarmId,  setSelectedFarmId]  = useState(FARMS_DATA[0].farmId);
  const [selectedFieldId, setSelectedFieldId] = useState(FARMS_DATA[0].fields[0].fieldId);
  const [liveData,        setLiveData]        = useState(null);
  const [isLoading,       setIsLoading]       = useState(true);
  const [activeOverlay,   setActiveOverlay]   = useState(null);

  const selectedFarm = useMemo(
    () => FARMS_DATA.find((f) => f.farmId === Number(selectedFarmId)),
    [selectedFarmId]
  );

  const fieldsForFarm = selectedFarm?.fields ?? [];

  const selectedField = useMemo(
    () => fieldsForFarm.find((f) => f.fieldId === Number(selectedFieldId)),
    [fieldsForFarm, selectedFieldId]
  );

  // When farm changes → auto-select first field + reset overlay
  useEffect(() => {
    if (fieldsForFarm.length > 0) {
      setSelectedFieldId(fieldsForFarm[0].fieldId);
      setActiveOverlay(null);
    }
  }, [selectedFarmId]); // eslint-disable-line react-hooks/exhaustive-deps

  // When field changes → reset overlay
  useEffect(() => {
    setActiveOverlay(null);
  }, [selectedFieldId]);

  // Fetch live sensor data (graceful fallback when backend offline)
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLiveData(null);
    api
      .get(`/dashboard/${selectedFarmId}`)
      .then((res) => { if (!cancelled) setLiveData(res.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedFarmId, selectedFieldId]);

  const farmOptions  = FARMS_DATA.map((f) => ({ value: f.farmId,    label: f.farmName  }));
  const fieldOptions = fieldsForFarm.map((f) => ({ value: f.fieldId, label: f.fieldName }));

  return (
    <div className="relative -m-[25px] h-screen overflow-hidden" style={{ background: "#f0f4f0" }}>
      {/* ── 65 / 35 grid ── */}
      <div
        className="relative h-full"
        style={{ display: "grid", gridTemplateColumns: "65% 35%" }}
      >
        {/* ══════════════════════════════════════════
            LEFT — Map (65%)
        ══════════════════════════════════════════ */}
        <div
          className="flex min-h-0 flex-col"
          style={{
            background: "linear-gradient(180deg, #091810 0%, #0e2318 100%)",
          }}
        >
          {/* Selector strip — compact, overlaid on dark bg */}
          <div
            className="relative z-10 flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            {/* Farm */}
            <div style={{ width: "210px", flexShrink: 0 }}>
              <SelectorDropdown
                id="farm-select"
                label="Select Farm"
                value={selectedFarmId}
                onChange={(v) => setSelectedFarmId(Number(v))}
                options={farmOptions}
              />
            </div>

            {/* Arrow */}
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "18px", userSelect: "none", flexShrink: 0 }}>
              →
            </span>

            {/* Field */}
            <div style={{ width: "190px", flexShrink: 0 }}>
              <SelectorDropdown
                id="field-select"
                label="Select Field"
                value={selectedFieldId}
                onChange={(v) => setSelectedFieldId(Number(v))}
                options={fieldOptions}
              />
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Live status */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.55)" }}>
                {isLoading ? "Connecting…" : liveData ? "Live" : "Demo Mode"}
              </span>
            </div>

            {/* Field name indicator */}
            {selectedField && (
              <div
                style={{
                  marginLeft: "12px",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: "0.08em",
                }}
              >
                {selectedField.fieldName} · {selectedField.area}
              </div>
            )}
          </div>

          {/* Map fills remaining height */}
          <div className="min-h-0 flex-1 p-2.5 pt-2">
            {isLoading && !selectedField ? (
              <Skeleton className="h-full" />
            ) : (
              <motion.div
                key={selectedField?.fieldId}
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
              >
                <FieldMap
                  field={selectedField}
                  activeOverlay={activeOverlay}
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            RIGHT — Field Info Panel (35%)
        ══════════════════════════════════════════ */}
        <div className="min-h-0 p-2.5 pl-1.5">
          {!selectedField ? (
            <Skeleton className="h-full" />
          ) : (
            <FieldInfoPanel
              field={selectedField}
              farm={selectedFarm}
              liveData={liveData}
              activeOverlay={activeOverlay}
              onOverlayChange={setActiveOverlay}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default DigitalTwin;
