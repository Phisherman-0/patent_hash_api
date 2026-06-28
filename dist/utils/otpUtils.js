import crypto from 'crypto';
/**
 * Generate a 6-digit OTP
 */
export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
/**
 * Hash OTP for secure storage
 */
export function hashOTP(otp) {
    return crypto.createHash('sha256').update(otp).digest('hex');
}
/**
 * Verify OTP against hashed version
 */
export function verifyOTP(otp, hashedOTP) {
    const hashedInput = hashOTP(otp);
    return hashedInput === hashedOTP;
}
/**
 * Check if OTP has expired
 */
export function isOTPExpired(expiry) {
    return new Date() > expiry;
}
/**
 * Get OTP expiry time (default: 5 minutes from now)
 */
export function getOTPExpiry(minutes = 5) {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + minutes);
    return expiry;
}
