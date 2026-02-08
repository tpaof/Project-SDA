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
  type?: "income" | "expense";
  category?: string;
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

    const response = await api.post<{ data: Slip }>("/slips/upload", formData, {
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
    
    // Adapter: map backend response { data: Slip } to frontend expectation { slip: Slip, message: string }
    return {
      slip: response.data.data,
      message: "Upload successful"
    };
  },

  async getSlipStatus(slipId: string): Promise<Slip> {
    const response = await api.get<{ data: Slip }>(`/slips/${slipId}`);
    return response.data.data;
  },

  async getSlipResult(slipId: string): Promise<{ ocrResult: OcrResult }> {
    const response = await api.get<{ data: { ocrResult: OcrResult } }>(`/slips/${slipId}/result`);
    return response.data.data;
  },

  async getSlipHistory(): Promise<Slip[]> {
    const response = await api.get<{ data: Slip[] }>("/slips");
    return response.data.data;
  },
};

export { uploadService };
export default uploadService;
