import { v4 as uuidv4 } from 'uuid';
import redis from '../lib/redis.js';
import { OCR_JOBS_CHANNEL } from '../types/slip.types.js';
import type { OcrJobMessage } from '../types/slip.types.js';

export class QueueService {
  /**
   * Publish an OCR processing job to the Redis Pub/Sub channel.
   */
  async publishOcrJob(
    slipId: string,
    userId: string,
    filePath: string,
  ): Promise<OcrJobMessage> {
    const port = process.env.PORT || 3000;
    const baseUrl = process.env.API_EXTERNAL_URL || `http://localhost:${port}`;
    const callbackUrl = `${baseUrl}/api/slips/callback`;
    // Ensure absolute path if not already
    const absolutePath = filePath.startsWith('/') ? filePath : `${process.cwd()}/${filePath}`;

    const job: OcrJobMessage = {
      job_id: slipId, // Use slipId as job_id for easy tracking
      image_path: absolutePath,
      callback_url: callbackUrl,
      slipId,
      userId,
    };

    await redis.publish(OCR_JOBS_CHANNEL, JSON.stringify(job));

    return job;
  }
}

export const queueService = new QueueService();
