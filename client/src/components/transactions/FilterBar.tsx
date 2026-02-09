import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { TransactionFilters } from "@/services/transaction.service";

interface FilterBarProps {
  filters: TransactionFilters;
  onFilterChange: (filters: TransactionFilters) => void;
  categories: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  categories,
}) => {
  const hasFilters =
    filters.type || filters.category || filters.search;
  const typeLabel =
    filters.type === "income"
      ? "Income"
      : filters.type === "expense"
        ? "Expense"
        : "All";
  const categoryLabel = filters.category || "All Categories";

  const clearFilters = () => {
    onFilterChange({});
  };

  return (
    <div className="flex flex-wrap gap-3 items-center rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          className="pl-10 rounded-xl"
          value={filters.search || ""}
          onChange={(e) =>
            onFilterChange({ ...filters, search: e.target.value })
          }
        />
      </div>

      {/* Type Filter */}
      <Select
        value={typeLabel}
        onValueChange={(value) =>
          onFilterChange({
            ...filters,
            type:
              value === "Income"
                ? "income"
                : value === "Expense"
                  ? "expense"
                  : undefined,
          })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All</SelectItem>
          <SelectItem value="Income">Income</SelectItem>
          <SelectItem value="Expense">Expense</SelectItem>
        </SelectContent>
      </Select>

      {/* Category Filter */}
      <Select
        value={categoryLabel}
        onValueChange={(value) =>
          onFilterChange({
            ...filters,
            category: value === "All Categories" ? undefined : value,
          })
        }
      >
        <SelectTrigger className="min-w-[180px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All Categories">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="rounded-xl"
        >
          <X className="h-4 w-4 mr-1" />
          Clear Filters
        </Button>
      )}
    </div>
  );
};

export default FilterBar;
