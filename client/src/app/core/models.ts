export interface User { id: string; name: string; email: string; }
export interface AuthResponse { token: string; user: User; }
export type TxType = 'income' | 'expense';

export interface Tx {
  _id: string;
  type: TxType;
  amount: number;
  category: string;
  date: string;
  note: string;
}
export interface TxInput { type: TxType; amount: number; category: string; date: string; note: string; }
export interface TxPage { items: Tx[]; total: number; page: number; pages: number; totals: { income: number; expense: number }; }

export interface CategoryTotal { category: string; total: number; count: number; }
export interface BudgetRow { category: string; limit: number; spent: number; }
export interface Overview {
  month: string;
  income: number;
  expense: number;
  balance: number;
  savingsRate: number;
  previous: { income: number; expense: number };
  projectedExpense: number;
  byCategory: CategoryTotal[];
  daily: { day: number; expense: number }[];
  biggest: Tx[];
  budgetAlerts: BudgetRow[];
}
export interface MonthPoint { month: string; income: number; expense: number; }

export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as { status?: number; error?: { message?: string } };
  if (e?.status === 0) return 'Cannot reach the server. Is the API running on port 5000?';
  return e?.error?.message || fallback;
}
