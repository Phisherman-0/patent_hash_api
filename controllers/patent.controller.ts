import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertPatentSchema } from '../models/index';
import { blockchainService } from '../services/blockchainService';
import fs from 'fs';
import crypto from 'crypto';

export const patentController = {
  getAll: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const patents = await storage.getPatentsByUser(req.user.id);
      res.json(patents);
    } catch (error) {
      console.error("Error fetching patents:", error);
      res.status(500).json({ message: "Failed to fetch patents" });
    }
  },

  getOne: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const patent = await storage.getPatent(req.params.id);
      if (!patent) return res.status(404).json({ message: "Patent not found" });
      if (patent.userId !== req.user.id) return res.status(403).json({ message: "Access denied" });
      res.json(patent);
    } catch (error) {
      console.error("Error fetching patent:", error);
      res.status(500).json({ message: "Failed to fetch patent" });
    }
  },

  create: async (req: Request, res: Response) => {
    let patent: any = null;
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const userId = req.user.id;
      
      const user = await storage.getUserById(userId);
      const settings = user?.settings as any;
      if (!settings?.walletConfig?.walletAddress) {
        return res.status(400).json({ 
          message: 'A connected Base wallet is required for patent filing. Please connect MetaMask or WalletConnect.',
          requiresWallet: true
        });
      }
      
      const patentData = insertPatentSchema.parse({
        ...req.body,
        userId,
        status: 'pending',
      });

      patent = await storage.createPatent(patentData);

      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files as Express.Multer.File[]) {
          const fileBuffer = fs.readFileSync(file.path);
          const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

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

        const fileHash = crypto.createHash('sha256').update(fs.readFileSync((req.files as Express.Multer.File[])[0].path)).digest('hex');
        await storage.updatePatent(patent.id, { hashValue: fileHash });

        // Register document hash on Base blockchain
        const txHash = await blockchainService.registerDocument(fileHash);
        if (txHash) {
          await storage.createBlockchainTransaction({
            patentId: patent.id,
            transactionHash: txHash,
            transactionType: 'register',
            status: 'confirmed',
            networkName: 'base-sepolia',
          });
          
          await storage.updatePatent(patent.id, { 
            blockchainTxHash: txHash,
            networkName: 'base-sepolia',
            blockchainStatus: 'confirmed'
          });
          
          console.log(`Patent ${patent.id} registered on Base: ${txHash}`);
        }
      }

      await storage.createPatentActivity({
        patentId: patent.id,
        userId,
        activityType: 'created',
        description: `Patent "${patent.title}" created`,
      });

      const approvedPatent = await storage.updatePatent(patent.id, {
        status: 'approved',
        approvedAt: new Date(),
      });

      res.status(201).json(approvedPatent);
    } catch (error) {
      console.error("Error creating patent:", error);
      if (patent?.id) {
        await storage.updatePatent(patent.id, { status: 'rejected' });
      }
      res.status(500).json({ message: "Failed to create patent" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const patent = await storage.getPatent(req.params.id);
      if (!patent) return res.status(404).json({ message: "Patent not found" });
      if (patent.userId !== req.user.id) return res.status(403).json({ message: "Access denied" });

      const updates = insertPatentSchema.partial().parse(req.body);
      const updatedPatent = await storage.updatePatent(req.params.id, updates);

      await storage.createPatentActivity({
        patentId: patent.id,
        userId: req.user.id,
        activityType: 'updated',
        description: `Patent "${patent.title}" updated`,
      });

      res.json(updatedPatent);
    } catch (error) {
      console.error("Error updating patent:", error);
      res.status(500).json({ message: "Failed to update patent" });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const patent = await storage.getPatent(req.params.id);
      if (!patent) return res.status(404).json({ message: "Patent not found" });
      if (patent.userId !== req.user.id) return res.status(403).json({ message: "Access denied" });

      await storage.deletePatent(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting patent:", error);
      res.status(500).json({ message: "Failed to delete patent" });
    }
  }
};
