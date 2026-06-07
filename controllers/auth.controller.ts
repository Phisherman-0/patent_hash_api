import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { storage } from '../storage';
import { db } from '../db';
import { users } from '../models/index';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Hash password utility
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Compare password utility
async function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// User validation schema
const userRegisterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "consultant"]).optional().default("user"),
});

export const authController = {
  register: async (req: Request, res: Response) => {
    try {
      const validatedData = userRegisterSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      
      const { generateOTP, hashOTP, getOTPExpiry } = await import('../utils/otpUtils.js');
      const { sendOTPEmail } = await import('../services/emailService.js');
      
      const otp = generateOTP();
      const hashedOTP = hashOTP(otp);
      const otpExpiry = getOTPExpiry(5);

      const { password, role, ...userDataWithoutPassword } = validatedData;
      const newUser = await storage.createUser({
        ...userDataWithoutPassword,
        passwordHash: hashedPassword,
        role: role || "user",
        isEmailVerified: false,
        emailVerificationToken: hashedOTP,
        emailVerificationExpiry: otpExpiry,
      });

      const emailSent = await sendOTPEmail(
        newUser.email,
        otp,
        `${newUser.firstName} ${newUser.lastName}`
      );
      
      if (!emailSent) {
        console.warn('Failed to send OTP email, but user was created');
      }

      const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '30d' });
      const { passwordHash, emailVerificationToken, ...userWithoutSensitiveData } = newUser;
      res.status(201).json({ user: userWithoutSensitiveData, token });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : 'Registration failed' 
      });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const isValidPassword = await comparePasswords(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (!user.isEmailVerified) {
        return res.status(401).json({ message: 'Email not verified', isUnverified: true });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  },

  logout: async (req: Request, res: Response) => {
    res.json({ message: 'Logged out successfully' });
  },

  getCurrentUser: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const user = await storage.getUserById(req.user.id);
      if (!user) return res.status(401).json({ message: 'User not found' });

      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  },

  getSettings: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const user = await storage.getUserById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user.settings || {});
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  },

  updateSettings: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const { settings } = req.body;
      const user = await storage.getUserById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      
      const updatedSettings = { ...(user.settings || {}), ...settings };
      await storage.updateUserSettings(req.user.id, updatedSettings);
      res.json({ message: "Settings updated successfully", settings: updatedSettings });
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  },

  updateProfile: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const { firstName, lastName } = req.body;
      const updatedUser = await storage.updateUser(req.user.id, {
        firstName,
        lastName,
        updatedAt: new Date()
      });

      if (!updatedUser) return res.status(404).json({ message: 'User not found' });
      const { passwordHash, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  verifyOTP: async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user || user.isEmailVerified || !user.emailVerificationToken || !user.emailVerificationExpiry) {
        return res.status(400).json({ message: 'Invalid verification request' });
      }

      const { verifyOTP, isOTPExpired } = await import('../utils/otpUtils.js');
      const { sendWelcomeEmail } = await import('../services/emailService.js');

      if (isOTPExpired(new Date(user.emailVerificationExpiry))) {
        return res.status(400).json({ message: 'OTP has expired' });
      }

      const isValid = verifyOTP(otp, user.emailVerificationToken);
      if (!isValid) return res.status(400).json({ message: 'Invalid OTP' });

      await storage.updateUser(user.id, {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        updatedAt: new Date()
      });

      await sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`);
      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ message: 'Verification failed' });
    }
  },

  resendOTP: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user || user.isEmailVerified) return res.status(400).json({ message: 'Cannot resend OTP' });

      const { generateOTP, hashOTP, getOTPExpiry } = await import('../utils/otpUtils.js');
      const { sendOTPEmail } = await import('../services/emailService.js');

      const otp = generateOTP();
      const hashedOTP = hashOTP(otp);
      const otpExpiry = getOTPExpiry(5);

      await storage.updateUser(user.id, {
        emailVerificationToken: hashedOTP,
        emailVerificationExpiry: otpExpiry,
        updatedAt: new Date()
      });

      const emailSent = await sendOTPEmail(user.email, otp, `${user.firstName} ${user.lastName}`);
      if (emailSent) res.json({ message: 'OTP resent successfully' });
      else res.status(500).json({ message: 'Failed to send OTP email' });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({ message: 'Failed to resend OTP' });
    }
  },

  uploadProfileImage: async (req: Request, res: Response) => {
    try {
      if (!req.file || !req.user) return res.status(400).json({ message: 'No file or user' });
      const userId = req.user.id;
      const profileImageUrl = `/uploads/profiles/${req.file.filename}`;

      const user = await storage.getUserById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (user.profileImageUrl) {
        const oldPath = path.join('.', user.profileImageUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const updatedUser = await storage.updateUser(userId, { profileImageUrl, updatedAt: new Date() });
      const { passwordHash, ...userWithoutPassword } = updatedUser!;
      res.json({ user: userWithoutPassword, message: 'Profile image updated successfully' });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  deleteProfileImage: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const user = await storage.getUserById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (user.profileImageUrl) {
        const imagePath = path.join('.', user.profileImageUrl);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }

      const updatedUser = await storage.updateUser(req.user.id, { profileImageUrl: null, updatedAt: new Date() });
      const { passwordHash, ...userWithoutPassword } = updatedUser!;
      res.json({ user: userWithoutPassword, message: 'Profile image deleted successfully' });
    } catch (error) {
      console.error('Error deleting profile image:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
