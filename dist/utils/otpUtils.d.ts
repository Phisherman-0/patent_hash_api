/**
 * Generate a 6-digit OTP
 */
export declare function generateOTP(): string;
/**
 * Hash OTP for secure storage
 */
export declare function hashOTP(otp: string): string;
/**
 * Verify OTP against hashed version
 */
export declare function verifyOTP(otp: string, hashedOTP: string): boolean;
/**
 * Check if OTP has expired
 */
export declare function isOTPExpired(expiry: Date): boolean;
/**
 * Get OTP expiry time (default: 5 minutes from now)
 */
export declare function getOTPExpiry(minutes?: number): Date;
//# sourceMappingURL=otpUtils.d.ts.map