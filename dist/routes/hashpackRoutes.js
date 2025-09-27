import { requireAuth } from '../auth';
import { hashPackHederaService } from '../services/hashPackHederaService';
import { storage } from '../storage';
export function setupHashPackRoutes(app) {
    // Create patent hash transaction for HashPack signing
    app.post('/api/hashpack/patent-hash-transaction', requireAuth, async (req, res) => {
        try {
            const { patentId, filePath } = req.body;
            const userId = req.user.id;
            if (!patentId || !filePath) {
                return res.status(400).json({
                    message: 'Patent ID and file path are required'
                });
            }
            // Get user's HashPack wallet info
            const user = await storage.getUserById(userId);
            const hashPackWallet = user?.settings?.hashPackWallet;
            if (!hashPackWallet || !hashPackWallet.accountId) {
                return res.status(400).json({
                    message: 'No HashPack wallet connected. Please connect your HashPack wallet first.'
                });
            }
            // Create unsigned transaction for HashPack signing
            const result = await hashPackHederaService.createPatentHashTransaction(patentId, filePath, hashPackWallet.accountId, hashPackWallet.network);
            res.json({
                success: true,
                transactionBytes: result.transactionBytes,
                hash: result.hash,
                step: 'create_topic'
            });
        }
        catch (error) {
            console.error('Error creating patent hash transaction:', error);
            res.status(500).json({
                message: 'Failed to create patent hash transaction',
                error: error.message
            });
        }
    });
    // Create patent message transaction after topic is created
    app.post('/api/hashpack/patent-message-transaction', requireAuth, async (req, res) => {
        try {
            const { patentId, hash, topicId } = req.body;
            const userId = req.user.id;
            if (!patentId || !hash || !topicId) {
                return res.status(400).json({
                    message: 'Patent ID, hash, and topic ID are required'
                });
            }
            // Get user's HashPack wallet info
            const user = await storage.getUserById(userId);
            const hashPackWallet = user?.settings?.hashPackWallet;
            if (!hashPackWallet || !hashPackWallet.accountId) {
                return res.status(400).json({
                    message: 'No HashPack wallet connected. Please connect your HashPack wallet first.'
                });
            }
            // Create message submission transaction for HashPack signing
            const result = await hashPackHederaService.createPatentMessageTransaction(patentId, hash, topicId, hashPackWallet.accountId, hashPackWallet.network);
            res.json({
                success: true,
                transactionBytes: result.transactionBytes,
                step: 'submit_message'
            });
        }
        catch (error) {
            console.error('Error creating patent message transaction:', error);
            res.status(500).json({
                message: 'Failed to create patent message transaction',
                error: error.message
            });
        }
    });
    // Create NFT transaction for HashPack signing
    app.post('/api/hashpack/nft-transaction', requireAuth, async (req, res) => {
        try {
            const { patentId } = req.body;
            const userId = req.user.id;
            if (!patentId) {
                return res.status(400).json({
                    message: 'Patent ID is required'
                });
            }
            // Get patent details
            const patent = await storage.getPatent(patentId);
            if (!patent || patent.userId !== userId) {
                return res.status(403).json({
                    message: 'Access denied. You do not own this patent.'
                });
            }
            // Get user's HashPack wallet info
            const user = await storage.getUserById(userId);
            const hashPackWallet = user?.settings?.hashPackWallet;
            if (!hashPackWallet || !hashPackWallet.accountId) {
                return res.status(400).json({
                    message: 'No HashPack wallet connected. Please connect your HashPack wallet first.'
                });
            }
            // Create NFT transaction for HashPack signing
            const result = await hashPackHederaService.createPatentNFTTransaction(patent, hashPackWallet.accountId, hashPackWallet.network);
            res.json({
                success: true,
                createTokenTx: result.createTokenTx,
                mintTokenTx: result.mintTokenTx,
                step: 'create_token'
            });
        }
        catch (error) {
            console.error('Error creating NFT transaction:', error);
            res.status(500).json({
                message: 'Failed to create NFT transaction',
                error: error.message
            });
        }
    });
    // Create NFT mint transaction after token is created
    app.post('/api/hashpack/nft-mint-transaction', requireAuth, async (req, res) => {
        try {
            const { tokenId, metadata } = req.body;
            const userId = req.user.id;
            if (!tokenId || !metadata) {
                return res.status(400).json({
                    message: 'Token ID and metadata are required'
                });
            }
            // Get user's HashPack wallet info
            const user = await storage.getUserById(userId);
            const hashPackWallet = user?.settings?.hashPackWallet;
            if (!hashPackWallet || !hashPackWallet.accountId) {
                return res.status(400).json({
                    message: 'No HashPack wallet connected. Please connect your HashPack wallet first.'
                });
            }
            // Create NFT mint transaction for HashPack signing
            const result = await hashPackHederaService.createNFTMintTransaction(tokenId, metadata, hashPackWallet.accountId, hashPackWallet.network);
            res.json({
                success: true,
                transactionBytes: result.transactionBytes,
                step: 'mint_token'
            });
        }
        catch (error) {
            console.error('Error creating NFT mint transaction:', error);
            res.status(500).json({
                message: 'Failed to create NFT mint transaction',
                error: error.message
            });
        }
    });
    // Submit signed transaction from HashPack
    app.post('/api/hashpack/submit-transaction', requireAuth, async (req, res) => {
        try {
            const { signedTransactionBytes, network } = req.body;
            if (!signedTransactionBytes || !network) {
                return res.status(400).json({
                    message: 'Signed transaction bytes and network are required'
                });
            }
            // Submit signed transaction to Hedera network
            const result = await hashPackHederaService.submitSignedTransaction(signedTransactionBytes, network);
            res.json({
                success: true,
                transactionId: result.transactionId,
                topicId: result.topicId,
                messageId: result.messageId
            });
        }
        catch (error) {
            console.error('Error submitting signed transaction:', error);
            res.status(500).json({
                message: 'Failed to submit signed transaction',
                error: error.message
            });
        }
    });
}
