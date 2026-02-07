import { useState } from "react";
import { Check, AlertCircle, Sparkles, Edit2 } from "lucide-react";
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

export function OcrResult({ result, onConfirm, onCancel }: OcrResultProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState(result.amount || 0);
  const [date, setDate] = useState(result.date || new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState(
    result.description || result.recipientName || ""
  );
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");

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
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Extracted Information</h3>
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
            "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
            isHighConfidence && "bg-green-100 text-green-700",
            isLowConfidence && "bg-red-100 text-red-700",
            !isHighConfidence && !isLowConfidence && "bg-amber-100 text-amber-700"
          )}
        >
          {isHighConfidence ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5" />
          )}
          {confidence.toFixed(0)}% confidence
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Amount & Type */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                ฿
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="pl-8 h-11"
                readOnly={!isEditing}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11"
            readOnly={!isEditing}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Lunch at restaurant"
            className="h-11"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Extra Info */}
        {(result.bankName || result.transactionId) && (
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
            {result.bankName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Bank</span>
                <span className="font-medium text-gray-700">{result.bankName}</span>
              </div>
            )}
            {result.transactionId && (
              <div className="flex justify-between">
                <span className="text-gray-500">Transaction ID</span>
                <span className="font-medium text-gray-700">{result.transactionId}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-11"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={!amount || !category}
          className="flex-1 h-11 btn-gradient text-white border-0"
        >
          Save Transaction
        </Button>
      </div>
    </div>
  );
}
