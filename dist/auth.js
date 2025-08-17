import bcrypt from 'bcrypt';
import { storage } from './storage';
import { z } from 'zod';
// Hash password utility
export async function hashPassword(password) {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
}
// Compare password utility
export async function comparePasswords(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
}
// Authentication middleware
export async function requireAuth(req, res, next) {
    if (!req.session?.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    // Get user data and attach to request
    try {
        const user = await storage.getUser(req.session.userId);
        if (!user) {
            req.session.destroy(() => { });
            return res.status(401).json({ message: 'User not found' });
        }
        req.user = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: null,
            role: null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ message: 'Authentication failed' });
    }
}
// User validation schema
const userRegisterSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});
// Register endpoint
export async function register(req, res) {
    try {
        const validatedData = userRegisterSchema.parse(req.body);
        // Check if user already exists
        const existingUser = await storage.getUserByEmail(validatedData.email);
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        // Hash password
        const hashedPassword = await hashPassword(validatedData.password);
        // Create user
        const { password, ...userDataWithoutPassword } = validatedData;
        const newUser = await storage.createUser({
            ...userDataWithoutPassword,
            passwordHash: hashedPassword,
        });
        // Set session
        req.session.userId = newUser.id;
        // Return user without password
        const { passwordHash, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({
            message: error instanceof Error ? error.message : 'Registration failed'
        });
    }
}
// Login endpoint
export async function login(req, res) {
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
        // Set session
        req.session.userId = user.id;
        // Return user without password
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
}
// Logout endpoint
export async function logout(req, res) {
    try {
        req.session?.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).json({ message: 'Logout failed' });
            }
            res.clearCookie('connect.sid');
            res.json({ message: 'Logged out successfully' });
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Logout failed' });
    }
}
// Get current user endpoint
export async function getCurrentUser(req, res) {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const user = await storage.getUser(req.session.userId);
        if (!user) {
            req.session.destroy(() => { });
            return res.status(401).json({ message: 'User not found' });
        }
        // Return user without password
        const { passwordHash, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Failed to get user' });
    }
}
