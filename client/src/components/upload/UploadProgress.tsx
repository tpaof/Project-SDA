import { Upload, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadProgressProps {
  fileName: string;
  progress: number;
  onCancel?: () => void;
  status?: "uploading" | "success" | "error";
}

export function UploadProgress({
  fileName,
  progress,
  onCancel,
  status = "uploading",
}: UploadProgressProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Status Icon */}
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            status === "uploading" && "bg-blue-50",
            status === "success" && "bg-green-50",
            status === "error" && "bg-red-50"
          )}
        >
          {status === "uploading" && (
            <Upload className="w-6 h-6 text-blue-500 animate-pulse" />
          )}
          {status === "success" && <Check className="w-6 h-6 text-green-500" />}
          {status === "error" && <X className="w-6 h-6 text-red-500" />}
        </div>

        {/* Progress Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700 truncate pr-4">
              {fileName}
            </p>
            <span
              className={cn(
                "text-sm font-semibold flex-shrink-0",
                status === "uploading" && "text-blue-600",
                status === "success" && "text-green-600",
                status === "error" && "text-red-600"
              )}
            >
              {status === "uploading" ? `${progress}%` : status === "success" ? "Done" : "Failed"}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300 ease-out rounded-full",
                status === "uploading" && "bg-gradient-to-r from-blue-500 to-blue-400",
                status === "success" && "bg-green-500",
                status === "error" && "bg-red-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Cancel Button */}
        {status === "uploading" && onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="flex-shrink-0 text-gray-400 hover:text-red-500"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
