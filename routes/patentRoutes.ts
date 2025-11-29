import { Router } from 'express';
import multer from 'multer';
import { patentController } from '../controllers/patentController';
import { requireAuth } from '../auth';
import { ensureDirectoryExists, generateUniqueFilename } from '../utils/fileUtils';

const router = Router();

// Configure multer for file uploads
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    ensureDirectoryExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const filename = generateUniqueFilename(file.originalname);
    cb(null, filename);
  }
});

const upload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
});

// Patent routes
router.get('/', requireAuth, patentController.getPatents);
router.get('/:id', requireAuth, patentController.getPatent);
router.post('/', requireAuth, upload.array('documents'), patentController.createPatent);
router.put('/:id', requireAuth, patentController.updatePatent);
router.delete('/:id', requireAuth, patentController.deletePatent);

export default router;
