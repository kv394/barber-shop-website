-- Add missing enum values to match actual usage in the codebase

-- AlterEnum
ALTER TYPE "CampaignStatus" ADD VALUE 'SENT';

-- AlterEnum
ALTER TYPE "CampaignType" ADD VALUE 'PROMO';
ALTER TYPE "CampaignType" ADD VALUE 'REACTIVATION';
ALTER TYPE "CampaignType" ADD VALUE 'BIRTHDAY';
ALTER TYPE "CampaignType" ADD VALUE 'ANNOUNCEMENT';
ALTER TYPE "CampaignType" ADD VALUE 'WINBACK';
ALTER TYPE "CampaignType" ADD VALUE 'CUSTOM';
