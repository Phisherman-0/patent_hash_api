import { Router } from 'express';
import multer from 'multer';
import { authController } from '../controllers/authController';
import { requireAuth, register, login, logout, getCurrentUser } from '../auth';
import { ensureDirectoryExists, generateUniqueFilename } from '../utils/fileUtils';
import path from 'path';

const router = Router();

// Configure multer for profile image uploads
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/profiles';
    ensureDirectoryExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.id || 'unknown';
    const filename = generateUniqueFilename(file.originalname, `profile_${userId}`);
    cb(null, filename);
  }
});

const profileImageUpload = multer({
  storage: profileImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/user', getCurrentUser);

// User settings routes
router.get('/user/settings', requireAuth, authController.getUserSettings);
router.put('/user/settings', requireAuth, authController.updateUserSettings);

// Profile routes
router.put('/profile', requireAuth, authController.updateProfile);
router.post('/profile/image', requireAuth, profileImageUpload.single('profileImage'), authController.uploadProfileImage);
router.delete('/profile/image', requireAuth, authController.deleteProfileImage);

export default router;
