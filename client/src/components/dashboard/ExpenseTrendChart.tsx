import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Transaction } from "@/services/transaction.service";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface ExpenseTrendChartProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

const COLORS = ["#fbbf24", "#f472b6", "#60a5fa", "#a78bfa", "#34d399", "#f87171", "#22d3ee", "#fb923c"];

export const ExpenseTrendChart: React.FC<ExpenseTrendChartProps> = ({
  transactions,
  isLoading = false,
}) => {
  // Get current month date range
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  const days = eachDayOfInterval({ start, end });

  // Get top 5 expense categories
  const topCategories = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      const cat = t.category || "Other";
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const categories = Object.entries(topCategories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name]) => name);

  // Create data for each day
  const data = days.map((day) => {
    const dayStr = format(day, "d");
    const dayData: Record<string, number | string> = { date: dayStr };

    categories.forEach((category) => {
      const amount = transactions
        .filter((t) => 
          t.type === "expense" && 
          (t.category || "Other") === category &&
          t.date && 
          format(parseISO(t.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
        )
        .reduce((sum, t) => sum + t.amount, 0);
      dayData[category] = amount;
    });

    return dayData;
  });

  if (isLoading) {
    return (
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Expense Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-gray-100 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Expense Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-gray-400">
            No expense data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Expense Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  fontSize={12}
                  interval={4}
                />
                <YAxis 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => `฿${value}`}
                />
                <Tooltip
                  formatter={(value) => 
                    new Intl.NumberFormat("th-TH", {
                      style: "currency",
                      currency: "THB",
                      maximumFractionDigits: 0,
                    }).format(Number(value) || 0)
                  }
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                {categories.map((category, index) => (
                  <Line
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExpenseTrendChart;
