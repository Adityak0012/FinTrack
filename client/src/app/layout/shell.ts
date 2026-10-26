import { Component, ElementRef, computed, inject } from '@angular/core';
import { animate } from 'motion';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { MonthService } from '../core/services/month.service';
import { DrawerService } from '../core/services/drawer.service';
import { TxDrawer } from './tx-drawer';

const NAV = [
  { path: '/dashboard', label: 'Overview', icon: 'bi-grid-1x2' },
  { path: '/transactions', label: 'Transactions', icon: 'bi-arrow-left-right' },
  { path: '/budgets', label: 'Budgets', icon: 'bi-bullseye' },
  { path: '/reports', label: 'Reports', icon: 'bi-bar-chart-line' },
];

@Component({
  selector: 'ft-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TxDrawer],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  readonly auth = inject(AuthService);
  readonly months = inject(MonthService);
  readonly drawer = inject(DrawerService);
  private router = inject(Router);
  private host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly nav = NAV;

  private url = toSignal(this.router.events.pipe(filter((e) => e instanceof NavigationEnd), map(() => this.router.url), startWith(this.router.url)), { initialValue: '/' });
  readonly heading = computed(() => {
    if (this.url().startsWith('/dashboard')) {
      const h = new Date().getHours();
      const part = h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
      return `Good ${part}, ${(this.auth.user()?.name ?? '').split(' ')[0]}.`;
    }
    return NAV.find((n) => this.url().startsWith(n.path))?.label ?? 'FinTrack';
  });
  readonly initials = computed(() => (this.auth.user()?.name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase());

  /** Every page change fades and lifts the content in. */
  enter(): void {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = this.host.querySelector('.content');
    if (el) animate(el, { opacity: [0, 1], transform: ['translateY(14px)', 'translateY(0px)'] }, { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] });
  }
}
