import { db } from './db';
import { users, patents, patentDocuments, aiAnalysis, priorArtResults, blockchainTransactions, patentActivity, consultants, appointments, chatRooms, chatMessages } from './shared/schema';
import type { User, InsertUser, UpsertUser, Patent, InsertPatent, PatentDocument, InsertPatentDocument, AIAnalysis, InsertAIAnalysis, PriorArtResult, InsertPriorArtResult, BlockchainTransaction, InsertBlockchainTransaction, PatentActivity, InsertPatentActivity, UserSettings, Consultant, InsertConsultant, Appointment, InsertAppointment, ChatRoom, InsertChatRoom, ChatMessage, InsertChatMessage } from './shared/schema';
import { eq, desc, and, ilike, sql, leftJoin } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations 
  createUser(user: InsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  updateUserSettings(id: string, settings: Partial<UserSettings>): Promise<User | undefined>;
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
  
  // Consultant operations
  createConsultant(consultant: InsertConsultant): Promise<Consultant>;
  getConsultant(id: string): Promise<Consultant | undefined>;
  getConsultantByUserId(userId: string): Promise<Consultant | undefined>;
  updateConsultant(id: string, updates: Partial<InsertConsultant>): Promise<Consultant | undefined>;
  deleteConsultant(id: string): Promise<void>;
  getAllConsultants(): Promise<Consultant[]>;
  getConsultantsBySpecialization(specialization: string): Promise<Consultant[]>;
  getVerifiedConsultants(): Promise<Consultant[]>;
  getUnverifiedConsultants(): Promise<Consultant[]>;
  verifyConsultant(id: string, adminUserId: string, notes?: string): Promise<Consultant | undefined>;
  rejectConsultant(id: string, adminUserId: string, notes?: string): Promise<Consultant | undefined>;
  
  // Appointment operations
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAppointmentsByUser(userId: string): Promise<Appointment[]>;
  getAppointmentsByConsultant(consultantId: string): Promise<Appointment[]>;
  updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<void>;
  
  // Chat operations
  createChatRoom(userId: string, consultantId: string): Promise<ChatRoom>;
  getChatRoom(id: string): Promise<ChatRoom | undefined>;
  getChatRoomByParticipants(userId: string, consultantId: string): Promise<ChatRoom | undefined>;
  getChatRoomsByUser(userId: string): Promise<ChatRoom[]>;
  getChatRoomsByConsultant(consultantId: string): Promise<ChatRoom[]>;
  deleteChatRoom(id: string): Promise<void>;
  
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(chatRoomId: string): Promise<ChatMessage[]>;
  markMessageAsRead(id: string): Promise<ChatMessage | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const user = result[0];
    if (!user) return undefined;
    return {
      ...user,
      settings: user.settings as UserSettings | undefined
    };
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async createUser(userData: Omit<InsertUser, 'id'>): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return {
      ...user,
      settings: user.settings as UserSettings | undefined
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) return undefined;
    return {
      ...user,
      settings: user.settings as UserSettings | undefined
    };
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    if (!user) return undefined;
    return {
      ...user,
      settings: user.settings as UserSettings | undefined
    };
  }

  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<User | undefined> {
    const user = await this.getUserById(userId);
    if (!user) return undefined;
    
    const updatedSettings = { ...user.settings, ...settings };
    const [updatedUser] = await db.update(users)
      .set({ settings: updatedSettings })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) return undefined;
    return {
      ...updatedUser,
      settings: updatedUser.settings as UserSettings | undefined
    };
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
    return {
      ...user,
      settings: user.settings as UserSettings | undefined
    };
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

  // Consultant operations
  async createConsultant(consultant: InsertConsultant): Promise<Consultant> {
    const [newConsultant] = await db.insert(consultants).values(consultant).returning();
    return {
      ...newConsultant,
      specialization: newConsultant.specialization ?? undefined,
      bio: newConsultant.bio ?? undefined,
      experienceYears: newConsultant.experienceYears ?? undefined,
      hourlyRate: newConsultant.hourlyRate !== null && newConsultant.hourlyRate !== undefined ? 
        Number(newConsultant.hourlyRate) : undefined,
      rating: newConsultant.rating !== null && newConsultant.rating !== undefined ? 
        Number(newConsultant.rating) : undefined,
      isVerified: newConsultant.isVerified ?? false,
      verifiedBy: newConsultant.verifiedBy ?? undefined,
      verifiedAt: newConsultant.verifiedAt ?? undefined,
      verificationNotes: newConsultant.verificationNotes ?? undefined,
      createdAt: newConsultant.createdAt ?? undefined,
      updatedAt: newConsultant.updatedAt ?? undefined,
    };
  }

  async getConsultant(id: string): Promise<Consultant | undefined> {
    const [consultant] = await db.select().from(consultants).where(eq(consultants.id, id)).limit(1);
    if (!consultant) return undefined;
    return {
      ...consultant,
      specialization: consultant.specialization ?? undefined,
      bio: consultant.bio ?? undefined,
      experienceYears: consultant.experienceYears ?? undefined,
      hourlyRate: consultant.hourlyRate !== null && consultant.hourlyRate !== undefined ? 
        Number(consultant.hourlyRate) : undefined,
      rating: consultant.rating !== null && consultant.rating !== undefined ? 
        Number(consultant.rating) : undefined,
      isVerified: consultant.isVerified ?? false,
      verifiedBy: consultant.verifiedBy ?? undefined,
      verifiedAt: consultant.verifiedAt ?? undefined,
      verificationNotes: consultant.verificationNotes ?? undefined,
      createdAt: consultant.createdAt ?? undefined,
      updatedAt: consultant.updatedAt ?? undefined,
    };
  }

  async getConsultantByUserId(userId: string): Promise<Consultant | undefined> {
    const [consultant] = await db.select().from(consultants).where(eq(consultants.userId, userId)).limit(1);
    if (!consultant) return undefined;
    return {
      ...consultant,
      specialization: consultant.specialization ?? undefined,
      bio: consultant.bio ?? undefined,
      experienceYears: consultant.experienceYears ?? undefined,
      hourlyRate: consultant.hourlyRate !== null && consultant.hourlyRate !== undefined ? 
        Number(consultant.hourlyRate) : undefined,
      rating: consultant.rating !== null && consultant.rating !== undefined ? 
        Number(consultant.rating) : undefined,
      isVerified: consultant.isVerified ?? false,
      verifiedBy: consultant.verifiedBy ?? undefined,
      verifiedAt: consultant.verifiedAt ?? undefined,
      verificationNotes: consultant.verificationNotes ?? undefined,
      createdAt: consultant.createdAt ?? undefined,
      updatedAt: consultant.updatedAt ?? undefined,
    };
  }

  async updateConsultant(id: string, updates: Partial<InsertConsultant>): Promise<Consultant | undefined> {
    const [updatedConsultant] = await db.update(consultants).set(updates).where(eq(consultants.id, id)).returning();
    if (!updatedConsultant) return undefined;
    return {
      ...updatedConsultant,
      specialization: updatedConsultant.specialization ?? undefined,
      bio: updatedConsultant.bio ?? undefined,
      experienceYears: updatedConsultant.experienceYears ?? undefined,
      hourlyRate: updatedConsultant.hourlyRate !== null && updatedConsultant.hourlyRate !== undefined ? 
        Number(updatedConsultant.hourlyRate) : undefined,
      rating: updatedConsultant.rating !== null && updatedConsultant.rating !== undefined ? 
        Number(updatedConsultant.rating) : undefined,
      isVerified: updatedConsultant.isVerified ?? false,
      verifiedBy: updatedConsultant.verifiedBy ?? undefined,
      verifiedAt: updatedConsultant.verifiedAt ?? undefined,
      verificationNotes: updatedConsultant.verificationNotes ?? undefined,
      createdAt: updatedConsultant.createdAt ?? undefined,
      updatedAt: updatedConsultant.updatedAt ?? undefined,
    };
  }

  async deleteConsultant(id: string): Promise<void> {
    await db.delete(consultants).where(eq(consultants.id, id));
  }

  async getAllConsultants(): Promise<Consultant[]> {
    // Only return verified consultants
    const consultantList = await db.select().from(consultants)
      .leftJoin(users, eq(consultants.userId, users.id))
      .where(eq(consultants.isVerified, true));
    
    return consultantList.map(result => {
      const consultant = result.consultants;
      const user = result.users;
      
      return {
        ...consultant,
        user: user ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        } : undefined,
        specialization: consultant.specialization ?? undefined,
        bio: consultant.bio ?? undefined,
        experienceYears: consultant.experienceYears ?? undefined,
        hourlyRate: consultant.hourlyRate !== null && consultant.hourlyRate !== undefined ? 
          Number(consultant.hourlyRate) : undefined,
        rating: consultant.rating !== null && consultant.rating !== undefined ? 
          Number(consultant.rating) : undefined,
        isVerified: consultant.isVerified ?? false,
        verifiedBy: consultant.verifiedBy ?? undefined,
        verifiedAt: consultant.verifiedAt ?? undefined,
        verificationNotes: consultant.verificationNotes ?? undefined,
        createdAt: consultant.createdAt ?? undefined,
        updatedAt: consultant.updatedAt ?? undefined,
      };
    });
  }

  async getConsultantsBySpecialization(specialization: string): Promise<Consultant[]> {
    const consultantList = await db.select().from(consultants).where(eq(consultants.specialization, specialization));
    return consultantList.map(consultant => ({
      ...consultant,
      specialization: consultant.specialization ?? undefined,
      bio: consultant.bio ?? undefined,
      experienceYears: consultant.experienceYears ?? undefined,
      hourlyRate: consultant.hourlyRate !== null && consultant.hourlyRate !== undefined ? 
        Number(consultant.hourlyRate) : undefined,
      rating: consultant.rating !== null && consultant.rating !== undefined ? 
        Number(consultant.rating) : undefined,
      isVerified: consultant.isVerified ?? false,
      verifiedBy: consultant.verifiedBy ?? undefined,
      verifiedAt: consultant.verifiedAt ?? undefined,
      verificationNotes: consultant.verificationNotes ?? undefined,
      createdAt: consultant.createdAt ?? undefined,
      updatedAt: consultant.updatedAt ?? undefined,
    }));
  }

  async getVerifiedConsultants(): Promise<Consultant[]> {
    const consultantList = await db.select().from(consultants).where(eq(consultants.isVerified, true));
    return consultantList.map(consultant => ({
      ...consultant,
      specialization: consultant.specialization ?? undefined,
      bio: consultant.bio ?? undefined,
      experienceYears: consultant.experienceYears ?? undefined,
      hourlyRate: consultant.hourlyRate !== null && consultant.hourlyRate !== undefined ? 
        Number(consultant.hourlyRate) : undefined,
      rating: consultant.rating !== null && consultant.rating !== undefined ? 
        Number(consultant.rating) : undefined,
      isVerified: consultant.isVerified ?? false,
      verifiedBy: consultant.verifiedBy ?? undefined,
      verifiedAt: consultant.verifiedAt ?? undefined,
      verificationNotes: consultant.verificationNotes ?? undefined,
      createdAt: consultant.createdAt ?? undefined,
      updatedAt: consultant.updatedAt ?? undefined,
    }));
  }

  async getUnverifiedConsultants(): Promise<Consultant[]> {
    const consultantList = await db.select().from(consultants).where(eq(consultants.isVerified, false));
    return consultantList.map(consultant => ({
      ...consultant,
      specialization: consultant.specialization ?? undefined,
      bio: consultant.bio ?? undefined,
      experienceYears: consultant.experienceYears ?? undefined,
      hourlyRate: consultant.hourlyRate !== null && consultant.hourlyRate !== undefined ? 
        Number(consultant.hourlyRate) : undefined,
      rating: consultant.rating !== null && consultant.rating !== undefined ? 
        Number(consultant.rating) : undefined,
      isVerified: consultant.isVerified ?? false,
      verifiedBy: consultant.verifiedBy ?? undefined,
      verifiedAt: consultant.verifiedAt ?? undefined,
      verificationNotes: consultant.verificationNotes ?? undefined,
      createdAt: consultant.createdAt ?? undefined,
      updatedAt: consultant.updatedAt ?? undefined,
    }));
  }

  async verifyConsultant(id: string, adminUserId: string, notes?: string): Promise<Consultant | undefined> {
    const [updatedConsultant] = await db.update(consultants)
      .set({
        isVerified: true,
        verifiedBy: adminUserId,
        verifiedAt: new Date(),
        verificationNotes: notes,
        updatedAt: new Date()
      })
      .where(eq(consultants.id, id))
      .returning();
      
    if (!updatedConsultant) return undefined;
    
    return {
      ...updatedConsultant,
      specialization: updatedConsultant.specialization ?? undefined,
      bio: updatedConsultant.bio ?? undefined,
      experienceYears: updatedConsultant.experienceYears ?? undefined,
      hourlyRate: updatedConsultant.hourlyRate !== null && updatedConsultant.hourlyRate !== undefined ? 
        Number(updatedConsultant.hourlyRate) : undefined,
      rating: updatedConsultant.rating !== null && updatedConsultant.rating !== undefined ? 
        Number(updatedConsultant.rating) : undefined,
      isVerified: updatedConsultant.isVerified ?? false,
      verifiedBy: updatedConsultant.verifiedBy ?? undefined,
      verifiedAt: updatedConsultant.verifiedAt ?? undefined,
      verificationNotes: updatedConsultant.verificationNotes ?? undefined,
      createdAt: updatedConsultant.createdAt ?? undefined,
      updatedAt: updatedConsultant.updatedAt ?? undefined,
    };
  }

  async rejectConsultant(id: string, adminUserId: string, notes?: string): Promise<Consultant | undefined> {
    const [updatedConsultant] = await db.update(consultants)
      .set({
        isVerified: false,
        verifiedBy: adminUserId,
        verifiedAt: new Date(),
        verificationNotes: notes || 'Application rejected',
        updatedAt: new Date()
      })
      .where(eq(consultants.id, id))
      .returning();
      
    if (!updatedConsultant) return undefined;
    
    return {
      ...updatedConsultant,
      specialization: updatedConsultant.specialization ?? undefined,
      bio: updatedConsultant.bio ?? undefined,
      experienceYears: updatedConsultant.experienceYears ?? undefined,
      hourlyRate: updatedConsultant.hourlyRate !== null && updatedConsultant.hourlyRate !== undefined ? 
        Number(updatedConsultant.hourlyRate) : undefined,
      rating: updatedConsultant.rating !== null && updatedConsultant.rating !== undefined ? 
        Number(updatedConsultant.rating) : undefined,
      isVerified: updatedConsultant.isVerified ?? false,
      verifiedBy: updatedConsultant.verifiedBy ?? undefined,
      verifiedAt: updatedConsultant.verifiedAt ?? undefined,
      verificationNotes: updatedConsultant.verificationNotes ?? undefined,
      createdAt: updatedConsultant.createdAt ?? undefined,
      updatedAt: updatedConsultant.updatedAt ?? undefined,
    };
  }

  // Appointment operations
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return {
      ...newAppointment,
      description: newAppointment.description ?? undefined,
      meetingLink: newAppointment.meetingLink ?? undefined,
      status: newAppointment.status ?? 'pending',
      createdAt: newAppointment.createdAt ?? undefined,
      updatedAt: newAppointment.updatedAt ?? undefined,
    };
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
    if (!appointment) return undefined;
    return {
      ...appointment,
      description: appointment.description ?? undefined,
      meetingLink: appointment.meetingLink ?? undefined,
      status: appointment.status ?? 'pending',
      createdAt: appointment.createdAt ?? undefined,
      updatedAt: appointment.updatedAt ?? undefined,
    };
  }

  async getAppointmentsByUser(userId: string): Promise<Appointment[]> {
    const appointmentList = await db.select().from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .where(eq(appointments.userId, userId))
      .orderBy(desc(appointments.appointmentDate));
    
    return appointmentList.map(result => {
      const appointment = result.appointments;
      const user = result.users;
      
      return {
        ...appointment,
        user: user ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        } : undefined,
        description: appointment.description ?? undefined,
        meetingLink: appointment.meetingLink ?? undefined,
        status: appointment.status ?? 'pending',
        createdAt: appointment.createdAt ?? undefined,
        updatedAt: appointment.updatedAt ?? undefined,
      };
    });
  }

  async getAppointmentsByConsultant(consultantId: string): Promise<Appointment[]> {
    const appointmentList = await db.select().from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .where(eq(appointments.consultantId, consultantId))
      .orderBy(desc(appointments.appointmentDate));
    
    return appointmentList.map(result => {
      const appointment = result.appointments;
      const user = result.users;
      
      return {
        ...appointment,
        user: user ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        } : undefined,
        description: appointment.description ?? undefined,
        meetingLink: appointment.meetingLink ?? undefined,
        status: appointment.status ?? 'pending',
        createdAt: appointment.createdAt ?? undefined,
        updatedAt: appointment.updatedAt ?? undefined,
      };
    });
  }

  async updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db.update(appointments).set(updates).where(eq(appointments.id, id)).returning();
    if (!updatedAppointment) return undefined;
    return {
      ...updatedAppointment,
      description: updatedAppointment.description ?? undefined,
      meetingLink: updatedAppointment.meetingLink ?? undefined,
      status: updatedAppointment.status ?? 'pending',
      createdAt: updatedAppointment.createdAt ?? undefined,
      updatedAt: updatedAppointment.updatedAt ?? undefined,
    };
  }

  async deleteAppointment(id: string): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  // Chat operations
  async createChatRoom(userId: string, consultantId: string): Promise<ChatRoom> {
    // Check if chat room already exists
    const existingRoom = await db.select().from(chatRooms)
      .where(and(
        eq(chatRooms.userId, userId),
        eq(chatRooms.consultantId, consultantId)
      )).limit(1);
      
    if (existingRoom.length > 0) {
      const room = existingRoom[0];
      return {
        ...room,
        createdAt: room.createdAt ?? undefined,
        updatedAt: room.updatedAt ?? undefined,
      };
    }
    
    // Create new chat room
    const [newChatRoom] = await db.insert(chatRooms).values({
      userId,
      consultantId
    }).returning();
    return {
      ...newChatRoom,
      createdAt: newChatRoom.createdAt ?? undefined,
      updatedAt: newChatRoom.updatedAt ?? undefined,
    };
  }

  async getChatRoom(id: string): Promise<ChatRoom | undefined> {
    const [chatRoom] = await db.select().from(chatRooms).where(eq(chatRooms.id, id)).limit(1);
    if (!chatRoom) return undefined;
    return {
      ...chatRoom,
      createdAt: chatRoom.createdAt ?? undefined,
      updatedAt: chatRoom.updatedAt ?? undefined,
    };
  }

  async getChatRoomByParticipants(userId: string, consultantId: string): Promise<ChatRoom | undefined> {
    const [chatRoom] = await db.select().from(chatRooms)
      .where(and(
        eq(chatRooms.userId, userId),
        eq(chatRooms.consultantId, consultantId)
      )).limit(1);
    if (!chatRoom) return undefined;
    return {
      ...chatRoom,
      createdAt: chatRoom.createdAt ?? undefined,
      updatedAt: chatRoom.updatedAt ?? undefined,
    };
  }

  async getChatRoomsByUser(userId: string): Promise<ChatRoom[]> {
    const chatRoomList = await db.select().from(chatRooms).where(eq(chatRooms.userId, userId)).orderBy(desc(chatRooms.createdAt));
    return chatRoomList.map(chatRoom => ({
      ...chatRoom,
      createdAt: chatRoom.createdAt ?? undefined,
      updatedAt: chatRoom.updatedAt ?? undefined,
    }));
  }

  async getChatRoomsByConsultant(consultantId: string): Promise<ChatRoom[]> {
    const chatRoomList = await db.select().from(chatRooms).where(eq(chatRooms.consultantId, consultantId)).orderBy(desc(chatRooms.createdAt));
    return chatRoomList.map(chatRoom => ({
      ...chatRoom,
      createdAt: chatRoom.createdAt ?? undefined,
      updatedAt: chatRoom.updatedAt ?? undefined,
    }));
  }

  async deleteChatRoom(id: string): Promise<void> {
    await db.delete(chatRooms).where(eq(chatRooms.id, id));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return {
      ...newMessage,
      isRead: newMessage.isRead ?? false,
      createdAt: newMessage.createdAt ?? undefined,
    };
  }

  async getChatMessages(chatRoomId: string): Promise<ChatMessage[]> {
    const messageList = await db.select().from(chatMessages).where(eq(chatMessages.chatRoomId, chatRoomId)).orderBy(chatMessages.createdAt);
    return messageList.map(message => ({
      ...message,
      isRead: message.isRead ?? false,
      createdAt: message.createdAt ?? undefined,
    }));
  }

  async markMessageAsRead(id: string): Promise<ChatMessage | undefined> {
    const [updatedMessage] = await db.update(chatMessages).set({ isRead: true }).where(eq(chatMessages.id, id)).returning();
    if (!updatedMessage) return undefined;
    return {
      ...updatedMessage,
      isRead: updatedMessage.isRead ?? false,
      createdAt: updatedMessage.createdAt ?? undefined,
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
