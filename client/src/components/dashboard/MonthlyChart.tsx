import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Transaction } from "@/services/transaction.service";
import { format, parseISO } from "date-fns";

interface MonthlyChartProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export const MonthlyChart: React.FC<MonthlyChartProps> = ({
  transactions,
  isLoading = false,
}) => {
  // Group transactions by month (filter out invalid dates)
  const data = transactions
    .filter((t) => t.date) // Filter out transactions without date
    .reduce((acc, transaction) => {
      const month = format(parseISO(transaction.date), "MMM yyyy");
      const existing = acc.find((item) => item.month === month);
      
      if (existing) {
        if (transaction.type === "income") {
          existing.income += transaction.amount;
        } else {
          existing.expense += transaction.amount;
        }
      } else {
        acc.push({
          month,
          income: transaction.type === "income" ? transaction.amount : 0,
          expense: transaction.type === "expense" ? transaction.amount : 0,
        });
      }
      return acc;
    }, [] as { month: string; income: number; expense: number }[])
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Last 6 months

  if (isLoading) {
    return (
      <div className="h-full w-full bg-muted/30 rounded-lg animate-pulse" />
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `฿${value / 1000}k`}
        />
        <Tooltip
          formatter={(value) => [`฿${Number(value).toLocaleString()}`, ""]}
          labelStyle={{ color: "#374151", fontSize: "12px" }}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px",
            padding: "8px 12px",
          }}
        />
        <Legend 
          wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
          iconType="circle"
        />
        <Bar
          dataKey="income"
          name="Income"
          fill="#22c55e"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
        <Bar
          dataKey="expense"
          name="Expense"
          fill="#ef4444"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MonthlyChart;
