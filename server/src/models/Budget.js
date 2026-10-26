import mongoose from 'mongoose';
import { EXPENSE_CATEGORIES } from '../utils/categories.js';

// One monthly limit per category per person; it repeats every month.
const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
    limit: { type: Number, required: true, min: 1, max: 1e9 },
  },
  { timestamps: true }
);
budgetSchema.index({ user: 1, category: 1 }, { unique: true });

export const Budget = mongoose.model('Budget', budgetSchema);
