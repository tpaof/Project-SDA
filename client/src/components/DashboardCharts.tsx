import React from "react";
import { SummaryCards } from "./dashboard/SummaryCards";
import { MonthlyChart } from "./dashboard/MonthlyChart";
import { SpendingChart } from "./dashboard/SpendingChart";
import { TrendChart } from "./dashboard/TrendChart";
import type { Transaction } from "@/services/transaction.service";

interface DashboardChartsProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  transactions,
  isLoading = false,
}) => {
  // Calculate summary data
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <SummaryCards
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        balance={balance}
        isLoading={isLoading}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart transactions={transactions} isLoading={isLoading} />
        <SpendingChart transactions={transactions} isLoading={isLoading} />
      </div>
      
      <MonthlyChart transactions={transactions} isLoading={isLoading} />
    </div>
  );
};

export default DashboardCharts;
