import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export default function Sparkline({ data, isUp }: { data: number[], isUp: boolean }) {
  const chartData = data.map((val, i) => ({ val, i }));
  const color = isUp ? "#34d399" : "#fb7185"; // emerald-400 : rose-400

  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line 
            type="monotone" 
            dataKey="val" 
            stroke={color} 
            strokeWidth={1.5} 
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
