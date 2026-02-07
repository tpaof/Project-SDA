import { useState, useCallback } from "react";
import { Loader2, Wallet, ArrowUpRight, ArrowDownRight, Upload, Camera, X, FileImage } from "lucide-react";
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
import { uploadService, type Slip, type OcrResult } from "@/services/upload.service";
import { UploadProgress } from "@/components/upload/UploadProgress";
import { ProcessingStatus } from "@/components/upload/ProcessingStatus";
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
interface UploadTabProps {
  onOcrComplete: (result: OcrResult) => void;
  onBack: () => void;
}

const UploadTab: React.FC<UploadTabProps> = ({ onOcrComplete, onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ loaded: number; total: number; percentage: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedSlip, setUploadedSlip] = useState<Slip | null>(null);
  const [processingStatus, setProcessingStatus] = useState<Slip["status"] | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const error = uploadService.validateFile(file);
      if (error) {
        setUploadError(error);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await uploadService.uploadSlip(selectedFile, (progress) => {
        setUploadProgress(progress);
      });
      setUploadedSlip(response.slip);
      setProcessingStatus(response.slip.status);
      pollStatus(response.slip.id);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const pollStatus = async (slipId: string) => {
    const interval = setInterval(async () => {
      try {
        const slip = await uploadService.getSlipStatus(slipId);
        setProcessingStatus(slip.status);

        if (slip.status === "completed") {
          clearInterval(interval);
          const result = await uploadService.getSlipResult(slipId);
          onOcrComplete(result.ocrResult);
        } else if (slip.status === "failed") {
          clearInterval(interval);
          setUploadError("Processing failed. Please try again.");
        }
      } catch (error) {
        console.error("Error polling status:", error);
      }
    }, 3000);
  };

  // Show processing state
  if (uploadedSlip && processingStatus && processingStatus !== "completed") {
    return (
      <div className="py-4">
        <ProcessingStatus
          status={processingStatus}
          error={uploadError || undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
        ← Back to manual entry
      </Button>

      {/* Dropzone or Preview */}
      {!selectedFile && !isUploading && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer",
            "flex flex-col items-center justify-center gap-4 min-h-[200px]",
            isDragActive ? "border-orange-500 bg-orange-50/50" : "border-gray-300 hover:border-orange-400"
          )}
        >
          <input {...getInputProps()} />
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Camera className="w-7 h-7 text-gray-400" />
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-700">Drop your slip here or click to browse</p>
            <p className="text-sm text-gray-500 mt-1">JPG, PNG, WebP up to 10MB</p>
          </div>
        </div>
      )}

      {/* Selected File Preview */}
      {selectedFile && !isUploading && (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border border-gray-200">
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              className="w-full h-48 object-contain bg-gray-50"
            />
            <button
              onClick={() => setSelectedFile(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setSelectedFile(null)} className="flex-1">
              Change
            </Button>
            <Button onClick={handleUpload} className="flex-1 btn-gradient text-white border-0">
              <Upload className="w-4 h-4 mr-2" />
              Upload & Analyze
            </Button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && selectedFile && (
        <UploadProgress
          fileName={selectedFile.name}
          progress={uploadProgress?.percentage || 0}
          status="uploading"
        />
      )}

      {/* Error */}
      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {uploadError}
        </div>
      )}
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

  const handleOcrComplete = (ocrResult: OcrResult) => {
    // Pre-fill form with OCR data
    setFormData({
      type: "expense",
      amount: ocrResult.amount?.toString() || "",
      description: ocrResult.description || ocrResult.recipientName || "",
      category: "",
      date: ocrResult.date || new Date().toISOString().split("T")[0],
    });
    setActiveTab("manual");
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
                    <SelectContent>
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
              "flex h-10 w-10 items-center justify-center rounded-lg",
              formData.type === "expense" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
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
              onOcrComplete={handleOcrComplete}
              onBack={() => setActiveTab("manual")}
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
                    <SelectContent>
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
  return <TransactionModalInner key={key} {...props} />;
};

export default TransactionModal;
