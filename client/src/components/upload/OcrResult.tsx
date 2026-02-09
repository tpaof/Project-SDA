import { useState } from "react";
import { Check, AlertCircle, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { OcrResult as OcrResultType } from "@/services/upload.service";

interface OcrResultProps {
  result: OcrResultType;
  onConfirm: (data: {
    amount: number;
    date: string;
    description: string;
    category: string;
    type: "income" | "expense";
  }) => void;
  onCancel: () => void;
  onTypeChange?: (type: "expense" | "income") => void;
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

export function OcrResult({ result, onConfirm, onCancel, onTypeChange }: OcrResultProps) {

  const [amount, setAmount] = useState(result.amount || 0);
  const [date, setDate] = useState((result.date || "").split("T")[0] || new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState(
    result.description || result.recipientName || ""
  );
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");

  const handleTypeChange = (newType: "income" | "expense") => {
    setType(newType);
    onTypeChange?.(newType);
  };

  const confidence = result.confidence || 0;
  const isHighConfidence = confidence >= 80;
  const isLowConfidence = confidence < 50;

  const handleConfirm = () => {
    onConfirm({
      amount,
      date,
      description,
      category,
      type,
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={cn(
            "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors shrink-0",
            type === "expense" 
              ? "bg-linear-to-br from-rose-400 to-red-500" 
              : "bg-linear-to-br from-emerald-400 to-green-500"
          )}>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm sm:text-base">Extracted Information</h3>
            <p className="text-xs text-gray-500">
              {isHighConfidence
                ? "High confidence"
                : isLowConfidence
                ? "Low confidence - please verify"
                : "Medium confidence - please verify"}
            </p>
          </div>
        </div>
        <div
          className={cn(
            "px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 self-start sm:self-auto",
            isHighConfidence && "bg-green-100 text-green-700",
            isLowConfidence && "bg-red-100 text-red-700",
            !isHighConfidence && !isLowConfidence && "bg-amber-100 text-amber-700"
          )}
        >
          {isHighConfidence ? (
            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          ) : (
            <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          )}
          {confidence.toFixed(0)}% confidence
        </div>
      </div>

      {/* Form */}
      <div className="space-y-3 sm:space-y-4">
        {/* Type Selection */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => handleTypeChange("expense")}
            className={cn(
              "flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all",
              type === "expense"
                ? "border-rose-500 bg-rose-50 text-rose-700"
                : "border-border bg-gray-50 text-muted-foreground hover:border-rose-200 hover:bg-rose-50/50"
            )}
          >
            <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Expense
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("income")}
            className={cn(
              "flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all",
              type === "income"
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-border bg-gray-50 text-muted-foreground hover:border-emerald-200 hover:bg-emerald-50/50"
            )}
          >
            <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Income
          </button>
        </div>

        {/* Amount */}
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-xs sm:text-sm font-medium text-gray-700">Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base sm:text-lg text-gray-500">
              ฿
            </span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="pl-8 h-10 sm:h-11 text-base sm:text-lg"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-xs sm:text-sm font-medium text-gray-700">Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Lunch at restaurant"
            className="h-10 sm:h-11"
          />
        </div>

        {/* Category & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm font-medium text-gray-700">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10 sm:h-11">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent position="top">
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm font-medium text-gray-700">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 sm:h-11"
            />
          </div>
        </div>

        {/* Extra Info */}
        {result.bankName && (
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Bank</span>
              <span className="font-medium text-gray-700">{result.bankName}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-10 sm:h-11 order-2 sm:order-1"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={!amount || !category}
          className={cn(
            "flex-1 h-10 sm:h-11 text-white border-0 transition-colors order-1 sm:order-2",
            type === "expense"
              ? "bg-rose-600 hover:bg-rose-700"
              : "bg-emerald-600 hover:bg-emerald-700"
          )}
        >
          Save Transaction
        </Button>
      </div>
    </div>
  );
}
