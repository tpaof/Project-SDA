import { z } from 'zod';

// --- Enums / constants -------------------------------------------------------

export const TransactionType = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const;

export type TransactionTypeValue =
  (typeof TransactionType)[keyof typeof TransactionType];

// Zod 4: tuple type for z.enum; use `error` instead of required_error/invalid_type_error
const transactionTypeEnum = z.enum(
  ['income', 'expense'] as const,
  {
    error: (issue) =>
      issue.input === undefined
        ? 'Type is required'
        : 'Type must be "income" or "expense"',
  }
);

// --- Zod schemas -------------------------------------------------------------

export const createTransactionSchema = z.object({
  type: transactionTypeEnum,
  amount: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? 'Amount is required'
          : 'Amount must be a number',
    })
    .positive('Amount must be a positive number'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .transform((v) => v.trim())
    .optional(),
  category: z
    .string()
    .max(100, 'Category must be at most 100 characters')
    .transform((v) => v.trim())
    .optional(),
  date: z
    .string({
      error: (issue) =>
        issue.input === undefined ? 'Date is required' : 'Invalid date format',
    })
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date format' })
    .transform((v) => new Date(v)),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionFiltersSchema = z.object({
  type: z.enum(['income', 'expense'] as const).optional(),
  category: z
    .string()
    .max(100)
    .transform((v) => v.trim())
    .optional(),
  startDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid startDate format' })
    .transform((v) => new Date(v))
    .optional(),
  endDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid endDate format' })
    .transform((v) => new Date(v))
    .optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const summaryFiltersSchema = z.object({
  startDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid startDate format' })
    .transform((v) => new Date(v))
    .optional(),
  endDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid endDate format' })
    .transform((v) => new Date(v))
    .optional(),
});

// --- Inferred types ----------------------------------------------------------

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
export type SummaryFilters = z.infer<typeof summaryFiltersSchema>;
