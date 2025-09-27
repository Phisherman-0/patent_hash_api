-- Migration: Role-Based User Types
-- Date: 2025-09-13
-- Description: Add role-based access control with user, consultant, and admin roles

-- Ensure the role column exists and has the correct type
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Add constraint to ensure only valid roles are used
ALTER TABLE users 
ADD CONSTRAINT valid_role CHECK (role IN ('user', 'consultant', 'admin'));

-- Create index for better performance on role queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create consultants table for consultant-specific information
CREATE TABLE IF NOT EXISTS consultants (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL UNIQUE,
    specialization VARCHAR(100),
    bio TEXT,
    experience_years INTEGER DEFAULT 0,
    hourly_rate DECIMAL(10, 2),
    availability JSONB DEFAULT '{}',
    rating DECIMAL(3, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_consultants_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for better performance on user_id
CREATE INDEX IF NOT EXISTS idx_consultants_user_id ON consultants(user_id);

-- Create appointments table for booking system
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    consultant_id VARCHAR NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    appointment_date TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
    meeting_link VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_appointments_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_appointments_consultant_id 
        FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE,
        
    -- Constraint for valid status values
    CONSTRAINT valid_appointment_status 
        CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_consultant_id ON appointments(consultant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- Create chat_rooms table for user-consultant communication
CREATE TABLE IF NOT EXISTS chat_rooms (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    consultant_id VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_chat_rooms_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_rooms_consultant_id 
        FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE,
        
    -- Ensure unique chat room between user and consultant
    CONSTRAINT unique_user_consultant_chat 
        UNIQUE (user_id, consultant_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_user_id ON chat_rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_consultant_id ON chat_rooms(consultant_id);

-- Create chat_messages table for storing messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_room_id VARCHAR NOT NULL,
    sender_id VARCHAR NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_chat_messages_chat_room_id 
        FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_messages_sender_id 
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_room_id ON chat_messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Create trigger to automatically update updated_at timestamp for consultants
CREATE OR REPLACE FUNCTION update_consultants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_consultants_updated_at
    BEFORE UPDATE ON consultants
    FOR EACH ROW
    EXECUTE FUNCTION update_consultants_updated_at();

-- Create trigger to automatically update updated_at timestamp for appointments
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();

-- Create trigger to automatically update updated_at timestamp for chat_rooms
CREATE OR REPLACE FUNCTION update_chat_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_rooms_updated_at
    BEFORE UPDATE ON chat_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_rooms_updated_at();

-- Add comments for documentation
COMMENT ON TABLE consultants IS 'Stores consultant-specific information';
COMMENT ON TABLE appointments IS 'Stores appointment bookings between users and consultants';
COMMENT ON TABLE chat_rooms IS 'Stores chat rooms for user-consultant communication';
COMMENT ON TABLE chat_messages IS 'Stores individual chat messages';

-- Verification queries (for manual testing)
-- SELECT COUNT(*) FROM users WHERE role = 'user';
-- SELECT COUNT(*) FROM users WHERE role = 'consultant';
-- SELECT COUNT(*) FROM users WHERE role = 'admin';
-- SELECT * FROM consultants LIMIT 5;
-- SELECT * FROM appointments LIMIT 5;
-- SELECT * FROM chat_rooms LIMIT 5;
-- SELECT * FROM chat_messages LIMIT 5;