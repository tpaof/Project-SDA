import { useState } from "react";
import { Loader2, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
} from "@/services/transaction.service";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  onSubmit: (data: CreateTransactionRequest | UpdateTransactionRequest) => Promise<void>;
  onDelete?: () => Promise<void>;
  isLoading?: boolean;
}

const CATEGORIES = [
  "Food & Drink",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Education",
  "Housing",
  "Salary",
  "Investment",
  "Other",
];

// Helper function to compute initial form data
function getInitialFormData(transaction?: Transaction | null) {
  if (transaction) {
    const isCustomCategory = transaction.category ? !CATEGORIES.includes(transaction.category) : false;
    return {
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description || "",
      category: isCustomCategory ? "Other" : (transaction.category || ""),
      date: transaction.date.split("T")[0],
    };
  }
  return {
    type: "expense" as const,
    amount: "",
    description: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
  };
}

function getInitialCustomCategory(transaction?: Transaction | null): string {
  if (transaction?.category && !CATEGORIES.includes(transaction.category)) {
    return transaction.category;
  }
  return "";
}

// Inner component that handles the form - remounts when key changes
interface TransactionModalInnerProps {
  transaction?: Transaction | null;
  onSubmit: (data: CreateTransactionRequest | UpdateTransactionRequest) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
  isOpen: boolean;
}

const TransactionModalInner: React.FC<TransactionModalInnerProps> = ({
  transaction,
  onSubmit,
  onDelete,
  onClose,
  isLoading,
  isOpen,
}) => {
  const isEditing = !!transaction;

  // Initialize state directly from props - no useEffect needed due to key-based remount
  const [formData, setFormData] = useState(getInitialFormData(transaction));
  const [customCategory, setCustomCategory] = useState(getInitialCustomCategory(transaction));
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOtherCategory = formData.category === "Other";

  const validate = (): boolean => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter an amount");
      return false;
    }
    if (!formData.date) {
      setError("Please select a date");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    try {
      // Use custom category if "Other" is selected and custom category is provided
      const finalCategory = isOtherCategory && customCategory.trim() 
        ? customCategory.trim() 
        : formData.category || undefined;
      
      await onSubmit({
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        category: finalCategory,
        date: formData.date,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              formData.type === "expense" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
            )}>
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>
                {isEditing ? "Edit Transaction" : "Add New Transaction"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update your transaction details"
                  : "Record a new income or expense"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "expense" })}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all",
                  formData.type === "expense"
                    ? "border-rose-500 bg-rose-50 text-rose-700"
                    : "border-border bg-background text-muted-foreground hover:border-rose-200 hover:bg-rose-50/50"
                )}
              >
                <ArrowDownRight className="h-4 w-4" />
                Expense
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "income" })}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all",
                  formData.type === "income"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-border bg-background text-muted-foreground hover:border-emerald-200 hover:bg-emerald-50/50"
                )}
              >
                <ArrowUpRight className="h-4 w-4" />
                Income
              </button>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-foreground">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
                  ฿
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="h-11 pl-8 text-lg"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Description</Label>
              <Input
                id="description"
                placeholder="e.g. Lunch at restaurant"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="h-11"
              />
            </div>

            {/* Category & Date - 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-foreground">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => {
                    setFormData({ ...formData, category: value });
                    if (value !== "Other") {
                      setCustomCategory("");
                    }
                  }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Custom Category Input */}
                {isOtherCategory && (
                  <Input
                    placeholder="Enter custom category..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="h-10 mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-foreground">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="h-11"
                />
              </div>
            </div>
          </form>
        </DialogBody>

        <DialogFooter>
          {isEditing && onDelete && (
            <Button
              type="button"
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isLoading}
            >
              Delete
            </Button>
          )}
          <Button
            type="submit"
            className={cn(
              "flex-1",
              formData.type === "expense" 
                ? "bg-rose-600 hover:bg-rose-700 text-white" 
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Add Transaction"
            )}
          </Button>
        </DialogFooter>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Transaction?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the transaction.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

// Wrapper component with key-based reset pattern
export const TransactionModal: React.FC<TransactionModalProps> = (props) => {
  // Key changes when transaction changes, causing TransactionModalInner to remount
  // This resets all internal state without needing useEffect
  const key = `${props.transaction?.id || "new"}-${props.isOpen}`;
  
  return (
    <TransactionModalInner
      key={key}
      transaction={props.transaction}
      onSubmit={props.onSubmit}
      onDelete={props.onDelete}
      onClose={props.onClose}
      isLoading={props.isLoading ?? false}
      isOpen={props.isOpen}
    />
  );
};

export default TransactionModal;
