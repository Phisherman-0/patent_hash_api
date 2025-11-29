import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertPatentSchema } from '../shared/schema';
import fs from 'fs';
import crypto from 'crypto';
import hederaService from '../services/hederaService';
import contractSigningService from '../services/contractSigningService';

export const patentController = {
  // Get all patents for current user
  getPatents: async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const patents = await storage.getPatentsByUser(userId);
      res.json(patents);
    } catch (error) {
      console.error("Error fetching patents:", error);
      res.status(500).json({ message: "Failed to fetch patents" });
    }
  },

  // Get a specific patent by ID
  getPatent: async (req: any, res: Response) => {
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
  },

  // Create a new patent
  createPatent: async (req: any, res: Response) => {
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

      // Verify contract signature if provided
      const { signature, publicKey, signedMessage } = req.body;
      if (signature && publicKey) {
        const verificationResult = await contractSigningService.verifyHederaSignature(
          signedMessage,
          signature,
          publicKey,
          walletConfig.accountId
        );

        if (!verificationResult.isValid) {
          return res.status(400).json({
            message: 'Invalid contract signature',
            error: verificationResult.message
          });
        }

        console.log('✅ Contract signature verified for account:', walletConfig.accountId);
      }
      
      const patentData = insertPatentSchema.parse({
        ...req.body,
        userId,
        // Initially set to pending, will update to approved/rejected based on success
        status: 'pending',
      });

      // Create the patent with signature data
      patent = await storage.createPatent({
        ...patentData,
        contractSignature: signature || null,
        signerPublicKey: publicKey || null,
        signedAt: signature ? new Date() : null
      });

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
  },

  // Update a patent
  updatePatent: async (req: any, res: Response) => {
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
  },

  // Delete a patent
  deletePatent: async (req: any, res: Response) => {
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
  }
};