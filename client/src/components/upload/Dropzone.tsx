import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileImage, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  error?: string | null;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export function Dropzone({ onFileSelect, error, disabled }: DropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer",
        "flex flex-col items-center justify-center gap-4 min-h-[240px]",
        isDragActive && !isDragReject && "border-orange-500 bg-orange-50/50 scale-[1.02]",
        isDragReject && "border-red-500 bg-red-50/50",
        error && !isDragActive && "border-red-400 bg-red-50/30",
        !isDragActive && !error && !disabled && "border-gray-300 hover:border-orange-400 hover:bg-gray-50/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />

      {/* Icon */}
      <div
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
          isDragActive && !isDragReject && "bg-orange-100 scale-110",
          isDragReject && "bg-red-100",
          error && !isDragActive && "bg-red-100",
          !isDragActive && !error && "bg-gray-100"
        )}
      >
        {isDragReject || error ? (
          <AlertCircle className="w-8 h-8 text-red-500" />
        ) : (
          <Upload
            className={cn(
              "w-8 h-8 transition-colors duration-300",
              isDragActive ? "text-orange-500" : "text-gray-400"
            )}
          />
        )}
      </div>

      {/* Text */}
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-gray-700">
          {isDragActive && !isDragReject
            ? "Drop your slip here"
            : isDragReject
            ? "File not supported"
            : "Drag & drop your slip here"}
        </p>
        <p className="text-sm text-gray-500">
          or <span className="text-orange-600 font-medium">click to browse</span>
        </p>
      </div>

      {/* File Info */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
        <FileImage className="w-4 h-4" />
        <span>JPG, PNG, WebP up to 10MB</span>
      </div>

      {/* Error Message */}
      {error && !isDragActive && (
        <p className="text-sm text-red-600 font-medium mt-2">{error}</p>
      )}
    </div>
  );
}
