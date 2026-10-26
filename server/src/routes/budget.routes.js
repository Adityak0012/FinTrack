import { Router } from 'express';
import { body, param } from 'express-validator';
import { Budget } from '../models/Budget.js';
import { Transaction } from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { monthRange } from '../utils/dates.js';
import { EXPENSE_CATEGORIES } from '../utils/categories.js';

const router = Router();
router.use(protect);

/** GET /api/budgets?month=2026-10 -> each budget with how much was spent that month */
router.get('/', async (req, res) => {
  const { start, end, key } = monthRange(req.query.month);
  const [budgets, spent] = await Promise.all([
    Budget.find({ user: req.user._id }).lean(),
    Transaction.aggregate([
      { $match: { user: req.user._id, type: 'expense', date: { $gte: start, $lt: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]),
  ]);
  const spentBy = Object.fromEntries(spent.map((s) => [s._id, s.total]));
  const items = budgets
    .map((b) => ({ category: b.category, limit: b.limit, spent: spentBy[b.category] || 0 }))
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit);
  res.json({ month: key, items });
});

/** PUT /api/budgets/:category { limit } -> create or update */
router.put(
  '/:category',
  param('category').isIn(EXPENSE_CATEGORIES).withMessage('Choose an expense category'),
  body('limit').isFloat({ gt: 0, max: 1e9 }).withMessage('Enter a limit greater than 0').toFloat(),
  validate,
  async (req, res) => {
    const b = await Budget.findOneAndUpdate(
      { user: req.user._id, category: req.params.category },
      { limit: req.body.limit },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ category: b.category, limit: b.limit });
  }
);

router.delete('/:category', param('category').isIn(EXPENSE_CATEGORIES), validate, async (req, res) => {
  await Budget.deleteOne({ user: req.user._id, category: req.params.category });
  res.json({ message: 'Deleted' });
});

export default router;
