export const SlipStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type SlipStatusValue = (typeof SlipStatus)[keyof typeof SlipStatus];

export interface OcrJobMessage {
  job_id: string; // Matches Python worker
  image_path: string; // Absolute path
  callback_url: string; // Where to POST results
  // Metadata for backend reference (optional, worker preserves unknown keys)
  slipId: string;
  userId: string;
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
