import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../core/categories';
import { TxType, errorMessage } from '../core/models';
import { todayIso, monthLong } from '../core/format';
import { DrawerService } from '../core/services/drawer.service';
import { FinService } from '../core/services/fin.service';
import { MonthService } from '../core/services/month.service';
import { ToastService } from '../core/services/toast.service';

/** Slide-in sheet (bottom sheet on phones) to add, edit or delete a transaction. */
@Component({
  selector: 'ft-tx-drawer',
  imports: [FormsModule],
  template: `
    @if (drawer.open()) {
      <div class="scrim" [class.out]="closing()" (click)="close()"></div>
      <section class="sheet" [class.out]="closing()" role="dialog" aria-modal="true" [attr.aria-label]="editing() ? 'Edit transaction' : 'Add transaction'" (keydown.escape)="close()">
        <header>
          <h2>{{ editing() ? 'Edit transaction' : 'New transaction' }}</h2>
          <button type="button" class="x" (click)="close()" aria-label="Close"><i class="bi bi-x-lg"></i></button>
        </header>

        <form (ngSubmit)="save()" novalidate>
          <div class="seg" role="tablist" [class.is-income]="type() === 'income'">
            <span class="pill-bg"></span>
            <button type="button" role="tab" [attr.aria-selected]="type() === 'expense'" (click)="setType('expense')">Expense</button>
            <button type="button" role="tab" [attr.aria-selected]="type() === 'income'" (click)="setType('income')">Income</button>
          </div>

          <label class="amount" [class.invalid]="tried() && !(amount() > 0)">
            <span class="cur serif">₹</span>
            <input #amt type="number" inputmode="decimal" min="0" step="any" placeholder="0" [ngModel]="amount() || null" (ngModelChange)="amount.set(+$event || 0)" name="amount" aria-label="Amount" />
          </label>
          @if (tried() && !(amount() > 0)) { <p class="err">Enter an amount greater than 0.</p> }

          <div class="field">
            <label>Category</label>
            <div class="cats" role="radiogroup" aria-label="Category">
              @for (c of list(); track c.key) {
                <button type="button" class="cat" role="radio" [attr.aria-checked]="category() === c.key" [class.on]="category() === c.key" [style.--c]="c.color" (click)="category.set(c.key)">
                  <i class="bi" [class]="c.icon"></i><span>{{ c.label }}</span>
                </button>
              }
            </div>
            @if (tried() && !category()) { <p class="err">Choose a category.</p> }
          </div>

          <div class="row">
            <div class="field"><label for="d">Date</label><input id="d" type="date" [ngModel]="date()" (ngModelChange)="date.set($event)" name="date" [max]="today" /></div>
          </div>
          <div class="field"><label for="n">Note <span class="muted">(optional)</span></label><input id="n" type="text" maxlength="120" placeholder="What was it for?" [ngModel]="note()" (ngModelChange)="note.set($event)" name="note" /></div>

          @if (error()) { <div class="alert">{{ error() }}</div> }

          <div class="actions">
            @if (editing()) {
              <button type="button" class="btn danger" (click)="remove()">{{ confirmDelete() ? 'Tap again to delete' : 'Delete' }}</button>
            }
            <button type="submit" class="btn brand lg grow" [disabled]="saving()">
              @if (saving()) { Saving… } @else { {{ editing() ? 'Save changes' : type() === 'income' ? 'Add income' : 'Add expense' }} }
            </button>
          </div>
        </form>
      </section>
    }
  `,
  styleUrl: './tx-drawer.scss',
})
export class TxDrawer {
  readonly drawer = inject(DrawerService);
  private fin = inject(FinService);
  private months = inject(MonthService);
  private toast = inject(ToastService);
  private amt = viewChild<ElementRef<HTMLInputElement>>('amt');

  readonly today = todayIso();
  readonly editing = this.drawer.editing;
  readonly type = signal<TxType>('expense');
  readonly amount = signal(0);
  readonly category = signal('');
  readonly date = signal(todayIso());
  readonly note = signal('');
  readonly tried = signal(false);
  readonly saving = signal(false);
  readonly closing = signal(false);
  readonly error = signal('');
  readonly confirmDelete = signal(false);
  readonly list = computed(() => (this.type() === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES));

  constructor() {
    effect(() => {
      if (!this.drawer.open()) return;
      const tx = this.drawer.editing();
      this.tried.set(false); this.error.set(''); this.closing.set(false); this.confirmDelete.set(false); this.saving.set(false);
      if (tx) {
        this.type.set(tx.type); this.amount.set(tx.amount); this.category.set(tx.category); this.date.set(tx.date.slice(0, 10)); this.note.set(tx.note || '');
      } else {
        this.type.set('expense'); this.amount.set(0); this.category.set(''); this.date.set(todayIso()); this.note.set('');
      }
      setTimeout(() => this.amt()?.nativeElement.focus({ preventScroll: true }), 220);
    });
  }

  setType(t: TxType): void {
    if (this.type() === t) return;
    this.type.set(t);
    if (!CATEGORIES.some((c) => c.key === this.category() && c.type === t)) this.category.set('');
  }

  close(): void {
    this.closing.set(true);
    setTimeout(() => { this.drawer.close(); this.closing.set(false); }, 220);
  }

  save(): void {
    this.tried.set(true);
    this.error.set('');
    if (!(this.amount() > 0) || !this.category() || !this.date()) return;
    this.saving.set(true);
    const body = { type: this.type(), amount: this.amount(), category: this.category(), date: this.date(), note: this.note().trim() };
    const tx = this.editing();
    (tx ? this.fin.updateTx(tx._id, body) : this.fin.createTx(body)).subscribe({
      next: () => {
        const month = body.date.slice(0, 7);
        this.toast.success(tx ? 'Changes saved' : `${body.type === 'income' ? 'Income' : 'Expense'} added`);
        if (month !== this.months.month()) this.toast.show(`Saved to ${monthLong(month)}`, 'success', 2800);
        this.months.changed();
        this.close();
      },
      error: (e) => { this.error.set(errorMessage(e)); this.saving.set(false); },
    });
  }

  remove(): void {
    const tx = this.editing();
    if (!tx) return;
    if (!this.confirmDelete()) { this.confirmDelete.set(true); setTimeout(() => this.confirmDelete.set(false), 3000); return; }
    this.fin.deleteTx(tx._id).subscribe({
      next: () => { this.toast.success('Transaction deleted'); this.months.changed(); this.close(); },
      error: (e) => this.error.set(errorMessage(e)),
    });
  }
}
