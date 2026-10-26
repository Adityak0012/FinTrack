import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; type: 'success' | 'error'; text: string; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  show(text: string, type: Toast['type'] = 'success', ms = 3200): void {
    const id = this.nextId++;
    this.toasts.update((t) => [...t.slice(-2), { id, type, text }]);
    setTimeout(() => this.dismiss(id), ms);
  }
  success(text: string): void { this.show(text, 'success'); }
  error(text: string): void { this.show(text, 'error', 5000); }
  dismiss(id: number): void { this.toasts.update((t) => t.filter((x) => x.id !== id)); }
}
