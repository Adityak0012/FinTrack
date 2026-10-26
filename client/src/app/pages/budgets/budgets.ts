import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EXPENSE_CATEGORIES, cat } from '../../core/categories';
import { money } from '../../core/format';
import { BudgetRow, errorMessage } from '../../core/models';
import { FinService } from '../../core/services/fin.service';
import { MonthService } from '../../core/services/month.service';
import { ToastService } from '../../core/services/toast.service';
import { Amount } from '../../shared/amount';
import { Bar } from '../../shared/bar';
import { Reveal } from '../../shared/reveal';

@Component({
  selector: 'ft-budgets',
  imports: [FormsModule, Amount, Bar, Reveal],
  templateUrl: './budgets.html',
  styleUrl: './budgets.scss',
})
export class Budgets {
  private fin = inject(FinService);
  private toast = inject(ToastService);
  readonly months = inject(MonthService);
  readonly money = money;
  readonly cat = cat;

  readonly items = signal<BudgetRow[] | null>(null);
  readonly failed = signal(false);
  readonly editing = signal<string | null>(null);
  readonly draft = signal(0);
  readonly adding = signal(false);
  readonly newCat = signal('');
  readonly newLimit = signal(0);

  readonly totalLimit = computed(() => (this.items() ?? []).reduce((a, b) => a + b.limit, 0));
  readonly totalSpent = computed(() => (this.items() ?? []).reduce((a, b) => a + b.spent, 0));
  readonly overall = computed(() => (this.totalLimit() ? Math.min(100, Math.round((this.totalSpent() / this.totalLimit()) * 100)) : 0));
  readonly available = computed(() => EXPENSE_CATEGORIES.filter((c) => !(this.items() ?? []).some((b) => b.category === c.key)));
  readonly sorted = computed(() => [...(this.items() ?? [])].sort((a, b) => b.spent / b.limit - a.spent / a.limit));

  constructor() {
    effect(() => {
      const m = this.months.month();
      this.months.version();
      this.failed.set(false);
      this.fin.budgets(m).subscribe({ next: (r) => this.items.set(r.items), error: () => this.failed.set(true) });
    });
  }

  pct(b: BudgetRow): number { return Math.min(100, Math.round((b.spent / b.limit) * 100)); }
  state(b: BudgetRow): 'ok' | 'warn' | 'over' { return b.spent >= b.limit ? 'over' : b.spent >= b.limit * 0.8 ? 'warn' : 'ok'; }
  color(b: BudgetRow): string { const s = this.state(b); return s === 'over' ? 'var(--expense)' : s === 'warn' ? 'var(--amber)' : 'var(--brand)'; }
  left(b: BudgetRow): string { return b.spent > b.limit ? `${money(b.spent - b.limit)} over` : `${money(b.limit - b.spent)} left`; }

  startEdit(b: BudgetRow): void { this.editing.set(b.category); this.draft.set(b.limit); }
  saveEdit(b: BudgetRow): void {
    if (!(this.draft() > 0)) return;
    this.fin.setBudget(b.category, this.draft()).subscribe({
      next: () => { this.editing.set(null); this.toast.success('Budget updated'); this.months.changed(); },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
  create(): void {
    if (!this.newCat() || !(this.newLimit() > 0)) return;
    this.fin.setBudget(this.newCat(), this.newLimit()).subscribe({
      next: () => { this.adding.set(false); this.newCat.set(''); this.newLimit.set(0); this.toast.success('Budget added'); this.months.changed(); },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
  remove(b: BudgetRow): void {
    this.fin.deleteBudget(b.category).subscribe({ next: () => { this.toast.success('Budget removed'); this.months.changed(); }, error: (e) => this.toast.error(errorMessage(e)) });
  }
}
