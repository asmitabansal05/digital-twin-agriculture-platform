import { useEffect, useState, useCallback } from "react";
import { Sprout } from "lucide-react";
import api from "../services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";
import ChartCard from "./ChartCard";

// One stroke color per field index. First field keeps the existing success color.
const FIELD_STROKES = [
  "hsl(var(--success))",
  "hsl(var(--primary))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
];

/**
 * SoilMoistureChart
 * @param {number} farmId       - Currently selected farm ID
 * @param {number} pollInterval - (optional) ms between background refreshes; default 10 000
 *
 * Fetches ALL fields for the farm, then fetches sensor history for each field.
 * Each field is plotted as a separate line using the field_name from the backend.
 *
 * chartData shape (for recharts multi-line):
 *   [{ reading: 1, "Wheat Field": 45.2, "Rice Field": 68.9 }, ...]
 *
 * fields shape:
 *   [{ field_id: 1, field_name: "Wheat Field" }, { field_id: 2, field_name: "Rice Field" }]
 */
function SoilMoistureChart({ farmId, pollInterval = 10000 }) {
  const [chartData, setChartData] = useState([]);
  const [fields, setFields] = useState([]);

  const fetchData = useCallback(() => {
    api.get(`/farms/${farmId}/fields`)
      .then((fieldRes) => {
        if (!fieldRes.data || fieldRes.data.length === 0) {
          setChartData([]);
          setFields([]);
          return;
        }

        const fieldList = fieldRes.data;

        // Fetch history for every field in parallel
        return Promise.all(
          fieldList.map((field) =>
            api.get(`/sensor-readings/history/${field.field_id}`)
              .then((sensorRes) => ({
                field,
                readings: [...sensorRes.data].reverse(),
              }))
              .catch(() => null) // omit fields with no history / fetch error
          )
        ).then((results) => {
          // Drop any fields that had a fetch error or empty history
          const valid = results.filter(
            (r) => r !== null && r.readings.length > 0
          );

          if (valid.length === 0) {
            setChartData([]);
            setFields([]);
            return;
          }

          // Align readings by index position across all fields.
          // Use the length of the longest field's history.
          const maxLen = Math.max(...valid.map((r) => r.readings.length));

          const merged = [];
          for (let i = 0; i < maxLen; i++) {
            const point = { reading: i + 1 };
            valid.forEach(({ field, readings }) => {
              if (i < readings.length) {
                point[field.field_name] = readings[i].soilMoisture;
              }
            });
            merged.push(point);
          }

          setChartData(merged);
          setFields(valid.map((r) => r.field));
        });
      })
      .catch((err) => {
        console.error("[SoilMoistureChart] Fetch failed:", err.message ?? err);
      });
  }, [farmId]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Background polling
  useEffect(() => {
    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchData, pollInterval]);

  return (
    <ChartCard
      icon={Sprout}
      title="Soil Moisture Trend"
      subtitle="Moisture stability by reading"
      accent="text-success"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="reading" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
            }}
          />
          {fields.map((field, idx) => (
            <Line
              key={field.field_id}
              type="monotone"
              dataKey={field.field_name}
              name={field.field_name}
              stroke={FIELD_STROKES[idx % FIELD_STROKES.length]}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default SoilMoistureChart;
