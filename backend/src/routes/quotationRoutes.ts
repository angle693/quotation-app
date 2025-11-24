// backend/src/routes/quotationRoutes.ts
import { Router } from 'express';
import * as ctrl from '../controllers/quotationController.js';

const router = Router();
router.get('/', ctrl.getAllQuotations);
router.post('/', ctrl.createQuotation);
export default router;