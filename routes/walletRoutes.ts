import { Router, Request, Response } from 'express';
import { walletService } from '../services/walletService';
import { requireAuth } from '../auth';

const router = Router();

/**
 * Wallet Routes - Handles all wallet-related operations
 * 
 * These routes follow the same pattern as the hedera-wallet-template
 * for consistency and maintainability.
 */

/**
 * POST /api/wallet/create-patent-hash-transaction
 * Create an unsigned transaction for patent hash storage
 */
router.post('/create-patent-hash-transaction', requireAuth, async (req: Request, res: Response) => {
  try {
    const { patentId, filePath, accountId, network = 'testnet' } = req.body;

    if (!patentId || !filePath || !accountId) {
      return res.status(400).json({
        error: 'Missing required fields: patentId, filePath, accountId'
      });
    }

    const result = await walletService.createPatentHashTransaction(
      patentId,
      filePath,
      accountId,
      network
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error creating patent hash transaction:', error);
    res.status(500).json({
      error: error.message || 'Failed to create patent hash transaction'
    });
  }
});

/**
 * POST /api/wallet/submit-signed-transaction
 * Submit a signed transaction from wallet
 */
router.post('/submit-signed-transaction', requireAuth, async (req: Request, res: Response) => {
  try {
    const { signedTransactionBytes, network = 'testnet' } = req.body;

    if (!signedTransactionBytes) {
      return res.status(400).json({
        error: 'Missing required field: signedTransactionBytes'
      });
    }

    const result = await walletService.submitSignedTransaction(
      signedTransactionBytes,
      network
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error submitting signed transaction:', error);
    res.status(500).json({
      error: error.message || 'Failed to submit signed transaction'
    });
  }
});

/**
 * POST /api/wallet/create-patent-message-transaction
 * Create message submission transaction after topic is created
 */
router.post('/create-patent-message-transaction', requireAuth, async (req: Request, res: Response) => {
  try {
    const { patentId, hash, topicId, accountId, network = 'testnet' } = req.body;

    if (!patentId || !hash || !topicId || !accountId) {
      return res.status(400).json({
        error: 'Missing required fields: patentId, hash, topicId, accountId'
      });
    }

    const result = await walletService.createPatentMessageTransaction(
      patentId,
      hash,
      topicId,
      accountId,
      network
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error creating patent message transaction:', error);
    res.status(500).json({
      error: error.message || 'Failed to create patent message transaction'
    });
  }
});

/**
 * POST /api/wallet/create-nft-transaction
 * Create NFT mint transaction for wallet signing
 */
router.post('/create-nft-transaction', requireAuth, async (req: Request, res: Response) => {
  try {
    const { patent, accountId, network = 'testnet' } = req.body;

    if (!patent || !accountId) {
      return res.status(400).json({
        error: 'Missing required fields: patent, accountId'
      });
    }

    const result = await walletService.createPatentNFTTransaction(
      patent,
      accountId,
      network
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error creating NFT transaction:', error);
    res.status(500).json({
      error: error.message || 'Failed to create NFT transaction'
    });
  }
});

/**
 * POST /api/wallet/create-nft-mint-transaction
 * Create NFT mint transaction after token is created
 */
router.post('/create-nft-mint-transaction', requireAuth, async (req: Request, res: Response) => {
  try {
    const { tokenId, metadata, accountId, network = 'testnet' } = req.body;

    if (!tokenId || !metadata || !accountId) {
      return res.status(400).json({
        error: 'Missing required fields: tokenId, metadata, accountId'
      });
    }

    const result = await walletService.createNFTMintTransaction(
      tokenId,
      metadata,
      accountId,
      network
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error creating NFT mint transaction:', error);
    res.status(500).json({
      error: error.message || 'Failed to create NFT mint transaction'
    });
  }
});

/**
 * POST /api/wallet/create-transfer-transaction
 * Create HBAR transfer transaction
 */
router.post('/create-transfer-transaction', requireAuth, async (req: Request, res: Response) => {
  try {
    const { fromAccountId, toAccountId, amount, network = 'testnet' } = req.body;

    if (!fromAccountId || !toAccountId || amount === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: fromAccountId, toAccountId, amount'
      });
    }

    const result = await walletService.createTransferTransaction(
      fromAccountId,
      toAccountId,
      amount,
      network
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error creating transfer transaction:', error);
    res.status(500).json({
      error: error.message || 'Failed to create transfer transaction'
    });
  }
});

/**
 * GET /api/wallet/verify-patent-hash/:topicId/:messageId
 * Verify patent hash from blockchain
 */
router.get('/verify-patent-hash/:topicId/:messageId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { topicId, messageId } = req.params;
    const { expectedHash, network = 'testnet' } = req.query;

    if (!topicId || !messageId || !expectedHash) {
      return res.status(400).json({
        error: 'Missing required fields: topicId, messageId, expectedHash'
      });
    }

    const result = await walletService.verifyPatentHash(
      topicId,
      messageId,
      expectedHash as string,
      network as 'testnet' | 'mainnet'
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error verifying patent hash:', error);
    res.status(500).json({
      error: error.message || 'Failed to verify patent hash'
    });
  }
});

/**
 * GET /api/wallet/balance/:accountId
 * Get account balance
 */
router.get('/balance/:accountId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { network = 'testnet' } = req.query;

    if (!accountId) {
      return res.status(400).json({
        error: 'Missing required field: accountId'
      });
    }

    const result = await walletService.getAccountBalance(
      accountId,
      network as 'testnet' | 'mainnet'
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error getting account balance:', error);
    res.status(500).json({
      error: error.message || 'Failed to get account balance'
    });
  }
});

/**
 * GET /api/wallet/network-status
 * Get network status
 */
router.get('/network-status', async (req: Request, res: Response) => {
  try {
    const { network = 'testnet' } = req.query;

    const result = await walletService.getNetworkStatus(
      network as 'testnet' | 'mainnet'
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error getting network status:', error);
    res.status(500).json({
      error: error.message || 'Failed to get network status'
    });
  }
});

export default router;
