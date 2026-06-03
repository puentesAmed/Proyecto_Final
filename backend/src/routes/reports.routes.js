import { Router } from "express";
import { totals } from "../controllers/reports.controller.js";
import { overdue, pendingPerAccountMonth } from '../controllers/reports.controller.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();
r.use(requireAuth);
r.get("/totals", totals);
r.get('/overdue', overdue);
r.get('/pending-per-account-month', pendingPerAccountMonth);
export default r;
