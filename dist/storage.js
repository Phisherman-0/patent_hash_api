import { users, patents, patentDocuments, aiAnalysis, priorArtResults, blockchainTransactions, patentActivity, } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, sql } from "drizzle-orm";
export class DatabaseStorage {
    // User operations (IMPORTANT: mandatory for Replit Auth)
    async getUser(id) {
        const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return result[0];
    }
    async getUserById(id) {
        return this.getUser(id);
    }
    async createUser(userData) {
        const [user] = await db.insert(users).values(userData).returning();
        return user;
    }
    async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
    }
    async updateUser(id, updates) {
        const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
        return user;
    }
    async updateUserSettings(id, settings) {
        await db.update(users).set({ settings }).where(eq(users.id, id));
    }
    async deleteUser(id) {
        await db.delete(users).where(eq(users.id, id));
    }
    async upsertUser(userData) {
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
    async createPatent(patent) {
        const [newPatent] = await db.insert(patents).values(patent).returning();
        return newPatent;
    }
    async getPatent(id) {
        const [patent] = await db.select().from(patents).where(eq(patents.id, id));
        return patent;
    }
    async getPatentsByUser(userId) {
        return await db
            .select()
            .from(patents)
            .where(eq(patents.userId, userId))
            .orderBy(desc(patents.createdAt));
    }
    async updatePatent(id, updates) {
        const [updatedPatent] = await db
            .update(patents)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(patents.id, id))
            .returning();
        return updatedPatent;
    }
    async deletePatent(id) {
        await db.delete(patents).where(eq(patents.id, id));
    }
    async searchPatents(query, userId) {
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
    async createPatentDocument(document) {
        const [newDocument] = await db.insert(patentDocuments).values(document).returning();
        return newDocument;
    }
    async getPatentDocuments(patentId) {
        return await db
            .select()
            .from(patentDocuments)
            .where(eq(patentDocuments.patentId, patentId))
            .orderBy(desc(patentDocuments.createdAt));
    }
    async getPatentDocumentsByUser(userId) {
        return await db
            .select()
            .from(patentDocuments)
            .where(eq(patentDocuments.userId, userId))
            .orderBy(desc(patentDocuments.createdAt));
    }
    async deletePatentDocument(documentId) {
        await db.delete(patentDocuments).where(eq(patentDocuments.id, documentId));
    }
    // AI analysis operations
    async createAIAnalysis(analysis) {
        const [newAnalysis] = await db.insert(aiAnalysis).values(analysis).returning();
        return newAnalysis;
    }
    async getAIAnalyses(patentId, type) {
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
    async createPriorArtResult(result) {
        const [newResult] = await db.insert(priorArtResults).values(result).returning();
        return newResult;
    }
    async getPriorArtResults(patentId) {
        return await db
            .select()
            .from(priorArtResults)
            .where(eq(priorArtResults.patentId, patentId))
            .orderBy(desc(priorArtResults.similarityScore));
    }
    // Blockchain operations
    async createBlockchainTransaction(transaction) {
        const [newTransaction] = await db.insert(blockchainTransactions).values(transaction).returning();
        return newTransaction;
    }
    async getBlockchainTransactions(patentId) {
        return await db
            .select()
            .from(blockchainTransactions)
            .where(eq(blockchainTransactions.patentId, patentId))
            .orderBy(desc(blockchainTransactions.createdAt));
    }
    async updateBlockchainTransaction(id, updates) {
        const [updatedTransaction] = await db
            .update(blockchainTransactions)
            .set(updates)
            .where(eq(blockchainTransactions.id, id))
            .returning();
        return updatedTransaction;
    }
    // Activity operations
    async createPatentActivity(activity) {
        const [newActivity] = await db.insert(patentActivity).values(activity).returning();
        return newActivity;
    }
    async getPatentActivities(patentId) {
        return await db
            .select()
            .from(patentActivity)
            .where(eq(patentActivity.patentId, patentId))
            .orderBy(desc(patentActivity.createdAt));
    }
    async getUserActivities(userId, limit = 20) {
        return await db
            .select()
            .from(patentActivity)
            .where(eq(patentActivity.userId, userId))
            .orderBy(desc(patentActivity.createdAt))
            .limit(limit);
    }
    // Dashboard statistics
    async getUserStats(userId) {
        const [stats] = await db
            .select({
            totalPatents: sql `count(*)`,
            pendingReviews: sql `count(*) filter (where ${patents.status} in ('pending', 'under_review'))`,
            blockchainVerified: sql `count(*) filter (where ${patents.hederaTopicId} is not null)`,
            portfolioValue: sql `coalesce(sum(${patents.estimatedValue}), 0)`,
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
    async getPatentCategoryStats(userId) {
        const categoryStats = await db
            .select({
            category: patents.category,
            count: sql `count(*)`,
        })
            .from(patents)
            .where(eq(patents.userId, userId))
            .groupBy(patents.category);
        const total = categoryStats.reduce((sum, stat) => sum + stat.count, 0);
        return categoryStats.map((stat) => ({
            category: stat.category || 'other',
            count: stat.count,
            percentage: total > 0 ? Math.round((stat.count / total) * 100) : 0,
        }));
    }
}
export const storage = new DatabaseStorage();
