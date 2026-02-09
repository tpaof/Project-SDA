import { format } from "date-fns";
import { Check, AlertCircle, Clock, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Slip } from "@/services/upload.service";

interface UploadHistoryProps {
  slips: Slip[];
  onSelect: (slip: Slip) => void;
  selectedId?: string;
}

export function UploadHistory({ slips, onSelect, selectedId }: UploadHistoryProps) {
  if (slips.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8 text-gray-500">
        <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
        <p className="text-sm">No uploads yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Upload your first slip to see it here
        </p>
      </div>
    );
  }

  const getStatusIcon = (status: Slip["status"]) => {
    switch (status) {
      case "completed":
        return <Check className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "pending":
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: Slip["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "failed":
        return "bg-red-50 border-red-200";
      case "processing":
        return "bg-blue-50 border-blue-200";
      case "pending":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      <h4 className="font-medium text-gray-700 text-xs sm:text-sm px-1">Recent Uploads</h4>
      <div className="space-y-2 max-h-[250px] sm:max-h-[300px] overflow-y-auto pr-1">
        {slips.map((slip) => (
          <button
            key={slip.id}
            onClick={() => onSelect(slip)}
            className={cn(
              "w-full p-2.5 sm:p-3 rounded-xl border text-left transition-all duration-200",
              "hover:shadow-sm",
              getStatusColor(slip.status),
              selectedId === slip.id && "ring-2 ring-orange-500 ring-offset-2"
            )}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Status Icon */}
              <div className="flex-shrink-0">{getStatusIcon(slip.status)}</div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-xs sm:text-sm truncate">
                  {slip.originalName}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                  {format(new Date(slip.createdAt), "MMM d, yyyy • h:mm a")}
                </p>
              </div>

              {/* Status Badge */}
              <span
                className={cn(
                  "text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0 capitalize",
                  slip.status === "completed" && "bg-green-100 text-green-700",
                  slip.status === "failed" && "bg-red-100 text-red-700",
                  slip.status === "processing" && "bg-blue-100 text-blue-700",
                  slip.status === "pending" && "bg-amber-100 text-amber-700"
                )}
              >
                {slip.status}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
