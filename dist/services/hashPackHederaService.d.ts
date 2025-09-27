import { Patent } from '../shared/schema';
export interface HashPackTransactionRequest {
    accountId: string;
    network: 'testnet' | 'mainnet';
    transactionBytes: string;
    signedTransactionBytes?: string;
}
declare class HashPackHederaService {
    private getClient;
    /**
     * Create an unsigned transaction for patent hash storage
     */
    createPatentHashTransaction(patentId: string, filePath: string, accountId: string, network: 'testnet' | 'mainnet'): Promise<{
        transactionBytes: string;
        hash: string;
        topicId?: string;
    }>;
    /**
     * Submit a signed transaction from HashPack
     */
    submitSignedTransaction(signedTransactionBytes: string, network: 'testnet' | 'mainnet'): Promise<{
        transactionId: string;
        topicId?: string;
        messageId?: string;
    }>;
    /**
     * Create and submit patent hash with HashPack workflow
     */
    storePatentHashWithHashPack(patentId: string, filePath: string, accountId: string, network: 'testnet' | 'mainnet'): Promise<{
        step: 'create_topic' | 'submit_message';
        transactionBytes?: string;
        hash?: string;
        topicId?: string;
        messageId?: string;
        transactionId?: string;
    }>;
    /**
     * Create message submission transaction after topic is created
     */
    createPatentMessageTransaction(patentId: string, hash: string, topicId: string, accountId: string, network: 'testnet' | 'mainnet'): Promise<{
        transactionBytes: string;
    }>;
    /**
     * Create NFT mint transaction for HashPack signing
     */
    createPatentNFTTransaction(patent: Patent, accountId: string, network: 'testnet' | 'mainnet'): Promise<{
        createTokenTx: string;
        mintTokenTx: string;
    }>;
    /**
     * Create NFT mint transaction after token is created
     */
    createNFTMintTransaction(tokenId: string, metadata: string, accountId: string, network: 'testnet' | 'mainnet'): Promise<{
        transactionBytes: string;
    }>;
    /**
     * Verify patent hash from blockchain
     */
    verifyPatentHash(topicId: string, messageId: string, expectedHash: string, network: 'testnet' | 'mainnet'): Promise<{
        verified: boolean;
        actualHash?: string;
        timestamp?: string;
        message: string;
    }>;
}
export declare const hashPackHederaService: HashPackHederaService;
export {};
//# sourceMappingURL=hashPackHederaService.d.ts.map