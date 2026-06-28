/**
 * Shared type definitions for the Patent Hash backend.
 * These types are inlined here instead of a separate shared/ folder
 * so the server is self-contained with no cross-package dependencies.
 */
export interface BaseWalletConfig {
    walletAddress: string;
    walletType: 'metamask' | 'walletconnect' | 'coinbase';
    chainId: number;
    chainName: 'base' | 'base-sepolia';
    lastConnected?: string;
}
export type WalletConfig = BaseWalletConfig;
export interface UserSettings {
    walletConfig?: WalletConfig;
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
    [key: string]: any;
}
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
    role: string | null;
    isEmailVerified: boolean | null;
    settings: UserSettings | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}
export interface Consultant {
    id: string;
    userId: string;
    specialization?: string | null;
    bio?: string | null;
    experienceYears?: number | null;
    hourlyRate?: number | null;
    availability?: any;
    rating?: number | null;
    isVerified?: boolean;
    verifiedBy?: string | null;
    verifiedAt?: Date | null;
    verificationNotes?: string | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
}
export interface Appointment {
    id: string;
    userId: string;
    consultantId: string;
    title: string;
    description?: string | null;
    appointmentDate: Date;
    duration: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    meetingLink?: string | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
}
export interface Patent {
    id: string;
    userId: string;
    title: string;
    description: string;
    category: string;
    status: string | null;
    patentNumber: string | null;
    filePath: string | null;
    hashValue: string | null;
    estimatedValue: number | null;
    aiConfidence: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}
export interface PatentDocument {
    id: string;
    patentId: string;
    userId: string;
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    hashValue: string;
    createdAt: Date | null;
}
//# sourceMappingURL=types.d.ts.map