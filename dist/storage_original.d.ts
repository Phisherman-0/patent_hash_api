import type { User, InsertUser, UpsertUser, Patent, InsertPatent, PatentDocument, InsertPatentDocument, AIAnalysis, InsertAIAnalysis, PriorArtResult, InsertPriorArtResult, BlockchainTransaction, InsertBlockchainTransaction, PatentActivity, InsertPatentActivity, UserSettings } from './shared/schema';
export interface IStorage {
    createUser(user: InsertUser): Promise<User>;
    getUser(id: string): Promise<User | undefined>;
    getUserById(id: string): Promise<User | undefined>;
    getUserByEmail(email: string): Promise<User | undefined>;
    updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
    updateUserSettings(id: string, settings: Partial<UserSettings>): Promise<User | undefined>;
    deleteUser(id: string): Promise<void>;
    createPatent(patent: InsertPatent): Promise<Patent>;
    getPatent(id: string): Promise<Patent | undefined>;
    getPatentsByUser(userId: string): Promise<Patent[]>;
    updatePatent(id: string, updates: Partial<InsertPatent>): Promise<Patent>;
    deletePatent(id: string): Promise<void>;
    searchPatents(query: string, userId?: string): Promise<Patent[]>;
    createPatentDocument(document: InsertPatentDocument): Promise<PatentDocument>;
    getPatentDocumentsByUser(userId: string): Promise<PatentDocument[]>;
    deletePatentDocument(documentId: string): Promise<void>;
    createAIAnalysis(analysis: InsertAIAnalysis): Promise<AIAnalysis>;
    getAIAnalyses(patentId: string, type?: string): Promise<AIAnalysis[]>;
    createPriorArtResult(result: InsertPriorArtResult): Promise<PriorArtResult>;
    getPriorArtResults(patentId: string): Promise<PriorArtResult[]>;
    createBlockchainTransaction(transaction: InsertBlockchainTransaction): Promise<BlockchainTransaction>;
    getBlockchainTransactions(patentId: string): Promise<BlockchainTransaction[]>;
    updateBlockchainTransaction(id: string, updates: Partial<InsertBlockchainTransaction>): Promise<BlockchainTransaction>;
    createPatentActivity(activity: InsertPatentActivity): Promise<PatentActivity>;
    getPatentActivities(patentId: string): Promise<PatentActivity[]>;
    getUserActivities(userId: string, limit?: number): Promise<PatentActivity[]>;
    getUserStats(userId: string): Promise<{
        totalPatents: number;
        pendingReviews: number;
        blockchainVerified: number;
        portfolioValue: string;
    }>;
    getPatentCategoryStats(userId: string): Promise<Array<{
        category: string;
        count: number;
        percentage: number;
    }>>;
}
export declare class DatabaseStorage implements IStorage {
    getUser(id: string): Promise<User | undefined>;
    getUserById(id: string): Promise<User | undefined>;
    createUser(userData: Omit<InsertUser, 'id'>): Promise<User>;
    getUserByEmail(email: string): Promise<User | undefined>;
    updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined>;
    updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<User | undefined>;
    deleteUser(id: string): Promise<void>;
    upsertUser(userData: UpsertUser): Promise<User>;
    createPatent(patent: InsertPatent): Promise<Patent>;
    getPatent(id: string): Promise<Patent | undefined>;
    getPatentsByUser(userId: string): Promise<Patent[]>;
    updatePatent(id: string, updates: Partial<InsertPatent>): Promise<Patent>;
    deletePatent(id: string): Promise<void>;
    searchPatents(query: string, userId?: string): Promise<Patent[]>;
    createPatentDocument(document: InsertPatentDocument): Promise<PatentDocument>;
    getPatentDocuments(patentId: string): Promise<PatentDocument[]>;
    getPatentDocumentsByUser(userId: string): Promise<PatentDocument[]>;
    deletePatentDocument(documentId: string): Promise<void>;
    createAIAnalysis(analysis: InsertAIAnalysis): Promise<AIAnalysis>;
    getAIAnalyses(patentId: string, type?: string): Promise<AIAnalysis[]>;
    createPriorArtResult(result: InsertPriorArtResult): Promise<PriorArtResult>;
    getPriorArtResults(patentId: string): Promise<PriorArtResult[]>;
    createBlockchainTransaction(transaction: InsertBlockchainTransaction): Promise<BlockchainTransaction>;
    getBlockchainTransactions(patentId: string): Promise<BlockchainTransaction[]>;
    updateBlockchainTransaction(id: string, updates: Partial<InsertBlockchainTransaction>): Promise<BlockchainTransaction>;
    createPatentActivity(activity: InsertPatentActivity): Promise<PatentActivity>;
    getPatentActivities(patentId: string): Promise<PatentActivity[]>;
    getUserActivities(userId: string, limit?: number): Promise<PatentActivity[]>;
    getUserStats(userId: string): Promise<{
        totalPatents: number;
        pendingReviews: number;
        blockchainVerified: number;
        portfolioValue: string;
    }>;
    getPatentCategoryStats(userId: string): Promise<Array<{
        category: string;
        count: number;
        percentage: number;
    }>>;
}
export declare const storage: DatabaseStorage;
//# sourceMappingURL=storage_original.d.ts.map