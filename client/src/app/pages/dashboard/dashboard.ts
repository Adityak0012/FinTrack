import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { cat } from '../../core/categories';
import { dayLabel, money, monthLong, shiftMonthKey } from '../../core/format';
import { MonthPoint, Overview } from '../../core/models';
import { DrawerService } from '../../core/services/drawer.service';
import { FinService } from '../../core/services/fin.service';
import { MonthService } from '../../core/services/month.service';
import { Amount } from '../../shared/amount';
import { Bar } from '../../shared/bar';
import { Bars } from '../../shared/bars';
import { Donut } from '../../shared/donut';
import { Reveal } from '../../shared/reveal';
import { Spark } from '../../shared/spark';

@Component({
  selector: 'ft-dashboard',
  imports: [RouterLink, Amount, Bar, Bars, Donut, Reveal, Spark],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private fin = inject(FinService);
  private drawer = inject(DrawerService);
  readonly months = inject(MonthService);
  readonly money = money;
  readonly cat = cat;
  readonly dayLabel = dayLabel;

  readonly data = signal<Overview | null>(null);
  readonly trend = signal<MonthPoint[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);

  readonly slices = computed(() => (this.data()?.byCategory ?? []).map((c) => ({ key: c.category, label: cat(c.category).label, value: c.total, color: cat(c.category).color })));
  readonly spark = computed(() => {
    let run = 0;
    const d = this.data()?.daily ?? [];
    return d.length ? d.map((x) => (run += x.expense)) : [0, 0];
  });
  readonly empty = computed(() => !!this.data() && this.data()!.income === 0 && this.data()!.expense === 0);
  readonly vsLast = computed(() => {
    const d = this.data();
    if (!d || !d.previous.expense) return null;
    return Math.round(((d.expense - d.previous.expense) / d.previous.expense) * 100);
  });
  readonly insights = computed(() => {
    const d = this.data();
    if (!d || this.empty()) return [];
    const out: { icon: string; text: string; tone: string }[] = [];
    const top = d.byCategory[0];
    if (top && d.expense) out.push({ icon: cat(top.category).icon, tone: 'blue', text: `${cat(top.category).label} is your biggest category at ${Math.round((top.total / d.expense) * 100)}% of spending.` });
    const v = this.vsLast();
    if (v !== null) out.push({ icon: v <= 0 ? 'bi-arrow-down-right' : 'bi-arrow-up-right', tone: v <= 0 ? 'good' : 'bad', text: `You spent ${Math.abs(v)}% ${v <= 0 ? 'less' : 'more'} than in ${monthLong(shiftMonthKey(d.month, -1))}.` });
    if (d.projectedExpense > d.expense && this.months.isCurrent()) out.push({ icon: 'bi-calendar2-range', tone: 'blue', text: `At this pace you will spend about ${money(d.projectedExpense)} by month end.` });
    if (d.income > 0) out.push({ icon: 'bi-piggy-bank', tone: d.savingsRate >= 20 ? 'good' : 'warn', text: d.savingsRate >= 0 ? `You are keeping ${d.savingsRate}% of your income.` : `You spent more than you earned this month.` });
    return out.slice(0, 3);
  });

  constructor() {
    effect(() => {
      const m = this.months.month();
      this.months.version();
      this.loading.set(untracked(() => this.data() === null));
      this.failed.set(false);
      this.fin.overview(m).subscribe({ next: (d) => { this.data.set(d); this.loading.set(false); }, error: () => { this.failed.set(true); this.loading.set(false); } });
      this.fin.monthly(m, 6).subscribe({ next: (r) => this.trend.set(r.items) });
    });
  }

  /** Tilts the balance card toward the pointer, like a physical card. */
  tilt(e: PointerEvent): void {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(hover: none)').matches) return;
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', `${(x - 0.5) * 9}deg`);
    el.style.setProperty('--rx', `${(0.5 - y) * 7}deg`);
    el.style.setProperty('--gx', `${x * 100}%`);
    el.style.setProperty('--gy', `${y * 100}%`);
  }
  untilt(e: PointerEvent): void { const el = e.currentTarget as HTMLElement; ['--rx', '--ry'].forEach((p) => el.style.removeProperty(p)); }

  add(): void { this.drawer.add(); }
  pct(b: { spent: number; limit: number }): number { return Math.min(100, Math.round((b.spent / b.limit) * 100)); }
  tone(b: { spent: number; limit: number }): string { return b.spent >= b.limit ? 'var(--expense)' : 'var(--amber)'; }
}
