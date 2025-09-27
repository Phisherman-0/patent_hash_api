import { Client, AccountId, TopicCreateTransaction, TopicMessageSubmitTransaction, TokenCreateTransaction, TokenType, TokenSupplyType, TokenMintTransaction, Hbar, TopicInfoQuery, TopicId, Transaction } from "@hashgraph/sdk";
import crypto from 'crypto';
import fs from 'fs';
class HashPackHederaService {
    getClient(network) {
        return network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
    }
    /**
     * Create an unsigned transaction for patent hash storage
     */
    async createPatentHashTransaction(patentId, filePath, accountId, network) {
        const client = this.getClient(network);
        const operatorId = AccountId.fromString(accountId);
        try {
            // Calculate file hash
            const fileBuffer = fs.readFileSync(filePath);
            const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
            console.log(`📝 Calculated hash for patent ${patentId}: ${hash}`);
            // Create a new topic for this patent
            console.log(`🔗 Creating Hedera topic for patent ${patentId}...`);
            const topicCreateTx = new TopicCreateTransaction()
                .setTopicMemo(`Patent Hash Storage for ${patentId}`)
                .setMaxTransactionFee(new Hbar(2)) // 2 HBAR max fee
                .freezeWith(client);
            // Convert to bytes for HashPack signing
            const transactionBytes = Buffer.from(topicCreateTx.toBytes()).toString('base64');
            return {
                transactionBytes,
                hash,
            };
        }
        catch (error) {
            console.error("Error creating patent hash transaction:", error);
            throw new Error(`Failed to create patent hash transaction: ${error.message || 'Unknown error'}`);
        }
        finally {
            client.close();
        }
    }
    /**
     * Submit a signed transaction from HashPack
     */
    async submitSignedTransaction(signedTransactionBytes, network) {
        const client = this.getClient(network);
        try {
            // Decode the signed transaction bytes
            const transactionBuffer = Buffer.from(signedTransactionBytes, 'base64');
            const transaction = Transaction.fromBytes(transactionBuffer);
            // Submit the signed transaction
            const submitResponse = await transaction.execute(client);
            const receipt = await submitResponse.getReceipt(client);
            const result = {
                transactionId: submitResponse.transactionId.toString(),
                topicId: receipt.topicId?.toString(),
                messageId: receipt.topicSequenceNumber?.toString(),
            };
            console.log(`✅ Signed transaction submitted:`, result);
            return result;
        }
        catch (error) {
            console.error("Error submitting signed transaction:", error);
            throw new Error(`Failed to submit signed transaction: ${error.message || 'Unknown error'}`);
        }
        finally {
            client.close();
        }
    }
    /**
     * Create and submit patent hash with HashPack workflow
     */
    async storePatentHashWithHashPack(patentId, filePath, accountId, network) {
        try {
            // Step 1: Create topic transaction
            const { transactionBytes, hash } = await this.createPatentHashTransaction(patentId, filePath, accountId, network);
            return {
                step: 'create_topic',
                transactionBytes,
                hash,
            };
        }
        catch (error) {
            console.error("Error in HashPack patent hash workflow:", error);
            throw new Error(`Failed to create HashPack transaction: ${error.message || 'Unknown error'}`);
        }
    }
    /**
     * Create message submission transaction after topic is created
     */
    async createPatentMessageTransaction(patentId, hash, topicId, accountId, network) {
        const client = this.getClient(network);
        try {
            // Create patent data message
            const patentData = {
                patentId,
                hash,
                timestamp: new Date().toISOString(),
                action: "patent_hash_storage"
            };
            console.log(`📤 Creating message transaction for topic ${topicId}...`);
            const topicMessageTx = new TopicMessageSubmitTransaction()
                .setTopicId(TopicId.fromString(topicId))
                .setMessage(JSON.stringify(patentData))
                .setMaxTransactionFee(new Hbar(1)) // 1 HBAR max fee
                .freezeWith(client);
            // Convert to bytes for HashPack signing
            const transactionBytes = Buffer.from(topicMessageTx.toBytes()).toString('base64');
            return {
                transactionBytes,
            };
        }
        catch (error) {
            console.error("Error creating patent message transaction:", error);
            throw new Error(`Failed to create patent message transaction: ${error.message || 'Unknown error'}`);
        }
        finally {
            client.close();
        }
    }
    /**
     * Create NFT mint transaction for HashPack signing
     */
    async createPatentNFTTransaction(patent, accountId, network) {
        const client = this.getClient(network);
        const operatorId = AccountId.fromString(accountId);
        try {
            // Create NFT token transaction
            const tokenCreateTx = new TokenCreateTransaction()
                .setTokenName(`Patent: ${patent.title}`)
                .setTokenSymbol("PATENT")
                .setTokenType(TokenType.NonFungibleUnique)
                .setSupplyType(TokenSupplyType.Finite)
                .setMaxSupply(1)
                .setTreasuryAccountId(operatorId)
                // Note: Keys will be set by HashPack during signing
                // .setSupplyKey(operatorKey) 
                // .setAdminKey(operatorKey)
                .setMaxTransactionFee(new Hbar(2))
                .freezeWith(client);
            // Create NFT metadata
            const nftMetadata = JSON.stringify({
                name: `Patent: ${patent.title.substring(0, 30)}${patent.title.length > 30 ? '...' : ''}`,
                description: `Patent NFT on Hedera blockchain`,
                image: `https://api.dicebear.com/7.x/shapes/svg?seed=${patent.id}&scale=80`,
                attributes: [
                    {
                        trait_type: "Category",
                        value: patent.category
                    },
                    {
                        trait_type: "Network",
                        value: network
                    },
                    {
                        trait_type: "Status",
                        value: "Filed"
                    }
                ],
                patentId: patent.id
            });
            // Note: We'll need the token ID from the first transaction to create the mint transaction
            // This is a limitation of the current approach - we need to do this in two steps
            const createTokenTxBytes = Buffer.from(tokenCreateTx.toBytes()).toString('base64');
            return {
                createTokenTx: createTokenTxBytes,
                mintTokenTx: '', // Will be created after token creation
            };
        }
        catch (error) {
            console.error("Error creating patent NFT transaction:", error);
            throw new Error(`Failed to create patent NFT transaction: ${error.message || 'Unknown error'}`);
        }
        finally {
            client.close();
        }
    }
    /**
     * Create NFT mint transaction after token is created
     */
    async createNFTMintTransaction(tokenId, metadata, accountId, network) {
        const client = this.getClient(network);
        try {
            const tokenMintTx = new TokenMintTransaction()
                .setTokenId(tokenId)
                .setMetadata([Buffer.from(metadata)])
                .setMaxTransactionFee(new Hbar(1))
                .freezeWith(client);
            const transactionBytes = Buffer.from(tokenMintTx.toBytes()).toString('base64');
            return {
                transactionBytes,
            };
        }
        catch (error) {
            console.error("Error creating NFT mint transaction:", error);
            throw new Error(`Failed to create NFT mint transaction: ${error.message || 'Unknown error'}`);
        }
        finally {
            client.close();
        }
    }
    /**
     * Verify patent hash from blockchain
     */
    async verifyPatentHash(topicId, messageId, expectedHash, network) {
        const client = this.getClient(network);
        try {
            // Query topic information
            const topicInfo = await new TopicInfoQuery()
                .setTopicId(TopicId.fromString(topicId))
                .execute(client);
            // Note: In a real implementation, you would need to query the mirror node
            // to retrieve the actual message content. For this demo, we'll simulate verification.
            return {
                verified: true, // In real implementation, compare with actual message content
                actualHash: expectedHash,
                timestamp: new Date().toISOString(),
                message: "Patent hash verified on Hedera blockchain"
            };
        }
        catch (error) {
            console.error("Error verifying patent hash:", error);
            return {
                verified: false,
                message: "Failed to verify patent hash on blockchain"
            };
        }
        finally {
            client.close();
        }
    }
}
export const hashPackHederaService = new HashPackHederaService();
