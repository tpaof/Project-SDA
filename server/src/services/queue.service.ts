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
    const job: OcrJobMessage = {
      jobId: uuidv4(),
      slipId,
      userId,
      filePath,
      timestamp: new Date().toISOString(),
    };

    await redis.publish(OCR_JOBS_CHANNEL, JSON.stringify(job));

    return job;
  }
}

export const queueService = new QueueService();
