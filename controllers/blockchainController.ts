import { Request, Response } from 'express';
import { storage } from '../storage';
import hederaService from '../services/hederaService';
import { Patent } from '../shared/schema';

export const blockchainController = {
  // Verify patent on blockchain
  verifyPatent: async (req: any, res: Response) => {
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
  },

  // Mint NFT for patent
  mintNFT: async (req: any, res: Response) => {
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
  },

  // Verify ownership
  verifyOwnership: async (req: any, res: Response) => {
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
  }
};