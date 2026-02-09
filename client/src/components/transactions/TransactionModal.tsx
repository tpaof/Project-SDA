import { useState, useCallback } from "react";
import { Loader2, Wallet, ArrowUpRight, ArrowDownRight, Camera, FileImage, Trash2 } from "lucide-react";
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
import { useDropzone } from "react-dropzone";
import { uploadService, type OcrResult as OcrResultType } from "@/services/upload.service";
import { OcrResult as OcrResultComponent } from "@/components/upload/OcrResult";
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

// ==================== UPLOAD TAB COMPONENT ====================
interface BatchItem {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "uploading" | "processing" | "ready" | "saved" | "failed";
  progress: number;
  slipId?: string;
  ocrResult?: OcrResultType;
  error?: string;
}

interface UploadTabProps {
  items: BatchItem[];
  setItems: React.Dispatch<React.SetStateAction<BatchItem[]>>;
  reviewItemId: string | null;
  setReviewItemId: React.Dispatch<React.SetStateAction<string | null>>;
  onBatchSave: (data: CreateTransactionRequest) => Promise<void>;
  onBack: () => void;
  currentType: "income" | "expense";
  setCurrentType: (type: "income" | "expense") => void;
}

const UploadTab: React.FC<UploadTabProps> = ({ 
  items, 
  setItems, 
  reviewItemId, 
  setReviewItemId, 
  onBatchSave, 
  onBack,
  setCurrentType
}) => {
  const updateItem = useCallback((id: string, updates: Partial<BatchItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, [setItems]);

  const pollStatus = useCallback(async (itemId: string, slipId: string) => {
    const interval = setInterval(async () => {
      try {
        const slip = await uploadService.getSlipStatus(slipId);
        
        if (slip.status === "completed") {
          clearInterval(interval);
          const result = await uploadService.getSlipResult(slipId);
          // Check if item still exists before updating
          setItems(currentItems => {
            if (!currentItems.find(i => i.id === itemId)) return currentItems;
            return currentItems.map(item => 
              item.id === itemId 
                ? { ...item, status: "ready", ocrResult: result.ocrResult } 
                : item
            );
          });
        } else if (slip.status === "failed") {
          clearInterval(interval);
          setItems(currentItems => 
            currentItems.map(item => 
              item.id === itemId 
                ? { ...item, status: "failed", error: "Processing failed" } 
                : item
            )
          );
        }
      } catch (error) {
        // Continue polling on error
        console.error("Polling error:", error);
      }
    }, 3000);
  }, [setItems]);

  const processItem = useCallback(async (item: BatchItem) => {
    updateItem(item.id, { status: "uploading", progress: 0 });

    try {
      const response = await uploadService.uploadSlip(item.file, (progress) => {
        updateItem(item.id, { 
          progress: progress.percentage,
          status: progress.percentage === 100 ? "processing" : "uploading"
        });
      });

      updateItem(item.id, { slipId: response.slip.id, status: "processing" });
      pollStatus(item.id, response.slip.id);
    } catch (error) {
      updateItem(item.id, { 
        status: "failed", 
        error: error instanceof Error ? error.message : "Upload failed" 
      });
    }
  }, [updateItem, pollStatus]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems: BatchItem[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending",
      progress: 0,
    }));

    setItems((prev) => [...prev, ...newItems]);
    
    // Start processing new items
    newItems.forEach((item) => processItem(item));
  }, [setItems, processItem]);





  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (reviewItemId === id) setReviewItemId(null);
  };

  const handleSaveTransaction = async (data: {
    amount: number;
    date: string;
    description: string;
    category: string;
    type: "income" | "expense";
  }) => {
    if (!reviewItemId) return;
    
    try {
      await onBatchSave({
        ...data,
        amount: data.amount,
      });
      updateItem(reviewItemId, { status: "saved" });
      setReviewItemId(null);
    } catch (error) {
      console.error("Failed to save transaction:", error);
      // Ideally show error toast
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
  });

  // Review Mode
  const reviewItem = items.find((i) => i.id === reviewItemId);
  if (reviewItem?.ocrResult) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={() => setReviewItemId(null)}>
            ← Back to list
          </Button>
        </div>
        <OcrResultComponent 
          result={reviewItem.ocrResult} 
          onConfirm={handleSaveTransaction}
          onCancel={() => setReviewItemId(null)}
          onTypeChange={setCurrentType}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
        ← Back to manual entry
      </Button>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-6 transition-all duration-300 cursor-pointer",
          "flex flex-col items-center justify-center gap-2",
          isDragActive ? "border-orange-500 bg-orange-50/50" : "border-gray-300 hover:border-orange-400"
        )}
      >
        <input {...getInputProps()} />
        <Camera className="w-8 h-8 text-gray-400" />
        <p className="text-sm font-medium text-gray-700">Drop slips here (Multiple likely)</p>
      </div>

      {/* List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.id} className={cn(
            "flex items-center gap-3 p-3 rounded-xl border transition-all",
            item.status === "saved" ? "bg-green-50 border-green-200 opacity-60" : "bg-white border-gray-100 shadow-sm"
          )}>
            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
              <img src={item.previewUrl} alt="Slip" className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{item.file.name}</p>
                {item.status === "saved" && <span className="text-xs text-green-600 font-bold px-2 py-0.5 bg-green-100 rounded-full">Saved</span>}
              </div>
              
              <div className="mt-1">
                 {item.status === "uploading" && (
                   <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${item.progress}%` }} />
                   </div>
                 )}
                 {item.status === "processing" && <span className="text-xs text-blue-600 animate-pulse">Processing OCR...</span>}
                 {item.status === "ready" && <span className="text-xs text-green-600">Ready to review</span>}
                 {item.status === "failed" && <span className="text-xs text-red-500">{item.error}</span>}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {item.status === "ready" && (
                <Button size="sm" onClick={() => setReviewItemId(item.id)} className="h-8 text-xs btn-gradient text-white border-0">
                  Review
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => handleRemove(item.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== MAIN MODAL COMPONENT ====================
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

  // Initialize state directly from props
  const [formData, setFormData] = useState(getInitialFormData(transaction));
  const [customCategory, setCustomCategory] = useState(getInitialCustomCategory(transaction));
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "upload">("manual");
  const [currentType, setCurrentType] = useState<"income" | "expense">("expense");
  
  // Batch upload state (lifted up from UploadTab)
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [reviewItemId, setReviewItemId] = useState<string | null>(null);

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

  const handleBatchSave = async (data: CreateTransactionRequest) => {
    // Save transaction but keep modal open
    await onSubmit(data);
  };

  // If editing, always show manual form
  if (isEditing) {
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
                <DialogTitle>Edit Transaction</DialogTitle>
                <DialogDescription>Update your transaction details</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogBody>
            <form onSubmit={handleSubmit} className="space-y-5">
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
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">฿</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="h-11 pl-8 text-lg"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g. Lunch at restaurant"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-11"
                />
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => {
                      setFormData({ ...formData, category: value });
                      if (value !== "Other") setCustomCategory("");
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent position="top">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>
            </form>
          </DialogBody>

          <DialogFooter>
            {onDelete && (
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
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // New transaction - show tabs
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              (activeTab === "manual" ? formData.type : currentType) === "expense" 
                ? "bg-rose-100 text-rose-600" 
                : "bg-emerald-100 text-emerald-600"
            )}>
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Add New Transaction</DialogTitle>
              <DialogDescription>Choose how you want to add your transaction</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1.5 p-1.5 bg-gray-100/80 rounded-2xl">
          <button
            onClick={() => setActiveTab("manual")}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2.5",
              activeTab === "manual"
                ? "bg-white text-gray-800 shadow-md shadow-gray-200/50 ring-1 ring-gray-100"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              activeTab === "manual" ? "bg-orange-100" : "bg-gray-200/50"
            )}>
              <FileImage className={cn("w-4 h-4", activeTab === "manual" ? "text-orange-600" : "text-gray-500")} />
            </div>
            <span>Manual Entry</span>
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2.5",
              activeTab === "upload"
                ? "bg-white text-gray-800 shadow-md shadow-gray-200/50 ring-1 ring-gray-100"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              activeTab === "upload" ? "bg-blue-100" : "bg-gray-200/50"
            )}>
              <Camera className={cn("w-4 h-4", activeTab === "upload" ? "text-blue-600" : "text-gray-500")} />
            </div>
            <span>Scan Slip</span>
          </button>
        </div>

        <DialogBody>
          {activeTab === "upload" ? (
            <UploadTab
              items={batchItems}
              setItems={setBatchItems}
              reviewItemId={reviewItemId}
              setReviewItemId={setReviewItemId}
              onBatchSave={handleBatchSave}
              onBack={() => setActiveTab("manual")}
              currentType={currentType}
              setCurrentType={setCurrentType}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">฿</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="h-11 pl-8 text-lg"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g. Lunch at restaurant"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-11"
                />
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => {
                      setFormData({ ...formData, category: value });
                      if (value !== "Other") setCustomCategory("");
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent position="top">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>
            </form>
          )}
        </DialogBody>

        {activeTab === "manual" && (
          <DialogFooter>
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
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : "Add Transaction"}
            </Button>
          </DialogFooter>
        )}

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
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
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
  const key = props.transaction?.id || "new";
  return <TransactionModalInner key={key} isLoading={false} {...props} />;
};

export default TransactionModal;
