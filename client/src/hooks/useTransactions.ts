import { useState, useCallback, useEffect, useMemo } from "react";
import transactionService, {
  type Transaction,
  type CreateTransactionRequest,
  type UpdateTransactionRequest,
  type TransactionFilters,
  type TransactionSummary,
  type PaginatedTransactions,
} from "@/services/transaction.service";

interface UseTransactionsReturn {
  transactions: Transaction[];
  summary: TransactionSummary;
  pagination: PaginatedTransactions["pagination"] | null;
  isLoading: boolean;
  isLoadingSummary: boolean;
  error: string | null;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  fetchSummary: (startDate?: string, endDate?: string) => Promise<void>;
  createTransaction: (data: CreateTransactionRequest) => Promise<Transaction>;
  updateTransaction: (id: string, data: UpdateTransactionRequest) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  refresh: () => void;
}

export const useTransactions = (): UseTransactionsReturn => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginatedTransactions["pagination"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<TransactionFilters>({});

  // Calculate summary from transactions in real-time
  const summary = useMemo<TransactionSummary>(() => {
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [transactions]);

  const fetchTransactions = useCallback(async (filters: TransactionFilters = {}) => {
    setIsLoading(true);
    setError(null);
    setCurrentFilters(filters);

    try {
      const response = await transactionService.getTransactions(filters);
      setTransactions(response.data);
      setPagination(response.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch transactions";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async (startDate?: string, endDate?: string) => {
    setIsLoadingSummary(true);
    setError(null);

    try {
      await transactionService.getSummary(startDate, endDate);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch summary";
      setError(message);
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  const createTransaction = useCallback(async (data: CreateTransactionRequest) => {
    setError(null);
    try {
      const transaction = await transactionService.createTransaction(data);
      setTransactions((prev) => [transaction, ...prev]);
      await fetchTransactions(currentFilters);
      await fetchSummary();
      return transaction;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create transaction";
      setError(message);
      throw err;
    }
  }, [currentFilters, fetchTransactions, fetchSummary]);

  const updateTransaction = useCallback(async (id: string, data: UpdateTransactionRequest) => {
    setError(null);
    try {
      const transaction = await transactionService.updateTransaction(id, data);
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? transaction : t))
      );
      await fetchTransactions(currentFilters);
      await fetchSummary();
      return transaction;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update transaction";
      setError(message);
      throw err;
    }
  }, [currentFilters, fetchTransactions, fetchSummary]);

  const deleteTransaction = useCallback(async (id: string) => {
    setError(null);
    try {
      await transactionService.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      await fetchTransactions(currentFilters);
      await fetchSummary();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete transaction";
      setError(message);
      throw err;
    }
  }, [currentFilters, fetchTransactions, fetchSummary]);

  const refresh = useCallback(() => {
    fetchTransactions(currentFilters);
    fetchSummary();
  }, [currentFilters, fetchTransactions, fetchSummary]);

  // Initial load
  useEffect(() => {
    fetchTransactions();
    fetchSummary();
  }, [fetchTransactions, fetchSummary]);

  return {
    transactions,
    summary,
    pagination,
    isLoading,
    isLoadingSummary,
    error,
    fetchTransactions,
    fetchSummary,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refresh,
  };
};

export default useTransactions;
