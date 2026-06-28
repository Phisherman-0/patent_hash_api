import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { requireAuth } from '../auth';
const router = Router();
router.get('/stats', requireAuth, dashboardController.getStats);
router.get('/activities', requireAuth, dashboardController.getActivities);
router.get('/category-stats', requireAuth, dashboardController.getCategoryStats);
export default router;
