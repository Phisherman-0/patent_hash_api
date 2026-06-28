import crypto from 'crypto';
import { db } from './db';
import { users, patents, patentDocuments, aiAnalysis, priorArtResults, blockchainTransactions, patentActivity, consultants, appointments, chatRooms, chatMessages } from './models/index';
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
        const insertId = crypto.randomUUID();
        const dataToInsert = { ...userData, id: insertId };
        await db
            .insert(users)
            .values(dataToInsert)
            .onDuplicateKeyUpdate({
            set: {
                ...dataToInsert,
                updatedAt: new Date(),
            },
        });
        const [user] = await db.select().from(users).where(eq(users.id, insertId));
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
        await db.update(users).set(userData).where(eq(users.id, id));
        const [user] = await db.select().from(users).where(eq(users.id, id));
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
        await db.update(users).set({ settings: updatedSettings }).where(eq(users.id, userId));
        const [updatedUser] = await db.select().from(users).where(eq(users.id, userId));
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
        const updateId = userData.id || crypto.randomUUID();
        const dataToInsert = { ...userData, id: updateId };
        await db
            .insert(users)
            .values(dataToInsert)
            .onDuplicateKeyUpdate({
            set: {
                ...userData,
                updatedAt: new Date(),
            },
        });
        const [user] = await db.select().from(users).where(eq(users.id, updateId));
        return {
            ...user,
            settings: user.settings
        };
    }
    // Patent operations
    async createPatent(patent) {
        const id = crypto.randomUUID();
        const newPatentToInsert = { id, ...patent };
        await db.insert(patents).values(newPatentToInsert);
        const [newPatent] = await db.select().from(patents).where(eq(patents.id, id));
        return {
            ...newPatent,
            aiConfidence: newPatent.aiConfidence ? Number(newPatent.aiConfidence) : null,
            estimatedValue: newPatent.estimatedValue ? Number(newPatent.estimatedValue) : null,
        };
    }
    async getPatent(id) {
        const [patent] = await db.select().from(patents).where(eq(patents.id, id)).limit(1);
        return patent ? {
            ...patent,
            aiConfidence: patent.aiConfidence ? Number(patent.aiConfidence) : null,
            estimatedValue: patent.estimatedValue ? Number(patent.estimatedValue) : null,
        } : undefined;
    }
    async getPatentsByUser(userId) {
        const patentsList = await db
            .select()
            .from(patents)
            .where(eq(patents.userId, userId))
            .orderBy(desc(patents.createdAt));
        return patentsList.map(p => ({
            ...p,
            aiConfidence: p.aiConfidence ? Number(p.aiConfidence) : null,
            estimatedValue: p.estimatedValue ? Number(p.estimatedValue) : null,
        }));
    }
    async updatePatent(id, updates) {
        await db
            .update(patents)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(patents.id, id));
        const [updatedPatent] = await db.select().from(patents).where(eq(patents.id, id));
        return {
            ...updatedPatent,
            aiConfidence: updatedPatent.aiConfidence ? Number(updatedPatent.aiConfidence) : null,
            estimatedValue: updatedPatent.estimatedValue ? Number(updatedPatent.estimatedValue) : null,
        };
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
        const patentsList = await db
            .select()
            .from(patents)
            .where(and(...conditions))
            .orderBy(desc(patents.createdAt));
        return patentsList.map(p => ({
            ...p,
            aiConfidence: p.aiConfidence ? Number(p.aiConfidence) : null,
            estimatedValue: p.estimatedValue ? Number(p.estimatedValue) : null,
        }));
    }
    // Patent document operations
    async createPatentDocument(document) {
        const id = crypto.randomUUID();
        const newDocumentToInsert = { id, ...document };
        await db.insert(patentDocuments).values(newDocumentToInsert);
        const [newDocument] = await db.select().from(patentDocuments).where(eq(patentDocuments.id, id));
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
        const id = crypto.randomUUID();
        const newAnalysisToInsert = { id, ...analysis };
        await db.insert(aiAnalysis).values(newAnalysisToInsert);
        const [newAnalysis] = await db.select().from(aiAnalysis).where(eq(aiAnalysis.id, id));
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
        const id = crypto.randomUUID();
        const newResultToInsert = { id, ...result };
        await db.insert(priorArtResults).values(newResultToInsert);
        const [newResult] = await db.select().from(priorArtResults).where(eq(priorArtResults.id, id));
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
        const id = crypto.randomUUID();
        const newTransactionToInsert = { id, ...transaction };
        await db.insert(blockchainTransactions).values(newTransactionToInsert);
        const [newTransaction] = await db.select().from(blockchainTransactions).where(eq(blockchainTransactions.id, id));
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
        await db
            .update(blockchainTransactions)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(blockchainTransactions.id, id));
        const [updatedTransaction] = await db.select().from(blockchainTransactions).where(eq(blockchainTransactions.id, id));
        return updatedTransaction;
    }
    // Activity operations
    async createPatentActivity(activity) {
        const id = crypto.randomUUID();
        const newActivityToInsert = { id, ...activity };
        await db.insert(patentActivity).values(newActivityToInsert);
        const [newActivity] = await db.select().from(patentActivity).where(eq(patentActivity.id, id));
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
            pendingReviews: sql `sum(case when ${patents.status} in ('pending', 'under_review') then 1 else 0 end)`,
            blockchainVerified: sql `sum(case when ${patents.blockchainTxHash} is not null then 1 else 0 end)`,
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
        const id = crypto.randomUUID();
        const newConsultantToInsert = { id, ...consultant };
        await db.insert(consultants).values(newConsultantToInsert);
        const [newConsultant] = await db.select().from(consultants).where(eq(consultants.id, id));
        return {
            ...newConsultant,
            specialization: newConsultant.specialization ?? null,
            bio: newConsultant.bio ?? null,
            experienceYears: newConsultant.experienceYears ?? null,
            hourlyRate: newConsultant.hourlyRate !== null && newConsultant.hourlyRate !== undefined ?
                Number(newConsultant.hourlyRate) : null,
            rating: newConsultant.rating !== null && newConsultant.rating !== undefined ?
                Number(newConsultant.rating) : null,
            isVerified: newConsultant.isVerified ?? false,
            verifiedBy: newConsultant.verifiedBy ?? null,
            verifiedAt: newConsultant.verifiedAt ?? null,
            verificationNotes: newConsultant.verificationNotes ?? null,
            createdAt: newConsultant.createdAt ?? null,
            updatedAt: newConsultant.updatedAt ?? null,
        };
    }
    async getConsultant(id) {
        const [consultant] = await db.select().from(consultants).where(eq(consultants.id, id)).limit(1);
        if (!consultant)
            return undefined;
        return {
            ...consultant,
            specialization: consultant.specialization ?? null,
            bio: consultant.bio ?? null,
            experienceYears: consultant.experienceYears ?? null,
            hourlyRate: consultant.hourlyRate !== null && consultant.hourlyRate !== undefined ?
                Number(consultant.hourlyRate) : null,
            rating: consultant.rating !== null && consultant.rating !== undefined ?
                Number(consultant.rating) : null,
            isVerified: consultant.isVerified ?? false,
            verifiedBy: consultant.verifiedBy ?? null,
            verifiedAt: consultant.verifiedAt ?? null,
            verificationNotes: consultant.verificationNotes ?? null,
            createdAt: consultant.createdAt ?? null,
            updatedAt: consultant.updatedAt ?? null,
        };
    }
    async getConsultantByUserId(userId) {
        const [consultant] = await db.select().from(consultants).where(eq(consultants.userId, userId)).limit(1);
        if (!consultant)
            return undefined;
        return {
            ...consultant,
            specialization: consultant.specialization ?? null,
            bio: consultant.bio ?? null,
            experienceYears: consultant.experienceYears ?? null,
            hourlyRate: consultant.hourlyRate !== null && consultant.hourlyRate !== undefined ?
                Number(consultant.hourlyRate) : null,
            rating: consultant.rating !== null && consultant.rating !== undefined ?
                Number(consultant.rating) : null,
            isVerified: consultant.isVerified ?? false,
            verifiedBy: consultant.verifiedBy ?? null,
            verifiedAt: consultant.verifiedAt ?? null,
            verificationNotes: consultant.verificationNotes ?? null,
            createdAt: consultant.createdAt ?? null,
            updatedAt: consultant.updatedAt ?? null,
        };
    }
    async updateConsultant(id, updates) {
        await db.update(consultants).set(updates).where(eq(consultants.id, id));
        const [updatedConsultant] = await db.select().from(consultants).where(eq(consultants.id, id));
        if (!updatedConsultant)
            return undefined;
        return {
            ...updatedConsultant,
            specialization: updatedConsultant.specialization ?? null,
            bio: updatedConsultant.bio ?? null,
            experienceYears: updatedConsultant.experienceYears ?? null,
            hourlyRate: updatedConsultant.hourlyRate !== null && updatedConsultant.hourlyRate !== undefined ?
                Number(updatedConsultant.hourlyRate) : null,
            rating: updatedConsultant.rating !== null && updatedConsultant.rating !== undefined ?
                Number(updatedConsultant.rating) : null,
            isVerified: updatedConsultant.isVerified ?? false,
            verifiedBy: updatedConsultant.verifiedBy ?? null,
            verifiedAt: updatedConsultant.verifiedAt ?? null,
            verificationNotes: updatedConsultant.verificationNotes ?? null,
            createdAt: updatedConsultant.createdAt ?? null,
            updatedAt: updatedConsultant.updatedAt ?? null,
        };
    }
    async deleteConsultant(id) {
        await db.delete(consultants).where(eq(consultants.id, id));
    }
    async getAllConsultants() {
        // Only return verified consultants
        const consultantList = await db.select({
            consultant: consultants,
            user: users
        }).from(consultants)
            .leftJoin(users, eq(consultants.userId, users.id))
            .where(eq(consultants.isVerified, true));
        return consultantList.map(result => {
            const consultant = result.consultant;
            const user = result.user;
            return {
                ...consultant,
                user: user ? {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
                } : null,
                specialization: consultant.specialization ?? null,
                bio: consultant.bio ?? null,
                experienceYears: consultant.experienceYears ?? null,
                hourlyRate: consultant.hourlyRate !== null && consultant.hourlyRate !== undefined ?
                    Number(consultant.hourlyRate) : null,
                rating: consultant.rating !== null && consultant.rating !== undefined ?
                    Number(consultant.rating) : null,
                isVerified: consultant.isVerified ?? false,
                verifiedBy: consultant.verifiedBy ?? null,
                verifiedAt: consultant.verifiedAt ?? null,
                verificationNotes: consultant.verificationNotes ?? null,
                createdAt: consultant.createdAt ?? null,
                updatedAt: consultant.updatedAt ?? null,
            };
        });
    }
    async getConsultantsBySpecialization(specialization) {
        const consultantList = await db.select().from(consultants).where(eq(consultants.specialization, specialization));
        return consultantList.map(consultant => ({
            ...consultant,
            specialization: consultant.specialization ?? null,
            bio: consultant.bio ?? null,
            experienceYears: consultant.experienceYears ?? null,
            hourlyRate: consultant.hourlyRate !== null && consultant.hourlyRate !== undefined ?
                Number(consultant.hourlyRate) : null,
            rating: consultant.rating !== null && consultant.rating !== undefined ?
                Number(consultant.rating) : null,
            isVerified: consultant.isVerified ?? false,
            verifiedBy: consultant.verifiedBy ?? null,
            verifiedAt: consultant.verifiedAt ?? null,
            verificationNotes: consultant.verificationNotes ?? null,
            createdAt: consultant.createdAt ?? null,
            updatedAt: consultant.updatedAt ?? null,
        }));
    }
    async getVerifiedConsultants() {
        const consultantList = await db.select().from(consultants).where(eq(consultants.isVerified, true));
        return consultantList.map(consultant => ({
            ...consultant,
            specialization: consultant.specialization ?? null,
            bio: consultant.bio ?? null,
            experienceYears: consultant.experienceYears ?? null,
            hourlyRate: consultant.hourlyRate !== null && consultant.hourlyRate !== undefined ?
                Number(consultant.hourlyRate) : null,
            rating: consultant.rating !== null && consultant.rating !== undefined ?
                Number(consultant.rating) : null,
            isVerified: consultant.isVerified ?? false,
            verifiedBy: consultant.verifiedBy ?? null,
            verifiedAt: consultant.verifiedAt ?? null,
            verificationNotes: consultant.verificationNotes ?? null,
            createdAt: consultant.createdAt ?? null,
            updatedAt: consultant.updatedAt ?? null,
        }));
    }
    async getUnverifiedConsultants() {
        const consultantList = await db.select().from(consultants).where(eq(consultants.isVerified, false));
        return consultantList.map(consultant => ({
            ...consultant,
            specialization: consultant.specialization ?? null,
            bio: consultant.bio ?? null,
            experienceYears: consultant.experienceYears ?? null,
            hourlyRate: consultant.hourlyRate !== null && consultant.hourlyRate !== undefined ?
                Number(consultant.hourlyRate) : null,
            rating: consultant.rating !== null && consultant.rating !== undefined ?
                Number(consultant.rating) : null,
            isVerified: consultant.isVerified ?? false,
            verifiedBy: consultant.verifiedBy ?? null,
            verifiedAt: consultant.verifiedAt ?? null,
            verificationNotes: consultant.verificationNotes ?? null,
            createdAt: consultant.createdAt ?? null,
            updatedAt: consultant.updatedAt ?? null,
        }));
    }
    async verifyConsultant(id, adminUserId, notes) {
        await db.update(consultants).set({
            isVerified: true,
            verifiedBy: adminUserId,
            verifiedAt: new Date(),
            verificationNotes: notes,
            updatedAt: new Date()
        }).where(eq(consultants.id, id));
        const [updatedConsultant] = await db.select().from(consultants).where(eq(consultants.id, id));
        if (!updatedConsultant)
            return undefined;
        return {
            ...updatedConsultant,
            specialization: updatedConsultant.specialization ?? null,
            bio: updatedConsultant.bio ?? null,
            experienceYears: updatedConsultant.experienceYears ?? null,
            hourlyRate: updatedConsultant.hourlyRate !== null && updatedConsultant.hourlyRate !== undefined ?
                Number(updatedConsultant.hourlyRate) : null,
            rating: updatedConsultant.rating !== null && updatedConsultant.rating !== undefined ?
                Number(updatedConsultant.rating) : null,
            isVerified: updatedConsultant.isVerified ?? false,
            verifiedBy: updatedConsultant.verifiedBy ?? null,
            verifiedAt: updatedConsultant.verifiedAt ?? null,
            verificationNotes: updatedConsultant.verificationNotes ?? null,
            createdAt: updatedConsultant.createdAt ?? null,
            updatedAt: updatedConsultant.updatedAt ?? null,
        };
    }
    async rejectConsultant(id, adminUserId, notes) {
        await db.update(consultants).set({
            isVerified: false,
            verifiedBy: adminUserId,
            verifiedAt: new Date(),
            verificationNotes: notes || 'Application rejected',
            updatedAt: new Date()
        }).where(eq(consultants.id, id));
        const [updatedConsultant] = await db.select().from(consultants).where(eq(consultants.id, id));
        if (!updatedConsultant)
            return undefined;
        return {
            ...updatedConsultant,
            specialization: updatedConsultant.specialization ?? null,
            bio: updatedConsultant.bio ?? null,
            experienceYears: updatedConsultant.experienceYears ?? null,
            hourlyRate: updatedConsultant.hourlyRate !== null && updatedConsultant.hourlyRate !== undefined ?
                Number(updatedConsultant.hourlyRate) : null,
            rating: updatedConsultant.rating !== null && updatedConsultant.rating !== undefined ?
                Number(updatedConsultant.rating) : null,
            isVerified: updatedConsultant.isVerified ?? false,
            verifiedBy: updatedConsultant.verifiedBy ?? null,
            verifiedAt: updatedConsultant.verifiedAt ?? null,
            verificationNotes: updatedConsultant.verificationNotes ?? null,
            createdAt: updatedConsultant.createdAt ?? null,
            updatedAt: updatedConsultant.updatedAt ?? null,
        };
    }
    // Appointment operations
    async createAppointment(appointment) {
        const id = crypto.randomUUID();
        const newAppointmentToInsert = { id, ...appointment };
        await db.insert(appointments).values(newAppointmentToInsert);
        const [newAppointment] = await db.select().from(appointments).where(eq(appointments.id, id));
        return {
            ...newAppointment,
            description: newAppointment.description ?? null,
            meetingLink: newAppointment.meetingLink ?? null,
            status: newAppointment.status ?? 'pending',
            createdAt: newAppointment.createdAt ?? null,
            updatedAt: newAppointment.updatedAt ?? null,
        };
    }
    async getAppointment(id) {
        const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
        if (!appointment)
            return undefined;
        return {
            ...appointment,
            description: appointment.description ?? null,
            meetingLink: appointment.meetingLink ?? null,
            status: appointment.status ?? 'pending',
            createdAt: appointment.createdAt ?? null,
            updatedAt: appointment.updatedAt ?? null,
        };
    }
    async getAppointmentsByUser(userId) {
        const appointmentList = await db.select({
            appointment: appointments,
            user: users
        }).from(appointments)
            .leftJoin(users, eq(appointments.userId, users.id))
            .where(eq(appointments.userId, userId))
            .orderBy(desc(appointments.appointmentDate));
        return appointmentList.map(result => {
            const appointment = result.appointment;
            const user = result.user;
            return {
                ...appointment,
                user: user ? {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
                } : null,
                description: appointment.description ?? null,
                meetingLink: appointment.meetingLink ?? null,
                status: appointment.status ?? 'pending',
                createdAt: appointment.createdAt ?? null,
                updatedAt: appointment.updatedAt ?? null,
            };
        });
    }
    async getAppointmentsByConsultant(consultantId) {
        const appointmentList = await db.select({
            appointment: appointments,
            user: users
        }).from(appointments)
            .leftJoin(users, eq(appointments.userId, users.id))
            .where(eq(appointments.consultantId, consultantId))
            .orderBy(desc(appointments.appointmentDate));
        return appointmentList.map(result => {
            const appointment = result.appointment;
            const user = result.user;
            return {
                ...appointment,
                user: user ? {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
                } : null,
                description: appointment.description ?? null,
                meetingLink: appointment.meetingLink ?? null,
                status: appointment.status ?? 'pending',
                createdAt: appointment.createdAt ?? null,
                updatedAt: appointment.updatedAt ?? null,
            };
        });
    }
    async updateAppointment(id, updates) {
        await db.update(appointments).set(updates).where(eq(appointments.id, id));
        const [updatedAppointment] = await db.select().from(appointments).where(eq(appointments.id, id));
        if (!updatedAppointment)
            return undefined;
        return {
            ...updatedAppointment,
            description: updatedAppointment.description ?? null,
            meetingLink: updatedAppointment.meetingLink ?? null,
            status: updatedAppointment.status ?? 'pending',
            createdAt: updatedAppointment.createdAt ?? null,
            updatedAt: updatedAppointment.updatedAt ?? null,
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
                createdAt: room.createdAt ?? null,
                updatedAt: room.updatedAt ?? null,
            };
        }
        // Create new chat room
        const id = crypto.randomUUID();
        const newChatRoomToInsert = { id, ...{
                userId,
                consultantId
            } };
        await db.insert(chatRooms).values(newChatRoomToInsert);
        const [newChatRoom] = await db.select().from(chatRooms).where(eq(chatRooms.id, id));
        return {
            ...newChatRoom,
            createdAt: newChatRoom.createdAt ?? null,
            updatedAt: newChatRoom.updatedAt ?? null,
        };
    }
    async getChatRoom(id) {
        const [chatRoom] = await db.select().from(chatRooms).where(eq(chatRooms.id, id)).limit(1);
        if (!chatRoom)
            return undefined;
        return {
            ...chatRoom,
            createdAt: chatRoom.createdAt ?? null,
            updatedAt: chatRoom.updatedAt ?? null,
        };
    }
    async getChatRoomByParticipants(userId, consultantId) {
        const [chatRoom] = await db.select().from(chatRooms)
            .where(and(eq(chatRooms.userId, userId), eq(chatRooms.consultantId, consultantId))).limit(1);
        if (!chatRoom)
            return undefined;
        return {
            ...chatRoom,
            createdAt: chatRoom.createdAt ?? null,
            updatedAt: chatRoom.updatedAt ?? null,
        };
    }
    async getChatRoomsByUser(userId) {
        const chatRoomList = await db.select().from(chatRooms).where(eq(chatRooms.userId, userId)).orderBy(desc(chatRooms.createdAt));
        return chatRoomList.map(chatRoom => ({
            ...chatRoom,
            createdAt: chatRoom.createdAt ?? null,
            updatedAt: chatRoom.updatedAt ?? null,
        }));
    }
    async getChatRoomsByConsultant(consultantId) {
        const chatRoomList = await db.select().from(chatRooms).where(eq(chatRooms.consultantId, consultantId)).orderBy(desc(chatRooms.createdAt));
        return chatRoomList.map(chatRoom => ({
            ...chatRoom,
            createdAt: chatRoom.createdAt ?? null,
            updatedAt: chatRoom.updatedAt ?? null,
        }));
    }
    async deleteChatRoom(id) {
        await db.delete(chatRooms).where(eq(chatRooms.id, id));
    }
    async createChatMessage(message) {
        const id = crypto.randomUUID();
        const newMessageToInsert = { id, ...message };
        await db.insert(chatMessages).values(newMessageToInsert);
        const [newMessage] = await db.select().from(chatMessages).where(eq(chatMessages.id, id));
        return {
            ...newMessage,
            isRead: newMessage.isRead ?? false,
            createdAt: newMessage.createdAt ?? null,
        };
    }
    async getChatMessages(chatRoomId) {
        const messageList = await db.select().from(chatMessages).where(eq(chatMessages.chatRoomId, chatRoomId)).orderBy(chatMessages.createdAt);
        return messageList.map(message => ({
            ...message,
            isRead: message.isRead ?? false,
            createdAt: message.createdAt ?? null,
        }));
    }
    async markMessageAsRead(id) {
        await db.update(chatMessages).set({ isRead: true }).where(eq(chatMessages.id, id));
        const [updatedMessage] = await db.select().from(chatMessages).where(eq(chatMessages.id, id));
        if (!updatedMessage)
            return undefined;
        return {
            ...updatedMessage,
            isRead: updatedMessage.isRead ?? false,
            createdAt: updatedMessage.createdAt ?? null,
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
