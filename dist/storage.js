import { db } from './db';
import { users, patents, patentDocuments, aiAnalysis, priorArtResults, blockchainTransactions, patentActivity, consultants, appointments, chatRooms, chatMessages } from './shared/schema';
import { eq, desc, and, ilike, sql } from "drizzle-orm";
export class DatabaseStorage {
    // User operations (IMPORTANT: mandatory for Replit Auth)
    async getUser(id) {
        const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
        const user = result[0];
        if (!user)
            return undefined;
        return {
            ...user,
            settings: user.settings
        };
    }
    async getUserById(id) {
        return this.getUser(id);
    }
    async createUser(userData) {
        const [user] = await db.insert(users).values(userData).returning();
        return {
            ...user,
            settings: user.settings
        };
    }
    async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user)
            return undefined;
        return {
            ...user,
            settings: user.settings
        };
    }
    async updateUser(id, userData) {
        const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
        if (!user)
            return undefined;
        return {
            ...user,
            settings: user.settings
        };
    }
    async updateUserSettings(userId, settings) {
        const user = await this.getUserById(userId);
        if (!user)
            return undefined;
        const updatedSettings = { ...user.settings, ...settings };
        const [updatedUser] = await db.update(users)
            .set({ settings: updatedSettings })
            .where(eq(users.id, userId))
            .returning();
        if (!updatedUser)
            return undefined;
        return {
            ...updatedUser,
            settings: updatedUser.settings
        };
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
        return {
            ...user,
            settings: user.settings
        };
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
    // Consultant operations
    async createConsultant(consultant) {
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
    async getConsultant(id) {
        const [consultant] = await db.select().from(consultants).where(eq(consultants.id, id)).limit(1);
        if (!consultant)
            return undefined;
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
    async getConsultantByUserId(userId) {
        const [consultant] = await db.select().from(consultants).where(eq(consultants.userId, userId)).limit(1);
        if (!consultant)
            return undefined;
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
    async updateConsultant(id, updates) {
        const [updatedConsultant] = await db.update(consultants).set(updates).where(eq(consultants.id, id)).returning();
        if (!updatedConsultant)
            return undefined;
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
    async deleteConsultant(id) {
        await db.delete(consultants).where(eq(consultants.id, id));
    }
    async getAllConsultants() {
        const consultantList = await db.select().from(consultants);
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
    async getConsultantsBySpecialization(specialization) {
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
    async getVerifiedConsultants() {
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
    async getUnverifiedConsultants() {
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
    async verifyConsultant(id, adminUserId, notes) {
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
        if (!updatedConsultant)
            return undefined;
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
    async rejectConsultant(id, adminUserId, notes) {
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
        if (!updatedConsultant)
            return undefined;
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
    async createAppointment(appointment) {
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
    async getAppointment(id) {
        const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
        if (!appointment)
            return undefined;
        return {
            ...appointment,
            description: appointment.description ?? undefined,
            meetingLink: appointment.meetingLink ?? undefined,
            status: appointment.status ?? 'pending',
            createdAt: appointment.createdAt ?? undefined,
            updatedAt: appointment.updatedAt ?? undefined,
        };
    }
    async getAppointmentsByUser(userId) {
        const appointmentList = await db.select().from(appointments).where(eq(appointments.userId, userId)).orderBy(desc(appointments.appointmentDate));
        return appointmentList.map(appointment => ({
            ...appointment,
            description: appointment.description ?? undefined,
            meetingLink: appointment.meetingLink ?? undefined,
            status: appointment.status ?? 'pending',
            createdAt: appointment.createdAt ?? undefined,
            updatedAt: appointment.updatedAt ?? undefined,
        }));
    }
    async getAppointmentsByConsultant(consultantId) {
        const appointmentList = await db.select().from(appointments).where(eq(appointments.consultantId, consultantId)).orderBy(desc(appointments.appointmentDate));
        return appointmentList.map(appointment => ({
            ...appointment,
            description: appointment.description ?? undefined,
            meetingLink: appointment.meetingLink ?? undefined,
            status: appointment.status ?? 'pending',
            createdAt: appointment.createdAt ?? undefined,
            updatedAt: appointment.updatedAt ?? undefined,
        }));
    }
    async updateAppointment(id, updates) {
        const [updatedAppointment] = await db.update(appointments).set(updates).where(eq(appointments.id, id)).returning();
        if (!updatedAppointment)
            return undefined;
        return {
            ...updatedAppointment,
            description: updatedAppointment.description ?? undefined,
            meetingLink: updatedAppointment.meetingLink ?? undefined,
            status: updatedAppointment.status ?? 'pending',
            createdAt: updatedAppointment.createdAt ?? undefined,
            updatedAt: updatedAppointment.updatedAt ?? undefined,
        };
    }
    async deleteAppointment(id) {
        await db.delete(appointments).where(eq(appointments.id, id));
    }
    // Chat operations
    async createChatRoom(userId, consultantId) {
        // Check if chat room already exists
        const existingRoom = await db.select().from(chatRooms)
            .where(and(eq(chatRooms.userId, userId), eq(chatRooms.consultantId, consultantId))).limit(1);
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
    async getChatRoom(id) {
        const [chatRoom] = await db.select().from(chatRooms).where(eq(chatRooms.id, id)).limit(1);
        if (!chatRoom)
            return undefined;
        return {
            ...chatRoom,
            createdAt: chatRoom.createdAt ?? undefined,
            updatedAt: chatRoom.updatedAt ?? undefined,
        };
    }
    async getChatRoomByParticipants(userId, consultantId) {
        const [chatRoom] = await db.select().from(chatRooms)
            .where(and(eq(chatRooms.userId, userId), eq(chatRooms.consultantId, consultantId))).limit(1);
        if (!chatRoom)
            return undefined;
        return {
            ...chatRoom,
            createdAt: chatRoom.createdAt ?? undefined,
            updatedAt: chatRoom.updatedAt ?? undefined,
        };
    }
    async getChatRoomsByUser(userId) {
        const chatRoomList = await db.select().from(chatRooms).where(eq(chatRooms.userId, userId)).orderBy(desc(chatRooms.createdAt));
        return chatRoomList.map(chatRoom => ({
            ...chatRoom,
            createdAt: chatRoom.createdAt ?? undefined,
            updatedAt: chatRoom.updatedAt ?? undefined,
        }));
    }
    async getChatRoomsByConsultant(consultantId) {
        const chatRoomList = await db.select().from(chatRooms).where(eq(chatRooms.consultantId, consultantId)).orderBy(desc(chatRooms.createdAt));
        return chatRoomList.map(chatRoom => ({
            ...chatRoom,
            createdAt: chatRoom.createdAt ?? undefined,
            updatedAt: chatRoom.updatedAt ?? undefined,
        }));
    }
    async deleteChatRoom(id) {
        await db.delete(chatRooms).where(eq(chatRooms.id, id));
    }
    async createChatMessage(message) {
        const [newMessage] = await db.insert(chatMessages).values(message).returning();
        return {
            ...newMessage,
            isRead: newMessage.isRead ?? false,
            createdAt: newMessage.createdAt ?? undefined,
        };
    }
    async getChatMessages(chatRoomId) {
        const messageList = await db.select().from(chatMessages).where(eq(chatMessages.chatRoomId, chatRoomId)).orderBy(chatMessages.createdAt);
        return messageList.map(message => ({
            ...message,
            isRead: message.isRead ?? false,
            createdAt: message.createdAt ?? undefined,
        }));
    }
    async markMessageAsRead(id) {
        const [updatedMessage] = await db.update(chatMessages).set({ isRead: true }).where(eq(chatMessages.id, id)).returning();
        if (!updatedMessage)
            return undefined;
        return {
            ...updatedMessage,
            isRead: updatedMessage.isRead ?? false,
            createdAt: updatedMessage.createdAt ?? undefined,
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
