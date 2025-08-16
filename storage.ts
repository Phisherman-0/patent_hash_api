import {
  users,
  patents,
  patentDocuments,
  aiAnalysis,
  priorArtResults,
  blockchainTransactions,
  patentActivity,
  type User,
  type InsertUser,
  type UpsertUser,
  type Patent,
  type InsertPatent,
  type PatentDocument,
  type InsertPatentDocument,
  type AIAnalysis,
  type InsertAIAnalysis,
  type PriorArtResult,
  type InsertPriorArtResult,
  type BlockchainTransaction,
  type InsertBlockchainTransaction,
  type PatentActivity,
  type InsertPatentActivity,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations 
  createUser(user: InsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  updateUserSettings(id: string, settings: any): Promise<void>;
  deleteUser(id: string): Promise<void>;
  
  // Patent operations
  createPatent(patent: InsertPatent): Promise<Patent>;
  getPatent(id: string): Promise<Patent | undefined>;
  getPatentsByUser(userId: string): Promise<Patent[]>;
  updatePatent(id: string, updates: Partial<InsertPatent>): Promise<Patent>;
  deletePatent(id: string): Promise<void>;
  searchPatents(query: string, userId?: string): Promise<Patent[]>;
  
  // Patent document operations
  createPatentDocument(document: InsertPatentDocument): Promise<PatentDocument>;
  getPatentDocumentsByUser(userId: string): Promise<PatentDocument[]>;
  deletePatentDocument(documentId: string): Promise<void>;
  
  // AI analysis operations
  createAIAnalysis(analysis: InsertAIAnalysis): Promise<AIAnalysis>;
  getAIAnalyses(patentId: string, type?: string): Promise<AIAnalysis[]>;
  
  // Prior art operations
  createPriorArtResult(result: InsertPriorArtResult): Promise<PriorArtResult>;
  getPriorArtResults(patentId: string): Promise<PriorArtResult[]>;
  
  // Blockchain operations
  createBlockchainTransaction(transaction: InsertBlockchainTransaction): Promise<BlockchainTransaction>;
  getBlockchainTransactions(patentId: string): Promise<BlockchainTransaction[]>;
  updateBlockchainTransaction(id: string, updates: Partial<InsertBlockchainTransaction>): Promise<BlockchainTransaction>;
  
  // Activity operations
  createPatentActivity(activity: InsertPatentActivity): Promise<PatentActivity>;
  getPatentActivities(patentId: string): Promise<PatentActivity[]>;
  getUserActivities(userId: string, limit?: number): Promise<PatentActivity[]>;
  
  // Dashboard statistics
  getUserStats(userId: string): Promise<{
    totalPatents: number;
    pendingReviews: number;
    blockchainVerified: number;
    portfolioValue: string;
  }>;
  
  // Patent statistics by category
  getPatentCategoryStats(userId: string): Promise<Array<{
    category: string;
    count: number;
    percentage: number;
  }>>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async createUser(userData: Omit<InsertUser, 'id'>): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserSettings(id: string, settings: any): Promise<void> {
    await db.update(users).set({ settings }).where(eq(users.id, id));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Patent operations
  async createPatent(patent: InsertPatent): Promise<Patent> {
    const [newPatent] = await db.insert(patents).values(patent).returning();
    return newPatent;
  }

  async getPatent(id: string): Promise<Patent | undefined> {
    const [patent] = await db.select().from(patents).where(eq(patents.id, id));
    return patent;
  }

  async getPatentsByUser(userId: string): Promise<Patent[]> {
    return await db
      .select()
      .from(patents)
      .where(eq(patents.userId, userId))
      .orderBy(desc(patents.createdAt));
  }

  async updatePatent(id: string, updates: Partial<InsertPatent>): Promise<Patent> {
    const [updatedPatent] = await db
      .update(patents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(patents.id, id))
      .returning();
    return updatedPatent;
  }

  async deletePatent(id: string): Promise<void> {
    await db.delete(patents).where(eq(patents.id, id));
  }

  async searchPatents(query: string, userId?: string): Promise<Patent[]> {
    const conditions = [
      ilike(patents.title, `%${query}%`),
      ilike(patents.description, `%${query}%`),
    ];
    
    if (userId) {
      conditions.push(eq(patents.userId, userId));
    }

    return await db
      .select()
      .from(patents)
      .where(and(...conditions))
      .orderBy(desc(patents.createdAt));
  }

  // Patent document operations
  async createPatentDocument(document: InsertPatentDocument): Promise<PatentDocument> {
    const [newDocument] = await db.insert(patentDocuments).values(document).returning();
    return newDocument;
  }

  async getPatentDocuments(patentId: string): Promise<PatentDocument[]> {
    return await db
      .select()
      .from(patentDocuments)
      .where(eq(patentDocuments.patentId, patentId))
      .orderBy(desc(patentDocuments.createdAt));
  }

  async getPatentDocumentsByUser(userId: string): Promise<PatentDocument[]> {
    return await db
      .select()
      .from(patentDocuments)
      .where(eq(patentDocuments.userId, userId))
      .orderBy(desc(patentDocuments.createdAt));
  }

  async deletePatentDocument(documentId: string): Promise<void> {
    await db.delete(patentDocuments).where(eq(patentDocuments.id, documentId));
  }

  // AI analysis operations
  async createAIAnalysis(analysis: InsertAIAnalysis): Promise<AIAnalysis> {
    const [newAnalysis] = await db.insert(aiAnalysis).values(analysis).returning();
    return newAnalysis;
  }

  async getAIAnalyses(patentId: string, type?: string): Promise<AIAnalysis[]> {
    const conditions = [eq(aiAnalysis.patentId, patentId)];
    if (type) {
      conditions.push(eq(aiAnalysis.analysisType, type));
    }

    return await db
      .select()
      .from(aiAnalysis)
      .where(and(...conditions))
      .orderBy(desc(aiAnalysis.createdAt));
  }

  // Prior art operations
  async createPriorArtResult(result: InsertPriorArtResult): Promise<PriorArtResult> {
    const [newResult] = await db.insert(priorArtResults).values(result).returning();
    return newResult;
  }

  async getPriorArtResults(patentId: string): Promise<PriorArtResult[]> {
    return await db
      .select()
      .from(priorArtResults)
      .where(eq(priorArtResults.patentId, patentId))
      .orderBy(desc(priorArtResults.similarityScore));
  }

  // Blockchain operations
  async createBlockchainTransaction(transaction: InsertBlockchainTransaction): Promise<BlockchainTransaction> {
    const [newTransaction] = await db.insert(blockchainTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getBlockchainTransactions(patentId: string): Promise<BlockchainTransaction[]> {
    return await db
      .select()
      .from(blockchainTransactions)
      .where(eq(blockchainTransactions.patentId, patentId))
      .orderBy(desc(blockchainTransactions.createdAt));
  }

  async updateBlockchainTransaction(id: string, updates: Partial<InsertBlockchainTransaction>): Promise<BlockchainTransaction> {
    const [updatedTransaction] = await db
      .update(blockchainTransactions)
      .set(updates)
      .where(eq(blockchainTransactions.id, id))
      .returning();
    return updatedTransaction;
  }

  // Activity operations
  async createPatentActivity(activity: InsertPatentActivity): Promise<PatentActivity> {
    const [newActivity] = await db.insert(patentActivity).values(activity).returning();
    return newActivity;
  }

  async getPatentActivities(patentId: string): Promise<PatentActivity[]> {
    return await db
      .select()
      .from(patentActivity)
      .where(eq(patentActivity.patentId, patentId))
      .orderBy(desc(patentActivity.createdAt));
  }

  async getUserActivities(userId: string, limit: number = 20): Promise<PatentActivity[]> {
    return await db
      .select()
      .from(patentActivity)
      .where(eq(patentActivity.userId, userId))
      .orderBy(desc(patentActivity.createdAt))
      .limit(limit);
  }

  // Dashboard statistics
  async getUserStats(userId: string): Promise<{
    totalPatents: number;
    pendingReviews: number;
    blockchainVerified: number;
    portfolioValue: string;
  }> {
    const [stats] = await db
      .select({
        totalPatents: sql<number>`count(*)`,
        pendingReviews: sql<number>`count(*) filter (where ${patents.status} in ('pending', 'under_review'))`,
        blockchainVerified: sql<number>`count(*) filter (where ${patents.hederaTopicId} is not null)`,
        portfolioValue: sql<string>`coalesce(sum(${patents.estimatedValue}), 0)`,
      })
      .from(patents)
      .where(eq(patents.userId, userId));

    return {
      totalPatents: stats.totalPatents,
      pendingReviews: stats.pendingReviews,
      blockchainVerified: stats.blockchainVerified,
      portfolioValue: stats.portfolioValue,
    };
  }

  // Patent statistics by category
  async getPatentCategoryStats(userId: string): Promise<Array<{
    category: string;
    count: number;
    percentage: number;
  }>> {
    const categoryStats = await db
      .select({
        category: patents.category,
        count: sql<number>`count(*)`,
      })
      .from(patents)
      .where(eq(patents.userId, userId))
      .groupBy(patents.category);

    const total = categoryStats.reduce((sum: number, stat: any) => sum + stat.count, 0);

    return categoryStats.map((stat: any) => ({
      category: stat.category || 'other',
      count: stat.count,
      percentage: total > 0 ? Math.round((stat.count / total) * 100) : 0,
    }));
  }
}

export const storage = new DatabaseStorage();
