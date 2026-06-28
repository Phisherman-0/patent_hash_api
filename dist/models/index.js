import { relations } from 'drizzle-orm';
import { sessions } from './session.model';
import { users } from './user.model';
import { patents, insertPatentSchema } from './patent.model';
import { patentDocuments, insertPatentDocumentSchema } from './patent-document.model';
import { aiAnalysis, insertAIAnalysisSchema } from './ai-analysis.model';
import { priorArtResults } from './prior-art-result.model';
import { blockchainTransactions } from './blockchain-transaction.model';
import { patentActivity } from './patent-activity.model';
import { walletConnections } from './wallet-connection.model';
import { consultants } from './consultant.model';
import { appointments } from './appointment.model';
import { chatRooms } from './chat-room.model';
import { chatMessages } from './chat-message.model';
export { sessions, users, patents, patentDocuments, aiAnalysis, priorArtResults, blockchainTransactions, patentActivity, walletConnections, consultants, appointments, chatRooms, chatMessages, insertPatentSchema, insertPatentDocumentSchema, insertAIAnalysisSchema };
// Relations
export const usersRelations = relations(users, ({ many }) => ({
    patents: many(patents),
    activities: many(patentActivity),
    walletConnections: many(walletConnections),
}));
export const walletConnectionsRelations = relations(walletConnections, ({ one }) => ({
    user: one(users, {
        fields: [walletConnections.userId],
        references: [users.id],
    }),
}));
export const consultantsRelations = relations(consultants, ({ one, many }) => ({
    user: one(users, {
        fields: [consultants.userId],
        references: [users.id],
    }),
    appointments: many(appointments),
    chatRooms: many(chatRooms),
}));
export const appointmentsRelations = relations(appointments, ({ one }) => ({
    user: one(users, {
        fields: [appointments.userId],
        references: [users.id],
    }),
    consultant: one(consultants, {
        fields: [appointments.consultantId],
        references: [consultants.id],
    }),
}));
export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
    user: one(users, {
        fields: [chatRooms.userId],
        references: [users.id],
    }),
    consultant: one(consultants, {
        fields: [chatRooms.consultantId],
        references: [consultants.id],
    }),
    messages: many(chatMessages),
}));
export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
    chatRoom: one(chatRooms, {
        fields: [chatMessages.chatRoomId],
        references: [chatRooms.id],
    }),
    sender: one(users, {
        fields: [chatMessages.senderId],
        references: [users.id],
    }),
}));
export const patentsRelations = relations(patents, ({ one, many }) => ({
    user: one(users, {
        fields: [patents.userId],
        references: [users.id],
    }),
    documents: many(patentDocuments),
    aiAnalyses: many(aiAnalysis),
    priorArtResults: many(priorArtResults),
    blockchainTransactions: many(blockchainTransactions),
    activities: many(patentActivity),
}));
export const patentDocumentsRelations = relations(patentDocuments, ({ one }) => ({
    patent: one(patents, {
        fields: [patentDocuments.patentId],
        references: [patents.id],
    }),
    user: one(users, {
        fields: [patentDocuments.userId],
        references: [users.id],
    }),
}));
export const aiAnalysisRelations = relations(aiAnalysis, ({ one }) => ({
    patent: one(patents, {
        fields: [aiAnalysis.patentId],
        references: [patents.id],
    }),
}));
export const priorArtResultsRelations = relations(priorArtResults, ({ one }) => ({
    patent: one(patents, {
        fields: [priorArtResults.patentId],
        references: [patents.id],
    }),
}));
export const blockchainTransactionsRelations = relations(blockchainTransactions, ({ one }) => ({
    patent: one(patents, {
        fields: [blockchainTransactions.patentId],
        references: [patents.id],
    }),
}));
export const patentActivityRelations = relations(patentActivity, ({ one }) => ({
    patent: one(patents, {
        fields: [patentActivity.patentId],
        references: [patents.id],
    }),
    user: one(users, {
        fields: [patentActivity.userId],
        references: [users.id],
    }),
}));
// Export all domain types for use across the server
export * from './types';
