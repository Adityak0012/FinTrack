import { Injectable, computed, signal } from '@angular/core';
import { currentMonth, monthLong, shiftMonthKey } from '../format';

/** The month every page is looking at, plus a counter that changes whenever data is added, edited or deleted. */
@Injectable({ providedIn: 'root' })
export class MonthService {
  readonly month = signal(currentMonth());
  readonly version = signal(0);
  readonly label = computed(() => monthLong(this.month()));
  readonly isCurrent = computed(() => this.month() === currentMonth());

  prev(): void { this.month.update((m) => shiftMonthKey(m, -1)); }
  next(): void { if (!this.isCurrent()) this.month.update((m) => shiftMonthKey(m, 1)); }
  today(): void { this.month.set(currentMonth()); }
  changed(): void { this.version.update((v) => v + 1); }
}
