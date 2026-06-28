/**
 * Send OTP email to user
 */
export declare function sendOTPEmail(email: string, otp: string, name: string): Promise<boolean>;
/**
 * Send welcome email after successful verification
 */
export declare function sendWelcomeEmail(email: string, name: string): Promise<boolean>;
//# sourceMappingURL=emailService.d.ts.map