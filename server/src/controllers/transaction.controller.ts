import type { Request, Response } from 'express';
import { transactionService } from '../services/transaction.service.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFiltersSchema,
  summaryFiltersSchema,
} from '../types/transaction.types.js';
import { AppError } from '../utils/AppError.js';

export class TransactionController {
  // POST /api/transactions
  async create(req: Request, res: Response): Promise<void> {
    try {
      const validation = createTransactionSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.error.issues,
        });
        return;
      }

      const transaction = await transactionService.create(
        req.user!.userId,
        validation.data,
      );

      res.status(201).json({ data: transaction });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to create transaction';
      res.status(500).json({ error: message });
    }
  }

  // GET /api/transactions
  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const validation = transactionFiltersSchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.error.issues,
        });
        return;
      }

      const result = await transactionService.findAll(
        req.user!.userId,
        validation.data,
      );

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to fetch transactions';
      res.status(500).json({ error: message });
    }
  }

  // GET /api/transactions/summary
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const validation = summaryFiltersSchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.error.issues,
        });
        return;
      }

      const summary = await transactionService.getSummary(
        req.user!.userId,
        validation.data,
      );

      res.status(200).json({ data: summary });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to fetch summary';
      res.status(500).json({ error: message });
    }
  }

  // GET /api/transactions/:id
  async findById(req: Request, res: Response): Promise<void> {
    try {
      const transaction = await transactionService.findById(
        req.user!.userId,
        String(req.params.id),
      );

      res.status(200).json({ data: transaction });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to fetch transaction';
      res.status(500).json({ error: message });
    }
  }

  // PUT /api/transactions/:id
  async update(req: Request, res: Response): Promise<void> {
    try {
      const validation = updateTransactionSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.error.issues,
        });
        return;
      }

      const transaction = await transactionService.update(
        req.user!.userId,
        String(req.params.id),
        validation.data,
      );

      res.status(200).json({ data: transaction });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to update transaction';
      res.status(500).json({ error: message });
    }
  }

  // DELETE /api/transactions/:id
  async delete(req: Request, res: Response): Promise<void> {
    try {
      await transactionService.delete(req.user!.userId, String(req.params.id));

      res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to delete transaction';
      res.status(500).json({ error: message });
    }
  }
}

export const transactionController = new TransactionController();
