import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  Wallet,
  CreditCard,
  History,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useUpload } from "@/hooks/useUpload";
import { transactionService } from "@/services/transaction.service";
import { toast } from "sonner";

import { Dropzone } from "@/components/upload/Dropzone";
import { ImagePreview } from "@/components/upload/ImagePreview";
import { UploadProgress } from "@/components/upload/UploadProgress";
import { ProcessingStatus } from "@/components/upload/ProcessingStatus";
import { OcrResult } from "@/components/upload/OcrResult";
import { UploadHistory } from "@/components/upload/UploadHistory";

export function UploadPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();


  const {
    selectedFile,
    uploadProgress,
    isUploading,
    uploadError,
    uploadedSlip,
    processingStatus,
    processingError,
    uploadHistory,
    selectFile,
    clearFile,
    uploadFile,
    cancelUpload,
    selectSlipFromHistory,
    retryProcessing,
  } = useUpload();

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleConfirmOcr = async (data: {
    amount: number;
    date: string;
    description: string;
    category: string;
    type: "income" | "expense";
  }) => {
    try {
      await transactionService.createTransaction({
        amount: data.amount,
        date: data.date,
        description: data.description,
        category: data.category,
        type: data.type,
      });
      toast.success("Transaction saved!", {
        description: "The extracted data has been saved successfully.",
      });
      navigate("/dashboard");
    } catch {
      toast.error("Failed to save", {
        description: "Could not save the transaction. Please try again.",
      });
    }
  };

  const showDropzone = !selectedFile && !isUploading && !uploadedSlip;
  const showPreview = selectedFile && !isUploading;
  const showProgress = isUploading;
  const showProcessing = uploadedSlip && processingStatus !== "completed";
  const showResult = uploadedSlip?.status === "completed" && uploadedSlip.ocrResult;

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center text-white shadow-lg">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-['Plus_Jakarta_Sans'] gradient-text">
                  MoneyMate
                </h1>
                <p className="text-xs text-muted-foreground">Upload Slip</p>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Page Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                Upload Bank Slip
              </h2>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                Upload an image of your bank transfer slip and let AI extract the details automatically.
              </p>
            </motion.div>

            {/* Upload Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border border-gray-200 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  {/* Dropzone */}
                  {showDropzone && (
                    <Dropzone
                      onFileSelect={selectFile}
                      error={uploadError}
                      disabled={isUploading}
                    />
                  )}

                  {/* Image Preview */}
                  {showPreview && selectedFile && (
                    <ImagePreview file={selectedFile} onRemove={clearFile} />
                  )}

                  {/* Upload Progress */}
                  {showProgress && selectedFile && (
                    <UploadProgress
                      fileName={selectedFile.name}
                      progress={uploadProgress?.percentage || 0}
                      onCancel={cancelUpload}
                      status={uploadError ? "error" : "uploading"}
                    />
                  )}

                  {/* Processing Status */}
                  {showProcessing && processingStatus && (
                    <ProcessingStatus
                      status={processingStatus}
                      error={processingError || undefined}
                      onRetry={retryProcessing}
                    />
                  )}

                  {/* OCR Result */}
                  {showResult && uploadedSlip.ocrResult && (
                    <OcrResult
                      result={uploadedSlip.ocrResult}
                      onConfirm={handleConfirmOcr}
                      onCancel={() => navigate("/dashboard")}
                    />
                  )}

                  {/* Upload Actions */}
                  {showPreview && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearFile}
                        className="flex-1 h-11 sm:h-12 text-sm sm:text-base"
                      >
                        Change File
                      </Button>
                      <Button
                        type="button"
                        onClick={uploadFile}
                        disabled={isUploading}
                        className="flex-1 h-11 sm:h-12 btn-gradient text-white border-0 gap-2 text-sm sm:text-base"
                      >
                        <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                        Upload & Analyze
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Tips Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-blue-50/50 border-blue-100">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm sm:text-base">
                        Tips for best results
                      </h4>
                      <ul className="text-xs sm:text-sm text-gray-600 mt-2 space-y-1">
                        <li>• Ensure the image is clear and well-lit</li>
                        <li>• Make sure all text is readable</li>
                        <li>• Supported formats: JPG, PNG, WebP</li>
                        <li>• Maximum file size: 10MB</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - History */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="border border-gray-200 shadow-lg lg:sticky lg:top-24">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
                        Recent Uploads
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/dashboard")}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-xs sm:text-sm h-8 sm:h-9"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">Add Manual</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>

                  <UploadHistory
                    slips={uploadHistory}
                    onSelect={selectSlipFromHistory}
                    selectedId={uploadedSlip?.id}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UploadPage;
