import { Router } from 'express';
import { consultantController } from '../controllers/consultant.controller';
import { requireAuth } from '../auth';
import { requireConsultant } from '../roleMiddleware';

const router = Router();

router.get('/profile', requireAuth, requireConsultant, consultantController.getProfile);
router.post('/profile', requireAuth, requireConsultant, consultantController.updateProfile);
router.get('/', consultantController.getAll);
router.get('/specialization/:specialization', consultantController.getBySpecialization);

export default router;
