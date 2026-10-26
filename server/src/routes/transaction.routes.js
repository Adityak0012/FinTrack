import { Router } from 'express';
import { body, query, param } from 'express-validator';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { ApiError } from '../utils/ApiError.js';
import { monthRange } from '../utils/dates.js';
import { ALL_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/categories.js';

const router = Router();
router.use(protect);

const rules = [
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount').isFloat({ gt: 0, max: 1e9 }).withMessage('Enter an amount greater than 0').toFloat(),
  body('category').isIn(ALL_CATEGORIES).withMessage('Choose a category'),
  body('date').isISO8601().withMessage('Choose a valid date'),
  body('note').optional({ values: 'falsy' }).trim().isLength({ max: 120 }).withMessage('Note can be up to 120 characters'),
  body().custom((v) => {
    const ok = v.type === 'income' ? INCOME_CATEGORIES.includes(v.category) : EXPENSE_CATEGORIES.includes(v.category);
    if (!ok) throw new Error(`That category is not valid for ${v.type}`);
    return true;
  }),
];

const toDate = (s) => new Date(`${String(s).slice(0, 10)}T12:00:00.000Z`);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function buildFilter(req) {
  const { month, type, category, search } = req.query;
  const { start, end } = monthRange(month);
  const filter = { user: req.user._id, date: { $gte: start, $lt: end } };
  if (type === 'income' || type === 'expense') filter.type = type;
  if (category && ALL_CATEGORIES.includes(category)) filter.category = category;
  if (search) filter.note = { $regex: escapeRegex(String(search).slice(0, 40)), $options: 'i' };
  return filter;
}

/** GET /api/transactions?month=2026-10&type=&category=&search=&page=&limit= */
router.get(
  '/',
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  async (req, res) => {
    const filter = buildFilter(req);
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const [items, total, sums] = await Promise.all([
      Transaction.find(filter).sort({ date: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Transaction.countDocuments(filter),
      Transaction.aggregate([{ $match: filter }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]),
    ]);
    const totals = { income: 0, expense: 0 };
    for (const s of sums) totals[s._id] = s.total;
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)), totals });
  }
);

/** GET /api/transactions/export?month=2026-10 -> CSV download */
router.get('/export', async (req, res) => {
  const { key } = monthRange(req.query.month);
  const rows = await Transaction.find(buildFilter(req)).sort({ date: 1 }).lean();
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = ['Date,Type,Category,Amount,Note', ...rows.map((r) => [r.date.toISOString().slice(0, 10), r.type, r.category, r.amount, esc(r.note)].join(','))];
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="fintrack-${key}.csv"`);
  res.send(lines.join('\n'));
});

router.post('/', rules, validate, async (req, res) => {
  const { type, amount, category, date, note } = req.body;
  const tx = await Transaction.create({ user: req.user._id, type, amount, category, date: toDate(date), note: note || '' });
  res.status(201).json(tx);
});

const idRule = param('id').custom((v) => mongoose.isValidObjectId(v)).withMessage('Invalid id');

router.put('/:id', idRule, rules, validate, async (req, res) => {
  const { type, amount, category, date, note } = req.body;
  const tx = await Transaction.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { type, amount, category, date: toDate(date), note: note || '' },
    { new: true, runValidators: true }
  );
  if (!tx) throw new ApiError(404, 'Transaction not found');
  res.json(tx);
});

router.delete('/:id', idRule, validate, async (req, res) => {
  const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!tx) throw new ApiError(404, 'Transaction not found');
  res.json({ message: 'Deleted', transaction: tx });
});

export default router;
