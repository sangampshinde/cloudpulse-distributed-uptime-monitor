-- ==============================================================================
-- CloudPulse - PostgreSQL Database Initialization & Migration Script
-- ==============================================================================

-- 1. Ensure database exists (Run separately if connecting as superuser postgres)
-- CREATE DATABASE cloudpulse;

-- 2. Connect to the cloudpulse database:
-- \c cloudpulse;

-- 3. Enable UUID extension for cryptographically strong random IDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 4. Create Custom ENUM Types
DO $$ BEGIN
    CREATE TYPE monitor_status_enum AS ENUM ('OPERATIONAL', 'DEGRADED', 'DOWN', 'UNKNOWN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ping_status_enum AS ENUM ('UP', 'DOWN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. Create 'monitors' Table
CREATE TABLE IF NOT EXISTS monitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    url VARCHAR(500) NOT NULL,
    method VARCHAR(10) NOT NULL DEFAULT 'GET',
    "checkInterval" INTEGER NOT NULL DEFAULT 60,
    status monitor_status_enum NOT NULL DEFAULT 'UNKNOWN',
    latency INTEGER,
    "uptimePercentage" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "lastCheckedAt" TIMESTAMP WITHOUT TIME ZONE,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Create 'ping_logs' Table
CREATE TABLE IF NOT EXISTS ping_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "monitorId" UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    "statusCode" INTEGER,
    "responseTimeMs" INTEGER NOT NULL,
    status ping_status_enum NOT NULL,
    "errorMessage" VARCHAR(500),
    "checkedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. High-Performance Indexes (DevOps standard for fast charting queries)
CREATE INDEX IF NOT EXISTS idx_ping_logs_monitor_id ON ping_logs ("monitorId");
CREATE INDEX IF NOT EXISTS idx_ping_logs_checked_at ON ping_logs ("checkedAt" DESC);

-- 8. Seed Sangam's Live Portfolio & Project Ecosystem Monitors
INSERT INTO monitors (name, url, method, "checkInterval", status, latency, "uptimePercentage", "lastCheckedAt")
VALUES 
    ('Sangam Portfolio (Live)', 'https://sangam-shinde-portfolio.netlify.app', 'GET', 30, 'OPERATIONAL', 65, 100.0, NOW()),
    ('GitHub Developer Profile', 'https://github.com/sangampshinde', 'GET', 30, 'OPERATIONAL', 42, 100.0, NOW()),
    ('AI SaaS Billing Platform', 'https://github.com/sangampshinde', 'GET', 60, 'OPERATIONAL', 58, 99.8, NOW()),
    ('ChefAI Meal Planner App', 'https://github.com/sangampshinde', 'GET', 60, 'OPERATIONAL', 70, 100.0, NOW()),
    ('AI Sales CRM Platform', 'https://github.com/sangampshinde', 'GET', 60, 'OPERATIONAL', 52, 99.9, NOW())
ON CONFLICT DO NOTHING;

