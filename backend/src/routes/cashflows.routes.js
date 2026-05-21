import { Router } from 'express'
import {
  list,
  createCashflow,
  updateCashflow,
  removeCashflow,
  calendar,
  upcoming,
  importCashflows,
  monthly,
  clearAll,
  updateStatus,
  overdueReport,
  pendingTotalsByAccountMonth,
} from '../controllers/cashflows.controller.js'
import multer from 'multer'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

router.use(requireAuth)

router.get('/', list)
router.get('/calendar', calendar)
router.get('/upcoming', upcoming)
router.get('/monthly', monthly)

router.post('/', createCashflow)
router.delete('/all', requireAdmin, clearAll)
router.put('/:id', updateCashflow)
router.delete('/:id', requireAdmin, removeCashflow)

router.post('/import', requireAdmin, upload.single('file'), importCashflows)
router.patch('/:id/status', updateStatus)

router.get('/reports/overdue', overdueReport)
router.get('/reports/pending-totals-by-account-month', pendingTotalsByAccountMonth)

export default router
