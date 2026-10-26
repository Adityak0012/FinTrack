import { Injectable, signal } from '@angular/core';
import { Tx } from '../models';

/** Opens the add / edit transaction sheet from anywhere. */
@Injectable({ providedIn: 'root' })
export class DrawerService {
  readonly open = signal(false);
  readonly editing = signal<Tx | null>(null);

  add(): void { this.editing.set(null); this.open.set(true); }
  edit(tx: Tx): void { this.editing.set(tx); this.open.set(true); }
  close(): void { this.open.set(false); }
}
