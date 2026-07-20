import { useEffect, useState } from "react";
import { Maximize2, Minimize2, Map } from "lucide-react";
import api from "../services/api";

import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function FitBounds({ fields }) {
    const map = useMap();

    useEffect(() => {
        if (fields.length === 0) return;

        const bounds = L.latLngBounds(
            fields.map(field => [
                field.latitude,
                field.longitude
            ])
        );

        map.fitBounds(bounds, {
            padding: [60, 60]
        });
    }, [fields, map]);

    return null;
}

function FarmMap({ farmId }) {
    const [fields, setFields] = useState([]);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        api.get(`http://localhost:8081/farms/${farmId}/fields`)
            .then((res) => {
                setFields(res.data);
            })
            .catch(console.error);
    }, [farmId]);

    if (fields.length === 0) {
        return null;
    }

    return (
        <section className={expanded ? "fixed inset-4 z-[1000] overflow-hidden rounded-lg border border-white/80 bg-white p-5 shadow-panel" : "rounded-lg border border-white/70 bg-white/82 p-6 shadow-soft backdrop-blur"}>
            <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Map size={22} />
                    </span>
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Geospatial Twin
                        </p>
                        <h2 className="text-2xl font-bold text-foreground">Farm Location</h2>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white text-foreground shadow-soft transition hover:border-primary/40 hover:text-primary"
                    aria-label={expanded ? "Collapse map" : "Expand map"}
                >
                    {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
            </div>

            <div className={expanded ? "h-[calc(100vh-8.5rem)] overflow-hidden rounded-lg border border-border" : "h-[450px] overflow-hidden rounded-lg border border-border"}>
                <MapContainer
                    center={[
                        fields[0].latitude,
                        fields[0].longitude
                    ]}
                    zoom={16}
                    style={{
                        height: "100%",
                        width: "100%",
                    }}
                >
                    <FitBounds fields={fields} />

                    <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {fields.map((field) => (
                        <Marker
                            key={field.field_id}
                            position={[
                                field.latitude,
                                field.longitude
                            ]}
                        >
                            <Popup>
                                <strong>{field.field_name}</strong>
                                <br />
                                Crop: {field.crop_type}
                                <br />
                                Area: {field.area} acres
                                <br />
                                Coordinates: ({field.latitude}, {field.longitude})
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </section>
    );
}

export default FarmMap;
