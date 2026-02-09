import { motion } from "framer-motion";
import { Edit2, Trash2, ArrowUpRight, ArrowDownRight, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/services/transaction.service";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

const categoryIcons: Record<string, string> = {
  "Food & Drink": "🍔",
  
  "Transport": "🚗",
  
  "Shopping": "🛍️",
  
  "Entertainment": "🎬",
  
  "Health": "💊",
  
  "Salary": "💰",
  
  "Investment": "📈",
  
  "Other": "📦",
  
};

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onEdit,
  onDelete,
}) => {
  const isIncome = transaction.type === "income";
  const amountColor = isIncome ? "text-emerald-600" : "text-rose-600";
  const bgColor = isIncome ? "bg-emerald-50" : "bg-rose-50";
  const iconColor = isIncome ? "text-emerald-600" : "text-rose-600";

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  const categoryIcon = transaction.category
    ? categoryIcons[transaction.category] || "📦"
    : "📦";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-md"
    >
      {/* Icon */}
      <div className={`shrink-0 w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center text-2xl`}>
        {transaction.slipId ? (
          <Receipt className={`h-5 w-5 ${iconColor}`} />
        ) : (
          <span>{categoryIcon}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">
            {transaction.description || (isIncome ? "Income" : "Expense")}
          </p>
          {isIncome ? (
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-rose-500" />
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{transaction.category || "Uncategorized"}</span>
          <span>•</span>
          <span>
            {format(new Date(transaction.date), "d MMM yyyy", { locale: th })}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div className={`font-semibold ${amountColor}`}>
        {isIncome ? "+" : "-"}
        {formatAmount(transaction.amount)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(transaction)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-rose-500 hover:text-rose-600"
          onClick={() => onDelete(transaction.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default TransactionItem;
