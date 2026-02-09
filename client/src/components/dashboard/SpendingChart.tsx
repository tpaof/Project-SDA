import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Transaction } from "@/services/transaction.service";

interface SpendingChartProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

const COLORS = [
  "#f97316", // orange-500
  "#ef4444", // red-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
];

export const SpendingChart: React.FC<SpendingChartProps> = ({
  transactions,
  isLoading = false,
}) => {
  // Group expenses by category
  const data = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, transaction) => {
      const category = transaction.category || "Other";
      const existing = acc.find((item) => item.name === category);
      if (existing) {
        existing.value += transaction.amount;
      } else {
        acc.push({ name: category, value: transaction.amount });
      }
      return acc;
    }, [] as { name: string; value: number }[])
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Top 6 categories

  if (isLoading) {
    return (
      <div className="h-full w-full bg-muted/30 rounded-lg animate-pulse" />
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
        No expense data
      </div>
    );
  }

  const formatAmount = (value: number) => {
    return `฿${value.toLocaleString()}`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatAmount(value as number)}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px",
            padding: "8px 12px",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default SpendingChart;
