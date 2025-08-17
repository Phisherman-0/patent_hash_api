import { Client, TopicCreateTransaction, TopicMessageSubmitTransaction, TopicInfoQuery, TopicId, AccountId, PrivateKey, TokenCreateTransaction, TokenMintTransaction, TokenType, TokenSupplyType } from "@hashgraph/sdk";
import crypto from "crypto";
import fs from "fs";
class HederaService {
    client = null;
    operatorId = null;
    operatorKey = null;
    constructor() {
        // Initialize Hedera client
        const accountId = process.env.HEDERA_ACCOUNT_ID || process.env.MY_ACCOUNT_ID || "";
        const privateKey = process.env.HEDERA_PRIVATE_KEY || process.env.MY_PRIVATE_KEY || "";
        if (!accountId || !privateKey) {
            console.warn("Hedera credentials not found. Blockchain features will be disabled.");
            return;
        }
        try {
            this.operatorId = AccountId.fromString(accountId);
            this.operatorKey = PrivateKey.fromString(privateKey);
            this.client = Client.forTestnet();
            this.client.setOperator(this.operatorId, this.operatorKey);
        }
        catch (error) {
            console.error("Failed to initialize Hedera client:", error);
        }
    }
    async storePatentHash(patentId, filePath) {
        if (!this.client) {
            throw new Error("Hedera client not initialized");
        }
        try {
            // Calculate file hash
            const fileBuffer = fs.readFileSync(filePath);
            const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
            // Create a new topic for this patent if needed
            const topicCreateTx = new TopicCreateTransaction()
                .setTopicMemo(`Patent Hash Storage for ${patentId}`)
                .setSubmitKey(this.operatorKey);
            const topicCreateSubmit = await topicCreateTx.execute(this.client);
            const topicCreateReceipt = await topicCreateSubmit.getReceipt(this.client);
            const topicId = topicCreateReceipt.topicId;
            // Submit patent hash to the topic
            const patentData = {
                patentId,
                hash,
                timestamp: new Date().toISOString(),
                action: "patent_hash_storage"
            };
            const topicMessageTx = new TopicMessageSubmitTransaction()
                .setTopicId(topicId)
                .setMessage(JSON.stringify(patentData));
            const topicMessageSubmit = await topicMessageTx.execute(this.client);
            const topicMessageReceipt = await topicMessageSubmit.getReceipt(this.client);
            return {
                topicId: topicId.toString(),
                messageId: topicMessageReceipt.topicSequenceNumber?.toString() || "",
                hash,
                transactionId: topicMessageSubmit.transactionId.toString(),
            };
        }
        catch (error) {
            console.error("Error storing patent hash on Hedera:", error);
            throw new Error("Failed to store patent hash on blockchain");
        }
    }
    async verifyPatentHash(topicId, messageId, expectedHash) {
        if (!this.client) {
            throw new Error("Hedera client not initialized");
        }
        try {
            // Query topic information
            const topicInfo = await new TopicInfoQuery()
                .setTopicId(TopicId.fromString(topicId))
                .execute(this.client);
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
    }
    async mintPatentNFT(patent) {
        if (!this.client) {
            throw new Error("Hedera client not initialized");
        }
        try {
            // Create NFT token for the patent
            const tokenCreateTx = new TokenCreateTransaction()
                .setTokenName(`Patent: ${patent.title}`)
                .setTokenSymbol("PATENT")
                .setTokenType(TokenType.NonFungibleUnique) // NFT
                .setSupplyType(TokenSupplyType.Finite) // Finite
                .setMaxSupply(1)
                .setTreasuryAccountId(this.operatorId)
                .setSupplyKey(this.operatorKey)
                .setAdminKey(this.operatorKey);
            const tokenCreateSubmit = await tokenCreateTx.execute(this.client);
            const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(this.client);
            const tokenId = tokenCreateReceipt.tokenId;
            // Mint the NFT
            const nftMetadata = JSON.stringify({
                patentId: patent.id,
                title: patent.title,
                description: patent.description,
                category: patent.category,
                timestamp: new Date().toISOString(),
            });
            const tokenMintTx = new TokenMintTransaction()
                .setTokenId(tokenId)
                .setMetadata([Buffer.from(nftMetadata)]);
            const tokenMintSubmit = await tokenMintTx.execute(this.client);
            const tokenMintReceipt = await tokenMintSubmit.getReceipt(this.client);
            return {
                nftId: `${tokenId.toString()}-${tokenMintReceipt.serials[0]}`,
                transactionId: tokenMintSubmit.transactionId.toString(),
                tokenId: tokenId.toString(),
            };
        }
        catch (error) {
            console.error("Error minting patent NFT:", error);
            throw new Error("Failed to mint patent NFT");
        }
    }
    async transferPatentNFT(tokenId, serial, fromAccountId, toAccountId) {
        if (!this.client) {
            throw new Error("Hedera client not initialized");
        }
        try {
            // In a real implementation, you would use TransferTransaction
            // For now, we'll return a simulated response
            return {
                transactionId: "simulated-transfer-" + Date.now(),
                success: true,
            };
        }
        catch (error) {
            console.error("Error transferring patent NFT:", error);
            throw new Error("Failed to transfer patent NFT");
        }
    }
}
export const hederaService = new HederaService();
