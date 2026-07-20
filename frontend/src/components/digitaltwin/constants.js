/**
 * Digital Twin — Farm & Field Data
 *
 * ═══════════════════════════════════════════════════════════════════
 * GIS REPLACEMENT GUIDE (when real PAU coordinates are available):
 *
 *   1. Replace `gisCenter: [lat, lng]` with the actual field centroid.
 *   2. Replace `gisPolygon` array with real GeoJSON [lng, lat] pairs.
 *      NOTE: GeoJSON uses [lng, lat] order (opposite of Leaflet).
 *   3. Replace `gisLat`/`gisLng` on each sensor with real coordinates.
 *   4. The map (FieldMap.jsx) reads ONLY gisCenter, gisPolygon and
 *      sensor.gisLat/gisLng — no other changes needed.
 *   5. svgPolygon / svgCenter are legacy SVG data — keep for fallback.
 *
 * Current placeholder coordinates are real-world Ludhiana/Punjab
 * locations scaled to approximate field sizes for each farm.
 * ═══════════════════════════════════════════════════════════════════
 */

export const FARMS_DATA = [
  {
    farmId: 1,
    farmName: "PAU Research Farm",
    location: "Ludhiana, Punjab",
    fields: [
      {
        fieldId: 101,
        fieldName: "Wheat Field",
        crop: "Wheat",
        variety: "HD-2967",
        area: "4.8 acres",
        stage: "Vegetative",
        health: "Healthy",
        lastUpdated: "2 min ago",
        // Map centroid [lat, lng] — Leaflet uses this for flyTo
        gisCenter: [30.9012, 75.8573],
        // GeoJSON polygon — coordinates in [lng, lat] order (GeoJSON standard)
        // Replace these with real PAU Wheat Field boundary coordinates
        gisPolygon: [
          [75.8548, 30.9035], [75.8598, 30.9031], [75.8606, 30.9011],
          [75.8598, 30.8993], [75.8550, 30.8991], [75.8542, 30.9013],
          [75.8548, 30.9035],
        ],
        // Legacy SVG polygon for fallback renderer
        svgPolygon: "148,78 522,58 592,198 572,418 438,522 198,532 78,398 68,178",
        svgCenter: { x: 340, y: 298 },
        irrigationPath: "M88 275 C182 238, 284 228, 382 258 S532 318, 604 290",
        sensors: [
          {
            id: "S-T1", type: "Temperature", value: "32.4°C", status: "online",
            // GIS coordinates — placed naturally within the field
            gisLat: 30.9027, gisLng: 75.8558,
            x: 218, y: 168, // SVG coords (legacy)
          },
          {
            id: "S-T2", type: "Temperature", value: "31.8°C", status: "online",
            gisLat: 30.9025, gisLng: 75.8592,
            x: 492, y: 148,
          },
          {
            id: "S-M1", type: "SoilMoisture", value: "54%", status: "online",
            gisLat: 30.9013, gisLng: 75.8573,
            x: 352, y: 278,
          },
          {
            id: "S-M2", type: "SoilMoisture", value: "51%", status: "online",
            gisLat: 30.9005, gisLng: 75.8556,
            x: 188, y: 392,
          },
          {
            id: "S-H1", type: "Humidity", value: "68%", status: "online",
            gisLat: 30.9009, gisLng: 75.8591,
            x: 518, y: 328,
          },
          {
            id: "S-R1", type: "Rainfall", value: "2.1 mm", status: "online",
            gisLat: 30.9000, gisLng: 75.8574,
            x: 398, y: 458,
          },
        ],
        aiRecommendation:
          "Soil moisture is decreasing across the eastern zone. Irrigation of approximately 8 mm is recommended within the next 6 hours to maintain optimal growing conditions.",
        aiPriority: "medium",
      },
      {
        fieldId: 102,
        fieldName: "Rice Field",
        crop: "Rice",
        variety: "PR-126",
        area: "3.9 acres",
        stage: "Tillering",
        health: "Watch",
        lastUpdated: "5 min ago",
        gisCenter: [30.9018, 75.8619],
        gisPolygon: [
          [75.8604, 30.9033], [75.8652, 30.9029], [75.8661, 30.9009],
          [75.8653, 30.8991], [75.8606, 30.8989], [75.8598, 30.9010],
          [75.8604, 30.9033],
        ],
        svgPolygon: "178,88 512,68 582,208 562,438 428,532 188,522 88,378 78,188",
        svgCenter: { x: 350, y: 302 },
        irrigationPath: "M98 308 C202 268, 322 252, 422 288 S562 352, 604 328",
        sensors: [
          {
            id: "S-T1", type: "Temperature", value: "29.6°C", status: "online",
            gisLat: 30.9028, gisLng: 75.8610,
            x: 248, y: 178,
          },
          {
            id: "S-M1", type: "SoilMoisture", value: "72%", status: "online",
            gisLat: 30.9018, gisLng: 75.8622,
            x: 378, y: 258,
          },
          {
            id: "S-M2", type: "SoilMoisture", value: "68%", status: "online",
            gisLat: 30.9008, gisLng: 75.8608,
            x: 198, y: 368,
          },
          {
            id: "S-H1", type: "Humidity", value: "78%", status: "online",
            gisLat: 30.9015, gisLng: 75.8642,
            x: 498, y: 308,
          },
          {
            id: "S-H2", type: "Humidity", value: "76%", status: "online",
            gisLat: 30.9003, gisLng: 75.8620,
            x: 298, y: 428,
          },
          {
            id: "S-R1", type: "Rainfall", value: "4.8 mm", status: "online",
            gisLat: 30.9002, gisLng: 75.8638,
            x: 448, y: 418,
          },
        ],
        aiRecommendation:
          "Waterlogging risk detected in the eastern drainage zone. Reduce irrigation frequency by 20% for the next 48 hours. Monitor soil drainage and adjust accordingly.",
        aiPriority: "warning",
      },
    ],
  },
  {
    farmId: 2,
    farmName: "Demo Farm",
    location: "Amritsar, Punjab",
    fields: [
      {
        fieldId: 201,
        fieldName: "Cotton Field",
        crop: "Cotton",
        variety: "Bt-Cotton MRC-7017",
        area: "2.7 acres",
        stage: "Growth",
        health: "Stress",
        lastUpdated: "8 min ago",
        gisCenter: [31.634, 74.872],
        gisPolygon: [
          [74.868, 31.637], [74.877, 31.636], [74.879, 31.633],
          [74.877, 31.630], [74.869, 31.629], [74.866, 31.632],
          [74.868, 31.637],
        ],
        svgPolygon: "198,108 492,88 562,238 542,418 418,502 218,512 108,388 98,218",
        svgCenter: { x: 335, y: 303 },
        irrigationPath: null,
        sensors: [
          {
            id: "S-T1", type: "Temperature", value: "36.2°C", status: "online",
            gisLat: 31.6355, gisLng: 74.8700,
            x: 258, y: 188,
          },
          {
            id: "S-T2", type: "Temperature", value: "35.8°C", status: "online",
            gisLat: 31.6348, gisLng: 74.8742,
            x: 482, y: 198,
          },
          {
            id: "S-M1", type: "SoilMoisture", value: "31%", status: "online",
            gisLat: 31.6340, gisLng: 74.8720,
            x: 358, y: 298,
          },
          {
            id: "S-H1", type: "Humidity", value: "45%", status: "online",
            gisLat: 31.6330, gisLng: 74.8698,
            x: 218, y: 398,
          },
          {
            id: "S-R1", type: "Rainfall", value: "0.0 mm", status: "offline",
            gisLat: 31.6332, gisLng: 74.8738,
            x: 452, y: 378,
          },
        ],
        aiRecommendation:
          "CRITICAL: Fungal stress signature detected. Soil moisture critically low at 31%. Emergency irrigation of 15 mm recommended immediately. Apply approved fungicide treatment within 24 hours.",
        aiPriority: "critical",
      },
    ],
  },
  {
    farmId: 3,
    farmName: "Green Valley Farm",
    location: "Patiala, Punjab",
    fields: [
      {
        fieldId: 301,
        fieldName: "Maize Field",
        crop: "Maize",
        variety: "Pro-368",
        area: "5.4 acres",
        stage: "Flowering",
        health: "Healthy",
        lastUpdated: "3 min ago",
        gisCenter: [30.339, 76.386],
        gisPolygon: [
          [76.380, 30.343], [76.391, 30.342], [76.393, 30.339],
          [76.391, 30.335], [76.381, 30.334], [76.378, 30.338],
          [76.380, 30.343],
        ],
        svgPolygon: "128,68 572,58 602,238 582,458 448,542 178,542 68,358 58,178",
        svgCenter: { x: 340, y: 303 },
        irrigationPath: "M72 328 C158 282, 282 268, 402 302 S562 372, 608 348",
        sensors: [
          {
            id: "S-T1", type: "Temperature", value: "28.9°C", status: "online",
            gisLat: 30.3420, gisLng: 76.3820,
            x: 208, y: 162,
          },
          {
            id: "S-T2", type: "Temperature", value: "29.4°C", status: "online",
            gisLat: 30.3415, gisLng: 76.3900,
            x: 522, y: 178,
          },
          {
            id: "S-M1", type: "SoilMoisture", value: "62%", status: "online",
            gisLat: 30.3390, gisLng: 76.3860,
            x: 338, y: 268,
          },
          {
            id: "S-M2", type: "SoilMoisture", value: "59%", status: "online",
            gisLat: 30.3370, gisLng: 76.3822,
            x: 198, y: 398,
          },
          {
            id: "S-H1", type: "Humidity", value: "71%", status: "online",
            gisLat: 30.3375, gisLng: 76.3896,
            x: 502, y: 348,
          },
          {
            id: "S-R1", type: "Rainfall", value: "3.2 mm", status: "online",
            gisLat: 30.3355, gisLng: 76.3858,
            x: 378, y: 458,
          },
          {
            id: "S-R2", type: "Rainfall", value: "3.0 mm", status: "online",
            gisLat: 30.3382, gisLng: 76.3838,
            x: 168, y: 288,
          },
        ],
        aiRecommendation:
          "Flowering stage is progressing optimally. Apply second dose of nitrogen fertiliser within 48 hours. Current conditions are ideal for pollination. No immediate action required.",
        aiPriority: "low",
      },
      {
        fieldId: 302,
        fieldName: "Sunflower Field",
        crop: "Sunflower",
        variety: "Hysun-33",
        area: "2.1 acres",
        stage: "Bud Formation",
        health: "Healthy",
        lastUpdated: "6 min ago",
        gisCenter: [30.3455, 76.388],
        gisPolygon: [
          [76.383, 30.348], [76.391, 30.347], [76.393, 30.344],
          [76.391, 30.341], [76.384, 30.341], [76.382, 30.344],
          [76.383, 30.348],
        ],
        svgPolygon: "218,118 492,98 552,258 532,432 378,512 208,502 128,358 118,238",
        svgCenter: { x: 340, y: 302 },
        irrigationPath: null,
        sensors: [
          {
            id: "S-T1", type: "Temperature", value: "30.1°C", status: "online",
            gisLat: 30.3472, gisLng: 76.3850,
            x: 278, y: 198,
          },
          {
            id: "S-M1", type: "SoilMoisture", value: "58%", status: "online",
            gisLat: 30.3455, gisLng: 76.3878,
            x: 398, y: 288,
          },
          {
            id: "S-H1", type: "Humidity", value: "65%", status: "online",
            gisLat: 30.3442, gisLng: 76.3898,
            x: 462, y: 378,
          },
          {
            id: "S-R1", type: "Rainfall", value: "2.8 mm", status: "online",
            gisLat: 30.3438, gisLng: 76.3848,
            x: 258, y: 388,
          },
        ],
        aiRecommendation:
          "Bud formation stage proceeding normally. Maintain current irrigation schedule. Scout for sunflower beetle activity in the next 3–5 days. Potassium supplementation is recommended.",
        aiPriority: "low",
      },
    ],
  },
];

/** Visual config for each sensor type */
export const SENSOR_CONFIG = {
  Temperature: {
    hex:       "#f59e0b",
    bgAlpha:   "rgba(245,158,11,0.18)",
    ringAlpha: "rgba(245,158,11,0.35)",
    code:      "T°",
    label:     "Temperature",
  },
  SoilMoisture: {
    hex:       "#3b82f6",
    bgAlpha:   "rgba(59,130,246,0.18)",
    ringAlpha: "rgba(59,130,246,0.35)",
    code:      "M%",
    label:     "Soil Moisture",
  },
  Humidity: {
    hex:       "#14b8a6",
    bgAlpha:   "rgba(20,184,166,0.18)",
    ringAlpha: "rgba(20,184,166,0.35)",
    code:      "H%",
    label:     "Humidity",
  },
  Rainfall: {
    hex:       "#0ea5e9",
    bgAlpha:   "rgba(14,165,233,0.18)",
    ringAlpha: "rgba(14,165,233,0.35)",
    code:      "R↓",
    label:     "Rainfall",
  },
};

export const HEALTH_STYLES = {
  Healthy: {
    badge:  "text-success bg-success/10 border-success/25",
    dot:    "bg-success",
    hex:    "#16a34a",
    fill:   "#22c55e",
    fillOpacity: 0.28,
    stroke: "#16a34a",
    weight: 2.5,
    dashArray: null,
    glow:   "url(#glow-healthy)",
  },
  Watch: {
    badge:  "text-warning-foreground bg-warning/15 border-warning/30",
    dot:    "bg-warning",
    hex:    "#d97706",
    fill:   "#f59e0b",
    fillOpacity: 0.25,
    stroke: "#d97706",
    weight: 2.5,
    dashArray: "8 4",
    glow:   "url(#glow-warning)",
  },
  Stress: {
    badge:  "text-destructive bg-destructive/10 border-destructive/25",
    dot:    "bg-destructive",
    hex:    "#dc2626",
    fill:   "#ef4444",
    fillOpacity: 0.28,
    stroke: "#dc2626",
    weight: 3,
    dashArray: "6 3",
    glow:   "url(#glow-stress)",
  },
};

export const AI_PRIORITY_STYLES = {
  low:      { container: "border-success/20 bg-success/6",         label: "All clear",     dot: "bg-success"     },
  medium:   { container: "border-primary/20 bg-primary/6",         label: "Action needed", dot: "bg-primary"     },
  warning:  { container: "border-warning/25 bg-warning/8",         label: "Warning",       dot: "bg-warning"     },
  critical: { container: "border-destructive/25 bg-destructive/8", label: "Critical",      dot: "bg-destructive" },
};
