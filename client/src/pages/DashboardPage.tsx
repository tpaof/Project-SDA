import { useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowUp,
  ArrowDown,
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  MoreHorizontal,
  Receipt,
  Trash2,
  Edit2,
  Calendar,
  Download,
  FileSpreadsheet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionModal } from "@/components/TransactionModal";
import { Pagination } from "@/components/Pagination";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { MonthlyChart } from "@/components/dashboard/MonthlyChart";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { cn } from "@/lib/utils";
import { exportToExcel, exportToCSV } from "@/utils/export";
import type { Transaction, CreateTransactionRequest, UpdateTransactionRequest } from "@/services/transaction.service";


// ============================================
// TYPES
// ============================================
interface FilterState {
  search: string;
  type: "" | "income" | "expense";
  category: string;
  sortBy: "date" | "amount";
  sortOrder: "desc" | "asc";
  startDate: string;
  endDate: string;
}

// ============================================
// TRANSACTION ROW COMPONENT
// ============================================
interface TransactionRowProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

const TransactionRow = ({ transaction, onEdit, onDelete }: TransactionRowProps) => {
  const isIncome = transaction.type === "income";

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="group border-b border-border/50 hover:bg-muted/30 transition-colors"
    >
      <td className="py-3 sm:py-4 pl-3 sm:pl-6 pr-2 sm:pr-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={cn(
            "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-md shrink-0",
            isIncome ? "gradient-income" : "gradient-expense"
          )}>
            {isIncome ? <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" /> : <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-xs sm:text-sm truncate">{transaction.description || transaction.category || "Uncategorized"}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{format(new Date(transaction.date), "MMM d, yyyy")}</p>
          </div>
        </div>
      </td>
      <td className="py-3 sm:py-4 px-2 sm:px-4 hidden sm:table-cell">
        <Badge variant={isIncome ? "success" : "destructive"} className="font-medium text-xs">
          {transaction.category || "Uncategorized"}
        </Badge>
      </td>
      <td className="py-3 sm:py-4 px-2 sm:px-4">
        <Badge variant="outline" className={cn(
          "font-medium text-xs",
          isIncome ? "border-green-500/30 text-green-600 bg-green-500/10" : "border-red-500/30 text-red-600 bg-red-500/10"
        )}>
          {isIncome ? "Income" : "Expense"}
        </Badge>
      </td>
      <td className="py-3 sm:py-4 text-right pr-3 sm:pr-6 pl-2 sm:pl-4">
        <span className={cn(
          "font-bold font-['Plus_Jakarta_Sans'] text-sm sm:text-base",
          isIncome ? "text-green-600" : "text-red-600"
        )}>
          {isIncome ? "+" : "-"}฿{transaction.amount.toLocaleString()}
        </span>
      </td>
      <td className="py-3 sm:py-4 pr-3 sm:pr-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
            <DropdownMenuItem onClick={() => onEdit(transaction)} className="gap-2 hover:bg-gray-100">
              <Edit2 className="w-4 h-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(transaction.id)} className="gap-2 text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </motion.tr>
  );
};

// ============================================
// FILTER BAR COMPONENT
// ============================================
interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onAddClick: () => void;
  transactions: Transaction[];
}

// ============================================
// DATE RANGE FILTER COMPONENT
// ============================================
interface DateRangeFilterProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const DateRangeFilter = ({ filters, onFilterChange }: DateRangeFilterProps) => {
  const handleQuickSelect = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    onFilterChange({
      ...filters,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    });
  };

  const handleClear = () => {
    onFilterChange({
      ...filters,
      startDate: "",
      endDate: "",
    });
  };

  const hasDateRange = filters.startDate || filters.endDate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm min-w-fit"
    >
      <div className="flex items-center gap-2 shrink-0">
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Date Range:</span>
      </div>
      
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
          className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          placeholder="Start Date"
        />
        <span className="text-gray-400">-</span>
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
          className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          placeholder="End Date"
        />
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 sm:ml-auto flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickSelect(7)}
          className="text-xs h-7 sm:h-8 px-2 sm:px-2.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50"
        >
          7 Days
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickSelect(30)}
          className="text-xs h-7 sm:h-8 px-2 sm:px-2.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50"
        >
          30 Days
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickSelect(90)}
          className="text-xs h-7 sm:h-8 px-2 sm:px-2.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50"
        >
          3 Months
        </Button>
        {hasDateRange && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs h-7 sm:h-8 px-2 sm:px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Clear
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// FILTER BAR COMPONENT
// ============================================
const FilterBar = ({ filters, onFilterChange, onAddClick, transactions }: FilterBarProps) => {
  // Get unique categories from transactions
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    transactions.forEach((t) => {
      if (t.category) uniqueCategories.add(t.category);
    });
    return Array.from(uniqueCategories).sort();
  }, [transactions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-3"
    >
      {/* Row 1: Search (full width on mobile) */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="pl-10 w-full border border-gray-200 bg-white"
        />
      </div>

      {/* Row 2: Filters in grid layout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Select
          value={filters.type}
          onValueChange={(value) => onFilterChange({ ...filters, type: value as FilterState["type"] })}
        >
          <SelectTrigger className="w-full border border-gray-200 bg-white text-xs sm:text-sm h-10">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.category}
          onValueChange={(value) => onFilterChange({ ...filters, category: value })}
        >
          <SelectTrigger className="w-full border border-gray-200 bg-white text-xs sm:text-sm h-10">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split("-") as [FilterState["sortBy"], FilterState["sortOrder"]];
            onFilterChange({ ...filters, sortBy, sortOrder });
          }}
        >
          <SelectTrigger className="w-full border border-gray-200 bg-white text-xs sm:text-sm h-10">
            <div className="flex items-center gap-1 sm:gap-2">
              {filters.sortBy === "date" ? (
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              ) : null}
              <span>{filters.sortBy === "date" ? "Date" : "Amount"}</span>
              {filters.sortOrder === "desc" ? (
                <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              )}
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Date (Newest)</SelectItem>
            <SelectItem value="date-asc">Date (Oldest)</SelectItem>
            <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
            <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          onClick={onAddClick} 
          className="btn-gradient text-white border-0 gap-1.5 sm:gap-2 w-full h-10 text-xs sm:text-sm"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN DASHBOARD PAGE
// ============================================
export function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { transactions, pagination, isLoading, fetchTransactions, deleteTransaction, createTransaction, updateTransaction } = useTransactions();
  
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    type: "",
    category: "",
    sortBy: "date",
    sortOrder: "desc",
    startDate: "",
    endDate: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [pageSize, setPageSize] = useState(10);

  // Hide-on-scroll navbar state
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header when scrolling up or at top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsHeaderVisible(true);
      } else {
        // Hide header when scrolling down and past threshold
        setIsHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter((t) => {
      const matchesSearch =
        !filters.search ||
        t.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.category?.toLowerCase().includes(filters.search.toLowerCase());
      const matchesType = !filters.type || t.type === filters.type;
      const matchesCategory = !filters.category || t.category === filters.category;
      
      // Date range filter
      const transactionDate = new Date(t.date);
      const matchesStartDate = !filters.startDate || transactionDate >= new Date(filters.startDate);
      const matchesEndDate = !filters.endDate || transactionDate <= new Date(filters.endDate);
      
      return matchesSearch && matchesType && matchesCategory && matchesStartDate && matchesEndDate;
    });

    // Sort transactions
    return filtered.sort((a, b) => {
      if (filters.sortBy === "date") {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return filters.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        return filters.sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
      }
    });
  }, [transactions, filters]);

  // Calculate filtered summary
  const filteredSummary = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [filteredTransactions]);

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }


  // Handlers
  const handleAddClick = () => {
    setEditingTransaction(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      await deleteTransaction(id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTransaction(undefined);
  };

  const handleSubmit = async (data: CreateTransactionRequest | UpdateTransactionRequest) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, data as UpdateTransactionRequest);
    } else {
      await createTransaction(data as CreateTransactionRequest);
    }
  };

  const handlePageChange = (page: number) => {
    fetchTransactions({ page, limit: pageSize });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    fetchTransactions({ page: 1, limit: size });
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header - Hide on Scroll */}
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm transition-transform duration-300 ease-in-out",
          isHeaderVisible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center text-white shadow-lg">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-['Plus_Jakarta_Sans'] gradient-text">
                  MoneyMate
                </h1>
                <p className="text-xs text-muted-foreground">Personal Finance</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <span className="hidden md:block text-sm text-muted-foreground">
                {user?.email}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarFallback className="bg-linear-to-br from-orange-400 to-red-500 text-white font-semibold">
                        {(user?.email?.[0] || "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border border-gray-200 bg-white shadow-lg">
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium">Account</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <ArrowDownRight className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content - Add pt-24 for fixed header */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 pt-20 ">
        {/* Welcome Section */}
        <div className="mb-4 sm:mb-8">
          <h2 className="text-2xl sm:pt-12 sm:text-3xl font-bold font-['Plus_Jakarta_Sans']">
            Welcome back,👋
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Here's what's happening with your money today.</p>
        </div>

        {/* Summary Cards - Compact Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="sm:col-span-2 lg:col-span-1"
          >
            <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
                    <h3 className="text-xl sm:text-2xl font-bold text-orange-600">
                      ฿{(filteredSummary.balance || 0).toLocaleString()}
                    </h3>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Income</p>
                    <h3 className="text-xl sm:text-2xl font-bold text-green-600">
                      ฿{(filteredSummary.totalIncome || 0).toLocaleString()}
                    </h3>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Expenses</p>
                    <h3 className="text-xl sm:text-2xl font-bold text-red-600">
                      ฿{(filteredSummary.totalExpense || 0).toLocaleString()}
                    </h3>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row 1 - Pie & Bar */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Pie Chart - Category Distribution (5 cols) */}
          <motion.div
            className="xl:col-span-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Card className="bg-white border border-gray-200 h-full">
              <CardHeader className="pb-2 sm:pb-3 border-b border-gray-100 px-3 sm:px-6">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Spending by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6">
                <div className="h-[220px] sm:h-[260px]">
                  <SpendingChart transactions={filteredTransactions} isLoading={isLoading} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bar Chart - Monthly Comparison (7 cols) */}
          <motion.div
            className="xl:col-span-7"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="bg-white border border-gray-200 h-full">
              <CardHeader className="pb-2 sm:pb-3 border-b border-gray-100 px-3 sm:px-6">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Income vs Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6">
                <div className="h-[220px] sm:h-[260px]">
                  <MonthlyChart transactions={filteredTransactions} isLoading={isLoading} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row 2 - Balance Trend (Full Width) */}
        <motion.div
          className="mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card className="bg-white border border-gray-200">
            <CardHeader className="pb-2 sm:pb-3 border-b border-gray-100 px-3 sm:px-6">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Balance Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6">
              <div className="h-[250px] sm:h-[320px]">
                <TrendChart transactions={filteredTransactions} isLoading={isLoading} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Date Range Filter */}
        <div className="mb-4 sm:mb-6 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <DateRangeFilter filters={filters} onFilterChange={setFilters} />
        </div>

        {/* Transactions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="space-y-3"
        >
          {/* Header and Filters - Stacked on mobile */}
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold font-['Plus_Jakarta_Sans']">Recent Transactions</h3>
            <FilterBar 
              filters={filters} 
              onFilterChange={setFilters} 
              onAddClick={handleAddClick} 
              transactions={transactions}
            />
          </div>

          <Card className="border border-gray-200 bg-white">
            <div className="overflow-x-auto -mx-px">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left py-3 px-3 sm:px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                      Category
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-right py-3 px-2 sm:px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="py-3 px-3 sm:px-6 w-12 sm:w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {isLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          <td className="py-3 sm:py-4 px-3 sm:px-6">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-24 sm:w-32" />
                                <Skeleton className="h-3 w-16 sm:w-20" />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-4 hidden sm:table-cell"><Skeleton className="h-6 w-20" /></td>
                          <td className="py-3 sm:py-4 px-2 sm:px-4"><Skeleton className="h-6 w-16" /></td>
                          <td className="py-3 sm:py-4 px-2 sm:px-6"><Skeleton className="h-6 w-20 sm:w-24 ml-auto" /></td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6"></td>
                        </tr>
                      ))
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 sm:py-12 text-center">
                          <div className="flex flex-col items-center gap-3 sm:gap-4">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center">
                              <Receipt className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-base sm:text-lg">No transactions found</p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Get started by adding your first transaction
                              </p>
                            </div>
                            <Button onClick={handleAddClick} className="btn-gradient text-white border-0 mt-2">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Transaction
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TransactionRow
                          key={transaction.id}
                          transaction={transaction}
                          onEdit={handleEditClick}
                          onDelete={handleDeleteClick}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Footer with Pagination and Export */}
            <div className="py-3 px-3 sm:px-6 border-t border-border/50">
              {/* Mobile: Stacked layout */}
              <div className="flex flex-col gap-3 sm:hidden">
                {/* Pagination - centered with overflow protection */}
                <div className="flex justify-center w-full">
                  {pagination && pagination.totalPages >= 1 && (
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                    />
                  )}
                </div>
                {/* Export button - full width */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-gray-200 hover:bg-gray-50 w-full"
                      disabled={filteredTransactions.length === 0}
                    >
                      <Download className="w-4 h-4" />
                      Export Data
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="bg-white border border-gray-200 shadow-lg">
                    <DropdownMenuItem
                      onClick={() => exportToExcel(filteredTransactions, { filename: "moneymate_transactions" })}
                      className="gap-2 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => exportToCSV(filteredTransactions, { filename: "moneymate_transactions" })}
                      className="gap-2 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                      Export as CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop: Horizontal layout */}
              <div className="hidden sm:flex items-center justify-between">
                {/* Left spacer */}
                <div className="w-20" />

                {/* Pagination - Center */}
                <div className="flex-1 flex justify-center">
                  {pagination && pagination.totalPages >= 1 && (
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                    />
                  )}
                </div>

                {/* Export Dropdown - Right */}
                <div className="w-20 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-gray-200 hover:bg-gray-50"
                        disabled={filteredTransactions.length === 0}
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
                      <DropdownMenuItem
                        onClick={() => exportToExcel(filteredTransactions, { filename: "moneymate_transactions" })}
                        className="gap-2 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        Export as Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => exportToCSV(filteredTransactions, { filename: "moneymate_transactions" })}
                        className="gap-2 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                        Export as CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        transaction={editingTransaction}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
