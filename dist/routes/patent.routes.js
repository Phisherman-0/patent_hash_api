import { Router } from 'express';
import { patentController } from '../controllers/patent.controller';
import { requireAuth } from '../auth';
import multer from 'multer';
import fs from 'fs';
import crypto from 'crypto';
const router = Router();
// Configure multer for patent document uploads
const patentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const hash = crypto.createHash('md5').update(file.originalname + Date.now()).digest('hex');
        cb(null, hash);
    }
});
const upload = multer({
    storage: patentStorage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit
    },
});
router.get('/', requireAuth, patentController.getAll);
router.get('/:id', requireAuth, patentController.getOne);
router.post('/', requireAuth, upload.array('documents'), patentController.create);
router.put('/:id', requireAuth, patentController.update);
router.delete('/:id', requireAuth, patentController.delete);
export default router;
