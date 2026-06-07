import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { requireAuth } from '../auth';
import { requireUserOrConsultant } from '../roleMiddleware';

const router = Router();

router.post('/room', requireAuth, requireUserOrConsultant, chatController.createOrGetRoom);
router.get('/rooms', requireAuth, chatController.getRooms);
router.get('/messages/:roomId', requireAuth, chatController.getMessages);
router.post('/messages', requireAuth, chatController.sendMessage);

export default router;
