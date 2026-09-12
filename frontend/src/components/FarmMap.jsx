import { useEffect, useState } from "react";
import { Maximize2, Minimize2, Map } from "lucide-react";

import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polygon,
    useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";


/* ── Fix Leaflet default marker icons (required for Vite builds) ─────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


/* ── Re-centres the map when the field changes ───────────────────────── */
function MapCenter({ latitude, longitude }) {
    const map = useMap();
    useEffect(() => {
        if (latitude && longitude) {
            map.setView([latitude, longitude], 16, { animate: true });
        }
    }, [latitude, longitude, map]);
    return null;
}


/* ── Tile-layer configurations ───────────────────────────────────────── */
const TILE_CONFIGS = {
    satellite: {
        url:         "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "© Esri, Maxar, Earthstar Geographics",
    },
    dark: {
        url:         "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution: "© CartoDB",
    },
    terrain: {
        url:         "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution: "© OpenTopoMap",
    },
};


/* ── Sensor type config ──────────────────────────────────────────────── */
const SENSOR_TYPES = {
    temperature: { symbol: "T", label: "Temperature",  unit: "°C",  color: "#f59e0b" },
    soil:        { symbol: "M", label: "Soil Moisture", unit: "%",   color: "#3b82f6" },
    humidity:    { symbol: "H", label: "Humidity",      unit: "%",   color: "#14b8a6" },
    rainfall:    { symbol: "R", label: "Rainfall",      unit: "mm",  color: "#0ea5e9" },
};


/* ── Individual sensor marker ────────────────────────────────────────── */
function SensorMarker({ position, type, value }) {
    const cfg = SENSOR_TYPES[type];

    const icon = L.divIcon({
        className: "",
        html: `
            <div style="
                width:38px;height:38px;border-radius:50%;
                background:white;border:2.5px solid ${cfg.color};
                display:flex;align-items:center;justify-content:center;
                color:${cfg.color};font-weight:700;font-size:12px;
                box-shadow:0 2px 8px rgba(0,0,0,0.25);
            ">${cfg.symbol}</div>`,
        iconSize:   [38, 38],
        iconAnchor: [19, 19],
    });

    const displayValue =
        value != null
            ? `${Number(value).toFixed(2)} ${cfg.unit}`
            : "Sensor data unavailable";

    return (
        <Marker position={position} icon={icon}>
            <Popup>
                <strong>{cfg.label}</strong>
                <br />
                {displayValue}
            </Popup>
        </Marker>
    );
}


/* ─────────────────────────────────────────────────────────────────────
   FarmMap
   Props:
     field    — field object from /farms/{farmId}/fields
                { field_id, field_name, crop_type, area, latitude, longitude }
     reading  — latest SensorReading (managed/polled every 10 s by Farms.jsx)
                { temperature, soilMoisture, humidity, rainfall, readingTime }
     compact  — boolean (default false)
                true  → bare map filling its container with Sat/Dark/Terrain
                        controls overlaid top-left (used by full-screen layout)
                false → card wrapper with header, expand button, readings strip

   Sensor logic (NEVER changes):
     • Exactly 4 sensor markers inside the hexagonal field polygon
     • Positions are stable offsets — always inside the polygon
     • Values come exclusively from the `reading` prop (no hardcoding)
     • soil_moisture serialised by Jackson as `soilMoisture`
   ───────────────────────────────────────────────────────────────────── */
function FarmMap({ field, reading, compact = false }) {

    const [expanded, setExpanded] = useState(false);

    /* Default to Satellite to match the old design; user can switch */
    const [tileMode, setTileMode] = useState("satellite");

    /* ── No field yet ── */
    if (!field) {
        return (
            <div
                className={
                    compact
                        ? "flex h-full items-center justify-center rounded-2xl bg-[#0a1f14]"
                        : "rounded-lg bg-white p-8 text-center text-muted-foreground"
                }
            >
                <p className={compact ? "text-sm font-semibold text-white/35" : ""}>
                    Loading field…
                </p>
            </div>
        );
    }

    const lat = Number(field.latitude);
    const lng = Number(field.longitude);

    /*
     * Field polygon — hexagonal boundary around the field center.
     * DO NOT change these offsets.
     * The database stores one lat/lng per field (PAU/Ludhiana coords).
     */
    const fieldPolygon = [
        [lat + 0.0010, lng - 0.0012],
        [lat + 0.0014, lng + 0.0010],
        [lat + 0.0002, lng + 0.0017],
        [lat - 0.0010, lng + 0.0010],
        [lat - 0.0012, lng - 0.0010],
        [lat - 0.0003, lng - 0.0017],
    ];

    /*
     * Exactly 4 sensor markers — one per sensor type.
     * All positions fall inside the hexagonal polygon.
     * Values from `reading` prop; soilMoisture is Jackson-camelCased.
     */
    const sensors = [
        { id: "sensor-temperature", type: "temperature", position: [lat + 0.0007, lng - 0.0005], value: reading?.temperature  },
        { id: "sensor-soil",        type: "soil",        position: [lat - 0.0001, lng - 0.0005], value: reading?.soilMoisture },
        { id: "sensor-humidity",    type: "humidity",    position: [lat - 0.0007, lng + 0.0006], value: reading?.humidity     },
        { id: "sensor-rainfall",    type: "rainfall",    position: [lat + 0.0004, lng + 0.0009], value: reading?.rainfall     },
    ];

    const tileCfg = TILE_CONFIGS[tileMode] ?? TILE_CONFIGS.satellite;

    /* ── Satellite / Dark / Terrain controls — overlaid on the map ── */
    const tileControls = (
        <div
            style={{
                position:       "absolute",
                top:            "12px",
                left:           "12px",
                zIndex:         1000,
                display:        "flex",
                overflow:       "hidden",
                borderRadius:   "10px",
                border:         "1px solid rgba(255,255,255,0.18)",
                background:     "rgba(0,0,0,0.52)",
                backdropFilter: "blur(10px)",
            }}
        >
            {["satellite", "dark", "terrain"].map((mode) => {
                const label    = mode.charAt(0).toUpperCase() + mode.slice(1);
                const isActive = tileMode === mode;
                return (
                    <button
                        key={mode}
                        type="button"
                        onClick={() => setTileMode(mode)}
                        style={{
                            padding:     "7px 14px",
                            fontSize:    "11px",
                            fontWeight:  "700",
                            background:  isActive ? "rgba(22,101,52,0.6)" : "transparent",
                            color:       isActive ? "white" : "rgba(255,255,255,0.5)",
                            border:      "none",
                            cursor:      "pointer",
                            fontFamily:  "inherit",
                            letterSpacing: "0.03em",
                            transition:  "all 0.15s ease",
                        }}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );

    /* ── Shared Leaflet map content ── */
    const leafletMap = (
        <MapContainer
            center={[lat, lng]}
            zoom={16}
            style={{ height: "100%", width: "100%" }}
        >
            {/* Re-centre when field changes */}
            <MapCenter latitude={lat} longitude={lng} />

            {/* Basemap tile layer — switches when tileMode changes */}
            <TileLayer
                key={tileMode}
                attribution={tileCfg.attribution}
                url={tileCfg.url}
                zIndex={1}
            />

            {/*
              Persistent geographic labels overlay.
              ESRI World Boundaries and Places — a fully transparent PNG tile set
              containing place/locality names, road labels, and area names.
              Rendered AFTER the basemap so Leaflet stacks it above (zIndex=2).
              key="labels-overlay" is fixed — this layer stays alive across all
              Satellite / Dark / Terrain switches.
              Leaflet's overlay pane (z-index 400) and marker pane (z-index 600)
              are always above all tile panes, so the field polygon and sensor
              markers always appear on top of this label layer automatically.
            */}
            <TileLayer
                key="labels-overlay"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                attribution=""
                zIndex={2}
                opacity={1}
            />

            {/* Field boundary polygon — green hexagon (unchanged) */}
            <Polygon
                positions={fieldPolygon}
                pathOptions={{
                    color:       "#16a34a",
                    fillColor:   "#22c55e",
                    fillOpacity: 0.20,
                    weight:      3,
                }}
            />

            {/* Field center marker */}
            <Marker position={[lat, lng]}>
                <Popup>
                    <strong>{field.field_name}</strong>
                    <br />Crop: {field.crop_type}
                    <br />Area: {field.area} ha
                    <br />{lat.toFixed(5)}°N, {lng.toFixed(5)}°E
                </Popup>
            </Marker>

            {/* Exactly 4 sensor markers inside the polygon */}
            {sensors.map((s) => (
                <SensorMarker
                    key={s.id}
                    position={s.position}
                    type={s.type}
                    value={s.value}
                />
            ))}
        </MapContainer>
    );


    /* ── COMPACT mode — bare map + overlaid tile controls ── */
    if (compact) {
        return (
            <div
                style={{
                    position:     "relative",
                    height:       "100%",
                    width:        "100%",
                    overflow:     "hidden",
                    borderRadius: "1rem",
                }}
            >
                {leafletMap}
                {tileControls}
            </div>
        );
    }

    /* ── FULL CARD mode — card wrapper with header + readings strip ── */
    return (
        <section
            className={
                expanded
                    ? "fixed inset-4 z-[1000] overflow-hidden rounded-lg border bg-white p-5 shadow-panel"
                    : "rounded-lg border border-white/70 bg-white/82 p-6 shadow-soft backdrop-blur"
            }
        >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Map size={22} />
                    </span>
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Geospatial Twin
                        </p>
                        <h2 className="text-2xl font-bold">{field.field_name}</h2>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-white"
                >
                    {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
            </div>

            {/* Map with controls */}
            <div
                className={
                    expanded
                        ? "h-[calc(100vh-8.5rem)] overflow-hidden rounded-lg border"
                        : "h-[500px] overflow-hidden rounded-lg border"
                }
            >
                <div style={{ position: "relative", height: "100%" }}>
                    {leafletMap}
                    {tileControls}
                </div>
            </div>

            {/* Live readings strip */}
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-lg bg-orange-50 p-4">
                    <p className="text-xs text-muted-foreground">Temperature</p>
                    <strong>
                        {reading?.temperature != null
                            ? `${Number(reading.temperature).toFixed(2)} °C`
                            : "--"}
                    </strong>
                </div>
                <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-xs text-muted-foreground">Soil Moisture</p>
                    <strong>
                        {reading?.soilMoisture != null
                            ? `${Number(reading.soilMoisture).toFixed(2)} %`
                            : "--"}
                    </strong>
                </div>
                <div className="rounded-lg bg-teal-50 p-4">
                    <p className="text-xs text-muted-foreground">Humidity</p>
                    <strong>
                        {reading?.humidity != null
                            ? `${Number(reading.humidity).toFixed(2)} %`
                            : "--"}
                    </strong>
                </div>
                <div className="rounded-lg bg-sky-50 p-4">
                    <p className="text-xs text-muted-foreground">Rainfall</p>
                    <strong>
                        {reading?.rainfall != null
                            ? `${Number(reading.rainfall).toFixed(2)} mm`
                            : "--"}
                    </strong>
                </div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
                Live sensor data refreshes every 10 seconds.
            </p>
        </section>
    );
}

export default FarmMap;