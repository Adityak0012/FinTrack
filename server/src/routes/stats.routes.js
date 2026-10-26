import { Router } from 'express';
import { query } from 'express-validator';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { monthRange, shiftMonth, monthKey } from '../utils/dates.js';

const router = Router();
router.use(protect);

const totalsFor = async (user, start, end) => {
  const rows = await Transaction.aggregate([
    { $match: { user, date: { $gte: start, $lt: end } } },
    { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const out = { income: 0, expense: 0, count: 0 };
  for (const r of rows) { out[r._id] = r.total; out.count += r.count; }
  return out;
};

/**
 * GET /api/stats/overview?month=2026-10
 * Everything the dashboard needs in one call, computed with MongoDB aggregation.
 */
router.get('/overview', async (req, res) => {
  const user = req.user._id;
  const { start, end, key } = monthRange(req.query.month);
  const prevStart = shiftMonth(start, -1);

  const [cur, prev, byCategory, daily, biggest, budgets] = await Promise.all([
    totalsFor(user, start, end),
    totalsFor(user, prevStart, start),
    Transaction.aggregate([
      { $match: { user, type: 'expense', date: { $gte: start, $lt: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Transaction.find({ user, type: 'expense', date: { $gte: start, $lt: end } }).select('date amount').lean(),
    Transaction.find({ user, type: 'expense', date: { $gte: start, $lt: end } }).sort({ amount: -1 }).limit(3).lean(),
    Budget.find({ user }).lean(),
  ]);

  const daysInMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  const spentByDay = {};
  for (const t of daily) spentByDay[t.date.getUTCDate()] = (spentByDay[t.date.getUTCDate()] || 0) + t.amount;
  const dailySeries = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, expense: spentByDay[i + 1] || 0 }));

  const now = new Date();
  const isCurrent = monthKey(now) === key;
  const elapsed = isCurrent ? now.getUTCDate() : daysInMonth;
  const projected = isCurrent && elapsed > 0 ? Math.round((cur.expense / elapsed) * daysInMonth) : cur.expense;

  const spentBy = Object.fromEntries(byCategory.map((c) => [c._id, c.total]));
  const overBudget = budgets
    .map((b) => ({ category: b.category, limit: b.limit, spent: spentBy[b.category] || 0 }))
    .filter((b) => b.spent >= b.limit * 0.8)
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit);

  res.json({
    month: key,
    income: cur.income,
    expense: cur.expense,
    balance: cur.income - cur.expense,
    savingsRate: cur.income > 0 ? Math.round(((cur.income - cur.expense) / cur.income) * 100) : 0,
    transactionCount: cur.count,
    previous: { income: prev.income, expense: prev.expense },
    projectedExpense: projected,
    byCategory: byCategory.map((c) => ({ category: c._id, total: c.total, count: c.count })),
    daily: dailySeries,
    biggest,
    budgetAlerts: overBudget,
  });
});

/** GET /api/stats/monthly?months=6 -> income and expense for each of the last N months */
router.get('/monthly', query('months').optional().isInt({ min: 2, max: 24 }).toInt(), validate, async (req, res) => {
  const n = req.query.months || 6;
  const { start } = monthRange(req.query.month);
  const first = shiftMonth(start, -(n - 1));
  // One grouped query per month keeps this simple and works on any MongoDB-compatible server
  const items = await Promise.all(
    Array.from({ length: n }, async (_, i) => {
      const from = shiftMonth(first, i);
      const t = await totalsFor(req.user._id, from, shiftMonth(from, 1));
      return { month: monthKey(from), income: t.income, expense: t.expense };
    })
  );
  res.json({ items });
});

export default router;
