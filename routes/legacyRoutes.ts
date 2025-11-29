/**
 * Legacy Routes
 * This file contains routes that haven't been modularized yet.
 * These will be gradually migrated to separate route files.
 */

import { Express } from 'express';
import { requireAuth } from '../auth';
import { requireUser, requireConsultant, requireAdmin, requireUserOrConsultant } from '../roleMiddleware';
import { storage } from '../storage';
import { aiService } from '../services/aiService';
import hederaService from '../services/hederaService';
import { db } from '../db';
import { users, consultants, appointments } from '../shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export async function setupLegacyRoutes(app: Express): Promise<void> {
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

  // AI Services routes
  app.post('/api/ai/prior-art-search', requireAuth, async (req: any, res) => {
    try {
      const { patentId, description } = req.body;
      const userId = req.user.id;

      const patent = await storage.getPatent(patentId);
      if (!patent || patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const searchResults = await aiService.performPriorArtSearch(description);

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

      const patent = await storage.getPatent(patentId);
      if (!patent || patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const valuation = await aiService.evaluatePatentValue(patent);

      await storage.updatePatent(patentId, {
        estimatedValue: valuation.estimatedValue.toString(),
      });

      await storage.createAIAnalysis({
        patentId,
        analysisType: 'valuation',
        result: valuation,
        confidence: valuation.confidence.toString(),
      });

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

      const patent = await storage.getPatent(patentId);
      if (!patent || patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const similarity = await aiService.detectSimilarity(patent.description, targetText);

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

      const user = await storage.getUserById(userId);
      const walletConfig = user?.settings?.walletConfig;
      
      if (!walletConfig || !walletConfig.accountId) {
        return res.status(400).json({ message: "Wallet not configured. Please configure your Hedera wallet first." });
      }

      if (walletConfig.walletType === 'legacy' && !('privateKey' in walletConfig && walletConfig.privateKey)) {
        return res.status(400).json({ message: "Legacy wallet requires private key. Please reconfigure your wallet." });
      }

      if (walletConfig.walletType === 'hashpack') {
        return res.status(400).json({ message: "NFT minting for HashPack wallets requires transaction signing implementation." });
      }

      const nftResult = await hederaService.mintPatentNFTWithWallet(patent, walletConfig);

      await storage.updatePatent(req.params.patentId, {
        hederaNftId: nftResult.nftId,
      });

      await storage.createBlockchainTransaction({
        patentId: patent.id,
        transactionType: 'nft_mint',
        hederaTransactionId: nftResult.transactionId,
        status: 'confirmed',
      });

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

      let patent: any = undefined;
      
      if (verificationMethod === 'patent_id') {
        patent = await storage.getPatent(identifier);
      } else if (verificationMethod === 'nft_id') {
        const patents = await storage.getPatentsByUser(userId);
        patent = patents.find(p => p.hederaNftId === identifier);
      } else if (verificationMethod === 'transaction_id') {
        const patents = await storage.getPatentsByUser(userId);
        patent = patents.find(p => p.hederaTransactionId === identifier);
      }

      if (!patent) {
        return res.status(404).json({ 
          verified: false,
          message: "Patent not found with the provided identifier" 
        });
      }

      const isOwner = patent.userId === userId;
      
      if (!isOwner) {
        return res.status(403).json({ 
          verified: false,
          message: "You are not the owner of this patent" 
        });
      }

      const user = req.user;

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

      const verificationResults = {
        verified: true,
        owner: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          walletAddress: null
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
          original: true,
          royalties: "0%",
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
      
      const documents = await storage.getPatentDocumentsByUser(userId);
      const document = documents.find(doc => doc.id === documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (!fs.existsSync(document.filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Content-Type', document.fileType);
      
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
      
      const documents = await storage.getPatentDocumentsByUser(userId);
      const document = documents.find(doc => doc.id === documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      await storage.deletePatentDocument(documentId);
      
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
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

  // Consultant routes
  app.post('/api/consultants/profile', requireAuth, requireConsultant, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { specialization, bio, experienceYears, hourlyRate, availability } = req.body;

      const existingConsultant = await storage.getConsultantByUserId(userId);
      
      let consultant;
      if (existingConsultant) {
        consultant = await storage.updateConsultant(existingConsultant.id, {
          specialization,
          bio,
          experienceYears,
          hourlyRate,
          availability,
          updatedAt: new Date()
        });
      } else {
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

  app.get('/api/consultants', async (req, res) => {
    try {
      const consultants = await storage.getAllConsultants();
      res.json(consultants);
    } catch (error) {
      console.error('Error fetching consultants:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

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

  // Appointment routes
  app.post('/api/appointments/book', requireAuth, requireUser, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { consultantId, title, description, appointmentDate, duration } = req.body;

      const consultant = await storage.getConsultant(consultantId);
      if (!consultant) {
        return res.status(404).json({ message: 'Consultant not found' });
      }

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

  app.get('/api/appointments/consultant', requireAuth, requireConsultant, async (req: any, res) => {
    try {
      const consultant = await storage.getConsultantByUserId(req.user!.id);
      if (!consultant) {
        return res.json([]);
      }

      const appointments = await storage.getAppointmentsByConsultant(consultant.id);
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching consultant appointments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/appointments/:id/status', requireAuth, requireConsultant, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, meetingLink } = req.body;

      const consultant = await storage.getConsultantByUserId(req.user!.id);
      if (!consultant) {
        return res.status(404).json({ message: 'Consultant profile not found' });
      }

      const appointment = await storage.getAppointment(id);
      if (!appointment || appointment.consultantId !== consultant.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

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

  app.delete('/api/appointments/:id', requireAuth, requireUser, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const appointment = await storage.getAppointment(id);
      if (!appointment || appointment.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await storage.deleteAppointment(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error canceling appointment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Chat routes
  app.post('/api/chat/room', requireAuth, requireUserOrConsultant, async (req: any, res) => {
    try {
      const { userId, consultantId } = req.body;
      
      const participantUserId = req.user!.role === 'user' ? req.user!.id : userId;
      const participantConsultantId = req.user!.role === 'consultant' ? 
        (await storage.getConsultantByUserId(req.user!.id))?.id : consultantId;

      if (!participantUserId || !participantConsultantId) {
        return res.status(400).json({ message: 'User ID and consultant ID are required' });
      }

      const consultant = await storage.getConsultant(participantConsultantId);
      if (!consultant) {
        return res.status(404).json({ message: 'Consultant not found' });
      }

      const chatRoom = await storage.createChatRoom(participantUserId, participantConsultantId);
      res.json(chatRoom);
    } catch (error) {
      console.error('Error creating chat room:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/chat/rooms', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      let chatRooms;

      if (req.user!.role === 'user') {
        chatRooms = await storage.getChatRoomsByUser(userId);
      } else if (req.user!.role === 'consultant') {
        const consultant = await storage.getConsultantByUserId(userId);
        if (!consultant) {
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

  app.get('/api/chat/messages/:roomId', requireAuth, async (req: any, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.user!.id;

      const chatRoom = await storage.getChatRoom(roomId);
      if (!chatRoom) {
        return res.status(404).json({ message: 'Chat room not found' });
      }

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

  app.post('/api/chat/messages', requireAuth, async (req: any, res) => {
    try {
      const { chatRoomId, message } = req.body;
      const senderId = req.user!.id;

      const chatRoom = await storage.getChatRoom(chatRoomId);
      if (!chatRoom) {
        return res.status(404).json({ message: 'Chat room not found' });
      }

      const isParticipant = chatRoom.userId === senderId || 
        (await storage.getConsultantByUserId(senderId))?.id === chatRoom.consultantId;
        
      if (!isParticipant) {
        return res.status(403).json({ message: 'Access denied' });
      }

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
  app.get('/api/admin/users', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const allUsers = await db.select().from(users);
      
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

  app.put('/api/admin/users/:id/role', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['user', 'consultant', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      const [updatedUser] = await db.update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { passwordHash, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/admin/appointments', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const allAppointments = await db.select().from(appointments);
      res.json(allAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/admin/users/:id', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await db.delete(users).where(eq(users.id, id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/admin/consultants', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const allConsultants = await storage.getAllConsultants();
      res.json(allConsultants);
    } catch (error) {
      console.error('Error fetching consultants:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/admin/consultants/unverified', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const unverifiedConsultants = await storage.getUnverifiedConsultants();
      res.json(unverifiedConsultants);
    } catch (error) {
      console.error('Error fetching unverified consultants:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/admin/consultants/:id/verify', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

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

  app.put('/api/admin/consultants/:id/reject', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

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

  app.get('/api/admin/consultants/:id/status', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

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

  // HashPack wallet connection routes
  app.post('/api/wallet/hashpack/connect', requireAuth, async (req: any, res) => {
    try {
      const { accountId, network, sessionData } = req.body;
      const userId = req.user.id;

      if (!accountId || !network) {
        return res.status(400).json({ message: 'Account ID and network are required' });
      }

      const hashPackConfig = {
        walletType: 'hashpack',
        accountId,
        network,
        sessionData: sessionData || {},
        lastConnected: new Date().toISOString(),
        isActive: true
      };

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
      
      const user = await storage.getUserById(userId);
      const hashPackWallet = user?.settings?.hashPackWallet;

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
}
