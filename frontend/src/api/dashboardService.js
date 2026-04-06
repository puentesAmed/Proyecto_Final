import { api } from '@/lib/api.js';

export const getSummary = () =>
  api.get('/reports/totals').then(r => r.data);              // KPIs reales

export const getMonthlyCashflows = () =>
  api.get('/cashflows/monthly').then(r => r.data);            // lo añadimos abajo

export const getAccountsBalance = () =>
  api.get('/accounts/balance').then(r => r.data);             // lo añadimos abajo
