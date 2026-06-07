import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = Router();

// Configure multer for profile image uploads
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.id || 'unknown';
    const hash = crypto.createHash('md5').update(userId + Date.now()).digest('hex');
    const ext = path.extname(file.originalname);
    cb(null, `profile_${hash}${ext}`);
  }
});

const profileImageUpload = multer({
  storage: profileImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.get('/user', authController.getCurrentUser);
router.get('/user/settings', requireAuth, authController.getSettings);
router.put('/user/settings', requireAuth, authController.updateSettings);
router.put('/profile', requireAuth, authController.updateProfile);
router.post('/profile/image', requireAuth, profileImageUpload.single('profileImage'), authController.uploadProfileImage);
router.delete('/profile/image', requireAuth, authController.deleteProfileImage);

export default router;
