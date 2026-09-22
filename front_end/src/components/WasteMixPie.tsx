import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#ef4444", "#10b981", "#f59e0b", "#3b82f6"];

export type MixDatum = { name: string; value: number; total?: number };

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const total = data.payload?.total ?? 0;
    const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : "0";
    return (
      <div className="bg-slate-800 text-white p-2 px-3 rounded-lg shadow-xl border border-slate-700">
        <span className="capitalize font-bold text-sm mr-2" style={{ color: data.payload.fill }}>
          {data.name}
        </span>
        <span className="text-sm font-medium">{data.value}건 ({percent}%)</span>
      </div>
    );
  }
  return null;
};

const renderLegend = (props: any) => {
  const { payload } = props;
  return (
    <ul className="flex flex-wrap justify-center gap-4 mt-2">
      {payload.map((entry: any, index: number) => (
        <li key={`item-${index}`} className="flex items-center text-xs font-medium text-slate-600">
          <div
            className="w-3 h-3 rounded-full mr-1.5"
            style={{ backgroundColor: entry.color }}
          />
          <span className="capitalize">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

export default function WasteMixPie({
  data,
  title = "쓰레기 종류별 비율",
}: {
  data: MixDatum[];
  title?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-700">{title}</h3>
      </div>

      <div className="flex-1 p-4 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
            >
              {data.map((_, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={COLORS[i % COLORS.length]}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}