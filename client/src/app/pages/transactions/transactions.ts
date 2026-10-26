import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CATEGORIES, cat } from '../../core/categories';
import { dayHeading, money } from '../../core/format';
import { Tx, TxPage } from '../../core/models';
import { DrawerService } from '../../core/services/drawer.service';
import { FinService } from '../../core/services/fin.service';
import { MonthService } from '../../core/services/month.service';
import { ToastService } from '../../core/services/toast.service';
import { Reveal } from '../../shared/reveal';

interface Group { key: string; heading: string; net: number; items: Tx[]; }

@Component({
  selector: 'ft-transactions',
  imports: [FormsModule, Reveal],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class Transactions {
  private fin = inject(FinService);
  private toast = inject(ToastService);
  readonly drawer = inject(DrawerService);
  readonly months = inject(MonthService);
  readonly money = money;
  readonly cat = cat;
  readonly categories = CATEGORIES;

  readonly type = signal('');
  readonly category = signal('');
  readonly search = signal('');
  readonly page = signal(1);
  readonly data = signal<TxPage | null>(null);
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly exporting = signal(false);
  private debounced = signal('');
  private timer?: ReturnType<typeof setTimeout>;

  readonly filtered = computed(() => !!(this.type() || this.category() || this.debounced()));
  readonly groups = computed<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const t of this.data()?.items ?? []) {
      const key = t.date.slice(0, 10);
      const g = map.get(key) ?? { key, heading: dayHeading(t.date), net: 0, items: [] };
      g.net += t.type === 'income' ? t.amount : -t.amount;
      g.items.push(t);
      map.set(key, g);
    }
    return [...map.values()];
  });
  readonly options = computed(() => (this.type() ? CATEGORIES.filter((c) => c.type === this.type()) : CATEGORIES));

  constructor() {
    effect(() => {
      const q = { month: this.months.month(), type: this.type(), category: this.category(), search: this.debounced(), page: this.page(), limit: 25 };
      this.months.version();
      this.loading.set(untracked(() => this.data() === null));
      this.failed.set(false);
      this.fin.transactions(q).subscribe({ next: (d) => { this.data.set(d); this.loading.set(false); }, error: () => { this.failed.set(true); this.loading.set(false); } });
    });
    // changing month or filters goes back to page 1
    effect(() => { this.months.month(); this.type(); this.category(); this.debounced(); this.page.set(1); }, { allowSignalWrites: true });
  }

  onSearch(v: string): void {
    this.search.set(v);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.debounced.set(v.trim()), 300);
  }
  setType(t: string): void {
    this.type.set(t);
    if (this.category() && t && cat(this.category()).type !== t) this.category.set('');
  }
  clear(): void { this.type.set(''); this.category.set(''); this.search.set(''); this.debounced.set(''); }
  go(p: number): void { this.page.set(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  async export(): Promise<void> {
    this.exporting.set(true);
    try { await this.fin.exportCsv(this.months.month()); this.toast.success('CSV downloaded'); }
    catch { this.toast.error('Could not export. Try again.'); }
    this.exporting.set(false);
  }
}
