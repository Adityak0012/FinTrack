import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guards';
import { Shell } from './layout/shell';

export const routes: Routes = [
  { path: 'login', canActivate: [guestGuard], title: 'Log in · FinTrack', loadComponent: () => import('./pages/auth/login').then((m) => m.Login) },
  { path: 'register', canActivate: [guestGuard], title: 'Create account · FinTrack', loadComponent: () => import('./pages/auth/register').then((m) => m.Register) },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', title: 'Overview · FinTrack', data: { heading: 'Overview' }, loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard) },
      { path: 'transactions', title: 'Transactions · FinTrack', data: { heading: 'Transactions' }, loadComponent: () => import('./pages/transactions/transactions').then((m) => m.Transactions) },
      { path: 'budgets', title: 'Budgets · FinTrack', data: { heading: 'Budgets' }, loadComponent: () => import('./pages/budgets/budgets').then((m) => m.Budgets) },
      { path: 'reports', title: 'Reports · FinTrack', data: { heading: 'Reports' }, loadComponent: () => import('./pages/reports/reports').then((m) => m.Reports) },
    ],
  },
  { path: '**', redirectTo: '' },
];
