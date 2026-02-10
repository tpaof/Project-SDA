import prisma from '../lib/db.js';
import { AppError } from '../utils/AppError.js';
import { queueService } from './queue.service.js';
import { SlipStatus } from '../types/slip.types.js';
import type { SlipStatusValue, SlipResponse } from '../types/slip.types.js';
import express from 'express'; // Import Express to declare the variable

const Express = express; // Declare the Express variable

export class SlipService {
  /**
   * Upload a slip image: persist the record as "pending" and publish an OCR job.
   */
  async upload(
    userId: string,
    file: Express.Multer.File,
  ): Promise<SlipResponse> {
    const slip = await prisma.slip.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        status: SlipStatus.PENDING,
        userId,
      },
    });

    // Publish an OCR job to Redis
    await queueService.publishOcrJob(slip.id, userId, file.path);

    return this.toResponse(slip);
  }

  /**
   * Get the processing status of a single slip.
   */
  async getStatus(userId: string, slipId: string): Promise<SlipResponse> {
    const slip = await prisma.slip.findUnique({ where: { id: slipId } });

    if (!slip) {
      throw new AppError(404, 'Slip not found');
    }
    if (slip.userId !== userId) {
      throw new AppError(403, 'You do not have permission to access this slip');
    }

    return this.toResponse(slip);
  }

  /**
   * Get the OCR result for a completed slip.
   */
  async getResult(userId: string, slipId: string): Promise<{ ocrResult: unknown }> {
    const slip = await prisma.slip.findUnique({ where: { id: slipId } });

    if (!slip) {
      throw new AppError(404, 'Slip not found');
    }
    if (slip.userId !== userId) {
      throw new AppError(403, 'You do not have permission to access this slip');
    }
    if (slip.status !== SlipStatus.COMPLETED) {
      throw new AppError(400, `Slip is not yet completed. Current status: ${slip.status}`);
    }

    return { ocrResult: slip.ocrResult };
  }

  /**
   * List all slips for a user, ordered newest-first.
   */
  async listByUser(userId: string): Promise<SlipResponse[]> {
    const slips = await prisma.slip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return slips.map((s) => this.toResponse(s));
  }

  /**
   * Re-queue a pending/stale slip for OCR processing.
   * Used when the original Pub/Sub job was lost (e.g. after a restart).
   */
  async requeuePending(userId: string, slipId: string): Promise<SlipResponse> {
    const slip = await prisma.slip.findUnique({ where: { id: slipId } });

    if (!slip) {
      throw new AppError(404, 'Slip not found');
    }
    if (slip.userId !== userId) {
      throw new AppError(403, 'You do not have permission to access this slip');
    }
    if (slip.status !== SlipStatus.PENDING && slip.status !== SlipStatus.FAILED) {
      throw new AppError(400, `Slip cannot be re-queued (status: ${slip.status})`);
    }

    // Reset to pending
    const updated = await prisma.slip.update({
      where: { id: slipId },
      data: { status: SlipStatus.PENDING, processedAt: null, ocrResult: undefined },
    });

    // Re-publish OCR job  
    const filePath = `uploads/${slip.filename}`;
    await queueService.publishOcrJob(slip.id, userId, filePath);

    console.log(`[Slip] Re-queued slip ${slipId} for OCR processing`);

    return this.toResponse(updated);
  }

  /**
   * Update slip status (called by the OCR worker / test script).
   */
  async updateStatus(
    slipId: string,
    status: SlipStatusValue,
    ocrResult?: unknown,
  ): Promise<SlipResponse> {
    const slip = await prisma.slip.findUnique({ where: { id: slipId } });

    if (!slip) {
      throw new AppError(404, 'Slip not found');
    }

    const data: Record<string, unknown> = { status };

    if (status === SlipStatus.COMPLETED || status === SlipStatus.FAILED) {
      data.processedAt = new Date();
    }
    if (ocrResult !== undefined) {
      data.ocrResult = ocrResult;
    }

    const updated = await prisma.slip.update({
      where: { id: slipId },
      data,
    });

    return this.toResponse(updated);
  }

  // ---- helpers ----

  private toResponse(slip: {
    id: string;
    filename: string;
    originalName: string;
    status: string;
    ocrResult: unknown;
    userId: string;
    createdAt: Date;
    processedAt: Date | null;
  }): SlipResponse {
    return {
      id: slip.id,
      filename: slip.filename,
      originalName: slip.originalName,
      status: slip.status as SlipStatusValue,
      ocrResult: slip.ocrResult,
      userId: slip.userId,
      createdAt: slip.createdAt,
      processedAt: slip.processedAt,
    };
  }
}

export const slipService = new SlipService();
