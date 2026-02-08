import api from "./api";

export type SlipStatus = "pending" | "processing" | "completed" | "failed";

export type Slip = {
  id: string;
  filename: string;
  originalName: string;
  status: SlipStatus;
  ocrResult: OcrResult | null;
  userId: string;
  createdAt: string;
  processedAt: string | null;
};

export type OcrResult = {
  amount?: number;
  date?: string;
  description?: string;
  bankName?: string;
  recipientName?: string;
  senderName?: string;
  transactionId?: string;
  confidence?: number;
  rawText?: string;
};

export type UploadProgress = {
  loaded: number;
  total: number;
  percentage: number;
};

export type UploadResponse = {
  slip: Slip;
  message: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const uploadService = {
  validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only JPG, PNG, and WebP images are allowed";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 10MB";
    }
    return null;
  },

  async uploadSlip(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("slip", file);

    const response = await api.post<UploadResponse>("/slips/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const loaded = progressEvent.loaded;
          const total = progressEvent.total;
          const percentage = Math.round((loaded * 100) / total);
          onProgress({ loaded, total, percentage });
        }
      },
    });
    return response.data;
  },

  async getSlipStatus(slipId: string): Promise<Slip> {
    const response = await api.get<Slip>(`/slips/${slipId}`);
    return response.data;
  },

  async getSlipResult(slipId: string): Promise<{ ocrResult: OcrResult }> {
    const response = await api.get<{ ocrResult: OcrResult }>(`/slips/${slipId}/result`);
    return response.data;
  },

  async getSlipHistory(): Promise<Slip[]> {
    const response = await api.get<Slip[]>("/slips");
    return response.data;
  },
};

export { uploadService };
export default uploadService;
