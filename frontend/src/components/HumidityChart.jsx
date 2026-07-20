import { useEffect, useState } from "react";
import { Droplets } from "lucide-react";
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

function HumidityChart({ farmId }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    api.get(`/farms/${farmId}/fields`)
      .then((fieldRes) => {
        if (fieldRes.data.length === 0) return;

        const fieldId = fieldRes.data[0].field_id;

        api.get(`/sensor-readings/history/${fieldId}`)
          .then((sensorRes) => {
            const data = sensorRes.data
              .reverse()
              .map((item, index) => ({
                reading: index + 1,
                humidity: item.humidity
              }));

            setChartData(data);
          });
      })
      .catch(console.error);
  }, [farmId]);

  return (
    <ChartCard
      icon={Droplets}
      title="Humidity Trend"
      subtitle="Relative humidity movement"
      accent="text-agri-water"
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
            dataKey="humidity"
            name="Humidity"
            stroke="hsl(var(--agri-water))"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default HumidityChart;
