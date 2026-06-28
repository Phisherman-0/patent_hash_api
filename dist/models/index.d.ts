import { UserSettings } from './types';
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
export declare const usersRelations: import("drizzle-orm").Relations<"users", {
    patents: import("drizzle-orm").Many<"patents">;
    activities: import("drizzle-orm").Many<"patent_activity">;
    walletConnections: import("drizzle-orm").Many<"wallet_connections">;
}>;
export declare const walletConnectionsRelations: import("drizzle-orm").Relations<"wallet_connections", {
    user: import("drizzle-orm").One<"users", true>;
}>;
export declare const consultantsRelations: import("drizzle-orm").Relations<"consultants", {
    user: import("drizzle-orm").One<"users", true>;
    appointments: import("drizzle-orm").Many<"appointments">;
    chatRooms: import("drizzle-orm").Many<"chat_rooms">;
}>;
export declare const appointmentsRelations: import("drizzle-orm").Relations<"appointments", {
    user: import("drizzle-orm").One<"users", true>;
    consultant: import("drizzle-orm").One<"consultants", true>;
}>;
export declare const chatRoomsRelations: import("drizzle-orm").Relations<"chat_rooms", {
    user: import("drizzle-orm").One<"users", true>;
    consultant: import("drizzle-orm").One<"consultants", true>;
    messages: import("drizzle-orm").Many<"chat_messages">;
}>;
export declare const chatMessagesRelations: import("drizzle-orm").Relations<"chat_messages", {
    chatRoom: import("drizzle-orm").One<"chat_rooms", true>;
    sender: import("drizzle-orm").One<"users", true>;
}>;
export declare const patentsRelations: import("drizzle-orm").Relations<"patents", {
    user: import("drizzle-orm").One<"users", true>;
    documents: import("drizzle-orm").Many<"patent_documents">;
    aiAnalyses: import("drizzle-orm").Many<"ai_analysis">;
    priorArtResults: import("drizzle-orm").Many<"prior_art_results">;
    blockchainTransactions: import("drizzle-orm").Many<"blockchain_transactions">;
    activities: import("drizzle-orm").Many<"patent_activity">;
}>;
export declare const patentDocumentsRelations: import("drizzle-orm").Relations<"patent_documents", {
    patent: import("drizzle-orm").One<"patents", true>;
    user: import("drizzle-orm").One<"users", true>;
}>;
export declare const aiAnalysisRelations: import("drizzle-orm").Relations<"ai_analysis", {
    patent: import("drizzle-orm").One<"patents", true>;
}>;
export declare const priorArtResultsRelations: import("drizzle-orm").Relations<"prior_art_results", {
    patent: import("drizzle-orm").One<"patents", true>;
}>;
export declare const blockchainTransactionsRelations: import("drizzle-orm").Relations<"blockchain_transactions", {
    patent: import("drizzle-orm").One<"patents", true>;
}>;
export declare const patentActivityRelations: import("drizzle-orm").Relations<"patent_activity", {
    patent: import("drizzle-orm").One<"patents", true>;
    user: import("drizzle-orm").One<"users", true>;
}>;
export * from './types';
export type User = typeof users.$inferSelect & {
    settings: UserSettings | null;
};
export type InsertUser = typeof users.$inferInsert;
export type UpsertUser = typeof users.$inferInsert;
export type InsertConsultant = typeof consultants.$inferInsert;
export type Consultant = Omit<typeof consultants.$inferSelect, 'hourlyRate' | 'rating'> & {
    hourlyRate: number | null;
    rating: number | null;
};
export type InsertAppointment = typeof appointments.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type InsertChatRoom = typeof chatRooms.$inferInsert;
export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertPatent = typeof patents.$inferInsert;
export type Patent = Omit<typeof patents.$inferSelect, 'aiConfidence' | 'estimatedValue'> & {
    aiConfidence: number | null;
    estimatedValue: number | null;
};
export type InsertPatentDocument = typeof patentDocuments.$inferInsert;
export type PatentDocument = typeof patentDocuments.$inferSelect;
export type InsertAIAnalysis = typeof aiAnalysis.$inferInsert;
export type AIAnalysis = typeof aiAnalysis.$inferSelect;
export type InsertPriorArtResult = typeof priorArtResults.$inferInsert;
export type PriorArtResult = typeof priorArtResults.$inferSelect;
export type InsertBlockchainTransaction = typeof blockchainTransactions.$inferInsert;
export type BlockchainTransaction = typeof blockchainTransactions.$inferSelect;
export type InsertPatentActivity = typeof patentActivity.$inferInsert;
export type PatentActivity = typeof patentActivity.$inferSelect;
export type InsertWalletConnection = typeof walletConnections.$inferInsert;
export type WalletConnection = typeof walletConnections.$inferSelect;
//# sourceMappingURL=index.d.ts.map