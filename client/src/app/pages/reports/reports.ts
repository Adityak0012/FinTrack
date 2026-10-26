import { Component, computed, effect, inject, signal } from '@angular/core';
import { cat } from '../../core/categories';
import { compact, money, monthLong, monthShort } from '../../core/format';
import { MonthPoint, Overview } from '../../core/models';
import { FinService } from '../../core/services/fin.service';
import { MonthService } from '../../core/services/month.service';
import { ToastService } from '../../core/services/toast.service';
import { Bar } from '../../shared/bar';
import { Bars } from '../../shared/bars';
import { Reveal } from '../../shared/reveal';

@Component({
  selector: 'ft-reports',
  imports: [Bar, Bars, Reveal],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports {
  private fin = inject(FinService);
  private toast = inject(ToastService);
  readonly months = inject(MonthService);
  readonly money = money;
  readonly compact = compact;
  readonly cat = cat;
  readonly monthShort = monthShort;
  readonly monthLong = monthLong;

  readonly trend = signal<MonthPoint[] | null>(null);
  readonly overview = signal<Overview | null>(null);
  readonly failed = signal(false);
  readonly exporting = signal(false);

  readonly rows = computed(() => [...(this.trend() ?? [])].reverse().map((m) => ({ ...m, net: m.income - m.expense, rate: m.income ? Math.round(((m.income - m.expense) / m.income) * 100) : 0 })));
  readonly totals = computed(() => {
    const t = this.trend() ?? [];
    const income = t.reduce((a, m) => a + m.income, 0), expense = t.reduce((a, m) => a + m.expense, 0);
    return { income, expense, net: income - expense, avg: t.length ? Math.round(expense / t.length) : 0 };
  });
  readonly topMax = computed(() => Math.max(1, ...(this.overview()?.byCategory ?? []).map((c) => c.total)));

  constructor() {
    effect(() => {
      const m = this.months.month();
      this.months.version();
      this.failed.set(false);
      this.fin.monthly(m, 12).subscribe({ next: (r) => this.trend.set(r.items), error: () => this.failed.set(true) });
      this.fin.overview(m).subscribe({ next: (o) => this.overview.set(o) });
    });
  }

  async export(): Promise<void> {
    this.exporting.set(true);
    try { await this.fin.exportCsv(this.months.month()); this.toast.success('CSV downloaded'); } catch { this.toast.error('Could not export. Try again.'); }
    this.exporting.set(false);
  }
}
