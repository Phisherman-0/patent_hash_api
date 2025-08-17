import type { Patent } from "@shared/schema";
declare class HederaService {
    private client;
    private operatorId;
    private operatorKey;
    constructor();
    storePatentHash(patentId: string, filePath: string): Promise<{
        topicId: string;
        messageId: string;
        hash: string;
        transactionId: string;
    }>;
    verifyPatentHash(topicId: string, messageId: string, expectedHash: string): Promise<{
        verified: boolean;
        actualHash?: string;
        timestamp?: string;
        message: string;
    }>;
    mintPatentNFT(patent: Patent): Promise<{
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