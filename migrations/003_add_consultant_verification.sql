-- Migration: Add Consultant Verification
-- Date: 2025-09-13
-- Description: Add verification fields to consultants table for admin approval

-- Add verification fields to consultants table
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_by VARCHAR REFERENCES users(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Add index for better performance on verification status
CREATE INDEX IF NOT EXISTS idx_consultants_is_verified ON consultants(is_verified);

-- Add comments for documentation
COMMENT ON COLUMN consultants.is_verified IS 'Whether the consultant has been verified by an admin';
COMMENT ON COLUMN consultants.verified_by IS 'The admin user who verified this consultant';
COMMENT ON COLUMN consultants.verified_at IS 'Timestamp when the consultant was verified';
COMMENT ON COLUMN consultants.verification_notes IS 'Notes from the admin about the verification';