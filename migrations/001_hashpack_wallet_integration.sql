-- Migration: HashPack Wallet Integration
-- Date: 2025-08-28
-- Description: Add wallet_connections table and update schema for HashPack integration

-- Create wallet_connections table
CREATE TABLE IF NOT EXISTS wallet_connections (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    wallet_type VARCHAR NOT NULL, -- 'hashpack' or 'legacy'
    account_id VARCHAR NOT NULL,
    network VARCHAR NOT NULL, -- 'testnet' or 'mainnet'
    session_data JSONB, -- HashConnect session data
    is_active BOOLEAN DEFAULT true,
    last_connected TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_wallet_connections_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate active connections per user
    CONSTRAINT unique_active_wallet_per_user 
        UNIQUE (user_id, is_active) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_connections_user_id ON wallet_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_account_id ON wallet_connections(account_id);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_active ON wallet_connections(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_wallet_connections_wallet_type ON wallet_connections(wallet_type);

-- Migrate existing wallet configurations from user settings to wallet_connections table
INSERT INTO wallet_connections (user_id, wallet_type, account_id, network, is_active, created_at, updated_at)
SELECT 
    id as user_id,
    CASE 
        WHEN settings->>'walletConfig' IS NOT NULL 
        THEN COALESCE((settings->'walletConfig'->>'walletType'), 'legacy')
        ELSE 'legacy'
    END as wallet_type,
    settings->'walletConfig'->>'accountId' as account_id,
    COALESCE(settings->'walletConfig'->>'network', 'testnet') as network,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM users 
WHERE settings->>'walletConfig' IS NOT NULL 
  AND settings->'walletConfig'->>'accountId' IS NOT NULL
  AND settings->'walletConfig'->>'accountId' != '';

-- Update blockchain_transactions table to include wallet_connection_id for better tracking
ALTER TABLE blockchain_transactions 
ADD COLUMN IF NOT EXISTS wallet_connection_id VARCHAR,
ADD CONSTRAINT fk_blockchain_transactions_wallet_connection_id 
    FOREIGN KEY (wallet_connection_id) REFERENCES wallet_connections(id) ON DELETE SET NULL;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_wallet_connection_id 
ON blockchain_transactions(wallet_connection_id);

-- Add wallet_type to blockchain_transactions for easier querying
ALTER TABLE blockchain_transactions 
ADD COLUMN IF NOT EXISTS wallet_type VARCHAR DEFAULT 'legacy';

-- Update existing blockchain transactions to reference wallet connections
UPDATE blockchain_transactions 
SET wallet_connection_id = wc.id,
    wallet_type = wc.wallet_type
FROM wallet_connections wc, patents p
WHERE p.id = blockchain_transactions.patent_id
  AND wc.user_id = p.user_id 
  AND wc.is_active = true
  AND blockchain_transactions.wallet_connection_id IS NULL;

-- Clean up legacy wallet configurations from user settings (optional - commented out for safety)
-- This removes the old walletConfig from user settings after migration
-- Uncomment if you want to clean up the old data after confirming migration worked
/*
UPDATE users 
SET settings = settings - 'walletConfig'
WHERE settings->>'walletConfig' IS NOT NULL;
*/

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wallet_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wallet_connections_updated_at
    BEFORE UPDATE ON wallet_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_connections_updated_at();

-- Add comments for documentation
COMMENT ON TABLE wallet_connections IS 'Stores wallet connection information for HashPack and legacy wallets';
COMMENT ON COLUMN wallet_connections.wallet_type IS 'Type of wallet: hashpack, legacy';
COMMENT ON COLUMN wallet_connections.session_data IS 'HashConnect session data for HashPack wallets';
COMMENT ON COLUMN wallet_connections.is_active IS 'Whether this wallet connection is currently active';

-- Verification queries (for manual testing)
-- SELECT COUNT(*) FROM wallet_connections;
-- SELECT wallet_type, COUNT(*) FROM wallet_connections GROUP BY wallet_type;
-- SELECT u.email, wc.wallet_type, wc.account_id, wc.network FROM users u JOIN wallet_connections wc ON u.id = wc.user_id WHERE wc.is_active = true;
