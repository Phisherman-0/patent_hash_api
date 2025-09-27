import { Patent, WalletConnection } from '../shared/schema';
declare class HederaService {
    constructor();
    /**
     * Validate wallet credentials (legacy method for backward compatibility)
     */
    validateWallet(accountId: string, privateKey: string, network: 'testnet' | 'mainnet'): Promise<{
        isValid: boolean;
        balance?: string;
        error?: string;
    }>;
    /**
     * Store patent hash with wallet connection (HashPack integration)
     */
    storePatentHashWithWallet(patentHash: string, patent: Patent, walletConnection: WalletConnection): Promise<{
        success: boolean;
        topicId?: string;
        messageId?: string;
        transactionId?: string;
        error?: string;
    }>;
    /**
     * Create unsigned transaction for HashPack signing
     */
    createUnsignedPatentHashTransaction(patentHash: string, patent: Patent, network?: 'testnet' | 'mainnet'): Promise<{
        success: boolean;
        transactionBytes?: string;
        topicId?: string;
        error?: string;
    }>;
    /**
     * Submit signed transaction from HashPack
     */
    submitSignedTransaction(signedTransactionBytes: string, network?: 'testnet' | 'mainnet'): Promise<{
        success: boolean;
        transactionId?: string;
        topicId?: string;
        error?: string;
    }>;
    /**
     * Verify patent hash on blockchain
     */
    verifyPatentHash(topicId: string, messageId: string, expectedHash: string): Promise<{
        verified: boolean;
        actualHash?: string;
        timestamp?: string;
        message: string;
    }>;
    /**
     * Mint patent NFT with wallet connection
     */
    mintPatentNFTWithWallet(patent: Patent, walletConfig: any): Promise<{
        success: boolean;
        tokenId?: string;
        nftId?: string;
        transactionId?: string;
        error?: string;
    }>;
    /**
     * Transfer patent NFT
     */
    transferPatentNFT(tokenId: string, serial: number, fromAccountId: string, toAccountId: string): Promise<{
        transactionId: string;
        success: boolean;
    }>;
    /**
     * Calculate file hash
     */
    calculateFileHash(filePath: string): string;
    /**
     * Get network status
     */
    getNetworkStatus(network?: 'testnet' | 'mainnet'): Promise<{
        isOnline: boolean;
        error?: string;
    }>;
}
declare const _default: HederaService;
export default _default;
//# sourceMappingURL=hederaService.d.ts.map