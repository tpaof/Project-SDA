import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Transaction } from "@/services/transaction.service";
import { format, parseISO } from "date-fns";

interface TrendChartProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

interface TooltipPayloadItem {
  value: number;
  name: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const formatAmount = (value: number) => `฿${value.toLocaleString()}`;

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const sortedPayload = payload
      .filter((p) => p.value !== 0)
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    if (sortedPayload.length === 0) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[180px]">
        <p className="font-medium text-gray-700 mb-2">{label}</p>
        <div className="space-y-1">
          {sortedPayload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-600 truncate max-w-[100px]">
                  {entry.name}
                </span>
              </div>
              <span
                className={`text-xs font-medium ${
                  entry.value >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {entry.value >= 0 ? "+" : ""}
                {formatAmount(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const COLORS = [
  "#f97316", // orange
  "#ef4444", // red
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f59e0b", // amber
  "#6366f1", // indigo
];

export const TrendChart: React.FC<TrendChartProps> = ({
  transactions,
  isLoading = false,
}) => {
  // Filter out transactions without date and sort
  const validTransactions = transactions
    .filter((t) => t.date && t.category)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Get unique categories (top 8 for readability)
  const categories = Array.from(
    new Set(validTransactions.map((t) => t.category).filter((c): c is string => c !== null))
  ).slice(0, 8);

  // Group by date
  const dateMap = new Map<string, Map<string, number>>();

  validTransactions.forEach((t) => {
    const date = format(parseISO(t.date), "dd MMM");
    const amount = t.type === "income" ? t.amount : -t.amount;
    const category = t.category || "Unknown";

    if (!dateMap.has(date)) {
      dateMap.set(date, new Map());
    }
    const catMap = dateMap.get(date)!;
    catMap.set(category, (catMap.get(category) || 0) + amount);
  });

  // Convert to array format for recharts
  const dates = Array.from(dateMap.keys()).slice(-14); // Last 14 days
  const data = dates.map((date) => {
    const catMap = dateMap.get(date)!;
    const point: Record<string, number | string> = { date };
    categories.forEach((cat) => {
      point[cat] = catMap.get(cat) || 0;
    });
    return point;
  });

  if (isLoading) {
    return (
      <div className="h-full w-full bg-muted/30 rounded-lg animate-pulse" />
    );
  }

  if (data.length === 0 || categories.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#6b7280", fontSize: 10 }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `฿${value / 1000}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
          iconType="circle"
        />
        {categories.map((category, index) => (
          <Line
            key={category}
            type="monotone"
            dataKey={category}
            name={category}
            stroke={COLORS[index % COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: "white", strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TrendChart;
