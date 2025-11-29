import { Request, Response } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';

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
    // Generate unique filename using user ID and timestamp
    const userId = req.user?.id || 'unknown';
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
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

export const authController = {
  // Get user settings
  getUserSettings: async (req: any, res: Response) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user.settings || {});
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  },

  // Update user settings
  updateUserSettings: async (req: any, res: Response) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      const { settings } = req.body;
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Merge new settings with existing ones
      const currentSettings = user.settings || {};
      const updatedSettings = { ...currentSettings, ...settings };
      
      // Update user settings
      await storage.updateUserSettings(req.user!.id, updatedSettings);
      
      res.json({ message: "Settings updated successfully", settings: updatedSettings });
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  },

  // Update profile
  updateProfile: async (req: any, res: Response) => {
    try {
      const { firstName, lastName } = req.body;
      const userId = req.user!.id;

      const updatedUser = await db.update(users)
        .set({ 
          firstName, 
          lastName,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      if (updatedUser.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = updatedUser[0];
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Upload profile image
  uploadProfileImage: async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const userId = req.user!.id;
      const profileImageUrl = `/uploads/profiles/${req.file.filename}`;

      // Get current user to check for existing profile image
      const currentUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (currentUser.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Delete old profile image if it exists
      if (currentUser[0].profileImageUrl) {
        const oldImagePath = path.join('.', currentUser[0].profileImageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Update user with new profile image URL
      const updatedUser = await db.update(users)
        .set({ 
          profileImageUrl,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = updatedUser[0];
      res.json({
        user: userWithoutPassword,
        message: 'Profile image updated successfully'
      });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      
      // Clean up uploaded file if there was an error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Delete profile image
  deleteProfileImage: async (req: any, res: Response) => {
    try {
      const userId = req.user!.id;

      // Get current user to check for existing profile image
      const currentUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (currentUser.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Delete profile image file if it exists
      if (currentUser[0].profileImageUrl) {
        const imagePath = path.join('.', currentUser[0].profileImageUrl);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      // Update user to remove profile image URL
      const updatedUser = await db.update(users)
        .set({ 
          profileImageUrl: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = updatedUser[0];
      res.json({
        user: userWithoutPassword,
        message: 'Profile image deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting profile image:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};