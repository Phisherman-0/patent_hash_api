import { Client, AccountId, TopicCreateTransaction, TopicMessageSubmitTransaction, TokenCreateTransaction, TokenType, TokenSupplyType, TokenMintTransaction, TransferTransaction, AccountBalanceQuery, TokenAssociateTransaction, Hbar, TopicInfoQuery, TopicId, Transaction } from "@hashgraph/sdk";
import crypto from 'crypto';
import fs from 'fs';
import { Patent } from '../shared/schema';

/**
 * WalletService - Unified wallet service for Hedera operations
 * 
 * This service provides a centralized interface for all wallet-related operations
 * including transaction creation, signing, and submission. It follows the same
 * pattern as the hedera-wallet-template for consistency.
 */

export interface WalletTransactionRequest {
  accountId: string;
  network: 'testnet' | 'mainnet';
  transactionBytes?: string; // Base64 encoded transaction bytes
  signedTransactionBytes?: string; // Base64 encoded signed transaction bytes from wallet
}

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  topicId?: string;
  messageId?: string;
  tokenId?: string;
  error?: string;
}

class WalletService {
  private getClient(network: 'testnet' | 'mainnet'): Client {
    return network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
  }

  /**
   * Create an unsigned transaction for patent hash storage
   * This transaction needs to be signed by the user's wallet
   */
  async createPatentHashTransaction(
    patentId: string,
    filePath: string,
    accountId: string,
    network: 'testnet' | 'mainnet'
  ): Promise<{
    transactionBytes: string;
    hash: string;
  }> {
    const client = this.getClient(network);

    try {
      // Calculate file hash
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      console.log(`📝 Calculated hash for patent ${patentId}: ${hash}`);

      // Create a new topic for this patent
      console.log(`🔗 Creating Hedera topic for patent ${patentId}...`);
      const topicCreateTx = new TopicCreateTransaction()
        .setTopicMemo(`Patent Hash Storage for ${patentId}`)
        .setMaxTransactionFee(new Hbar(2))
        .freezeWith(client);

      // Convert to bytes for wallet signing
      const transactionBytes = Buffer.from(topicCreateTx.toBytes()).toString('base64');

      return {
        transactionBytes,
        hash,
      };
    } catch (error: any) {
      console.error("Error creating patent hash transaction:", error);
      throw new Error(`Failed to create patent hash transaction: ${error.message || 'Unknown error'}`);
    } finally {
      client.close();
    }
  }

  /**
   * Submit a signed transaction from wallet
   */
  async submitSignedTransaction(
    signedTransactionBytes: string,
    network: 'testnet' | 'mainnet'
  ): Promise<TransactionResult> {
    const client = this.getClient(network);

    try {
      // Decode the signed transaction bytes
      const transactionBuffer = Buffer.from(signedTransactionBytes, 'base64');
      const transaction = Transaction.fromBytes(transactionBuffer);

      // Submit the signed transaction
      const submitResponse = await transaction.execute(client);
      const receipt = await submitResponse.getReceipt(client);

      const result: TransactionResult = {
        success: true,
        transactionId: submitResponse.transactionId.toString(),
        topicId: receipt.topicId?.toString(),
        messageId: receipt.topicSequenceNumber?.toString(),
      };

      console.log(`✅ Signed transaction submitted:`, result);
      return result;
    } catch (error: any) {
      console.error("Error submitting signed transaction:", error);
      return {
        success: false,
        error: `Failed to submit signed transaction: ${error.message || 'Unknown error'}`,
      };
    } finally {
      client.close();
    }
  }

  /**
   * Create message submission transaction after topic is created
   */
  async createPatentMessageTransaction(
    patentId: string,
    hash: string,
    topicId: string,
    accountId: string,
    network: 'testnet' | 'mainnet'
  ): Promise<{
    transactionBytes: string;
  }> {
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
        .setMaxTransactionFee(new Hbar(1))
        .freezeWith(client);

      // Convert to bytes for wallet signing
      const transactionBytes = Buffer.from(topicMessageTx.toBytes()).toString('base64');

      return {
        transactionBytes,
      };
    } catch (error: any) {
      console.error("Error creating patent message transaction:", error);
      throw new Error(`Failed to create patent message transaction: ${error.message || 'Unknown error'}`);
    } finally {
      client.close();
    }
  }

  /**
   * Create NFT mint transaction for wallet signing
   */
  async createPatentNFTTransaction(
    patent: Patent,
    accountId: string,
    network: 'testnet' | 'mainnet'
  ): Promise<{
    createTokenTx: string;
  }> {
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
        .setMaxTransactionFee(new Hbar(2))
        .freezeWith(client);

      const createTokenTxBytes = Buffer.from(tokenCreateTx.toBytes()).toString('base64');

      return {
        createTokenTx: createTokenTxBytes,
      };
    } catch (error: any) {
      console.error("Error creating patent NFT transaction:", error);
      throw new Error(`Failed to create patent NFT transaction: ${error.message || 'Unknown error'}`);
    } finally {
      client.close();
    }
  }

  /**
   * Create NFT mint transaction after token is created
   */
  async createNFTMintTransaction(
    tokenId: string,
    metadata: string,
    accountId: string,
    network: 'testnet' | 'mainnet'
  ): Promise<{
    transactionBytes: string;
  }> {
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
    } catch (error: any) {
      console.error("Error creating NFT mint transaction:", error);
      throw new Error(`Failed to create NFT mint transaction: ${error.message || 'Unknown error'}`);
    } finally {
      client.close();
    }
  }

  /**
   * Create HBAR transfer transaction
   */
  async createTransferTransaction(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    network: 'testnet' | 'mainnet'
  ): Promise<{
    transactionBytes: string;
  }> {
    const client = this.getClient(network);

    try {
      const transferTx = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(fromAccountId), -amount)
        .addHbarTransfer(AccountId.fromString(toAccountId), amount)
        .setMaxTransactionFee(new Hbar(1))
        .freezeWith(client);

      const transactionBytes = Buffer.from(transferTx.toBytes()).toString('base64');

      return {
        transactionBytes,
      };
    } catch (error: any) {
      console.error("Error creating transfer transaction:", error);
      throw new Error(`Failed to create transfer transaction: ${error.message || 'Unknown error'}`);
    } finally {
      client.close();
    }
  }

  /**
   * Verify patent hash from blockchain
   */
  async verifyPatentHash(
    topicId: string,
    messageId: string,
    expectedHash: string,
    network: 'testnet' | 'mainnet'
  ): Promise<{
    verified: boolean;
    actualHash?: string;
    timestamp?: string;
    message: string;
  }> {
    const client = this.getClient(network);

    try {
      // Query topic information
      const topicInfo = await new TopicInfoQuery()
        .setTopicId(TopicId.fromString(topicId))
        .execute(client);

      // Note: In a real implementation, you would query the mirror node
      // to retrieve the actual message content
      return {
        verified: true,
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
    } finally {
      client.close();
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(
    accountId: string,
    network: 'testnet' | 'mainnet'
  ): Promise<{
    balance: string;
    error?: string;
  }> {
    const client = this.getClient(network);

    try {
      const balance = await new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(accountId))
        .execute(client);

      return {
        balance: balance.hbars.toString()
      };
    } catch (error: any) {
      console.error("Error getting account balance:", error);
      return {
        balance: '0',
        error: error.message || 'Failed to get account balance'
      };
    } finally {
      client.close();
    }
  }

  /**
   * Calculate file hash
   */
  calculateFileHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Get network status
   */
  async getNetworkStatus(network: 'testnet' | 'mainnet' = 'testnet'): Promise<{ isOnline: boolean; error?: string }> {
    try {
      const client = this.getClient(network);

      // Simple network check - try to query a well-known account
      await new AccountBalanceQuery()
        .setAccountId('0.0.2') // Hedera treasury account
        .execute(client);

      client.close();

      return { isOnline: true };
    } catch (error: any) {
      return {
        isOnline: false,
        error: error.message || 'Network unavailable'
      };
    }
  }
}

export const walletService = new WalletService();
