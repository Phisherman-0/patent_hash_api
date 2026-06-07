import { Router } from 'express';
import { searchController } from '../controllers/search.controller';
import { requireAuth } from '../auth';

const router = Router();

router.get('/patents', requireAuth, searchController.searchPatents);

export default router;
