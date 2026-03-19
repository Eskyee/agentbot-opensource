-- Migration: Add verification fields to agents table
-- Adds onchain attestation support for Verified Human Badge feature

-- Add verification fields to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS verification_type VARCHAR(50);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS attestation_uid VARCHAR(255);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS verifier_address VARCHAR(255);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS verification_metadata JSONB;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agents_verified ON agents(verified);

-- Comments for documentation
COMMENT ON COLUMN agents.verified IS 'Whether the agent has been verified as human-run';
COMMENT ON COLUMN agents.verification_type IS 'Type of verification: eas, coinbase, ens, webauthn';
COMMENT ON COLUMN agents.attestation_uid IS 'Unique identifier from the attestation service';
COMMENT ON COLUMN agents.verifier_address IS 'Ethereum address of the verifier';
COMMENT ON COLUMN agents.verified_at IS 'Timestamp when verification was completed';
COMMENT ON COLUMN agents.verification_metadata IS 'Additional verification data (JSON)';
