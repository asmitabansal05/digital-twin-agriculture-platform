/**
 * FieldMap.jsx — MapLibre GL JS renderer (GIS-ready, pseudo-3D)
 *
 * ═══════════════════════════════════════════════════════════════════
 * FEATURES
 *   • ESRI World Imagery satellite tiles (free, no API key)
 *   • Pitch 50° + Bearing −15° → pseudo-3D perspective
 *   • Smooth flyTo() on field selection change
 *   • Field polygon: semi-transparent fill + 3-layer glow outline
 *   • Sensor HTML markers: per-type colour, CSS pulse-ring animation
 *   • Sensor hover tooltip (inline, no Popup class)
 *   • Per-type heatmap overlay layers (toggle via activeOverlay prop)
 *   • View toggle: Satellite / Dark / Terrain
 *   • Zoom, Reset, Fullscreen controls
 *
 * HOW TO ADD REAL PAU COORDINATES:
 *   Only edit constants.js:
 *     • field.gisCenter   [lat, lng]
 *     • field.gisPolygon  [[lng,lat], …]   — GeoJSON order
 *     • sensor.gisLat / sensor.gisLng
 *   Nothing here needs to change.
 * ═══════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Crosshair, Expand, Layers, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import { SENSOR_CONFIG, HEALTH_STYLES } from "./constants";

/* ─── Tile sources ───────────────────────────────────────────────────── */
const ESRI_SAT    = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_LABELS = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const CARTO_DARK  = [
  "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
];
const ESRI_TOPO   = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";

/* ─── Initial MapLibre style (all base tile sources pre-defined) ─────── */
const INITIAL_STYLE = {
  version: 8,
  sources: {
    "esri-sat":    { type: "raster", tiles: [ESRI_SAT],    tileSize: 256, maxzoom: 19 },
    "esri-labels": { type: "raster", tiles: [ESRI_LABELS], tileSize: 256, maxzoom: 19 },
    "carto-dark":  { type: "raster", tiles: CARTO_DARK,    tileSize: 256, maxzoom: 19 },
    "esri-topo":   { type: "raster", tiles: [ESRI_TOPO],   tileSize: 256, maxzoom: 19 },
  },
  layers: [
    // Base layers — visibility toggled by setLayoutProperty
    { id: "sat-layer",    type: "raster", source: "esri-sat",    paint: { "raster-saturation": 0.1 } },
    { id: "labels-layer", type: "raster", source: "esri-labels", paint: { "raster-opacity": 0.45 } },
    { id: "dark-layer",   type: "raster", source: "carto-dark",  layout: { visibility: "none" } },
    { id: "topo-layer",   type: "raster", source: "esri-topo",   layout: { visibility: "none" } },
  ],
};

/* ─── Heatmap colour ramps per sensor type ───────────────────────────── */
const OVERLAY_RAMPS = {
  Temperature:  ["rgba(0,0,0,0)", "rgba(96,165,250,0.5)", "rgba(245,158,11,0.7)", "rgba(239,68,68,0.85)"],
  SoilMoisture: ["rgba(0,0,0,0)", "rgba(191,219,254,0.4)", "rgba(59,130,246,0.65)", "rgba(30,58,138,0.85)"],
  Humidity:     ["rgba(0,0,0,0)", "rgba(204,251,241,0.4)", "rgba(20,184,166,0.65)", "rgba(15,118,110,0.85)"],
  Rainfall:     ["rgba(0,0,0,0)", "rgba(224,242,254,0.4)", "rgba(14,165,233,0.65)", "rgba(3,105,161,0.85)"],
};

const OVERLAY_TYPES = Object.keys(OVERLAY_RAMPS);

/* ─── CSS injection ──────────────────────────────────────────────────── */
let _cssInjected = false;
function injectCSS() {
  if (_cssInjected) return;
  _cssInjected = true;
  const s = document.createElement("style");
  s.textContent = `
    @keyframes dtPulseRing {
      0%,100%{ transform:translate(-50%,-50%) scale(1);   opacity:.55 }
      50%     { transform:translate(-50%,-50%) scale(2.4); opacity:0   }
    }
    .dt-pulse { animation: dtPulseRing 2.6s ease-in-out infinite; }
    /* Hide default MapLibre UI chrome */
    .maplibregl-ctrl-logo, .maplibregl-ctrl-attrib { display:none !important; }
    /* Popup reset */
    .maplibregl-popup-content {
      background:transparent !important;
      padding:0 !important;
      box-shadow:none !important;
      border-radius:0 !important;
    }
    .maplibregl-popup-tip { display:none !important; }
  `;
  document.head.appendChild(s);
}

/* ─── GeoJSON builders ───────────────────────────────────────────────── */
function fieldGeoJSON(field) {
  if (!field?.gisPolygon) return { type: "FeatureCollection", features: [] };
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [field.gisPolygon] },
    properties: {},
  };
}

function sensorGeoJSON(field, type) {
  const features = (field?.sensors ?? [])
    .filter((s) => s.type === type && s.gisLat && s.gisLng)
    .map((s) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [s.gisLng, s.gisLat] },
      properties: { val: Math.max(0, parseFloat(s.value) || 0) },
    }));
  return { type: "FeatureCollection", features };
}

/* ─── Main component ─────────────────────────────────────────────────── */
function FieldMap({ field, activeOverlay }) {
  const containerRef  = useRef(null);
  const mapRef        = useRef(null);
  const markersRef    = useRef([]);
  const fieldRef      = useRef(field);   // always points to latest field
  fieldRef.current    = field;

  const [viewMode,     setViewModeState] = useState("satellite");
  const [isFullscreen, setIsFullscreen]  = useState(false);

  /* ── Init MapLibre once ── */
  useEffect(() => {
    injectCSS();
    let unmounted = false;

    if (!field?.gisCenter) return;

    const map = new maplibregl.Map({
      container:        containerRef.current,
      style:            INITIAL_STYLE,
      center:           [field.gisCenter[1], field.gisCenter[0]],  // [lng, lat]
      zoom:             16.5,
      pitch:            52,       // pseudo-3D tilt
      bearing:          -15,      // slight rotation for cinematic feel
      antialias:        true,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      if (unmounted) return;
      const f = fieldRef.current;
      const h = HEALTH_STYLES[f?.health] || HEALTH_STYLES.Healthy;

      /* Field polygon source */
      map.addSource("field-src", { type: "geojson", data: fieldGeoJSON(f) });

      /* 3-layer glow polygon */
      map.addLayer({
        id: "field-glow-outer", type: "line", source: "field-src",
        paint: { "line-color": h.stroke, "line-width": 28, "line-opacity": 0.06, "line-blur": 12 },
        layout: { "line-cap": "round", "line-join": "round" },
      });
      map.addLayer({
        id: "field-glow-mid", type: "line", source: "field-src",
        paint: { "line-color": h.stroke, "line-width": 12, "line-opacity": 0.15, "line-blur": 4 },
        layout: { "line-cap": "round", "line-join": "round" },
      });
      map.addLayer({
        id: "field-fill", type: "fill", source: "field-src",
        paint: { "fill-color": h.fill, "fill-opacity": 0.20 },
      });
      map.addLayer({
        id: "field-line", type: "line", source: "field-src",
        paint: { "line-color": h.stroke, "line-width": 2.8, "line-opacity": 0.95 },
        layout: { "line-cap": "round", "line-join": "round" },
      });

      /* Sensor overlay heatmap sources & layers */
      OVERLAY_TYPES.forEach((type) => {
        const ramp = OVERLAY_RAMPS[type];
        map.addSource(`hm-${type}`, { type: "geojson", data: sensorGeoJSON(f, type) });
        map.addLayer({
          id:      `ov-${type}`,
          type:    "heatmap",
          source:  `hm-${type}`,
          layout:  { visibility: "none" },
          paint: {
            "heatmap-weight":     1,
            "heatmap-intensity":  1.4,
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0, ramp[0], 0.25, ramp[1], 0.6, ramp[2], 1, ramp[3],
            ],
            "heatmap-radius":  72,
            "heatmap-opacity": 0.78,
          },
        });
      });

      /* Add sensor markers for initial field */
      addSensorMarkers(map, f);
    });

    return () => {
      unmounted = true;
      clearMarkers();
      map.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Update on field change ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !field) return;

    const update = () => {
      const h = HEALTH_STYLES[field.health] || HEALTH_STYLES.Healthy;

      if (map.getSource("field-src")) {
        map.getSource("field-src").setData(fieldGeoJSON(field));
        // Update polygon colors for new health status
        ["field-glow-outer", "field-glow-mid", "field-line"].forEach((id) => {
          if (map.getLayer(id)) map.setPaintProperty(id, "line-color", h.stroke);
        });
        if (map.getLayer("field-fill")) {
          map.setPaintProperty("field-fill", "fill-color", h.fill);
        }
      }

      // Update heatmap sources
      OVERLAY_TYPES.forEach((type) => {
        if (map.getSource(`hm-${type}`)) {
          map.getSource(`hm-${type}`).setData(sensorGeoJSON(field, type));
        }
      });

      // Re-place sensor markers
      clearMarkers();
      addSensorMarkers(map, field);

      // Fly to new field with cinematic animation
      if (field.gisCenter) {
        map.flyTo({
          center:   [field.gisCenter[1], field.gisCenter[0]],
          zoom:     16.5,
          pitch:    52,
          bearing:  -15,
          duration: 1600,
          essential: true,
        });
      }
    };

    if (map.loaded()) {
      update();
    } else {
      map.once("load", update);
    }
  }, [field?.fieldId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Toggle overlay heatmap ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;

    OVERLAY_TYPES.forEach((type) => {
      const id = `ov-${type}`;
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", activeOverlay === type ? "visible" : "none");
      }
    });
  }, [activeOverlay]);

  /* ── Toggle base tile layer visibility ── */
  function applyViewMode(mode) {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;
    const show = (id, visible) =>
      map.getLayer(id) && map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");

    show("sat-layer",    mode === "satellite");
    show("labels-layer", mode === "satellite");
    show("dark-layer",   mode === "dark");
    show("topo-layer",   mode === "terrain");
    setViewModeState(mode);
  }

  /* ── Sensor marker helpers ── */
  function addSensorMarkers(map, f) {
    (f?.sensors ?? []).forEach((sensor, idx) => {
      if (!sensor.gisLat || !sensor.gisLng) return;
      const cfg     = SENSOR_CONFIG[sensor.type] || SENSOR_CONFIG.Temperature;
      const offline = sensor.status === "offline";
      const delay   = `${(idx * 0.42).toFixed(2)}s`;

      const el = document.createElement("div");
      el.style.cssText = "position:relative;width:38px;height:38px;cursor:pointer;";

      el.innerHTML = `
        ${!offline ? `
          <div class="dt-pulse" style="
            position:absolute;top:50%;left:50%;
            width:38px;height:38px;border-radius:50%;
            background:${cfg.hex}20;border:1.5px solid ${cfg.hex}70;
            animation-delay:${delay};
          "></div>` : ""}
        <div style="
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:28px;height:28px;border-radius:50%;
          background:${offline ? "rgba(50,50,50,0.82)" : cfg.bgAlpha};
          border:2px solid ${offline ? "rgba(140,140,140,0.4)" : cfg.hex};
          display:flex;align-items:center;justify-content:center;
          font-size:8.5px;font-weight:900;
          color:${offline ? "rgba(160,160,160,0.5)" : cfg.hex};
          font-family:Inter,system-ui,sans-serif;
          box-shadow:${offline ? "none" : `0 0 12px ${cfg.hex}55,0 0 24px ${cfg.hex}22`};
          backdrop-filter:blur(6px);
        ">${cfg.code}</div>
        <div class="dt-sensor-tip" style="
          display:none;position:absolute;bottom:42px;left:50%;
          transform:translateX(-50%);
          background:rgba(5,15,10,0.95);
          border:1px solid ${cfg.hex}55;
          border-radius:10px;padding:9px 12px;
          white-space:nowrap;pointer-events:none;
          box-shadow:0 8px 24px rgba(0,0,0,0.5);
          z-index:9999;
        ">
          <div style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${cfg.hex};margin-bottom:5px">${cfg.label}</div>
          <div style="font-size:18px;font-weight:800;color:white;line-height:1">${offline ? "Offline" : sensor.value}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:3px">${sensor.id}</div>
        </div>
      `;

      const tip = el.querySelector(".dt-sensor-tip");
      el.addEventListener("mouseenter", () => { tip.style.display = "block"; });
      el.addEventListener("mouseleave", () => { tip.style.display = "none";  });

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([sensor.gisLng, sensor.gisLat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }

  function clearMarkers() {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  }

  /* ── Zoom helpers ── */
  const zoomIn  = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();
  const center  = () =>
    field?.gisCenter &&
    mapRef.current?.flyTo({
      center: [field.gisCenter[1], field.gisCenter[0]],
      zoom: 16.5, pitch: 52, bearing: -15, duration: 900,
    });
  const toggleFullscreen = () => {
    setIsFullscreen((v) => !v);
    setTimeout(() => mapRef.current?.resize(), 80);
  };

  /* ── Active overlay label ── */
  const cfg = activeOverlay ? SENSOR_CONFIG[activeOverlay] : null;

  /* ── JSX ── */
  const mapContent = (
    <div
      className={`relative overflow-hidden ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "h-full w-full rounded-2xl"
      }`}
      style={{ boxShadow: "0 12px 48px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.16)" }}
    >
      {/* MapLibre container */}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* ── View mode toggle (top-left) ── */}
      <div className="absolute left-3 top-3 z-10 flex gap-1">
        <div className="flex overflow-hidden rounded-xl border border-white/15 bg-black/50 backdrop-blur-md">
          {[
            { id: "satellite", label: "Satellite" },
            { id: "dark",      label: "Dark"      },
            { id: "terrain",   label: "Terrain"   },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => applyViewMode(id)}
              className={`px-3 py-1.5 text-[11px] font-bold transition ${
                viewMode === id
                  ? "bg-primary/45 text-white"
                  : "text-white/50 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Zoom / Centre / Fullscreen (top-right) ── */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
        <div className="flex overflow-hidden rounded-xl border border-white/15 bg-black/50 backdrop-blur-md">
          {[
            { Icon: ZoomIn,    title: "Zoom in",      action: zoomIn  },
            { Icon: ZoomOut,   title: "Zoom out",     action: zoomOut },
            { Icon: Crosshair, title: "Centre field", action: center  },
          ].map(({ Icon, title, action }) => (
            <button
              key={title}
              type="button"
              title={title}
              onClick={action}
              className="flex h-8 w-8 items-center justify-center border-r border-white/10 text-white/65 transition hover:bg-white/12 hover:text-white last:border-0"
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-black/50 text-white/65 backdrop-blur-md transition hover:bg-white/12 hover:text-white"
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Expand size={14} />}
        </button>
      </div>

      {/* ── Active overlay banner (below top-left controls) ── */}
      {cfg && (
        <div
          className="absolute left-3 top-14 z-10 flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[11px] font-bold backdrop-blur-md"
          style={{ borderColor: `${cfg.hex}40`, background: `${cfg.hex}18`, color: cfg.hex }}
        >
          <span
            className="h-2 w-2 animate-pulse rounded-full"
            style={{ backgroundColor: cfg.hex }}
          />
          {cfg.label} Overlay Active
        </div>
      )}

      {/* ── Sensor legend + status (bottom bar) ── */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-black/55 px-3 py-1.5 backdrop-blur-md">
          {Object.entries(SENSOR_CONFIG).map(([type, c]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: c.hex, boxShadow: `0 0 5px ${c.hex}` }}
              />
              <span className="text-[10px] font-bold text-white/65">{c.label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-black/55 px-3 py-1.5 backdrop-blur-md">
          <span
            className="h-1.5 w-1.5 rounded-full bg-success"
            style={{ boxShadow: "0 0 6px #22c55e" }}
          />
          <span className="text-[11px] font-semibold text-white/80">
            {(field?.sensors ?? []).filter((s) => s.status === "online").length}
            {" / "}
            {(field?.sensors ?? []).length} sensors
          </span>
          <span className="text-white/30">·</span>
          <span className="text-[11px] font-bold text-white/55">
            52° pitch
          </span>
        </div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-12 left-1/2 z-10 -translate-x-1/2">
        <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[9px] text-white/28 backdrop-blur-sm">
          © ESRI · Placeholder coords — replace with real PAU GIS data
        </span>
      </div>
    </div>
  );

  if (!field) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl bg-[#0a1f14]">
        <p className="text-sm font-semibold text-white/35">Select a field to view the map</p>
      </div>
    );
  }

  return isFullscreen ? (
    <>
      <div className="h-full w-full rounded-2xl bg-[#0e2719]/35" />
      {mapContent}
    </>
  ) : (
    mapContent
  );
}

export default FieldMap;
