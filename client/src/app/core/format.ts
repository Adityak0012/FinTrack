const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function money(n: number, decimals = false): string {
  return (decimals && n % 1 !== 0 ? inr2 : inr).format(n);
}

/** ₹1.2L, ₹45k and so on, for chart axes. */
export function compact(n: number): string {
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (a >= 1e7) return `${sign}₹${trim(a / 1e7)}Cr`;
  if (a >= 1e5) return `${sign}₹${trim(a / 1e5)}L`;
  if (a >= 1e3) return `${sign}₹${trim(a / 1e3)}k`;
  return `${sign}₹${Math.round(a)}`;
}
const trim = (n: number) => (n >= 10 ? Math.round(n) : Math.round(n * 10) / 10).toString();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const monthShort = (key: string) => MONTHS[Number(key.slice(5, 7)) - 1];
export const monthLong = (key: string) => `${LONG[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
export function shiftMonthKey(key: string, delta: number): string {
  const d = new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/** "2026-10-12T12:00:00.000Z" -> "12 Oct" */
export function dayLabel(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
}
export function dayHeading(iso: string): string {
  const today = todayIso();
  const d = iso.slice(0, 10);
  const y = new Date(); y.setDate(y.getDate() - 1);
  const yest = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
  if (d === today) return 'Today';
  if (d === yest) return 'Yesterday';
  const wd = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(`${d}T12:00:00Z`).getUTCDay()];
  return `${wd}, ${dayLabel(iso)}`;
}
