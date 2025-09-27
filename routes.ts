import { Express, Request, Response } from 'express';
import { Server } from 'http';
import { createServer } from 'http';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { storage } from './storage';
import { requireAuth, register, login, logout, getCurrentUser } from './auth';
import { requireUser, requireConsultant, requireAdmin, requireUserOrConsultant } from './roleMiddleware';
import { aiService } from './services/aiService';
import hederaService from './services/hederaService';
import { Patent } from './shared/schema';
import { pool } from './db';
import { insertPatentSchema } from './shared/schema';
import { db } from './db';
import { users, walletConnections, consultants, appointments } from './shared/schema';
import { eq, and } from 'drizzle-orm';

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 20 * 1024 * 1024, // 50MB limit
  },
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename using hash
    const hash = crypto.createHash('md5').update(file.originalname + Date.now()).digest('hex');
    cb(null, hash);
  }
});

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

export async function setupRoutes(app: Express): Promise<Server> {
  // Session middleware setup
  const session = await import('express-session');
  const connectPgSimple = await import('connect-pg-simple');
  const pgSession = connectPgSimple.default(session.default);
  
  const IS_PRODUCTION = process.env.NODE_ENV === 'production';
  
  app.use(session.default({
    store: new pgSession({
      pool: pool,
      tableName: 'sessions'
    }),
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: IS_PRODUCTION, // HTTPS only in production
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: IS_PRODUCTION ? 'none' : 'lax' // 'none' required for cross-origin in production
    }
  }));

  // Get user settings endpoint
  app.get('/api/auth/user/settings', requireAuth, async (req: any, res) => {
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
  });

  // Update user settings endpoint
  app.put('/api/auth/user/settings', requireAuth, async (req: any, res) => {
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
  });

  // Auth routes
  app.post('/api/auth/register', register);
  app.post('/api/auth/login', login);
  app.post('/api/auth/logout', logout);
  app.get('/api/auth/user', getCurrentUser);
  
  // Profile routes
  app.put('/api/auth/profile', requireAuth, async (req, res) => {
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
  });

  // Consultant profile routes
  app.post('/api/consultants/profile', requireAuth, requireConsultant, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { specialization, bio, experienceYears, hourlyRate, availability } = req.body;

      // Check if consultant profile already exists
      const existingConsultant = await storage.getConsultantByUserId(userId);
      
      let consultant;
      if (existingConsultant) {
        // Update existing consultant profile
        consultant = await storage.updateConsultant(existingConsultant.id, {
          specialization,
          bio,
          experienceYears,
          hourlyRate,
          availability,
          updatedAt: new Date()
        });
      } else {
        // Create new consultant profile
        consultant = await storage.createConsultant({
          userId,
          specialization,
          bio,
          experienceYears,
          hourlyRate,
          availability
        });
      }

      res.json(consultant);
    } catch (error) {
      console.error('Error updating consultant profile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/consultants/profile', requireAuth, requireConsultant, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const consultant = await storage.getConsultantByUserId(userId);
      
      if (!consultant) {
        return res.status(404).json({ message: 'Consultant profile not found' });
      }

      res.json(consultant);
    } catch (error) {
      console.error('Error fetching consultant profile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get all consultants (public endpoint)
  app.get('/api/consultants', async (req, res) => {
    try {
      const consultants = await storage.getAllConsultants();
      res.json(consultants);
    } catch (error) {
      console.error('Error fetching consultants:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get consultants by specialization
  app.get('/api/consultants/specialization/:specialization', async (req, res) => {
    try {
      const { specialization } = req.params;
      const consultants = await storage.getConsultantsBySpecialization(specialization);
      res.json(consultants);
    } catch (error) {
      console.error('Error fetching consultants by specialization:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Upload profile image
  app.post('/api/auth/profile/image', requireAuth, profileImageUpload.single('profileImage'), async (req, res) => {
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
  });

  // Delete profile image
  app.delete('/api/auth/profile/image', requireAuth, async (req, res) => {
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
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/activities', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getUserActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get('/api/dashboard/category-stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const categoryStats = await storage.getPatentCategoryStats(userId);
      res.json(categoryStats);
    } catch (error) {
      console.error("Error fetching category stats:", error);
      res.status(500).json({ message: "Failed to fetch category stats" });
    }
  });

  // Patent routes
  app.get('/api/patents', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const patents = await storage.getPatentsByUser(userId);
      res.json(patents);
    } catch (error) {
      console.error("Error fetching patents:", error);
      res.status(500).json({ message: "Failed to fetch patents" });
    }
  });

  app.get('/api/patents/:id', requireAuth, async (req: any, res) => {
    try {
      const patent = await storage.getPatent(req.params.id);
      if (!patent) {
        return res.status(404).json({ message: "Patent not found" });
      }
      
      // Check if user owns this patent
      if (patent.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(patent);
    } catch (error) {
      console.error("Error fetching patent:", error);
      res.status(500).json({ message: "Failed to fetch patent" });
    }
  });

  app.post('/api/patents', requireAuth, upload.array('documents'), async (req: any, res) => {
    let patent: any = null;
    try {
      const userId = req.user.id;
      
      // Check if user has wallet configured for patent filing
      const user = await storage.getUserById(userId);
      const walletConfig = user?.settings?.walletConfig;
      
      if (!walletConfig) {
        return res.status(400).json({ 
          message: 'Wallet connection required for patent filing. Please configure your wallet in settings.',
          requiresWallet: true
        });
      }
      
      const patentData = insertPatentSchema.parse({
        ...req.body,
        userId,
        // Initially set to pending, will update to approved/rejected based on success
        status: 'pending',
      });

      // Create the patent
      patent = await storage.createPatent(patentData);

      // Process uploaded files
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          // Calculate file hash
          const fileBuffer = fs.readFileSync(file.path);
          const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

          // Create document record
          await storage.createPatentDocument({
            patentId: patent.id,
            userId,
            fileName: file.originalname,
            filePath: file.path,
            fileType: file.mimetype,
            fileSize: file.size,
            hashValue: hash,
          });
        }

        // Store patent hash (HashPack integration - blockchain transactions handled by frontend)
        try {
          console.log(`📝 Calculating hash for patent ${patent.id}...`);
          
          // Calculate file hash for patent verification
          const fileHash = hederaService.calculateFileHash(req.files[0].path);
          
          // Update patent with calculated hash
          await storage.updatePatent(patent.id, {
            hashValue: fileHash,
          });
          
          console.log('✅ Patent hash calculated and stored:', fileHash);
        } catch (error: any) {
          console.error('❌ Hash calculation failed:', error.message);
          
          // Fallback hash calculation
          const fallbackHash = crypto.createHash('sha256').update(fs.readFileSync(req.files[0].path)).digest('hex');
          await storage.updatePatent(patent.id, {
            hashValue: fallbackHash,
            hederaError: error.message
          });
          
          console.log('⚠️  Patent saved with fallback hash calculation');
        }
      }

      // Create activity record
      await storage.createPatentActivity({
        patentId: patent.id,
        userId,
        activityType: 'created',
        description: `Patent "${patent.title}" created`,
      });

      // Update patent status to approved since submission was successful
      const approvedPatent = await storage.updatePatent(patent.id, {
        status: 'approved',
        approvedAt: new Date(),
      });

      res.status(201).json(approvedPatent);
    } catch (error) {
      console.error("Error creating patent:", error);
      
      // If patent was created but failed later, update status to rejected
      if (patent?.id) {
        try {
          await storage.updatePatent(patent.id, {
            status: 'rejected',
          });
        } catch (updateError) {
          console.error("Error updating patent status to rejected:", updateError);
        }
      }
      
      res.status(500).json({ message: "Failed to create patent" });
    }
  });

  app.put('/api/patents/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const patent = await storage.getPatent(req.params.id);
      
      if (!patent) {
        return res.status(404).json({ message: "Patent not found" });
      }
      
      if (patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updates = insertPatentSchema.partial().parse(req.body);
      const updatedPatent = await storage.updatePatent(req.params.id, updates);

      // Create activity record
      await storage.createPatentActivity({
        patentId: patent.id,
        userId,
        activityType: 'updated',
        description: `Patent "${patent.title}" updated`,
      });

      res.json(updatedPatent);
    } catch (error) {
      console.error("Error updating patent:", error);
      res.status(500).json({ message: "Failed to update patent" });
    }
  });

  app.delete('/api/patents/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const patent = await storage.getPatent(req.params.id);
      
      if (!patent) {
        return res.status(404).json({ message: "Patent not found" });
      }
      
      if (patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deletePatent(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting patent:", error);
      res.status(500).json({ message: "Failed to delete patent" });
    }
  });

  // AI Services routes
  app.post('/api/ai/prior-art-search', requireAuth, async (req: any, res) => {
    try {
      const { patentId, description } = req.body;
      const userId = req.user.id;

      // Verify patent ownership
      const patent = await storage.getPatent(patentId);
      if (!patent || patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Perform AI prior art search
      const searchResults = await aiService.performPriorArtSearch(description);

      // Store results in database
      for (const result of searchResults) {
        await storage.createPriorArtResult({
          patentId,
          externalPatentId: result.patentId,
          similarityScore: result.similarityScore.toString(),
          title: result.title,
          description: result.description,
          source: result.source,
        });
      }

      // Create AI analysis record
      await storage.createAIAnalysis({
        patentId,
        analysisType: 'prior_art',
        result: { results: searchResults },
        confidence: Math.max(...searchResults.map(r => r.similarityScore)).toString(),
      });

      res.json(searchResults);
    } catch (error) {
      console.error("Error in prior art search:", error);
      res.status(500).json({ message: "Failed to perform prior art search" });
    }
  });

  app.post('/api/ai/patent-valuation', requireAuth, async (req: any, res) => {
    try {
      const { patentId } = req.body;
      const userId = req.user.id;

      // Verify patent ownership
      const patent = await storage.getPatent(patentId);
      if (!patent || patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Perform AI valuation
      const valuation = await aiService.evaluatePatentValue(patent);

      // Update patent with estimated value
      await storage.updatePatent(patentId, {
        estimatedValue: valuation.estimatedValue.toString(),
      });

      // Create AI analysis record
      await storage.createAIAnalysis({
        patentId,
        analysisType: 'valuation',
        result: valuation,
        confidence: valuation.confidence.toString(),
      });

      // Create activity record
      await storage.createPatentActivity({
        patentId,
        userId,
        activityType: 'valuation_updated',
        description: `Patent valuation updated to $${valuation.estimatedValue}`,
      });

      res.json(valuation);
    } catch (error) {
      console.error("Error in patent valuation:", error);
      res.status(500).json({ message: "Failed to evaluate patent value" });
    }
  });

  app.post('/api/ai/similarity-detection', requireAuth, async (req: any, res) => {
    try {
      const { patentId, targetText } = req.body;
      const userId = req.user.id;

      // Verify patent ownership
      const patent = await storage.getPatent(patentId);
      if (!patent || patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Perform similarity detection
      const similarity = await aiService.detectSimilarity(patent.description, targetText);

      // Create AI analysis record
      await storage.createAIAnalysis({
        patentId,
        analysisType: 'similarity',
        result: similarity,
        confidence: similarity.confidence.toString(),
      });

      res.json(similarity);
    } catch (error) {
      console.error("Error in similarity detection:", error);
      res.status(500).json({ message: "Failed to detect similarity" });
    }
  });

  app.post('/api/ai/patent-drafting', requireAuth, async (req: any, res) => {
    try {
      const { title, description, category } = req.body;
      
      // Generate patent document using AI
      const draftDocument = await aiService.generatePatentDraft({
        title,
        description,
        category,
      });

      res.json(draftDocument);
    } catch (error) {
      console.error("Error in patent drafting:", error);
      res.status(500).json({ message: "Failed to generate patent draft" });
    }
  });

  // Wallet validation route (no auth required for validation only)
  app.post('/api/wallet/validate', async (req: any, res) => {
    try {
      const { accountId, privateKey, network } = req.body;

      if (!accountId || !privateKey || !network) {
        return res.status(400).json({ message: 'Account ID, private key and network are required' });
      }

      // Validate wallet credentials with Hedera
      const validationResult = await hederaService.validateWallet(accountId, privateKey, network);

      if (validationResult.isValid) {
        res.json({
          isValid: true,
          balance: validationResult.balance,
          message: 'Wallet validation successful'
        });
      } else {
        res.status(400).json({
          isValid: false,
          error: validationResult.error,
          message: 'Wallet validation failed'
        });
      }
    } catch (error) {
      console.error('Error validating wallet:', error);
      res.status(500).json({ message: 'Failed to validate wallet' });
    }
  });

  // Wallet configuration routes
  app.post('/api/wallet/configure', requireAuth, async (req: any, res) => {
    try {
      const { accountId, privateKey, network } = req.body;
      const userId = req.user.id;

      if (!accountId || !privateKey || !network) {
        return res.status(400).json({ message: 'Account ID, private key, and network are required' });
      }

      // Validate wallet before saving
      const validationResult = await hederaService.validateWallet(accountId, privateKey, network);
      
      if (!validationResult.isValid) {
        return res.status(400).json({ 
          message: 'Invalid wallet credentials',
          error: validationResult.error
        });
      }

      // Store wallet configuration in user settings
      const walletConfig = {
        accountId,
        privateKey, // In production, this should be encrypted
        network,
        walletType: 'legacy' as const,
        configuredAt: new Date().toISOString()
      };

      await storage.updateUserSettings(userId, {
        walletConfig
      });

      res.json({ 
        message: 'Wallet configured successfully',
        accountId,
        network,
        balance: validationResult.balance
      });
    } catch (error) {
      console.error('Error configuring wallet:', error);
      res.status(500).json({ message: 'Failed to configure wallet' });
    }
  });

  app.get('/api/wallet/status', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUserById(userId);
      
      if (!user || !user.settings?.walletConfig) {
        return res.json({ 
          isConfigured: false,
          message: 'No wallet configured'
        });
      }

      const walletConfig = user.settings.walletConfig;
      const { privateKey, ...walletInfo } = 'privateKey' in walletConfig ? 
        walletConfig : 
        { ...walletConfig, privateKey: undefined };
      res.json({
        isConfigured: true,
        ...walletInfo
      });
    } catch (error) {
      console.error('Error checking wallet status:', error);
      res.status(500).json({ message: 'Failed to check wallet status' });
    }
  });

  app.delete('/api/wallet/disconnect', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUserById(userId);
      
      if (user && user.settings) {
        const { walletConfig, ...otherSettings } = user.settings;
        await storage.updateUserSettings(userId, otherSettings);
      }

      res.json({ message: 'Wallet disconnected successfully' });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      res.status(500).json({ message: 'Failed to disconnect wallet' });
    }
  });

  // Blockchain verification routes
  app.get('/api/blockchain/verify/:patentId', requireAuth, async (req: any, res) => {
    try {
      const patent = await storage.getPatent(req.params.patentId);
      if (!patent) {
        return res.status(404).json({ message: "Patent not found" });
      }

      if (!patent.hederaTopicId || !patent.hederaMessageId) {
        return res.status(400).json({ message: "Patent not stored on blockchain" });
      }

      // Verify on Hedera blockchain
      const verification = await hederaService.verifyPatentHash(
        patent.hederaTopicId,
        patent.hederaMessageId,
        patent.hashValue!
      );

      res.json(verification);
    } catch (error) {
      console.error("Error verifying patent:", error);
      res.status(500).json({ message: "Failed to verify patent on blockchain" });
    }
  });

  app.post('/api/blockchain/mint-nft/:patentId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const patent = await storage.getPatent(req.params.patentId);
      
      if (!patent || patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (patent.hederaNftId) {
        return res.status(400).json({ message: "NFT already minted for this patent" });
      }

      // Get user's wallet configuration
      const user = await storage.getUserById(userId);
      const walletConfig = user?.settings?.walletConfig;
      
      if (!walletConfig || !walletConfig.accountId) {
        return res.status(400).json({ message: "Wallet not configured. Please configure your Hedera wallet first." });
      }

      // Check if it's a legacy wallet with private key
      if (walletConfig.walletType === 'legacy' && !('privateKey' in walletConfig && walletConfig.privateKey)) {
        return res.status(400).json({ message: "Legacy wallet requires private key. Please reconfigure your wallet." });
      }

      // For now, skip NFT minting for HashPack wallets (requires transaction signing)
      if (walletConfig.walletType === 'hashpack') {
        return res.status(400).json({ message: "NFT minting for HashPack wallets requires transaction signing implementation." });
      }

      // Mint NFT on Hedera with legacy wallet
      const nftResult = await hederaService.mintPatentNFTWithWallet(patent, walletConfig);

      // Update patent with NFT information
      await storage.updatePatent(req.params.patentId, {
        hederaNftId: nftResult.nftId,
      });

      // Create blockchain transaction record
      await storage.createBlockchainTransaction({
        patentId: patent.id,
        transactionType: 'nft_mint',
        hederaTransactionId: nftResult.transactionId,
        status: 'confirmed',
      });

      // Create activity record
      await storage.createPatentActivity({
        patentId: patent.id,
        userId,
        activityType: 'nft_minted',
        description: `NFT minted for patent "${patent.title}"`,
      });

      res.json(nftResult);
    } catch (error) {
      console.error("Error minting NFT:", error);
      res.status(500).json({ message: "Failed to mint patent NFT" });
    }
  });

  // Verify ownership endpoint
  app.post('/api/blockchain/verify-ownership', requireAuth, async (req: any, res) => {
    try {
      const { verificationMethod, identifier } = req.body;
      const userId = req.user.id;

      let patent: Patent | undefined = undefined;
      
      // Find patent based on verification method
      if (verificationMethod === 'patent_id') {
        patent = await storage.getPatent(identifier);
      } else if (verificationMethod === 'nft_id') {
        // Find patent by NFT ID
        const patents = await storage.getPatentsByUser(userId);
        patent = patents.find(p => p.hederaNftId === identifier);
      } else if (verificationMethod === 'transaction_id') {
        // Find patent by transaction ID
        const patents = await storage.getPatentsByUser(userId);
        patent = patents.find(p => p.hederaTransactionId === identifier);
      }

      if (!patent) {
        return res.status(404).json({ 
          verified: false,
          message: "Patent not found with the provided identifier" 
        });
      }

      // Verify ownership
      const isOwner = patent.userId === userId;
      
      if (!isOwner) {
        return res.status(403).json({ 
          verified: false,
          message: "You are not the owner of this patent" 
        });
      }

      // Get user information
      const user = req.user;

      // Verify blockchain data if available
      let blockchainVerification: any = null;
      if (patent.hederaTopicId && patent.hederaMessageId && patent.hashValue) {
        try {
          blockchainVerification = await hederaService.verifyPatentHash(
            patent.hederaTopicId,
            patent.hederaMessageId,
            patent.hashValue
          );
        } catch (error) {
          console.error('Blockchain verification failed:', error);
        }
      }

      // Return verification results
      const verificationResults = {
        verified: true,
        owner: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          walletAddress: null // Not implemented yet
        },
        patent: {
          id: patent.id,
          title: patent.title,
          status: patent.status,
          createdAt: patent.createdAt,
          hederaNftId: patent.hederaNftId,
          hederaTopicId: patent.hederaTopicId,
        },
        ownership: {
          original: true, // Assuming original owner for now
          royalties: "0%", // Not implemented yet
          transferHistory: [
            {
              type: "Initial Creation",
              from: "Patent System",
              to: `${user.firstName} ${user.lastName}`,
              timestamp: patent.createdAt,
              status: "Completed"
            }
          ]
        },
        blockchain: {
          network: "Hedera Testnet",
          transactionId: patent.hederaTransactionId || null,
          timestamp: patent.createdAt,
          consensus: blockchainVerification?.verified ? "Verified" : "Pending",
          gasUsed: "0.001"
        }
      };

      res.json(verificationResults);
    } catch (error) {
      console.error("Error verifying ownership:", error);
      res.status(500).json({ 
        verified: false,
        message: "Failed to verify ownership" 
      });
    }
  });

  // Document management routes
  app.get('/api/documents/user', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const documents = await storage.getPatentDocumentsByUser(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching user documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get('/api/documents/:id/download', requireAuth, async (req: any, res) => {
    try {
      const documentId = req.params.id;
      const userId = req.user.id;
      
      // Get document and verify ownership
      const documents = await storage.getPatentDocumentsByUser(userId);
      const document = documents.find(doc => doc.id === documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if file exists
      if (!fs.existsSync(document.filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }

      // Set appropriate headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Content-Type', document.fileType);
      
      // Stream the file
      const fileStream = fs.createReadStream(document.filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  app.delete('/api/documents/:id', requireAuth, async (req: any, res) => {
    try {
      const documentId = req.params.id;
      const userId = req.user.id;
      
      // Get document and verify ownership
      const documents = await storage.getPatentDocumentsByUser(userId);
      const document = documents.find(doc => doc.id === documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Delete the document from storage
      await storage.deletePatentDocument(documentId);
      
      // Delete physical file if it exists
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // HashPack wallet connection routes
  app.post('/api/wallet/hashpack/connect', requireAuth, async (req: any, res) => {
    try {
      const { accountId, network, sessionData } = req.body;
      const userId = req.user.id;

      if (!accountId || !network) {
        return res.status(400).json({ message: 'Account ID and network are required' });
      }

      // Store HashPack wallet info in user settings as fallback
      const hashPackConfig = {
        walletType: 'hashpack',
        accountId,
        network,
        sessionData: sessionData || {},
        lastConnected: new Date().toISOString(),
        isActive: true
      };

      // Update user settings with HashPack wallet config
      const user = await storage.getUserById(userId);
      const currentSettings = user?.settings || {};
      const updatedSettings = {
        ...currentSettings,
        hashPackWallet: hashPackConfig
      };

      await storage.updateUserSettings(userId, updatedSettings);

      res.json({
        success: true,
        message: 'HashPack wallet connected successfully',
        connection: {
          accountId: hashPackConfig.accountId,
          network: hashPackConfig.network,
          walletType: hashPackConfig.walletType
        }
      });
    } catch (error) {
      console.error('Error connecting HashPack wallet:', error);
      res.status(500).json({ message: 'Failed to connect HashPack wallet' });
    }
  });

  app.get('/api/wallet/hashpack/status', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get HashPack wallet from user settings
      const user = await storage.getUserById(userId);
      const hashPackWallet = user?.settings?.hashPackWallet;

      // Validate that we have a proper connection with account info
      if (!hashPackWallet || !hashPackWallet.isActive || !hashPackWallet.accountId) {
        return res.json({
          isConnected: false,
          message: 'No active HashPack wallet connection'
        });
      }

      res.json({
        isConnected: true,
        accountId: hashPackWallet.accountId,
        network: hashPackWallet.network,
        lastConnected: hashPackWallet.lastConnected,
        sessionData: hashPackWallet.sessionData
      });
    } catch (error) {
      console.error('Error checking HashPack wallet status:', error);
      res.status(500).json({ message: 'Failed to check HashPack wallet status' });
    }
  });

  app.delete('/api/wallet/hashpack/disconnect', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Remove HashPack wallet from user settings
      const user = await storage.getUserById(userId);
      if (user?.settings?.hashPackWallet) {
        const { hashPackWallet, ...otherSettings } = user.settings;
        await storage.updateUserSettings(userId, otherSettings);
      }

      res.json({
        success: true,
        message: 'HashPack wallet disconnected successfully'
      });
    } catch (error) {
      console.error('Error disconnecting HashPack wallet:', error);
      res.status(500).json({ message: 'Failed to disconnect HashPack wallet' });
    }
  });

  // Search routes
  app.get('/api/search/patents', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }

      const results = await storage.searchPatents(query, userId);
      res.json(results);
    } catch (error) {
      console.error("Error searching patents:", error);
      res.status(500).json({ message: "Failed to search patents" });
    }
  });

  // HashPack transaction routes
  const { setupHashPackRoutes } = await import('./routes/hashpackRoutes');
  setupHashPackRoutes(app);

  // Appointment routes
  // Book appointment (only for users)
  app.post('/api/appointments/book', requireAuth, requireUser, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { consultantId, title, description, appointmentDate, duration } = req.body;

      // Verify consultant exists
      const consultant = await storage.getConsultant(consultantId);
      if (!consultant) {
        return res.status(404).json({ message: 'Consultant not found' });
      }

      // Create appointment
      const appointment = await storage.createAppointment({
        userId,
        consultantId,
        title,
        description,
        appointmentDate: new Date(appointmentDate),
        duration,
        status: 'pending'
      });

      res.status(201).json(appointment);
    } catch (error) {
      console.error('Error booking appointment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get user's appointments
  app.get('/api/appointments/user', requireAuth, requireUser, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const appointments = await storage.getAppointmentsByUser(userId);
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching user appointments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get consultant's appointments
  app.get('/api/appointments/consultant', requireAuth, requireConsultant, async (req: any, res) => {
    try {
      const consultant = await storage.getConsultantByUserId(req.user!.id);
      if (!consultant) {
        // If consultant profile doesn't exist, return empty array instead of error
        return res.json([]);
      }

      const appointments = await storage.getAppointmentsByConsultant(consultant.id);
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching consultant appointments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update appointment status (consultant can confirm/cancel)
  app.put('/api/appointments/:id/status', requireAuth, requireConsultant, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, meetingLink } = req.body;

      // Verify appointment exists and belongs to consultant
      const consultant = await storage.getConsultantByUserId(req.user!.id);
      if (!consultant) {
        return res.status(404).json({ message: 'Consultant profile not found' });
      }

      const appointment = await storage.getAppointment(id);
      if (!appointment || appointment.consultantId !== consultant.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Update appointment
      const updatedAppointment = await storage.updateAppointment(id, {
        status,
        meetingLink,
        updatedAt: new Date()
      });

      if (!updatedAppointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      res.json(updatedAppointment);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Cancel appointment (user can cancel their own appointments)
  app.delete('/api/appointments/:id', requireAuth, requireUser, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Verify appointment exists and belongs to user
      const appointment = await storage.getAppointment(id);
      if (!appointment || appointment.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Delete appointment
      await storage.deleteAppointment(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error canceling appointment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Chat routes
  // Create or get chat room
  app.post('/api/chat/room', requireAuth, requireUserOrConsultant, async (req: any, res) => {
    try {
      const { userId, consultantId } = req.body;
      
      // Determine participant IDs
      const participantUserId = req.user!.role === 'user' ? req.user!.id : userId;
      const participantConsultantId = req.user!.role === 'consultant' ? 
        (await storage.getConsultantByUserId(req.user!.id))?.id : consultantId;

      if (!participantUserId || !participantConsultantId) {
        return res.status(400).json({ message: 'User ID and consultant ID are required' });
      }

      // Verify consultant exists
      const consultant = await storage.getConsultant(participantConsultantId);
      if (!consultant) {
        return res.status(404).json({ message: 'Consultant not found' });
      }

      // Create or get chat room
      const chatRoom = await storage.createChatRoom(participantUserId, participantConsultantId);
      res.json(chatRoom);
    } catch (error) {
      console.error('Error creating chat room:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get chat rooms for user
  app.get('/api/chat/rooms', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      let chatRooms;

      if (req.user!.role === 'user') {
        chatRooms = await storage.getChatRoomsByUser(userId);
      } else if (req.user!.role === 'consultant') {
        const consultant = await storage.getConsultantByUserId(userId);
        if (!consultant) {
          // If consultant profile doesn't exist, return empty array instead of error
          return res.json([]);
        }
        chatRooms = await storage.getChatRoomsByConsultant(consultant.id);
      } else {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(chatRooms);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get chat messages for a room
  app.get('/api/chat/messages/:roomId', requireAuth, async (req: any, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.user!.id;

      // Verify user has access to this chat room
      const chatRoom = await storage.getChatRoom(roomId);
      if (!chatRoom) {
        return res.status(404).json({ message: 'Chat room not found' });
      }

      // Check if user is a participant in the chat room
      const isParticipant = chatRoom.userId === userId || 
        (await storage.getConsultantByUserId(userId))?.id === chatRoom.consultantId;
        
      if (!isParticipant) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const messages = await storage.getChatMessages(roomId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Send chat message
  app.post('/api/chat/messages', requireAuth, async (req: any, res) => {
    try {
      const { chatRoomId, message } = req.body;
      const senderId = req.user!.id;

      // Verify chat room exists
      const chatRoom = await storage.getChatRoom(chatRoomId);
      if (!chatRoom) {
        return res.status(404).json({ message: 'Chat room not found' });
      }

      // Check if user is a participant in the chat room
      const isParticipant = chatRoom.userId === senderId || 
        (await storage.getConsultantByUserId(senderId))?.id === chatRoom.consultantId;
        
      if (!isParticipant) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Create message
      const chatMessage = await storage.createChatMessage({
        chatRoomId,
        senderId,
        message
      });

      res.status(201).json(chatMessage);
    } catch (error) {
      console.error('Error sending chat message:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin routes
  // Get all users (admin only)
  app.get('/api/admin/users', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const allUsers = await db.select().from(users);
      
      // Remove password hashes from response
      const usersWithoutPasswords = allUsers.map(user => {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update user role (admin only)
  app.put('/api/admin/users/:id/role', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // Validate role
      if (!['user', 'consultant', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      // Update user role
      const [updatedUser] = await db.update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get all appointments (admin only)
  app.get('/api/admin/appointments', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const allAppointments = await db.select().from(appointments);
      res.json(allAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Delete user (admin only)
  app.delete('/api/admin/users/:id', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

      // Delete user
      await db.delete(users).where(eq(users.id, id));

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get all consultants (admin only)
  app.get('/api/admin/consultants', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const allConsultants = await storage.getAllConsultants();
      res.json(allConsultants);
    } catch (error) {
      console.error('Error fetching consultants:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get unverified consultants (admin only)
  app.get('/api/admin/consultants/unverified', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const unverifiedConsultants = await storage.getUnverifiedConsultants();
      res.json(unverifiedConsultants);
    } catch (error) {
      console.error('Error fetching unverified consultants:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Verify consultant (admin only)
  app.put('/api/admin/consultants/:id/verify', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      // Verify consultant
      const verifiedConsultant = await storage.verifyConsultant(id, req.user.id, notes);

      if (!verifiedConsultant) {
        return res.status(404).json({ message: 'Consultant not found' });
      }

      res.json(verifiedConsultant);
    } catch (error) {
      console.error('Error verifying consultant:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Reject consultant application (admin only)
  app.put('/api/admin/consultants/:id/reject', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      // Reject consultant application
      const rejectedConsultant = await storage.rejectConsultant(id, req.user.id, notes);

      if (!rejectedConsultant) {
        return res.status(404).json({ message: 'Consultant not found' });
      }

      res.json(rejectedConsultant);
    } catch (error) {
      console.error('Error rejecting consultant:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get consultant verification status (admin only)
  app.get('/api/admin/consultants/:id/status', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

      // Get consultant
      const consultant = await storage.getConsultant(id);

      if (!consultant) {
        return res.status(404).json({ message: 'Consultant not found' });
      }

      res.json({
        id: consultant.id,
        isVerified: consultant.isVerified,
        verifiedBy: consultant.verifiedBy,
        verifiedAt: consultant.verifiedAt,
        verificationNotes: consultant.verificationNotes
      });
    } catch (error) {
      console.error('Error fetching consultant status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

