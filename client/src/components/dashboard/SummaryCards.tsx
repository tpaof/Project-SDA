import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  isLoading?: boolean;
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(amount);
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalIncome,
  totalExpense,
  balance,
  isLoading = false,
}) => {
  const cards = [
    {
      title: "Balance",
      amount: balance,
      icon: Wallet,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      textColor: "text-blue-600",
      shadowColor: "shadow-blue-500/20",
    },
    {
      title: "Total Income",
      amount: totalIncome,
      icon: TrendingUp,
      gradient: "from-emerald-500 to-green-600",
      bgGradient: "from-emerald-50 to-green-100",
      textColor: "text-emerald-600",
      shadowColor: "shadow-emerald-500/20",
    },
    {
      title: "Total Expenses",
      amount: totalExpense,
      icon: TrendingDown,
      gradient: "from-rose-500 to-red-600",
      bgGradient: "from-rose-50 to-red-100",
      textColor: "text-rose-600",
      shadowColor: "shadow-rose-500/20",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 shadow-lg animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card
            className={`card-glow group relative overflow-hidden border-0 shadow-lg ${card.shadowColor} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-linear-to-br ${card.bgGradient}`}
          >
            <div
              className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${card.gradient} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500`}
            />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-xl bg-linear-to-br ${card.gradient} shadow-lg`}>
                <card.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className={`text-2xl sm:text-3xl font-bold ${card.textColor}`}>
                {formatAmount(card.amount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(), "MMMM yyyy")}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default SummaryCards;
