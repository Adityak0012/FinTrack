import { TxType } from './models';

export interface Category { key: string; label: string; icon: string; color: string; type: TxType; }

export const CATEGORIES: Category[] = [
  { key: 'food', label: 'Food & dining', icon: 'bi-cup-hot', color: '#17171a', type: 'expense' },
  { key: 'housing', label: 'Housing', icon: 'bi-house-door', color: '#9b82ff', type: 'expense' },
  { key: 'transport', label: 'Transport', icon: 'bi-bus-front', color: '#7aa7c7', type: 'expense' },
  { key: 'shopping', label: 'Shopping', icon: 'bi-bag', color: '#d08a6e', type: 'expense' },
  { key: 'bills', label: 'Bills & utilities', icon: 'bi-lightning-charge', color: '#6faf98', type: 'expense' },
  { key: 'health', label: 'Health', icon: 'bi-heart-pulse', color: '#cf8fa3', type: 'expense' },
  { key: 'fun', label: 'Entertainment', icon: 'bi-film', color: '#c9a24a', type: 'expense' },
  { key: 'travel', label: 'Travel', icon: 'bi-airplane', color: '#a9c4d8', type: 'expense' },
  { key: 'education', label: 'Education', icon: 'bi-mortarboard', color: '#6d7380', type: 'expense' },
  { key: 'other', label: 'Other', icon: 'bi-three-dots', color: '#b0b0ab', type: 'expense' },
  { key: 'salary', label: 'Salary', icon: 'bi-briefcase', color: '#6faf98', type: 'income' },
  { key: 'freelance', label: 'Freelance', icon: 'bi-laptop', color: '#4d9c85', type: 'income' },
  { key: 'investments', label: 'Investments', icon: 'bi-graph-up-arrow', color: '#2f7f5e', type: 'income' },
  { key: 'gift', label: 'Gift', icon: 'bi-gift', color: '#86c4a8', type: 'income' },
  { key: 'refund', label: 'Refund', icon: 'bi-arrow-counterclockwise', color: '#a9d6c3', type: 'income' },
];

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));
export const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => c.type === 'expense');
export const INCOME_CATEGORIES = CATEGORIES.filter((c) => c.type === 'income');
export const cat = (key: string): Category => CATEGORY_MAP[key] ?? CATEGORY_MAP['other'];
