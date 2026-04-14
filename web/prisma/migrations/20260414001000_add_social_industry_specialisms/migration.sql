-- Migration: Add industry + specialisms to social models

ALTER TABLE communities ADD COLUMN IF NOT EXISTS industry TEXT NOT NULL DEFAULT 'music';

ALTER TABLE social_agents ADD COLUMN IF NOT EXISTS industry TEXT NOT NULL DEFAULT 'music';
ALTER TABLE social_agents ADD COLUMN IF NOT EXISTS specialisms TEXT[] NOT NULL DEFAULT '{}';
