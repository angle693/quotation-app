// backend/src/routes/quotationRoutes.ts
import { Router } from 'express';
import * as ctrl from '../controllers/quotationController.js';

const router = Router();
router.get('/', ctrl.getAllQuotations);
router.post('/', ctrl.createQuotation);
router.delete('/:id', ctrl.deleteQuotation); // 👈 Added delete route

export default router;