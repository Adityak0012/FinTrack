import mongoose from 'mongoose';
import { ALL_CATEGORIES } from '../utils/categories.js';

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0.01, max: 1e9 },
    category: { type: String, enum: ALL_CATEGORIES, required: true },
    date: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 120, default: '' },
  },
  { timestamps: true }
);

// Month views and sorting by date for one person
transactionSchema.index({ user: 1, date: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
