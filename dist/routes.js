import { createServer } from 'http';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { storage } from './storage';
import { requireAuth, register, login, logout, getCurrentUser } from './auth';
import { aiService } from './services/aiService';
import { hederaService } from './services/hederaService';
import { pool } from './db';
import { insertPatentSchema } from './shared/schema';
import { db } from './db';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';
// Configure multer for file uploads
const upload = multer({
    dest: "uploads/",
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
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
        }
        else {
            cb(null, false);
        }
    }
});
export async function setupRoutes(app) {
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
            sameSite: IS_PRODUCTION ? 'strict' : 'lax'
        }
    }));
    // Get user settings endpoint
    app.get('/api/auth/user/settings', requireAuth, async (req, res) => {
        try {
            const user = await storage.getUserById(req.user.id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            res.json(user.settings || {});
        }
        catch (error) {
            console.error("Error fetching user settings:", error);
            res.status(500).json({ message: "Failed to fetch settings" });
        }
    });
    // Update user settings endpoint
    app.put('/api/auth/user/settings', requireAuth, async (req, res) => {
        try {
            const user = await storage.getUserById(req.user.id);
            const { settings } = req.body;
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            // Merge new settings with existing ones
            const currentSettings = user.settings || {};
            const updatedSettings = { ...currentSettings, ...settings };
            // Update user settings
            await storage.updateUserSettings(req.user.id, updatedSettings);
            res.json({ message: "Settings updated successfully", settings: updatedSettings });
        }
        catch (error) {
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
            const userId = req.user.id;
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
        }
        catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
    // Upload profile image
    app.post('/api/auth/profile/image', requireAuth, profileImageUpload.single('profileImage'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No image file provided' });
            }
            const userId = req.user.id;
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
        }
        catch (error) {
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
            const userId = req.user.id;
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
        }
        catch (error) {
            console.error('Error deleting profile image:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
    // Dashboard routes
    app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            const stats = await storage.getUserStats(userId);
            res.json(stats);
        }
        catch (error) {
            console.error("Error fetching dashboard stats:", error);
            res.status(500).json({ message: "Failed to fetch dashboard stats" });
        }
    });
    app.get('/api/dashboard/activities', requireAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            const limit = parseInt(req.query.limit) || 10;
            const activities = await storage.getUserActivities(userId, limit);
            res.json(activities);
        }
        catch (error) {
            console.error("Error fetching activities:", error);
            res.status(500).json({ message: "Failed to fetch activities" });
        }
    });
    app.get('/api/dashboard/category-stats', requireAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            const categoryStats = await storage.getPatentCategoryStats(userId);
            res.json(categoryStats);
        }
        catch (error) {
            console.error("Error fetching category stats:", error);
            res.status(500).json({ message: "Failed to fetch category stats" });
        }
    });
    // Patent routes
    app.get('/api/patents', requireAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            const patents = await storage.getPatentsByUser(userId);
            res.json(patents);
        }
        catch (error) {
            console.error("Error fetching patents:", error);
            res.status(500).json({ message: "Failed to fetch patents" });
        }
    });
    app.get('/api/patents/:id', requireAuth, async (req, res) => {
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
        }
        catch (error) {
            console.error("Error fetching patent:", error);
            res.status(500).json({ message: "Failed to fetch patent" });
        }
    });
    app.post('/api/patents', requireAuth, upload.array('documents'), async (req, res) => {
        let patent = null;
        try {
            const userId = req.user.id;
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
                // Store patent hash on Hedera blockchain
                try {
                    console.log(`🔗 Attempting to store patent ${patent.id} on Hedera blockchain...`);
                    const hederaResult = await hederaService.storePatentHash(patent.id, req.files[0].path);
                    // Update patent with Hedera information
                    await storage.updatePatent(patent.id, {
                        hederaTopicId: hederaResult.topicId,
                        hederaMessageId: hederaResult.messageId,
                        hederaTransactionId: hederaResult.transactionId,
                        hashValue: hederaResult.hash,
                    });
                    console.log('✅ Patent successfully stored on Hedera blockchain:', hederaResult);
                }
                catch (hederaError) {
                    console.error('❌ Hedera blockchain storage failed:', hederaError.message);
                    // Store error details but continue without blockchain storage
                    await storage.updatePatent(patent.id, {
                        hashValue: crypto.createHash('sha256').update(fs.readFileSync(req.files[0].path)).digest('hex'),
                        hederaError: hederaError.message
                    });
                    console.log('⚠️  Patent saved without blockchain verification due to Hedera error');
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
        }
        catch (error) {
            console.error("Error creating patent:", error);
            // If patent was created but failed later, update status to rejected
            if (patent?.id) {
                try {
                    await storage.updatePatent(patent.id, {
                        status: 'rejected',
                    });
                }
                catch (updateError) {
                    console.error("Error updating patent status to rejected:", updateError);
                }
            }
            res.status(500).json({ message: "Failed to create patent" });
        }
    });
    app.put('/api/patents/:id', requireAuth, async (req, res) => {
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
        }
        catch (error) {
            console.error("Error updating patent:", error);
            res.status(500).json({ message: "Failed to update patent" });
        }
    });
    app.delete('/api/patents/:id', requireAuth, async (req, res) => {
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
        }
        catch (error) {
            console.error("Error deleting patent:", error);
            res.status(500).json({ message: "Failed to delete patent" });
        }
    });
    // AI Services routes
    app.post('/api/ai/prior-art-search', requireAuth, async (req, res) => {
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
        }
        catch (error) {
            console.error("Error in prior art search:", error);
            res.status(500).json({ message: "Failed to perform prior art search" });
        }
    });
    app.post('/api/ai/patent-valuation', requireAuth, async (req, res) => {
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
        }
        catch (error) {
            console.error("Error in patent valuation:", error);
            res.status(500).json({ message: "Failed to evaluate patent value" });
        }
    });
    app.post('/api/ai/similarity-detection', requireAuth, async (req, res) => {
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
        }
        catch (error) {
            console.error("Error in similarity detection:", error);
            res.status(500).json({ message: "Failed to detect similarity" });
        }
    });
    app.post('/api/ai/patent-drafting', requireAuth, async (req, res) => {
        try {
            const { title, description, category } = req.body;
            // Generate patent document using AI
            const draftDocument = await aiService.generatePatentDraft({
                title,
                description,
                category,
            });
            res.json(draftDocument);
        }
        catch (error) {
            console.error("Error in patent drafting:", error);
            res.status(500).json({ message: "Failed to generate patent draft" });
        }
    });
    // Blockchain verification routes
    app.get('/api/blockchain/verify/:patentId', requireAuth, async (req, res) => {
        try {
            const patent = await storage.getPatent(req.params.patentId);
            if (!patent) {
                return res.status(404).json({ message: "Patent not found" });
            }
            if (!patent.hederaTopicId || !patent.hederaMessageId) {
                return res.status(400).json({ message: "Patent not stored on blockchain" });
            }
            // Verify on Hedera blockchain
            const verification = await hederaService.verifyPatentHash(patent.hederaTopicId, patent.hederaMessageId, patent.hashValue);
            res.json(verification);
        }
        catch (error) {
            console.error("Error verifying patent:", error);
            res.status(500).json({ message: "Failed to verify patent on blockchain" });
        }
    });
    app.post('/api/blockchain/mint-nft/:patentId', requireAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            const patent = await storage.getPatent(req.params.patentId);
            if (!patent || patent.userId !== userId) {
                return res.status(403).json({ message: "Access denied" });
            }
            if (patent.hederaNftId) {
                return res.status(400).json({ message: "NFT already minted for this patent" });
            }
            // Mint NFT on Hedera
            const nftResult = await hederaService.mintPatentNFT(patent);
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
        }
        catch (error) {
            console.error("Error minting NFT:", error);
            res.status(500).json({ message: "Failed to mint patent NFT" });
        }
    });
    // Verify ownership endpoint
    app.post('/api/blockchain/verify-ownership', requireAuth, async (req, res) => {
        try {
            const { verificationMethod, identifier } = req.body;
            const userId = req.user.id;
            let patent = null;
            // Find patent based on verification method
            if (verificationMethod === 'patent_id') {
                patent = await storage.getPatent(identifier);
            }
            else if (verificationMethod === 'nft_id') {
                // Find patent by NFT ID
                const patents = await storage.getPatentsByUser(userId);
                patent = patents.find(p => p.hederaNftId === identifier);
            }
            else if (verificationMethod === 'transaction_id') {
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
            // Verify on blockchain if Hedera data exists
            let blockchainVerification = null;
            if (patent.hederaTopicId && patent.hederaMessageId && patent.hashValue) {
                try {
                    blockchainVerification = await hederaService.verifyPatentHash(patent.hederaTopicId, patent.hederaMessageId, patent.hashValue);
                }
                catch (error) {
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
        }
        catch (error) {
            console.error("Error verifying ownership:", error);
            res.status(500).json({
                verified: false,
                message: "Failed to verify ownership"
            });
        }
    });
    // Document management routes
    app.get('/api/documents/user', requireAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            const documents = await storage.getPatentDocumentsByUser(userId);
            res.json(documents);
        }
        catch (error) {
            console.error("Error fetching user documents:", error);
            res.status(500).json({ message: "Failed to fetch documents" });
        }
    });
    app.get('/api/documents/:id/download', requireAuth, async (req, res) => {
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
        }
        catch (error) {
            console.error("Error downloading document:", error);
            res.status(500).json({ message: "Failed to download document" });
        }
    });
    app.delete('/api/documents/:id', requireAuth, async (req, res) => {
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
        }
        catch (error) {
            console.error("Error deleting document:", error);
            res.status(500).json({ message: "Failed to delete document" });
        }
    });
    // Search routes
    app.get('/api/search/patents', requireAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            const query = req.query.q;
            if (!query) {
                return res.status(400).json({ message: "Search query required" });
            }
            const results = await storage.searchPatents(query, userId);
            res.json(results);
        }
        catch (error) {
            console.error("Error searching patents:", error);
            res.status(500).json({ message: "Failed to search patents" });
        }
    });
    const httpServer = createServer(app);
    return httpServer;
}
