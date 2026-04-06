import { Router } from "express";
import { totals } from "../controllers/reports.controller.js";
import { overdue, pendingPerAccountMonth } from '../controllers/reports.controller.js';

const r = Router();
r.get("/totals", totals);
r.get('/overdue', overdue);
r.get('/pending-per-account-month', pendingPerAccountMonth);
export default r;