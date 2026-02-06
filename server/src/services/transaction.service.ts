import prisma from '../lib/db.js';
import { AppError } from '../utils/AppError.js';
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
  SummaryFilters,
} from '../types/transaction.types.js';
import type { Prisma } from '@prisma/client';

export class TransactionService {
  /**
   * Build a Prisma `where` clause scoped to the user, with optional filters.
   */
  private buildWhere(
    userId: string,
    filters: Partial<TransactionFilters> = {},
  ): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = { userId };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.category) {
      where.category = { equals: filters.category, mode: 'insensitive' };
    }

    if (filters.startDate || filters.endDate) {
      where.date = {
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {}),
      };
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.amount = {
        ...(filters.minAmount !== undefined ? { gte: filters.minAmount } : {}),
        ...(filters.maxAmount !== undefined ? { lte: filters.maxAmount } : {}),
      };
    }

    return where;
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async create(userId: string, data: CreateTransactionInput) {
    return prisma.transaction.create({
      data: {
        type: data.type,
        amount: data.amount,
        description: data.description ?? null,
        category: data.category ?? null,
        date: data.date,
        userId,
      },
    });
  }

  async findAll(userId: string, filters: TransactionFilters) {
    const where = this.buildWhere(userId, filters);
    const skip = (filters.page - 1) * filters.limit;
    const take = filters.limit;

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async findById(userId: string, id: string) {
    const transaction = await prisma.transaction.findUnique({ where: { id } });

    if (!transaction) {
      throw new AppError(404, 'Transaction not found');
    }

    if (transaction.userId !== userId) {
      throw new AppError(403, 'You do not have permission to access this transaction');
    }

    return transaction;
  }

  async update(userId: string, id: string, data: UpdateTransactionInput) {
    // Ownership check
    const existing = await this.findById(userId, id);

    return prisma.transaction.update({
      where: { id: existing.id },
      data: {
        ...(data.type !== undefined && { type: data.type }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.description !== undefined && { description: data.description ?? null }),
        ...(data.category !== undefined && { category: data.category ?? null }),
        ...(data.date !== undefined && { date: data.date }),
      },
    });
  }

  async delete(userId: string, id: string) {
    // Ownership check
    const existing = await this.findById(userId, id);

    await prisma.transaction.delete({ where: { id: existing.id } });
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------

  async getSummary(userId: string, dateRange: SummaryFilters) {
    const where = this.buildWhere(userId, dateRange);

    const [incomeAgg, expenseAgg, count] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: 'income' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: 'expense' },
        _sum: { amount: true },
      }),
      prisma.transaction.count({ where }),
    ]);

    const totalIncome = incomeAgg._sum.amount ?? 0;
    const totalExpense = expenseAgg._sum.amount ?? 0;

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: count,
    };
  }
}

export const transactionService = new TransactionService();
