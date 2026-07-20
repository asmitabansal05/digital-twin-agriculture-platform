import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import api from "../services/api";

/**
 * FarmSelector — farm search + dropdown.
 * Accepts an optional `compact` prop for inline use (e.g. ControlBar).
 * In compact mode: no outer card wrapper, inline flex layout, smaller height.
 */
function FarmSelector({ selectedFarm, setSelectedFarm, onSelectedFarmChange, compact = false }) {
  const [farms, setFarms] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get("http://localhost:8081/farms")
      .then((res) => {
        setFarms(res.data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const selected = farms.find((farm) => String(farm.farm_id) === String(selectedFarm));
    if (selected && onSelectedFarmChange) {
      onSelectedFarmChange(selected.farm_name);
    }
  }, [farms, selectedFarm, onSelectedFarmChange]);

  const filteredFarms = farms.filter((farm) =>
    farm.farm_name.toLowerCase().includes(query.toLowerCase())
  );

  if (compact) {
    // Inline layout for the ControlBar — no outer card, smaller inputs
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={13}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search farms…"
            className="h-8 w-36 rounded-lg border border-border bg-white px-8 text-xs text-foreground outline-none transition focus:border-primary focus:shadow-focus"
          />
        </div>

        <select
          value={selectedFarm}
          onChange={(e) => setSelectedFarm(e.target.value)}
          className="h-8 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-foreground outline-none transition focus:border-primary focus:shadow-focus"
        >
          {filteredFarms.map((farm) => (
            <option key={farm.farm_id} value={farm.farm_id}>
              {farm.farm_name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Default full layout (Dashboard, Digital Twin header, etc.)
  return (
    <div className="rounded-lg border border-white/70 bg-white/80 p-3 shadow-soft backdrop-blur">
      <div className="grid gap-2 sm:grid-cols-[0.9fr_1.1fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search farms..."
            className="h-11 w-full rounded-lg border border-border bg-white px-10 text-sm text-foreground outline-none transition focus:border-primary focus:shadow-focus"
          />
        </div>

        <select
          value={selectedFarm}
          onChange={(e) => setSelectedFarm(e.target.value)}
          className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:shadow-focus"
        >
          {filteredFarms.map((farm) => (
            <option key={farm.farm_id} value={farm.farm_id}>
              {farm.farm_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default FarmSelector;
