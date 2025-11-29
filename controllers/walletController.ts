import { Request, Response } from 'express';
import { storage } from '../storage';
import hederaService from '../services/hederaService';

export const walletController = {
  // Validate wallet
  validate: async (req: any, res: Response) => {
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
  },

  // Configure wallet
  configure: async (req: any, res: Response) => {
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
  },

  // Get wallet status
  getStatus: async (req: any, res: Response) => {
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
  },

  // Disconnect wallet
  disconnect: async (req: any, res: Response) => {
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
  }
};