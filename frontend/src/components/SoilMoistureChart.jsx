import { useEffect, useState } from "react";
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

function SoilMoistureChart({ farmId }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    api.get(`http://localhost:8081/farms/${farmId}/fields`)
      .then((fieldRes) => {
        if (fieldRes.data.length === 0) return;

        const fieldId = fieldRes.data[0].field_id;

        api.get(`http://localhost:8081/sensor-readings/history/${fieldId}`)
          .then((sensorRes) => {
            const data = sensorRes.data
              .reverse()
              .map((item, index) => ({
                reading: index + 1,
                moisture: item.soilMoisture
              }));

            setChartData(data);
          });
      })
      .catch(console.error);
  }, [farmId]);

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
          <Line
            type="monotone"
            dataKey="moisture"
            name="Soil Moisture"
            stroke="hsl(var(--success))"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default SoilMoistureChart;
