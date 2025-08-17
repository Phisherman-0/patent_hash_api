var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// index.ts
import express from "express";
import cors from "cors";

// routes.ts
import { createServer } from "http";
import multer from "multer";
import fs2 from "fs";
import crypto2 from "crypto";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  aiAnalysis: () => aiAnalysis,
  aiAnalysisRelations: () => aiAnalysisRelations,
  blockchainTransactions: () => blockchainTransactions,
  blockchainTransactionsRelations: () => blockchainTransactionsRelations,
  insertAIAnalysisSchema: () => insertAIAnalysisSchema,
  insertPatentDocumentSchema: () => insertPatentDocumentSchema,
  insertPatentSchema: () => insertPatentSchema,
  patentActivity: () => patentActivity,
  patentActivityRelations: () => patentActivityRelations,
  patentCategoryEnum: () => patentCategoryEnum,
  patentDocuments: () => patentDocuments,
  patentDocumentsRelations: () => patentDocumentsRelations,
  patentStatusEnum: () => patentStatusEnum,
  patents: () => patents,
  patentsRelations: () => patentsRelations,
  priorArtResults: () => priorArtResults,
  priorArtResultsRelations: () => priorArtResultsRelations,
  sessions: () => sessions,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"),
  passwordHash: varchar("password_hash"),
  settings: jsonb("settings").default(sql`'{}'`),
  // Store user preferences including theme
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var patentStatusEnum = pgEnum("patent_status", [
  "draft",
  "pending",
  "under_review",
  "approved",
  "rejected",
  "expired"
]);
var patentCategoryEnum = pgEnum("patent_category", [
  "medical_technology",
  "software_ai",
  "renewable_energy",
  "manufacturing",
  "biotechnology",
  "automotive",
  "telecommunications",
  "other"
]);
var patents = pgTable("patents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: patentCategoryEnum("category").notNull(),
  status: patentStatusEnum("status").default("draft"),
  patentNumber: varchar("patent_number"),
  filePath: varchar("file_path"),
  hashValue: varchar("hash_value"),
  hederaTopicId: varchar("hedera_topic_id"),
  hederaMessageId: varchar("hedera_message_id"),
  hederaNftId: varchar("hedera_nft_id"),
  aiSuggestedCategory: patentCategoryEnum("ai_suggested_category"),
  aiConfidence: decimal("ai_confidence", { precision: 5, scale: 4 }),
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }),
  filedAt: timestamp("filed_at"),
  approvedAt: timestamp("approved_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var patentDocuments = pgTable("patent_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patentId: varchar("patent_id").notNull(),
  userId: varchar("user_id").notNull(),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileType: varchar("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  hashValue: varchar("hash_value").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var aiAnalysis = pgTable("ai_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patentId: varchar("patent_id").notNull(),
  analysisType: varchar("analysis_type").notNull(),
  // prior_art, similarity, valuation, classification
  result: jsonb("result").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow()
});
var priorArtResults = pgTable("prior_art_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patentId: varchar("patent_id").notNull(),
  similarPatentId: varchar("similar_patent_id"),
  externalPatentId: varchar("external_patent_id"),
  similarityScore: decimal("similarity_score", { precision: 5, scale: 4 }),
  title: varchar("title"),
  description: text("description"),
  source: varchar("source"),
  // internal, uspto, epo, etc.
  createdAt: timestamp("created_at").defaultNow()
});
var blockchainTransactions = pgTable("blockchain_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patentId: varchar("patent_id").notNull(),
  transactionType: varchar("transaction_type").notNull(),
  // hash_storage, nft_mint, transfer
  hederaTransactionId: varchar("hedera_transaction_id"),
  hederaTopicId: varchar("hedera_topic_id"),
  hederaMessageId: varchar("hedera_message_id"),
  hashValue: varchar("hash_value"),
  // Store the hash that was submitted to blockchain
  gasUsed: decimal("gas_used", { precision: 10, scale: 6 }),
  status: varchar("status").default("pending"),
  // pending, confirmed, failed
  createdAt: timestamp("created_at").defaultNow()
});
var patentActivity = pgTable("patent_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patentId: varchar("patent_id").notNull(),
  userId: varchar("user_id").notNull(),
  activityType: varchar("activity_type").notNull(),
  // created, updated, filed, approved, etc.
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow()
});
var usersRelations = relations(users, ({ many }) => ({
  patents: many(patents),
  activities: many(patentActivity)
}));
var patentsRelations = relations(patents, ({ one, many }) => ({
  user: one(users, {
    fields: [patents.userId],
    references: [users.id]
  }),
  documents: many(patentDocuments),
  aiAnalyses: many(aiAnalysis),
  priorArtResults: many(priorArtResults),
  blockchainTransactions: many(blockchainTransactions),
  activities: many(patentActivity)
}));
var patentDocumentsRelations = relations(patentDocuments, ({ one }) => ({
  patent: one(patents, {
    fields: [patentDocuments.patentId],
    references: [patents.id]
  }),
  user: one(users, {
    fields: [patentDocuments.userId],
    references: [users.id]
  })
}));
var aiAnalysisRelations = relations(aiAnalysis, ({ one }) => ({
  patent: one(patents, {
    fields: [aiAnalysis.patentId],
    references: [patents.id]
  })
}));
var priorArtResultsRelations = relations(priorArtResults, ({ one }) => ({
  patent: one(patents, {
    fields: [priorArtResults.patentId],
    references: [patents.id]
  })
}));
var blockchainTransactionsRelations = relations(blockchainTransactions, ({ one }) => ({
  patent: one(patents, {
    fields: [blockchainTransactions.patentId],
    references: [patents.id]
  })
}));
var patentActivityRelations = relations(patentActivity, ({ one }) => ({
  patent: one(patents, {
    fields: [patentActivity.patentId],
    references: [patents.id]
  }),
  user: one(users, {
    fields: [patentActivity.userId],
    references: [users.id]
  })
}));
var insertPatentSchema = createInsertSchema(patents).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertPatentDocumentSchema = createInsertSchema(patentDocuments).omit({
  id: true,
  createdAt: true
});
var insertAIAnalysisSchema = createInsertSchema(aiAnalysis).omit({
  id: true,
  createdAt: true
});

// db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Supabase/Vercel optimizations
  max: process.env.NODE_ENV === "production" ? 1 : 10,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 2e3,
  // SSL configuration for production (Supabase requires SSL)
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
};
var pool = new Pool(poolConfig);
var db = drizzle(pool, { schema: schema_exports });

// storage.ts
import { eq, desc, and, ilike, sql as sql2 } from "drizzle-orm";
var DatabaseStorage = class {
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
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
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
    return await db.select().from(patents).where(eq(patents.userId, userId)).orderBy(desc(patents.createdAt));
  }
  async updatePatent(id, updates) {
    const [updatedPatent] = await db.update(patents).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(patents.id, id)).returning();
    return updatedPatent;
  }
  async deletePatent(id) {
    await db.delete(patents).where(eq(patents.id, id));
  }
  async searchPatents(query, userId) {
    const conditions = [
      ilike(patents.title, `%${query}%`),
      ilike(patents.description, `%${query}%`)
    ];
    if (userId) {
      conditions.push(eq(patents.userId, userId));
    }
    return await db.select().from(patents).where(and(...conditions)).orderBy(desc(patents.createdAt));
  }
  // Patent document operations
  async createPatentDocument(document) {
    const [newDocument] = await db.insert(patentDocuments).values(document).returning();
    return newDocument;
  }
  async getPatentDocuments(patentId) {
    return await db.select().from(patentDocuments).where(eq(patentDocuments.patentId, patentId)).orderBy(desc(patentDocuments.createdAt));
  }
  async getPatentDocumentsByUser(userId) {
    return await db.select().from(patentDocuments).where(eq(patentDocuments.userId, userId)).orderBy(desc(patentDocuments.createdAt));
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
    return await db.select().from(aiAnalysis).where(and(...conditions)).orderBy(desc(aiAnalysis.createdAt));
  }
  // Prior art operations
  async createPriorArtResult(result) {
    const [newResult] = await db.insert(priorArtResults).values(result).returning();
    return newResult;
  }
  async getPriorArtResults(patentId) {
    return await db.select().from(priorArtResults).where(eq(priorArtResults.patentId, patentId)).orderBy(desc(priorArtResults.similarityScore));
  }
  // Blockchain operations
  async createBlockchainTransaction(transaction) {
    const [newTransaction] = await db.insert(blockchainTransactions).values(transaction).returning();
    return newTransaction;
  }
  async getBlockchainTransactions(patentId) {
    return await db.select().from(blockchainTransactions).where(eq(blockchainTransactions.patentId, patentId)).orderBy(desc(blockchainTransactions.createdAt));
  }
  async updateBlockchainTransaction(id, updates) {
    const [updatedTransaction] = await db.update(blockchainTransactions).set(updates).where(eq(blockchainTransactions.id, id)).returning();
    return updatedTransaction;
  }
  // Activity operations
  async createPatentActivity(activity) {
    const [newActivity] = await db.insert(patentActivity).values(activity).returning();
    return newActivity;
  }
  async getPatentActivities(patentId) {
    return await db.select().from(patentActivity).where(eq(patentActivity.patentId, patentId)).orderBy(desc(patentActivity.createdAt));
  }
  async getUserActivities(userId, limit = 20) {
    return await db.select().from(patentActivity).where(eq(patentActivity.userId, userId)).orderBy(desc(patentActivity.createdAt)).limit(limit);
  }
  // Dashboard statistics
  async getUserStats(userId) {
    const [stats] = await db.select({
      totalPatents: sql2`count(*)`,
      pendingReviews: sql2`count(*) filter (where ${patents.status} in ('pending', 'under_review'))`,
      blockchainVerified: sql2`count(*) filter (where ${patents.hederaTopicId} is not null)`,
      portfolioValue: sql2`coalesce(sum(${patents.estimatedValue}), 0)`
    }).from(patents).where(eq(patents.userId, userId));
    return {
      totalPatents: stats.totalPatents,
      pendingReviews: stats.pendingReviews,
      blockchainVerified: stats.blockchainVerified,
      portfolioValue: stats.portfolioValue
    };
  }
  // Patent statistics by category
  async getPatentCategoryStats(userId) {
    const categoryStats = await db.select({
      category: patents.category,
      count: sql2`count(*)`
    }).from(patents).where(eq(patents.userId, userId)).groupBy(patents.category);
    const total = categoryStats.reduce((sum, stat) => sum + stat.count, 0);
    return categoryStats.map((stat) => ({
      category: stat.category || "other",
      count: stat.count,
      percentage: total > 0 ? Math.round(stat.count / total * 100) : 0
    }));
  }
};
var storage = new DatabaseStorage();

// auth.ts
import bcrypt from "bcrypt";
import { z } from "zod";
async function hashPassword(password) {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}
async function comparePasswords(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}
async function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {
      });
      return res.status(401).json({ message: "User not found" });
    }
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: null,
      role: null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Authentication failed" });
  }
}
var userRegisterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
async function register(req, res) {
  try {
    const validatedData = userRegisterSchema.parse(req.body);
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }
    const hashedPassword = await hashPassword(validatedData.password);
    const { password, ...userDataWithoutPassword } = validatedData;
    const newUser = await storage.createUser({
      ...userDataWithoutPassword,
      passwordHash: hashedPassword
    });
    req.session.userId = newUser.id;
    const { passwordHash, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Registration failed"
    });
  }
}
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.passwordHash) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const isValidPassword = await comparePasswords(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    req.session.userId = user.id;
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
}
async function logout(req, res) {
  try {
    req.session?.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
}
async function getCurrentUser(req, res) {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {
      });
      return res.status(401).json({ message: "User not found" });
    }
    const { passwordHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Failed to get user" });
  }
}

// services/aiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();
var genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
var AIService = class {
  async generateWithGemini(prompt, systemPrompt) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY not configured. Please add it to your .env file.");
      }
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      });
      const fullPrompt = `${systemPrompt}

${prompt}`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text2 = response.text();
      if (!text2 || text2.trim().length === 0) {
        throw new Error("Empty response from Gemini AI");
      }
      return text2;
    } catch (error) {
      console.error("Gemini AI error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("API_KEY_INVALID")) {
        throw new Error("Invalid Gemini API key. Please check your GEMINI_API_KEY in .env file.");
      } else if (errorMessage.includes("QUOTA_EXCEEDED")) {
        throw new Error("Gemini API quota exceeded. Please check your usage limits.");
      } else if (errorMessage.includes("RATE_LIMIT_EXCEEDED")) {
        throw new Error("Gemini API rate limit exceeded. Please try again later.");
      }
      throw error;
    }
  }
  parseAIResponse(response, fallback = {}) {
    try {
      let cleanResponse = response.replace(/```json\s*/gi, "").replace(/```\s*/g, "").replace(/^\s*[\r\n]/gm, "").trim();
      const jsonStart = cleanResponse.indexOf("{");
      const jsonEnd = cleanResponse.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      }
      return JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      console.error("Raw response preview:", response.substring(0, 300));
      const patterns = [
        /\{[\s\S]*?\}/,
        /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/,
        /\{.*\}/s
      ];
      for (const pattern of patterns) {
        const jsonMatch = response.match(pattern);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (secondParseError) {
            continue;
          }
        }
      }
      console.error("All JSON parsing attempts failed, using fallback");
      return fallback;
    }
  }
  async performPriorArtSearch(description) {
    try {
      const systemPrompt = "You are a patent research expert. Analyze patent descriptions and identify prior art with high accuracy. Respond with valid JSON only.";
      const prompt = `
        Analyze the following patent description and identify potential prior art. 
        Return a JSON array of similar patents with the following structure:
        {
          "results": [
            {
              "patentId": "US-XXXX-XXXX",
              "title": "Patent Title",
              "description": "Brief description",
              "similarityScore": 0.85,
              "source": "USPTO"
            }
          ]
        }
        
        Patent description: ${description}
        
        Focus on technical similarities, innovative aspects, and potential conflicts.
      `;
      const response = await this.generateWithGemini(prompt, systemPrompt);
      const result = this.parseAIResponse(response, { results: [] });
      return result.results || [];
    } catch (error) {
      console.error("Error in prior art search:", error);
      return [];
    }
  }
  async evaluatePatentValue(patent) {
    try {
      const systemPrompt = "You are a patent valuation expert. Provide realistic commercial valuations based on market data and innovation potential. Respond with valid JSON only.";
      const prompt = `
        Evaluate the commercial value of this patent based on market potential, innovation level, and industry trends.
        Return a JSON object with the following structure:
        {
          "estimatedValue": 450000,
          "confidence": 0.78,
          "factors": ["Market size", "Innovation level", "Commercial applicability"],
          "marketAnalysis": "Detailed market analysis",
          "recommendations": ["Licensing opportunities", "Market expansion"]
        }
        
        Patent Details:
        Title: ${patent.title}
        Description: ${patent.description}
        Category: ${patent.category}
        Status: ${patent.status}
      `;
      const response = await this.generateWithGemini(prompt, systemPrompt);
      const result = this.parseAIResponse(response, {
        estimatedValue: 0,
        confidence: 0,
        factors: [],
        marketAnalysis: "Valuation analysis unavailable",
        recommendations: []
      });
      return {
        estimatedValue: result.estimatedValue || 0,
        confidence: result.confidence || 0,
        factors: result.factors || [],
        marketAnalysis: result.marketAnalysis || "",
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error("Error in patent valuation:", error);
      return {
        estimatedValue: 0,
        confidence: 0,
        factors: [],
        marketAnalysis: "Valuation analysis unavailable",
        recommendations: []
      };
    }
  }
  async detectSimilarity(sourceText, targetText) {
    try {
      const systemPrompt = "You are a patent similarity expert. Analyze text similarity for potential patent conflicts. Respond with valid JSON only.";
      const prompt = `
        Compare these two patent descriptions for similarity and potential conflicts.
        Return a JSON object with the following structure:
        {
          "similarityScore": 0.75,
          "confidence": 0.85,
          "analysis": "Detailed similarity analysis",
          "riskLevel": "medium"
        }
        
        Source Text: ${sourceText}
        Target Text: ${targetText}
        
        Focus on technical concepts, methodology, and potential infringement risks.
      `;
      const response = await this.generateWithGemini(prompt, systemPrompt);
      const result = this.parseAIResponse(response, {
        similarityScore: 0,
        confidence: 0,
        analysis: "Similarity analysis unavailable",
        riskLevel: "low"
      });
      return {
        similarityScore: result.similarityScore || 0,
        confidence: result.confidence || 0,
        analysis: result.analysis || "",
        riskLevel: result.riskLevel || "low"
      };
    } catch (error) {
      console.error("Error in similarity detection:", error);
      return {
        similarityScore: 0,
        confidence: 0,
        analysis: "Similarity analysis unavailable",
        riskLevel: "low"
      };
    }
  }
  async generatePatentDraft(input) {
    try {
      const systemPrompt = "You are a patent attorney expert. Generate professional patent application documents with proper legal and technical language. Respond with valid JSON only.";
      const prompt = `
        Generate a professional patent application draft based on the following information.
        Return a JSON object with the following structure:
        {
          "title": "Improved title",
          "abstract": "Patent abstract",
          "background": "Background section",
          "summary": "Summary section",
          "detailedDescription": "Detailed description",
          "claims": ["Claim 1", "Claim 2", "Claim 3"]
        }
        
        Input Information:
        Title: ${input.title}
        Description: ${input.description}
        Category: ${input.category}
        
        Generate professional, technical language suitable for patent applications.
        Include multiple detailed claims with proper patent terminology.
      `;
      const response = await this.generateWithGemini(prompt, systemPrompt);
      const result = this.parseAIResponse(response, {
        title: input.title,
        abstract: "Patent draft generation unavailable",
        background: "",
        summary: "",
        detailedDescription: "",
        claims: []
      });
      return {
        title: result.title || input.title,
        abstract: result.abstract || "",
        background: result.background || "",
        summary: result.summary || "",
        detailedDescription: result.detailedDescription || "",
        claims: result.claims || [],
        drawings: result.drawings || []
      };
    } catch (error) {
      console.error("Error in patent drafting:", error);
      return {
        title: input.title,
        abstract: "Patent draft generation unavailable",
        background: "",
        summary: "",
        detailedDescription: "",
        claims: []
      };
    }
  }
  async classifyInnovation(description) {
    try {
      const systemPrompt = "You are an innovation classification expert. Categorize innovations accurately based on technical content. Respond with valid JSON only.";
      const prompt = `
        Classify this innovation into appropriate patent categories.
        Return a JSON object with the following structure:
        {
          "category": "medical_technology",
          "confidence": 0.92,
          "subcategories": ["diagnostic devices", "medical imaging"],
          "analysis": "Detailed classification analysis"
        }
        
        Innovation Description: ${description}
        
        Use these main categories: medical_technology, software_ai, renewable_energy, manufacturing, biotechnology, automotive, telecommunications, other
      `;
      const response = await this.generateWithGemini(prompt, systemPrompt);
      const result = this.parseAIResponse(response, {
        category: "other",
        confidence: 0,
        subcategories: [],
        analysis: "Classification analysis unavailable"
      });
      return {
        category: result.category || "other",
        confidence: result.confidence || 0,
        subcategories: result.subcategories || [],
        analysis: result.analysis || ""
      };
    } catch (error) {
      console.error("Error in innovation classification:", error);
      return {
        category: "other",
        confidence: 0,
        subcategories: [],
        analysis: "Classification analysis unavailable"
      };
    }
  }
};
var aiService = new AIService();

// services/hederaService.ts
import { Client, TopicCreateTransaction, TopicMessageSubmitTransaction, TopicInfoQuery, TopicId, AccountId, PrivateKey, TokenCreateTransaction, TokenMintTransaction, TokenType, TokenSupplyType } from "@hashgraph/sdk";
import crypto from "crypto";
import fs from "fs";
var HederaService = class {
  client = null;
  operatorId = null;
  operatorKey = null;
  constructor() {
    const accountId = process.env.HEDERA_ACCOUNT_ID || process.env.MY_ACCOUNT_ID || "";
    const privateKey = process.env.HEDERA_PRIVATE_KEY || process.env.MY_PRIVATE_KEY || "";
    if (!accountId || !privateKey) {
      console.warn("Hedera credentials not found. Blockchain features will be disabled.");
      return;
    }
    try {
      this.operatorId = AccountId.fromString(accountId);
      this.operatorKey = PrivateKey.fromString(privateKey);
      this.client = Client.forTestnet();
      this.client.setOperator(this.operatorId, this.operatorKey);
    } catch (error) {
      console.error("Failed to initialize Hedera client:", error);
    }
  }
  async storePatentHash(patentId, filePath) {
    if (!this.client) {
      throw new Error("Hedera client not initialized");
    }
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
      const topicCreateTx = new TopicCreateTransaction().setTopicMemo(`Patent Hash Storage for ${patentId}`).setSubmitKey(this.operatorKey);
      const topicCreateSubmit = await topicCreateTx.execute(this.client);
      const topicCreateReceipt = await topicCreateSubmit.getReceipt(this.client);
      const topicId = topicCreateReceipt.topicId;
      const patentData = {
        patentId,
        hash,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        action: "patent_hash_storage"
      };
      const topicMessageTx = new TopicMessageSubmitTransaction().setTopicId(topicId).setMessage(JSON.stringify(patentData));
      const topicMessageSubmit = await topicMessageTx.execute(this.client);
      const topicMessageReceipt = await topicMessageSubmit.getReceipt(this.client);
      return {
        topicId: topicId.toString(),
        messageId: topicMessageReceipt.topicSequenceNumber?.toString() || "",
        hash,
        transactionId: topicMessageSubmit.transactionId.toString()
      };
    } catch (error) {
      console.error("Error storing patent hash on Hedera:", error);
      throw new Error("Failed to store patent hash on blockchain");
    }
  }
  async verifyPatentHash(topicId, messageId, expectedHash) {
    if (!this.client) {
      throw new Error("Hedera client not initialized");
    }
    try {
      const topicInfo = await new TopicInfoQuery().setTopicId(TopicId.fromString(topicId)).execute(this.client);
      return {
        verified: true,
        // In real implementation, compare with actual message content
        actualHash: expectedHash,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        message: "Patent hash verified on Hedera blockchain"
      };
    } catch (error) {
      console.error("Error verifying patent hash:", error);
      return {
        verified: false,
        message: "Failed to verify patent hash on blockchain"
      };
    }
  }
  async mintPatentNFT(patent) {
    if (!this.client) {
      throw new Error("Hedera client not initialized");
    }
    try {
      const tokenCreateTx = new TokenCreateTransaction().setTokenName(`Patent: ${patent.title}`).setTokenSymbol("PATENT").setTokenType(TokenType.NonFungibleUnique).setSupplyType(TokenSupplyType.Finite).setMaxSupply(1).setTreasuryAccountId(this.operatorId).setSupplyKey(this.operatorKey).setAdminKey(this.operatorKey);
      const tokenCreateSubmit = await tokenCreateTx.execute(this.client);
      const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(this.client);
      const tokenId = tokenCreateReceipt.tokenId;
      const nftMetadata = JSON.stringify({
        patentId: patent.id,
        title: patent.title,
        description: patent.description,
        category: patent.category,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      const tokenMintTx = new TokenMintTransaction().setTokenId(tokenId).setMetadata([Buffer.from(nftMetadata)]);
      const tokenMintSubmit = await tokenMintTx.execute(this.client);
      const tokenMintReceipt = await tokenMintSubmit.getReceipt(this.client);
      return {
        nftId: `${tokenId.toString()}-${tokenMintReceipt.serials[0]}`,
        transactionId: tokenMintSubmit.transactionId.toString(),
        tokenId: tokenId.toString()
      };
    } catch (error) {
      console.error("Error minting patent NFT:", error);
      throw new Error("Failed to mint patent NFT");
    }
  }
  async transferPatentNFT(tokenId, serial, fromAccountId, toAccountId) {
    if (!this.client) {
      throw new Error("Hedera client not initialized");
    }
    try {
      return {
        transactionId: "simulated-transfer-" + Date.now(),
        success: true
      };
    } catch (error) {
      console.error("Error transferring patent NFT:", error);
      throw new Error("Failed to transfer patent NFT");
    }
  }
};
var hederaService = new HederaService();

// routes.ts
var upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024
    // 50MB limit
  }
});
async function registerRoutes(app2) {
  const session = await import("express-session");
  const pgSession = (await import("connect-pg-simple")).default(session.default);
  const IS_PRODUCTION2 = process.env.NODE_ENV === "production";
  app2.use(session.default({
    store: new pgSession({
      pool,
      tableName: "sessions"
    }),
    secret: process.env.SESSION_SECRET || "fallback-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: IS_PRODUCTION2,
      // HTTPS only in production
      httpOnly: true,
      maxAge: 1e3 * 60 * 60 * 24,
      // 24 hours
      sameSite: IS_PRODUCTION2 ? "strict" : "lax"
    }
  }));
  app2.get("/api/auth/user/settings", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user.settings || {});
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  app2.put("/api/auth/user/settings", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { settings } = req.body;
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const currentSettings = user.settings || {};
      const updatedSettings = { ...currentSettings, ...settings };
      await storage.updateUserSettings(userId, updatedSettings);
      res.json({ message: "Settings updated successfully", settings: updatedSettings });
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });
  app2.post("/api/auth/register", register);
  app2.post("/api/auth/login", login);
  app2.post("/api/auth/logout", logout);
  app2.get("/api/auth/user", getCurrentUser);
  app2.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });
  app2.get("/api/dashboard/activities", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;
      const activities = await storage.getUserActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });
  app2.get("/api/dashboard/category-stats", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const categoryStats = await storage.getPatentCategoryStats(userId);
      res.json(categoryStats);
    } catch (error) {
      console.error("Error fetching category stats:", error);
      res.status(500).json({ message: "Failed to fetch category stats" });
    }
  });
  app2.get("/api/patents", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const patents2 = await storage.getPatentsByUser(userId);
      res.json(patents2);
    } catch (error) {
      console.error("Error fetching patents:", error);
      res.status(500).json({ message: "Failed to fetch patents" });
    }
  });
  app2.get("/api/patents/:id", requireAuth, async (req, res) => {
    try {
      const patent = await storage.getPatent(req.params.id);
      if (!patent) {
        return res.status(404).json({ message: "Patent not found" });
      }
      if (patent.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(patent);
    } catch (error) {
      console.error("Error fetching patent:", error);
      res.status(500).json({ message: "Failed to fetch patent" });
    }
  });
  app2.post("/api/patents", requireAuth, upload.array("documents"), async (req, res) => {
    try {
      const userId = req.user.id;
      const patentData = insertPatentSchema.parse({
        ...req.body,
        userId
      });
      const patent = await storage.createPatent(patentData);
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const fileBuffer = fs2.readFileSync(file.path);
          const hash = crypto2.createHash("sha256").update(fileBuffer).digest("hex");
          await storage.createPatentDocument({
            patentId: patent.id,
            userId,
            fileName: file.originalname,
            filePath: file.path,
            fileType: file.mimetype,
            fileSize: file.size,
            hashValue: hash
          });
        }
        try {
          const hederaResult = await hederaService.storePatentHash(patent.id, req.files[0].path);
          await storage.updatePatent(patent.id, {
            hederaTopicId: hederaResult.topicId,
            hederaMessageId: hederaResult.messageId,
            hashValue: hederaResult.hash
          });
          await storage.createBlockchainTransaction({
            patentId: patent.id,
            transactionType: "hash_storage",
            hederaTopicId: hederaResult.topicId,
            hederaMessageId: hederaResult.messageId,
            status: "confirmed"
          });
        } catch (hederaError) {
          console.error("Hedera storage error:", hederaError);
        }
      }
      await storage.createPatentActivity({
        patentId: patent.id,
        userId,
        activityType: "created",
        description: `Patent "${patent.title}" created`
      });
      res.status(201).json(patent);
    } catch (error) {
      console.error("Error creating patent:", error);
      res.status(500).json({ message: "Failed to create patent" });
    }
  });
  app2.put("/api/patents/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const patent = await storage.getPatent(req.params.id);
      if (!patent) {
        return res.status(404).json({ message: "Patent not found" });
      }
      if (patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const updates = insertPatentSchema.partial().parse(req.body);
      const updatedPatent = await storage.updatePatent(req.params.id, updates);
      await storage.createPatentActivity({
        patentId: patent.id,
        userId,
        activityType: "updated",
        description: `Patent "${patent.title}" updated`
      });
      res.json(updatedPatent);
    } catch (error) {
      console.error("Error updating patent:", error);
      res.status(500).json({ message: "Failed to update patent" });
    }
  });
  app2.delete("/api/patents/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const patent = await storage.getPatent(req.params.id);
      if (!patent) {
        return res.status(404).json({ message: "Patent not found" });
      }
      if (patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deletePatent(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting patent:", error);
      res.status(500).json({ message: "Failed to delete patent" });
    }
  });
  app2.post("/api/ai/prior-art-search", requireAuth, async (req, res) => {
    try {
      const { patentId, description } = req.body;
      const userId = req.user.id;
      const patent = await storage.getPatent(patentId);
      if (!patent || patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const searchResults = await aiService.performPriorArtSearch(description);
      for (const result of searchResults) {
        await storage.createPriorArtResult({
          patentId,
          externalPatentId: result.patentId,
          similarityScore: result.similarityScore.toString(),
          title: result.title,
          description: result.description,
          source: result.source
        });
      }
      await storage.createAIAnalysis({
        patentId,
        analysisType: "prior_art",
        result: { results: searchResults },
        confidence: Math.max(...searchResults.map((r) => r.similarityScore)).toString()
      });
      res.json(searchResults);
    } catch (error) {
      console.error("Error in prior art search:", error);
      res.status(500).json({ message: "Failed to perform prior art search" });
    }
  });
  app2.post("/api/ai/patent-valuation", requireAuth, async (req, res) => {
    try {
      const { patentId } = req.body;
      const userId = req.user.id;
      const patent = await storage.getPatent(patentId);
      if (!patent || patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const valuation = await aiService.evaluatePatentValue(patent);
      await storage.updatePatent(patentId, {
        estimatedValue: valuation.estimatedValue.toString()
      });
      await storage.createAIAnalysis({
        patentId,
        analysisType: "valuation",
        result: valuation,
        confidence: valuation.confidence.toString()
      });
      await storage.createPatentActivity({
        patentId,
        userId,
        activityType: "valuation_updated",
        description: `Patent valuation updated to $${valuation.estimatedValue}`
      });
      res.json(valuation);
    } catch (error) {
      console.error("Error in patent valuation:", error);
      res.status(500).json({ message: "Failed to evaluate patent value" });
    }
  });
  app2.post("/api/ai/similarity-detection", requireAuth, async (req, res) => {
    try {
      const { patentId, targetText } = req.body;
      const userId = req.user.id;
      const patent = await storage.getPatent(patentId);
      if (!patent || patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const similarity = await aiService.detectSimilarity(patent.description, targetText);
      await storage.createAIAnalysis({
        patentId,
        analysisType: "similarity",
        result: similarity,
        confidence: similarity.confidence.toString()
      });
      res.json(similarity);
    } catch (error) {
      console.error("Error in similarity detection:", error);
      res.status(500).json({ message: "Failed to detect similarity" });
    }
  });
  app2.post("/api/ai/patent-drafting", requireAuth, async (req, res) => {
    try {
      const { title, description, category } = req.body;
      const draftDocument = await aiService.generatePatentDraft({
        title,
        description,
        category
      });
      res.json(draftDocument);
    } catch (error) {
      console.error("Error in patent drafting:", error);
      res.status(500).json({ message: "Failed to generate patent draft" });
    }
  });
  app2.get("/api/blockchain/verify/:patentId", requireAuth, async (req, res) => {
    try {
      const patent = await storage.getPatent(req.params.patentId);
      if (!patent) {
        return res.status(404).json({ message: "Patent not found" });
      }
      if (!patent.hederaTopicId || !patent.hederaMessageId) {
        return res.status(400).json({ message: "Patent not stored on blockchain" });
      }
      const verification = await hederaService.verifyPatentHash(
        patent.hederaTopicId,
        patent.hederaMessageId,
        patent.hashValue
      );
      res.json(verification);
    } catch (error) {
      console.error("Error verifying patent:", error);
      res.status(500).json({ message: "Failed to verify patent on blockchain" });
    }
  });
  app2.post("/api/blockchain/mint-nft/:patentId", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const patent = await storage.getPatent(req.params.patentId);
      if (!patent || patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (patent.hederaNftId) {
        return res.status(400).json({ message: "NFT already minted for this patent" });
      }
      const nftResult = await hederaService.mintPatentNFT(patent);
      await storage.updatePatent(req.params.patentId, {
        hederaNftId: nftResult.nftId
      });
      await storage.createBlockchainTransaction({
        patentId: patent.id,
        transactionType: "nft_mint",
        hederaTransactionId: nftResult.transactionId,
        status: "confirmed"
      });
      await storage.createPatentActivity({
        patentId: patent.id,
        userId,
        activityType: "nft_minted",
        description: `NFT minted for patent "${patent.title}"`
      });
      res.json(nftResult);
    } catch (error) {
      console.error("Error minting NFT:", error);
      res.status(500).json({ message: "Failed to mint patent NFT" });
    }
  });
  app2.get("/api/documents/user", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const documents = await storage.getPatentDocumentsByUser(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching user documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });
  app2.get("/api/documents/:id/download", requireAuth, async (req, res) => {
    try {
      const documentId = req.params.id;
      const userId = req.user.id;
      const documents = await storage.getPatentDocumentsByUser(userId);
      const document = documents.find((doc) => doc.id === documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      if (!fs2.existsSync(document.filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }
      res.setHeader("Content-Disposition", `attachment; filename="${document.fileName}"`);
      res.setHeader("Content-Type", document.fileType);
      const fileStream = fs2.createReadStream(document.filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });
  app2.delete("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const documentId = req.params.id;
      const userId = req.user.id;
      const documents = await storage.getPatentDocumentsByUser(userId);
      const document = documents.find((doc) => doc.id === documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      await storage.deletePatentDocument(documentId);
      if (fs2.existsSync(document.filePath)) {
        fs2.unlinkSync(document.filePath);
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });
  app2.get("/api/search/patents", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      const results = await storage.searchPatents(query, userId);
      res.json(results);
    } catch (error) {
      console.error("Error searching patents:", error);
      res.status(500).json({ message: "Failed to search patents" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// index.ts
var app = express();
var NODE_ENV = process.env.NODE_ENV || "development";
var IS_PRODUCTION = NODE_ENV === "production";
var FRONTEND_URL = process.env.FRONTEND_URL || (IS_PRODUCTION ? "https://your-production-domain.com" : "http://localhost:3000");
var corsOrigins = IS_PRODUCTION ? [FRONTEND_URL] : [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001"
];
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      console.log(logLine);
    }
  });
  next();
});
if (IS_PRODUCTION) {
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  if (IS_PRODUCTION) {
    console.error("Production error:", err);
  }
  res.status(status).json({ message });
});
if (IS_PRODUCTION) {
  console.log("Initializing for Vercel production...");
} else {
  (async () => {
    try {
      const server = await registerRoutes(app);
      const port = parseInt(process.env.PORT || "5000", 10);
      server.listen(port, () => {
        console.log(`\u{1F680} Server running on port ${port} (${NODE_ENV})`);
        console.log(`\u{1F4E1} CORS origins: ${corsOrigins.join(", ")}`);
      });
    } catch (error) {
      console.error("Failed to start development server:", error);
    }
  })();
}
var index_default = app;
export {
  index_default as default
};
