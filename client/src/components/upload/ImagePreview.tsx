import { useState } from "react";
import { X, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
}

export function ImagePreview({ file, onRemove }: ImagePreviewProps) {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [imageUrl] = useState(() => URL.createObjectURL(file));

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
      {/* Toolbar */}
      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 z-10 flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="bg-white/90 backdrop-blur-sm shadow-sm h-8 w-8 p-0"
          >
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
          <span className="text-xs font-medium text-gray-600 bg-white/90 backdrop-blur-sm px-1.5 sm:px-2 py-1 rounded-md shadow-sm min-w-[36px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="bg-white/90 backdrop-blur-sm shadow-sm h-8 w-8 p-0"
          >
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRotate}
            className="bg-white/90 backdrop-blur-sm shadow-sm h-8 w-8 p-0"
          >
            <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onRemove}
            className="shadow-sm h-8 w-8 p-0"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>

      {/* Image Container */}
      <div className="relative h-[240px] sm:h-[320px] flex items-center justify-center overflow-hidden p-4 sm:p-8">
        <img
          src={imageUrl}
          alt="Preview"
          className={cn(
            "max-w-full max-h-full object-contain transition-transform duration-300 shadow-lg rounded-lg"
          )}
          style={{
            transform: `rotate(${rotation}deg) scale(${scale})`,
          }}
        />
      </div>

      {/* File Info */}
      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black/50 to-transparent">
        <p className="text-white text-xs sm:text-sm font-medium truncate">{file.name}</p>
        <p className="text-white/70 text-xs">
          {(file.size / (1024 * 1024)).toFixed(2)} MB
        </p>
      </div>
    </div>
  );
}
