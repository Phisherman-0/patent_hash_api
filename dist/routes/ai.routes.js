import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { requireAuth } from '../auth';
const router = Router();
router.post('/prior-art-search', requireAuth, aiController.priorArtSearch);
router.post('/patent-valuation', requireAuth, aiController.patentValuation);
router.post('/similarity-detection', requireAuth, aiController.similarityDetection);
router.post('/patent-drafting', requireAuth, aiController.patentDrafting);
export default router;
