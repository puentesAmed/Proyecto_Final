import { api } from '@/lib/api.js';

export const setCashflowStatus = (id, status) => api.patch(`/cashflows/${id}/status`, { status }).then(r => r.data);
