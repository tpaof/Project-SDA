import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessingStatusProps {
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  error?: string;
  onRetry?: () => void;
}

export function ProcessingStatus({
  status,
  progress,
  error,
  onRetry,
}: ProcessingStatusProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      title: "Waiting in queue",
      description: "Your slip is waiting to be processed",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
    },
    processing: {
      icon: Loader2,
      title: "Analyzing slip",
      description: "AI is extracting information from your image",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    completed: {
      icon: CheckCircle,
      title: "Processing complete",
      description: "All information has been extracted successfully",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    failed: {
      icon: AlertCircle,
      title: "Processing failed",
      description: error || "Could not process the image. Please try again.",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-2xl border p-6 transition-all duration-500",
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="flex items-center gap-4">
        {/* Status Icon */}
        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
            status === "processing" && "animate-pulse"
          )}
        >
          <Icon
            className={cn(
              "w-8 h-8",
              config.color,
              status === "processing" && "animate-spin"
            )}
          />
        </div>

        {/* Status Info */}
        <div className="flex-1">
          <h4 className={cn("font-semibold text-lg", config.color)}>
            {config.title}
          </h4>
          <p className="text-gray-600 text-sm mt-1">{config.description}</p>

          {/* Progress Bar for Processing */}
          {status === "processing" && (
            <div className="mt-3">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full animate-pulse"
                  style={{ width: `${progress || 50}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Retry Button */}
      {status === "failed" && onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 w-full py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
