import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Transaction } from "@/services/transaction.service";

interface CategoryBarChartProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

const COLORS = ["#2dd4bf", "#f472b6", "#fbbf24", "#a78bfa", "#60a5fa", "#f87171", "#34d399", "#fb923c"];

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({
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
    .slice(0, 8); // Top 8 categories

  if (isLoading) {
    return (
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Amount by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-gray-100 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Amount by Category</CardTitle>
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
      transition={{ delay: 0.3 }}
    >
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Amount by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis 
                  type="number" 
                  tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#6b7280"
                  fontSize={12}
                  width={70}
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
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CategoryBarChart;
