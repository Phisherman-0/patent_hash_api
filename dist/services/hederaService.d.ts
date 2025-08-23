import { Patent, WalletConfig } from '../shared/schema';
declare class HederaService {
    private client;
    private operatorId;
    private operatorKey;
    constructor();
    validateWallet(accountId: string, privateKey: string, network: 'testnet' | 'mainnet'): Promise<{
        isValid: boolean;
        balance?: string;
        error?: string;
    }>;
    storePatentHashWithWallet(patentId: string, filePath: string, walletConfig: WalletConfig): Promise<{
        topicId: string;
        messageId: string;
        hash: string;
        transactionId: string;
    }>;
    storePatentHash(patentId: string, filePath: string): Promise<{
        topicId: string;
        messageId: string;
        hash: string;
        transactionId: string;
    }>;
    private executePatentHashStorage;
    verifyPatentHash(topicId: string, messageId: string, expectedHash: string): Promise<{
        verified: boolean;
        actualHash?: string;
        timestamp?: string;
        message: string;
    }>;
    mintPatentNFT(patent: Patent, walletConfig?: WalletConfig): Promise<{
        nftId: string;
        transactionId: string;
        tokenId: string;
    }>;
    transferPatentNFT(tokenId: string, serial: number, fromAccountId: string, toAccountId: string): Promise<{
        transactionId: string;
        success: boolean;
    }>;
}
export declare const hederaService: HederaService;
export {};
//# sourceMappingURL=hederaService.d.ts.map