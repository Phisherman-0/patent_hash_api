import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { requireAuth } from '../auth';
const router = Router();
router.get('/user', requireAuth, documentController.getUserDocuments);
router.get('/:id/download', requireAuth, documentController.downloadDocument);
router.delete('/:id', requireAuth, documentController.deleteDocument);
export default router;
