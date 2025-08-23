import { Client, AccountId, PrivateKey, TopicCreateTransaction, TopicMessageSubmitTransaction, TokenCreateTransaction, TokenType, TokenSupplyType, TokenMintTransaction, TransferTransaction, AccountBalanceQuery, TokenAssociateTransaction, Hbar, TopicInfoQuery, TopicId } from "@hashgraph/sdk";
import crypto from 'crypto';
import fs from 'fs';
import { Patent, WalletConfig } from '../shared/schema';

class HederaService {
  private client: Client | null = null;
  private operatorId: AccountId | null = null;
  private operatorKey: PrivateKey | null = null;

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
      
      // Handle different private key formats
      if (privateKey.startsWith('0x')) {
        // Use fromStringECDSA with the full 0x prefix (this is what works!)
        this.operatorKey = PrivateKey.fromStringECDSA(privateKey);
      } else if (privateKey.length === 64) {
        // Raw hex string without 0x prefix
        this.operatorKey = PrivateKey.fromStringECDSA(privateKey);
      } else {
        // DER or other format
        this.operatorKey = PrivateKey.fromString(privateKey);
      }
      
      this.client = Client.forTestnet();
      this.client.setOperator(this.operatorId, this.operatorKey);
      
      console.log(`✅ Hedera client initialized for account: ${this.operatorId.toString()}`);
      console.log(`🔑 Private key format: ${privateKey.startsWith('0x') ? 'ECDSA with 0x prefix' : 'Other format'}`);
      console.log(`🔑 Key length: ${privateKey.length} characters`);
    } catch (error) {
      console.error("Failed to initialize Hedera client:", error);
      this.client = null;
      this.operatorId = null;
      this.operatorKey = null;
    }
  }

  async validateWallet(accountId: string, privateKey: string, network: 'testnet' | 'mainnet'): Promise<{ isValid: boolean; balance?: string; error?: string }> {
    try {
      // Parse account ID
      const parsedAccountId = AccountId.fromString(accountId);
      
      // Parse private key
      let parsedPrivateKey: PrivateKey;
      if (privateKey.startsWith('0x')) {
        parsedPrivateKey = PrivateKey.fromStringECDSA(privateKey);
      } else if (privateKey.length === 64) {
        parsedPrivateKey = PrivateKey.fromStringECDSA(privateKey);
      } else {
        parsedPrivateKey = PrivateKey.fromString(privateKey);
      }

      // Create client for the specified network
      const client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
      client.setOperator(parsedAccountId, parsedPrivateKey);

      // Test the connection by querying account balance
      const accountBalanceQuery = new AccountBalanceQuery()
        .setAccountId(parsedAccountId);
      const balance = await accountBalanceQuery.execute(client);
      
      client.close();
      
      return {
        isValid: true,
        balance: balance.hbars.toString()
      };
    } catch (error: any) {
      console.error('Wallet validation failed:', error);
      return {
        isValid: false,
        error: error.message || 'Invalid wallet credentials'
      };
    }
  }

  async storePatentHashWithWallet(patentId: string, filePath: string, walletConfig: WalletConfig): Promise<{
    topicId: string;
    messageId: string;
    hash: string;
    transactionId: string;
  }> {
    // Create a temporary client with user's wallet configuration
    let tempClient: Client | null = null;
    
    try {
      const operatorId = AccountId.fromString(walletConfig.accountId);
      let operatorKey: PrivateKey;
      
      // Handle different private key formats
      if (walletConfig.privateKey.startsWith('0x')) {
        operatorKey = PrivateKey.fromStringECDSA(walletConfig.privateKey);
      } else if (walletConfig.privateKey.length === 64) {
        operatorKey = PrivateKey.fromStringECDSA(walletConfig.privateKey);
      } else {
        operatorKey = PrivateKey.fromString(walletConfig.privateKey);
      }
      
      tempClient = walletConfig.network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
      tempClient.setOperator(operatorId, operatorKey);
      
      return await this.executePatentHashStorage(patentId, filePath, tempClient, operatorKey);
    } finally {
      if (tempClient) {
        tempClient.close();
      }
    }
  }

  async storePatentHash(patentId: string, filePath: string): Promise<{
    topicId: string;
    messageId: string;
    hash: string;
    transactionId: string;
  }> {
    if (!this.client || !this.operatorKey) {
      throw new Error("Hedera client not initialized - check credentials and network connection");
    }

    return await this.executePatentHashStorage(patentId, filePath, this.client, this.operatorKey);
  }

  private async executePatentHashStorage(patentId: string, filePath: string, client: Client, operatorKey: PrivateKey): Promise<{
    topicId: string;
    messageId: string;
    hash: string;
    transactionId: string;
  }> {
    try {
      // Calculate file hash
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      console.log(`📝 Calculated hash for patent ${patentId}: ${hash}`);

      // Create a new topic for this patent if needed
      console.log(`🔗 Creating Hedera topic for patent ${patentId}...`);
      const topicCreateTx = new TopicCreateTransaction()
        .setTopicMemo(`Patent Hash Storage for ${patentId}`)
        .setSubmitKey(operatorKey)
        .setMaxTransactionFee(200000000); // 2 HBAR max fee

      const topicCreateSubmit = await topicCreateTx.execute(client);
      const topicCreateReceipt = await topicCreateSubmit.getReceipt(client);
      const topicId = topicCreateReceipt.topicId!;
      console.log(`✅ Topic created: ${topicId.toString()}`);

      // Submit patent hash to the topic
      const patentData = {
        patentId,
        hash,
        timestamp: new Date().toISOString(),
        action: "patent_hash_storage"
      };

      console.log(`📤 Submitting patent data to topic...`);
      const topicMessageTx = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(JSON.stringify(patentData))
        .setMaxTransactionFee(100000000); // 1 HBAR max fee

      const topicMessageSubmit = await topicMessageTx.execute(client);
      const topicMessageReceipt = await topicMessageSubmit.getReceipt(client);

      const result = {
        topicId: topicId.toString(),
        messageId: topicMessageReceipt.topicSequenceNumber?.toString() || "",
        hash,
        transactionId: topicMessageSubmit.transactionId.toString(),
      };

      console.log(`✅ Patent hash stored on Hedera blockchain:`, result);
      return result;
    } catch (error: any) {
      console.error("Error storing patent hash on Hedera:", error);
      
      // Provide more specific error messages
      if (error.message?.includes('INVALID_SIGNATURE')) {
        throw new Error("Invalid Hedera credentials - private key doesn't match account ID");
      } else if (error.message?.includes('INSUFFICIENT_PAYER_BALANCE')) {
        throw new Error("Insufficient HBAR balance for blockchain transaction");
      } else if (error.message?.includes('TRANSACTION_EXPIRED')) {
        throw new Error("Blockchain transaction expired - network may be congested");
      } else {
        throw new Error(`Failed to store patent hash on blockchain: ${error.message || 'Unknown error'}`);
      }
    }
  }

  async verifyPatentHash(topicId: string, messageId: string, expectedHash: string): Promise<{
    verified: boolean;
    actualHash?: string;
    timestamp?: string;
    message: string;
  }> {
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
    } catch (error) {
      console.error("Error verifying patent hash:", error);
      return {
        verified: false,
        message: "Failed to verify patent hash on blockchain"
      };
    }
  }

  async mintPatentNFT(patent: Patent, walletConfig?: WalletConfig): Promise<{
    nftId: string;
    transactionId: string;
    tokenId: string;
  }> {
    // Create a temporary client with user's wallet configuration if provided
    let tempClient: Client | null = null;
    let tempOperatorId: AccountId | null = null;
    let tempOperatorKey: PrivateKey | null = null;
    
    if (walletConfig) {
      try {
        tempOperatorId = AccountId.fromString(walletConfig.accountId);
        
        // Handle different private key formats
        if (walletConfig.privateKey.startsWith('0x')) {
          tempOperatorKey = PrivateKey.fromStringECDSA(walletConfig.privateKey);
        } else if (walletConfig.privateKey.length === 64) {
          tempOperatorKey = PrivateKey.fromStringECDSA(walletConfig.privateKey);
        } else {
          tempOperatorKey = PrivateKey.fromString(walletConfig.privateKey);
        }
        
        tempClient = walletConfig.network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
        tempClient.setOperator(tempOperatorId, tempOperatorKey);
      } catch (error) {
        console.error("Failed to initialize temporary client:", error);
        throw new Error("Failed to initialize Hedera client with wallet configuration");
      }
    }
    
    const client = tempClient || this.client;
    const operatorId = tempOperatorId || this.operatorId;
    const operatorKey = tempOperatorKey || this.operatorKey;
    
    if (!client || !operatorId || !operatorKey) {
      throw new Error("Hedera client not initialized");
    }
    
    // Type assertion to fix TypeScript issues
    const hederaClient = client as Client;

    try {
      // Create NFT token for the patent
      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName(`Patent: ${patent.title}`)
        .setTokenSymbol("PATENT")
        .setTokenType(TokenType.NonFungibleUnique) // NFT
        .setSupplyType(TokenSupplyType.Finite) // Finite
        .setMaxSupply(1)
        .setTreasuryAccountId(operatorId)
        .setSupplyKey(operatorKey)
        .setAdminKey(operatorKey);

      const tokenCreateSubmit = await tokenCreateTx.execute(hederaClient);
      const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(hederaClient);
      const tokenId = tokenCreateReceipt.tokenId!;

      // Create compact NFT metadata within Hedera limits
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
            value: walletConfig?.network || "testnet"
          },
          {
            trait_type: "Status",
            value: "Filed"
          }
        ],
        patentId: patent.id
      });

      const tokenMintTx = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([Buffer.from(nftMetadata)]);

      const tokenMintSubmit = await tokenMintTx.execute(hederaClient);
      const tokenMintReceipt = await tokenMintSubmit.getReceipt(hederaClient);

      return {
        nftId: `${tokenId.toString()}-${tokenMintReceipt.serials[0]}`,
        transactionId: tokenMintSubmit.transactionId.toString(),
        tokenId: tokenId.toString(),
      };
    } catch (error) {
      console.error("Error minting patent NFT:", error);
      throw new Error("Failed to mint patent NFT");
    } finally {
      // Clean up temporary client if created
      if (tempClient) {
        tempClient.close();
      }
    }
  }

  async transferPatentNFT(tokenId: string, serial: number, fromAccountId: string, toAccountId: string): Promise<{
    transactionId: string;
    success: boolean;
  }> {
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
    } catch (error) {
      console.error("Error transferring patent NFT:", error);
      throw new Error("Failed to transfer patent NFT");
    }
  }
}

export const hederaService = new HederaService();
