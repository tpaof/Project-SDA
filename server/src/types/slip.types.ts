export const SlipStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type SlipStatusValue = (typeof SlipStatus)[keyof typeof SlipStatus];

export interface OcrJobMessage {
  jobId: string;
  slipId: string;
  userId: string;
  filePath: string;
  timestamp: string;
}

export interface SlipResponse {
  id: string;
  filename: string;
  originalName: string;
  status: SlipStatusValue;
  ocrResult: unknown;
  userId: string;
  createdAt: Date;
  processedAt: Date | null;
}

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const OCR_JOBS_CHANNEL = 'ocr:jobs';
