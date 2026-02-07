import api from "./api";

export type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  category: string | null;
  date: string;
  userId: string;
  slipId: string | null;
  createdAt: string;
};

export type CreateTransactionRequest = {
  type: "income" | "expense";
  amount: number;
  description?: string;
  category?: string;
  date: string;
};

export type UpdateTransactionRequest = {
  type?: "income" | "expense";
  amount?: number;
  description?: string;
  category?: string;
  date?: string;
};

export type TransactionFilters = {
  type?: "income" | "expense";
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  search?: string;
};

export type TransactionSummary = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
};

export type PaginatedTransactions = {
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const transactionService = {
  async getTransactions(filters: TransactionFilters = {}): Promise<PaginatedTransactions> {
    const params = new URLSearchParams();
    
    if (filters.type) params.append("type", filters.type);
    if (filters.category) params.append("category", filters.category);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.minAmount) params.append("minAmount", filters.minAmount.toString());
    if (filters.maxAmount) params.append("maxAmount", filters.maxAmount.toString());
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const response = await api.get<PaginatedTransactions>(`/transactions?${params.toString()}`);
    return response.data;
  },

  async getTransactionById(id: string): Promise<Transaction> {
    const response = await api.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  async createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
    const response = await api.post<Transaction>("/transactions", data);
    return response.data;
  },

  async updateTransaction(id: string, data: UpdateTransactionRequest): Promise<Transaction> {
    const response = await api.put<Transaction>(`/transactions/${id}`, data);
    return response.data;
  },

  async deleteTransaction(id: string): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },

  async getSummary(startDate?: string, endDate?: string): Promise<TransactionSummary> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await api.get<TransactionSummary>(`/transactions/summary?${params.toString()}`);
    return response.data;
  },
};

export { transactionService };
export default transactionService;
