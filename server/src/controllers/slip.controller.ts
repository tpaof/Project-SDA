import type { Request, Response } from 'express';
import multer from 'multer';
import { slipService } from '../services/slip.service.js';
import { AppError } from '../utils/AppError.js';
import { SlipStatus } from '../types/slip.types.js';
import type { SlipStatusValue } from '../types/slip.types.js';

export class SlipController {
  // POST /api/slips/upload
  async upload(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const slip = await slipService.upload(req.user!.userId, req.file);

      res.status(201).json({ data: slip });
    } catch (error) {
      if (error instanceof multer.MulterError) {
        const messages: Record<string, string> = {
          LIMIT_FILE_SIZE: 'File size exceeds the 10MB limit',
          LIMIT_UNEXPECTED_FILE: 'Only jpg, png, and webp images are allowed',
        };
        res.status(400).json({
          error: messages[error.code] || `Upload error: ${error.message}`,
        });
        return;
      }
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Failed to upload slip';
      res.status(500).json({ error: message });
    }
  }

  // GET /api/slips/:id
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const slip = await slipService.getStatus(
        req.user!.userId,
        req.params.id as string,
      );
      res.status(200).json({ data: slip });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Failed to get slip status';
      res.status(500).json({ error: message });
    }
  }

  // GET /api/slips/:id/result
  async getResult(req: Request, res: Response): Promise<void> {
    try {
      const result = await slipService.getResult(
        req.user!.userId,
        req.params.id as string,
      );
      res.status(200).json({ data: result });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Failed to get slip result';
      res.status(500).json({ error: message });
    }
  }

  // POST /api/slips/callback
  async handleOcrCallback(req: Request, res: Response): Promise<void> {
    try {
      // notify.py sends: { slipId, status, data }
      const { slipId, status, data } = req.body;

      if (!slipId || !status) {
        res.status(400).json({ error: 'Missing slipId or status' });
        return;
      }

      console.log(`[OCR Callback] Received for slip ${slipId}: ${status}`);

      // Map worker status to SlipStatus
      // Worker sends: "success" or "failed"
      // Backend expects: "completed" or "failed"
      let slipStatus: SlipStatusValue = SlipStatus.FAILED;
      if (status === 'success') {
        slipStatus = SlipStatus.COMPLETED;
      }

      await slipService.updateStatus(slipId, slipStatus, data);

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('[OCR Callback Error]', error);
      res.status(500).json({ error: 'Internal callback error' });
    }
  }

  // GET /api/slips
  async list(req: Request, res: Response): Promise<void> {
    try {
      const slips = await slipService.listByUser(req.user!.userId);
      res.status(200).json({ data: slips });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Failed to list slips';
      res.status(500).json({ error: message });
    }
  }
}

export const slipController = new SlipController();
