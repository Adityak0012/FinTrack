import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BudgetRow, MonthPoint, Overview, Tx, TxInput, TxPage } from '../models';
import { AuthService } from './auth.service';

export interface TxQuery { month: string; type?: string; category?: string; search?: string; page?: number; limit?: number; }

@Injectable({ providedIn: 'root' })
export class FinService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  overview(month: string): Observable<Overview> { return this.http.get<Overview>('/api/stats/overview', { params: { month } }); }
  monthly(month: string, months = 6): Observable<{ items: MonthPoint[] }> {
    return this.http.get<{ items: MonthPoint[] }>('/api/stats/monthly', { params: { month, months } });
  }
  transactions(q: TxQuery): Observable<TxPage> {
    let params = new HttpParams().set('month', q.month);
    for (const [k, v] of Object.entries(q)) if (k !== 'month' && v !== undefined && v !== '') params = params.set(k, String(v));
    return this.http.get<TxPage>('/api/transactions', { params });
  }
  createTx(body: TxInput): Observable<Tx> { return this.http.post<Tx>('/api/transactions', body); }
  updateTx(id: string, body: TxInput): Observable<Tx> { return this.http.put<Tx>(`/api/transactions/${id}`, body); }
  deleteTx(id: string): Observable<unknown> { return this.http.delete(`/api/transactions/${id}`); }

  budgets(month: string): Observable<{ month: string; items: BudgetRow[] }> { return this.http.get<{ month: string; items: BudgetRow[] }>('/api/budgets', { params: { month } }); }
  setBudget(category: string, limit: number): Observable<unknown> { return this.http.put(`/api/budgets/${category}`, { limit }); }
  deleteBudget(category: string): Observable<unknown> { return this.http.delete(`/api/budgets/${category}`); }

  /** Downloads the month as a CSV file (the request needs the login token, so a plain link will not work). */
  async exportCsv(month: string): Promise<void> {
    const res = await fetch(`/api/transactions/export?month=${month}`, { headers: { Authorization: `Bearer ${this.auth.token()}` } });
    if (!res.ok) throw new Error('Export failed');
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
