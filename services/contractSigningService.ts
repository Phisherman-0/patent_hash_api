import { PublicKey, AccountId } from '@hashgraph/sdk';
import crypto from 'crypto';

export interface SignatureVerificationResult {
  isValid: boolean;
  message?: string;
  signerAccountId?: string;
}

export interface PatentSigningData {
  patentId: string;
  title: string;
  description: string;
  category: string;
  userId: string;
  timestamp: number;
}

/**
 * Contract Signing Service
 * Handles wallet signature verification for patent filing
 */
class ContractSigningService {
  /**
   * Generate message to be signed for patent filing
   */
  generatePatentSigningMessage(data: PatentSigningData): string {
    const message = JSON.stringify({
      action: 'FILE_PATENT',
      patentId: data.patentId,
      title: data.title,
      description: data.description,
      category: data.category,
      userId: data.userId,
      timestamp: data.timestamp,
      network: process.env.HEDERA_NETWORK || 'testnet'
    });
    
    return message;
  }

  /**
   * Generate hash of the signing message
   */
  generateMessageHash(message: string): string {
    return crypto.createHash('sha256').update(message).digest('hex');
  }

  /**
   * Verify signature from Hedera wallet
   * @param message - Original message that was signed
   * @param signature - Signature bytes (hex string)
   * @param publicKey - Public key of the signer (hex string)
   * @param accountId - Expected account ID
   */
  async verifyHederaSignature(
    message: string,
    signature: string,
    publicKey: string,
    accountId: string
  ): Promise<SignatureVerificationResult> {
    try {
      // Validate inputs
      if (!message || !signature || !publicKey || !accountId) {
        return {
          isValid: false,
          message: 'Missing required parameters for signature verification'
        };
      }

      // Convert hex strings to buffers
      const signatureBytes = Buffer.from(signature, 'hex');
      const publicKeyBytes = Buffer.from(publicKey, 'hex');
      
      // Create PublicKey object from bytes
      const pubKey = PublicKey.fromBytes(publicKeyBytes);
      
      // Hash the message
      const messageHash = Buffer.from(this.generateMessageHash(message), 'hex');
      
      // Verify signature
      const isValid = pubKey.verify(messageHash, signatureBytes);
      
      if (!isValid) {
        return {
          isValid: false,
          message: 'Invalid signature'
        };
      }

      return {
        isValid: true,
        message: 'Signature verified successfully',
        signerAccountId: accountId
      };
    } catch (error) {
      console.error('Error verifying Hedera signature:', error);
      return {
        isValid: false,
        message: `Signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Verify HashPack wallet signature
   * HashPack uses a specific signing format
   */
  async verifyHashPackSignature(
    message: string,
    signatureData: {
      signature: string;
      publicKey: string;
      accountId: string;
    }
  ): Promise<SignatureVerificationResult> {
    try {
      return await this.verifyHederaSignature(
        message,
        signatureData.signature,
        signatureData.publicKey,
        signatureData.accountId
      );
    } catch (error) {
      console.error('Error verifying HashPack signature:', error);
      return {
        isValid: false,
        message: `HashPack signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create a patent filing contract
   * This generates the data structure that needs to be signed
   */
  createPatentFilingContract(patentData: {
    title: string;
    description: string;
    category: string;
    userId: string;
  }): PatentSigningData {
    return {
      patentId: crypto.randomUUID(),
      title: patentData.title,
      description: patentData.description,
      category: patentData.category,
      userId: patentData.userId,
      timestamp: Date.now()
    };
  }

  /**
   * Validate signature matches expected account
   */
  validateSignerAccount(
    expectedAccountId: string,
    actualAccountId: string
  ): boolean {
    return expectedAccountId === actualAccountId;
  }
}

export const contractSigningService = new ContractSigningService();
export default contractSigningService;
