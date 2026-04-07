-- Migration: add_job_board
-- Run with: npx prisma migrate dev --name add_job_board

BEGIN;

-- Job Companies
CREATE TABLE "JobCompany" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "advertiserId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "logoUrl" TEXT,
    "website" TEXT NOT NULL,
    "description" TEXT,
    "githubOrg" TEXT,
    "hiredCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

-- Job Listings
CREATE TABLE "JobListing" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "companyId" TEXT NOT NULL REFERENCES "JobCompany"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "salaryMin" INTEGER NOT NULL,
    "salaryMax" INTEGER NOT NULL,
    "salaryCurrency" TEXT NOT NULL DEFAULT 'USD',
    "roleType" TEXT NOT NULL,
    "techStack" TEXT[] NOT NULL DEFAULT '{}',
    "seniority" TEXT NOT NULL,
    "contractType" TEXT NOT NULL,
    "webType" TEXT NOT NULL DEFAULT 'both',
    "applyUrl" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "languagePtBr" TEXT,
    "badgeResponseGuaranteed" BOOLEAN NOT NULL DEFAULT false,
    "badgeNoAiScreening" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "tier" TEXT NOT NULL DEFAULT 'standard',
    "rejectionReason" TEXT,
    "stripeSessionId" TEXT,
    "stripePaymentIntent" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "applyCount" INTEGER NOT NULL DEFAULT 0,
    "profileCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "filledAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX "JobListing_companyId_idx" ON "JobListing"("companyId");
CREATE INDEX "JobListing_status_idx" ON "JobListing"("status");
CREATE INDEX "JobListing_expiresAt_idx" ON "JobListing"("expiresAt");

-- Career Profiles
CREATE TABLE "CareerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL UNIQUE,
    "skills" TEXT[] NOT NULL DEFAULT '{}',
    "seniority" TEXT NOT NULL,
    "yearsExperience" INTEGER,
    "bio" TEXT NOT NULL,
    "webType" TEXT NOT NULL DEFAULT 'both',
    "contractTypes" TEXT[] NOT NULL DEFAULT '{}',
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryCurrency" TEXT NOT NULL DEFAULT 'USD',
    "salaryVisible" BOOLEAN NOT NULL DEFAULT false,
    "languages" TEXT[] NOT NULL DEFAULT '{}',
    "timezone" TEXT,
    "linkPortfolio" TEXT,
    "linkLinkedin" TEXT,
    "linkWebsite" TEXT,
    "openToWork" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

-- Job Applications
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hasProfile" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    UNIQUE("listingId", "userId")
);

CREATE INDEX "JobApplication_listingId_idx" ON "JobApplication"("listingId");
CREATE INDEX "JobApplication_userId_idx" ON "JobApplication"("userId");

-- Job Alerts
CREATE TABLE "JobAlert" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "skills" TEXT[] NOT NULL DEFAULT '{}',
    "seniority" TEXT[] NOT NULL DEFAULT '{}',
    "webType" TEXT NOT NULL DEFAULT 'both',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifyToken" TEXT
);

CREATE INDEX "JobAlert_email_idx" ON "JobAlert"("email");

COMMIT;