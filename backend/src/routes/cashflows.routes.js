import { Router } from 'express'
import { list,createCashflow,updateCashflow,removeCashflow,calendar, upcoming, importCashflows, monthly, clearAll, updateStatus, overdueReport,
  pendingTotalsByAccountMonth } from '../controllers/cashflows.controller.js'
import multer from 'multer';
import { requireAdmin } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';

const r=Router(); 
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });



r.get('/',list); 
r.get('/calendar',calendar); 
r.get('/upcoming', upcoming);
r.get('/monthly', monthly);    

r.post('/',createCashflow);
r.delete('/all', clearAll);
r.put('/:id',updateCashflow); 
r.delete('/:id', requireAuth, requireAdmin, removeCashflow);

r.post('/import', upload.single('file'), importCashflows);

// ✅ NUEVA: cambiar estado (p.ej. a "paid")
r.patch('/:id/status', updateStatus);

// REPORTES
r.get('/reports/overdue', overdueReport);
r.get('/reports/pending-totals-by-account-month', pendingTotalsByAccountMonth);


export default r