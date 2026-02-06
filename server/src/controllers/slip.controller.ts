import type { Request, Response } from 'express';
import multer from 'multer';
import { slipService } from '../services/slip.service.js';
import { AppError } from '../utils/AppError.js';

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
        req.params.id,
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
        req.params.id,
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
