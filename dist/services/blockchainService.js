import { ethers } from 'ethers';
// Base Sepolia testnet (chainId 84532). Switch to 'https://mainnet.base.org' for mainnet.
const RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
// ABI for PatentSign.sol on Base
const PatentSignABI = [
    'function registerDocument(bytes32 docHash) external',
    'function signDocument(bytes32 docHash) external',
    'function documents(bytes32 docHash) external view returns (bool)',
    'function hasSigned(bytes32 docHash, address signer) external view returns (bool)',
    'function getSigners(bytes32 docHash) external view returns (address[])',
    'function getSignerCount(bytes32 docHash) external view returns (uint256)',
    'event DocumentRegistered(bytes32 indexed docHash, address indexed registeredBy, uint256 timestamp)',
    'event DocumentSigned(bytes32 indexed docHash, address indexed signer, uint256 timestamp)',
];
function toBytes32(hexHash) {
    const clean = hexHash.startsWith('0x') ? hexHash : `0x${hexHash}`;
    // Pad to bytes32 if needed
    return ethers.zeroPadValue(clean, 32);
}
export const blockchainService = {
    getProvider: () => new ethers.JsonRpcProvider(RPC_URL),
    getWallet: () => {
        const provider = blockchainService.getProvider();
        return new ethers.Wallet(PRIVATE_KEY, provider);
    },
    getContract: (readOnly = true) => {
        return new ethers.Contract(CONTRACT_ADDRESS, PatentSignABI, readOnly ? blockchainService.getProvider() : blockchainService.getWallet());
    },
    /**
     * Check whether a document hash has been registered on-chain.
     */
    isDocumentRegistered: async (hashValue) => {
        try {
            const contract = blockchainService.getContract(true);
            return await contract.documents(toBytes32(hashValue));
        }
        catch (error) {
            console.error('Blockchain verification error (Base):', error);
            return false;
        }
    },
    /**
     * Register a document hash on-chain using the backend operator wallet.
     * Returns the transaction hash on success.
     */
    registerDocument: async (hashValue) => {
        try {
            const contract = blockchainService.getContract(false);
            const tx = await contract.registerDocument(toBytes32(hashValue));
            const receipt = await tx.wait();
            return receipt.hash;
        }
        catch (error) {
            console.error('Blockchain registerDocument error (Base):', error);
            return null;
        }
    },
    /**
     * Retrieve all wallet addresses that have signed a document.
     */
    getSigners: async (hashValue) => {
        try {
            const contract = blockchainService.getContract(true);
            return await contract.getSigners(toBytes32(hashValue));
        }
        catch (error) {
            console.error('Blockchain getSigners error (Base):', error);
            return [];
        }
    },
    /**
     * Check whether a specific address has signed a document.
     */
    hasSigned: async (hashValue, signerAddress) => {
        try {
            const contract = blockchainService.getContract(true);
            return await contract.hasSigned(toBytes32(hashValue), signerAddress);
        }
        catch (error) {
            console.error('Blockchain hasSigned error (Base):', error);
            return false;
        }
    },
};
