import { Component, inject } from '@angular/core';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'ft-toasts',
  template: `
    <div class="stack" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class.error]="t.type === 'error'" role="status">
          <i class="bi" [class]="t.type === 'error' ? 'bi-exclamation-circle-fill' : 'bi-check-circle-fill'"></i>
          <span>{{ t.text }}</span>
          <button type="button" (click)="toast.dismiss(t.id)" aria-label="Dismiss"><i class="bi bi-x-lg"></i></button>
        </div>
      }
    </div>
  `,
  styles: `
    .stack { position: fixed; z-index: 3000; right: 1rem; bottom: 5.5rem; left: 1rem; display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end; pointer-events: none; }
    @media (min-width: 992px) { .stack { bottom: 1.25rem; } }
    .toast { pointer-events: auto; display: flex; align-items: center; gap: 0.65rem; max-width: 24rem; background: var(--panel); color: #fff; border-radius: 0.9rem; padding: 0.7rem 0.8rem 0.7rem 0.95rem; font-size: 0.9rem; box-shadow: 0 18px 40px -16px rgba(11, 13, 23, 0.6); animation: in 0.35s var(--ease); }
    .toast > i { color: #5be3cf; } .toast.error > i { color: #ff8b7e; }
    .toast button { border: 0; background: none; color: #9aa0b8; padding: 0.2rem; margin-left: 0.3rem; display: grid; }
    @keyframes in { from { opacity: 0; transform: translateY(14px) scale(0.97); } }
  `,
})
export class Toasts { readonly toast = inject(ToastService); }
