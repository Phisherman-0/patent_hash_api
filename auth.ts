import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { storage } from './storage';
import { z } from 'zod';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string | null;
        firstName: string | null;
        lastName: string | null;
        profileImageUrl: string | null;
        role: string | null;
        createdAt: Date | null;
        updatedAt: Date | null;
      };
    }
  }
}

// Hash password utility
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Compare password utility
export async function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Cookie options
const COOKIE_NAME = 'patent_hash_token';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const setTokenCookie = (res: Response, token: string) => {
  const options = {
    httpOnly: true,
    secure: false, // Explicitly false for HTTP dev
    sameSite: 'lax' as const,
    path: '/',
    // Removed maxAge for local session testing
  };
  
  console.log(`[Auth] Setting session cookie ${COOKIE_NAME}. Options:`, options);
  res.cookie(COOKIE_NAME, token, options);
};

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Debug log to see if cookies are being received
  console.log(`[Auth] Path: ${req.path}, Cookies:`, req.cookies ? Object.keys(req.cookies) : 'No req.cookies');
  
  // Check cookie first (more secure), fallback to Authorization header
  const token = req.cookies[COOKIE_NAME] || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// User validation schema
const userRegisterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "consultant"]).optional().default("user"),
});

// Register endpoint
export async function register(req: Request, res: Response) {
  try {
    const validatedData = userRegisterSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);
    
    // Generate OTP
    const { generateOTP, hashOTP, getOTPExpiry } = await import('./utils/otpUtils.js');
    const { sendOTPEmail } = await import('./services/emailService.js');
    
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const otpExpiry = getOTPExpiry(5); // 5 minutes
    
    // Create user with specified role and OTP
    const { password, role, ...userDataWithoutPassword } = validatedData;
    const newUser = await storage.createUser({
      ...userDataWithoutPassword,
      passwordHash: hashedPassword,
      role: role || "user",
      isEmailVerified: false,
      emailVerificationToken: hashedOTP,
      emailVerificationExpiry: otpExpiry,
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(
      newUser.email,
      otp,
      `${newUser.firstName} ${newUser.lastName}`
    );
    
    if (!emailSent) {
      console.warn('Failed to send OTP email, but user was created');
    }

    // Set session
    
    
    // Return user without password and OTP
    // Set cookie
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '2d' });
    setTokenCookie(res, token);
    
    const { passwordHash, emailVerificationToken, ...userWithoutSensitiveData } = newUser;
    res.status(201).json({ user: userWithoutSensitiveData, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : 'Registration failed' 
    });
  }
}

// Login endpoint
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    if (!user.passwordHash) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isValidPassword = await comparePasswords(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({ message: 'Email not verified', isUnverified: true });
    }

    // Set session
    
    
    // Return user without password
    // Set cookie
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '2d' });
    setTokenCookie(res, token);
    
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
}

// Logout endpoint
export async function logout(req: Request, res: Response) {
  try {
    res.clearCookie(COOKIE_NAME);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
}

// Get current user endpoint
export async function getCurrentUser(req: Request, res: Response) {
  try {
    const token = req.cookies[COOKIE_NAME] || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUserById(payload.userId);
    if (!user) {
      
      return res.status(401).json({ message: 'User not found' });
    }

    // Return user without password
    const { passwordHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
}

// Update user profile
export async function updateProfile(req: Request, res: Response) {
  try {
    const { firstName, lastName } = req.body;
    const token = req.cookies[COOKIE_NAME] || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const userId = payload.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const updatedUser = await storage.updateUser(userId, {
      firstName,
      lastName,
      updatedAt: new Date()
    });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user without password
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Verify OTP endpoint
export async function verifyOTP(req: Request, res: Response) {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    if (!user.emailVerificationToken || !user.emailVerificationExpiry) {
      return res.status(400).json({ message: 'No verification pending' });
    }

    // Import OTP utils dynamically
    const { verifyOTP, isOTPExpired } = await import('./utils/otpUtils.js');
    const { sendWelcomeEmail } = await import('./services/emailService.js');

    // Check expiry
    if (isOTPExpired(new Date(user.emailVerificationExpiry))) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Verify OTP
    const isValid = verifyOTP(otp, user.emailVerificationToken);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update user as verified
    const updatedUser = await storage.updateUser(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
      updatedAt: new Date()
    });

    // Generate token and set cookie now that they are verified
    if (updatedUser) {
      const token = jwt.sign({ userId: updatedUser.id }, JWT_SECRET, { expiresIn: '2d' });
      setTokenCookie(res, token);
    }

    // Send welcome email
    await sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`);

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
}

// Resend OTP endpoint
export async function resendOTP(req: Request, res: Response) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Import utils dynamically
    const { generateOTP, hashOTP, getOTPExpiry } = await import('./utils/otpUtils.js');
    const { sendOTPEmail } = await import('./services/emailService.js');

    // Generate new OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const otpExpiry = getOTPExpiry(5); // 5 minutes

    // Update user with new OTP
    await storage.updateUser(user.id, {
      emailVerificationToken: hashedOTP,
      emailVerificationExpiry: otpExpiry,
      updatedAt: new Date()
    });

    // Send email
    const emailSent = await sendOTPEmail(
      user.email,
      otp,
      `${user.firstName} ${user.lastName}`
    );

    if (emailSent) {
      res.json({ message: 'OTP resent successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send OTP email' });
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
}
