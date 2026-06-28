import { ethers } from 'ethers';
export declare const blockchainService: {
    getProvider: () => ethers.JsonRpcProvider;
    getWallet: () => ethers.Wallet;
    getContract: (readOnly?: boolean) => ethers.Contract;
    /**
     * Check whether a document hash has been registered on-chain.
     */
    isDocumentRegistered: (hashValue: string) => Promise<boolean>;
    /**
     * Register a document hash on-chain using the backend operator wallet.
     * Returns the transaction hash on success.
     */
    registerDocument: (hashValue: string) => Promise<string | null>;
    /**
     * Retrieve all wallet addresses that have signed a document.
     */
    getSigners: (hashValue: string) => Promise<string[]>;
    /**
     * Check whether a specific address has signed a document.
     */
    hasSigned: (hashValue: string, signerAddress: string) => Promise<boolean>;
};
//# sourceMappingURL=blockchainService.d.ts.map