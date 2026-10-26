import { fileURLToPath } from 'node:url';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';

export const DEMO = { name: 'Aditya Kale', email: 'demo@fintrack.dev', password: 'Demo@123' };

// Small deterministic random generator, so the demo data looks the same on every machine
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FOOD = ['Lunch at the canteen', 'Swiggy order', 'Groceries', 'Chai and snacks', 'Dinner with friends', 'Zomato order', 'Vegetables and fruit', 'Breakfast cafe'];
const TRANSPORT = ['Metro recharge', 'Uber to office', 'Petrol', 'Auto fare', 'Bus pass'];
const SHOPPING = ['T-shirts', 'Headphones', 'Amazon order', 'Shoes', 'Home decor', 'Backpack'];
const FUN = ['Movie tickets', 'Netflix', 'Spotify', 'Gaming top-up', 'Concert pass'];
const HEALTH = ['Pharmacy', 'Doctor visit', 'Gym membership', 'Dental check-up'];
const TRAVEL = ['Train tickets', 'Weekend trip stay', 'Flight to Goa'];

export async function seedDemo() {
  await Promise.all([User.deleteMany({ email: DEMO.email })]);
  const user = await User.create(DEMO);
  await Promise.all([Transaction.deleteMany({ user: user._id }), Budget.deleteMany({ user: user._id })]);

  const rand = rng(2026);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const between = (a, b) => Math.round(a + rand() * (b - a));
  const now = new Date();
  const rows = [];
  const add = (y, m, d, type, category, amount, note) => {
    const date = new Date(Date.UTC(y, m, d, 12));
    if (date > now) return; // never in the future
    rows.push({ user: user._id, type, category, amount, date, note });
  };

  for (let back = 6; back >= 0; back--) {
    const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    const y = first.getUTCFullYear();
    const m = first.getUTCMonth();
    const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

    add(y, m, 1, 'income', 'salary', 85000, 'Monthly salary');
    if (rand() > 0.45) add(y, m, between(8, 24), 'income', 'freelance', between(6000, 18000), 'Freelance project');
    if (rand() > 0.7) add(y, m, between(10, 25), 'income', 'investments', between(1200, 4200), 'Dividend payout');
    if (rand() > 0.85) add(y, m, between(5, 20), 'income', 'gift', between(1000, 3000), 'Birthday gift');

    add(y, m, 3, 'expense', 'housing', 22000, 'Rent');
    add(y, m, 5, 'expense', 'bills', between(1400, 2600), 'Electricity bill');
    add(y, m, 6, 'expense', 'bills', 799, 'Broadband');
    add(y, m, 7, 'expense', 'bills', 399, 'Mobile recharge');
    add(y, m, 9, 'expense', 'fun', 649, 'Netflix and Spotify');

    for (let d = 1; d <= days; d++) {
      if (rand() > 0.22) add(y, m, d, 'expense', 'food', between(90, 620), pick(FOOD));
      if (rand() > 0.62) add(y, m, d, 'expense', 'food', between(120, 480), pick(FOOD));
      if (rand() > 0.55) add(y, m, d, 'expense', 'transport', between(40, 420), pick(TRANSPORT));
      if (rand() > 0.93) add(y, m, d, 'expense', 'shopping', between(700, 4800), pick(SHOPPING));
      if (rand() > 0.94) add(y, m, d, 'expense', 'fun', between(250, 1400), pick(FUN));
      if (rand() > 0.97) add(y, m, d, 'expense', 'health', between(300, 2200), pick(HEALTH));
      if (rand() > 0.985) add(y, m, d, 'expense', 'travel', between(1800, 7800), pick(TRAVEL));
    }
    if (back % 3 === 1) add(y, m, 18, 'expense', 'education', 4999, 'Online course');
  }
  await Transaction.insertMany(rows);

  const budgets = { food: 9000, housing: 22000, transport: 3500, shopping: 6000, bills: 5000, fun: 3000, health: 2500, travel: 8000 };
  await Budget.insertMany(Object.entries(budgets).map(([category, limit]) => ({ user: user._id, category, limit })));

  console.log(`[seed] demo account ready with ${rows.length} transactions and ${Object.keys(budgets).length} budgets`);
  console.log(`[seed] login: ${DEMO.email} / ${DEMO.password}`);
}

// Allow "npm run seed" to run this file directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { connectDB, disconnectDB } = await import('../config/db.js');
  await connectDB();
  await seedDemo();
  await disconnectDB();
}
