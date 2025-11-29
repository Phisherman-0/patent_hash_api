import { Request, Response } from 'express';
import { storage } from '../storage';

export const hashPackController = {
  // Connect HashPack wallet
  connect: async (req: any, res: Response) => {
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
  },

  // Get HashPack wallet status
  getStatus: async (req: any, res: Response) => {
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
  },

  // Disconnect HashPack wallet
  disconnect: async (req: any, res: Response) => {
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
  }
};