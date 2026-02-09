import { motion, AnimatePresence } from "framer-motion";
import { Receipt, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/services/transaction.service";
import { TransactionItem } from "./TransactionItem";
import { Pagination } from "@/components/ui/pagination";

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
  onAdd: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isLoading = false,
  pagination,
  onEdit,
  onDelete,
  onPageChange,
  onAdd,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Receipt className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-medium text-muted-foreground">
          No transactions yet
        </h3>
        <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
          Start tracking your income and expenses
        </p>
        <Button onClick={onAdd} className="rounded-xl btn-gradient text-white border-0">
          <Plus className="h-4 w-4 mr-2" />
          Add First Transaction
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>

      {pagination && pagination.totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-4"
        >
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.limit}
            onPageChange={onPageChange}
          />
        </motion.div>
      )}
    </div>
  );
};

export default TransactionList;
