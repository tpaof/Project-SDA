import { useState, useCallback, useEffect, useRef } from "react";
import { uploadService, type Slip, type UploadProgress } from "@/services/upload.service";

interface UseUploadReturn {
  // Upload state
  selectedFile: File | null;
  uploadProgress: UploadProgress | null;
  isUploading: boolean;
  uploadError: string | null;
  uploadedSlip: Slip | null;

  // Processing state
  processingStatus: Slip["status"] | null;
  processingError: string | null;

  // History
  uploadHistory: Slip[];
  isLoadingHistory: boolean;

  // Actions
  selectFile: (file: File) => void;
  clearFile: () => void;
  uploadFile: () => Promise<void>;
  cancelUpload: () => void;
  selectSlipFromHistory: (slip: Slip) => void;
  refreshHistory: () => Promise<void>;
  retryProcessing: () => void;
}

export function useUpload(): UseUploadReturn {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedSlip, setUploadedSlip] = useState<Slip | null>(null);
  const [processingStatus, setProcessingStatus] = useState<Slip["status"] | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [uploadHistory, setUploadHistory] = useState<Slip[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load upload history on mount
  useEffect(() => {
    refreshHistory();
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Poll for status updates when slip is processing
  useEffect(() => {
    if (!uploadedSlip) return;

    const pollStatus = async () => {
      try {
        const slip = await uploadService.getSlipStatus(uploadedSlip.id);
        setProcessingStatus(slip.status);
        setUploadedSlip(slip);

        if (slip.status === "completed" || slip.status === "failed") {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          if (slip.status === "failed") {
            setProcessingError("Processing failed. Please try again.");
          }
          refreshHistory();
        }
      } catch (error) {
        console.error("Error polling status:", error);
      }
    };

    // Poll immediately and then every 3 seconds
    pollStatus();
    if (uploadedSlip.status === "pending" || uploadedSlip.status === "processing") {
      pollingIntervalRef.current = setInterval(pollStatus, 3000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [uploadedSlip?.id]);

  const selectFile = useCallback((file: File) => {
    const error = uploadService.validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }
    setSelectedFile(file);
    setUploadError(null);
  }, []);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setUploadProgress(null);
    setUploadError(null);
  }, []);

  const uploadFile = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await uploadService.uploadSlip(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      setUploadedSlip(response.slip);
      setProcessingStatus(response.slip.status);
      setSelectedFile(null);
      refreshHistory();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setUploadError("Upload cancelled");
      } else {
        setUploadError(error instanceof Error ? error.message : "Upload failed");
      }
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  }, [selectedFile]);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const selectSlipFromHistory = useCallback((slip: Slip) => {
    setUploadedSlip(slip);
    setProcessingStatus(slip.status);
    setProcessingError(slip.status === "failed" ? "Processing failed" : null);
    setSelectedFile(null);
    setUploadProgress(null);
  }, []);

  const refreshHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const slips = await uploadService.getSlipHistory();
      setUploadHistory(slips);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const retryProcessing = useCallback(() => {
    setProcessingError(null);
    if (uploadedSlip) {
      // Re-trigger polling by setting the slip again
      setUploadedSlip({ ...uploadedSlip });
    }
  }, [uploadedSlip]);

  return {
    selectedFile,
    uploadProgress,
    isUploading,
    uploadError,
    uploadedSlip,
    processingStatus,
    processingError,
    uploadHistory,
    isLoadingHistory,
    selectFile,
    clearFile,
    uploadFile,
    cancelUpload,
    selectSlipFromHistory,
    refreshHistory,
    retryProcessing,
  };
}
