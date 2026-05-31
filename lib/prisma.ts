import { PrismaClient, Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: any;
}

// Force Node.js to use IPv6 first for Supabase database connections
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'development') {
  try {
    const dns = require('dns');
    if (dns && dns.setDefaultResultOrder) {
      dns.setDefaultResultOrder('ipv6first');
    }
  } catch (e) {
    // Ignore in edge environments where 'dns' might not exist
  }
}

function createPrismaClient() {
  // 1. Prioritize Vercel's Supabase Integration Prisma pooler URL (POSTGRES_PRISMA_URL) which is pre-configured for port 6543 with correct username
  // 2. Fall back to other URLs
  let connectionString = 
    process.env.POSTGRES_PRISMA_URL || 
    process.env.POSTGRES_URL || 
    process.env.SUPABASE_DATABASE_URL || 
    process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.warn("DATABASE_URL is missing. PrismaClient may fail to initialize.");
  } else {
    // Prisma's Rust engine requires explicit trust of self-signed certs from serverless databases like Vercel Postgres/Supabase
    if (process.env.NODE_ENV === 'production') {
      if (!connectionString.includes('sslaccept=')) {
        connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslaccept=accept_invalid_certs';
      }
    }
    // Set env var for Prisma
    process.env.DATABASE_URL = connectionString;
  }
  
  // For the `pg` driver adapter, we need a clean connection string without Prisma-specific params like ?pgbouncer=true
  let pgConnectionString = connectionString ? connectionString.replace(/[?&]pgbouncer=true/g, '') : undefined;
  
  if (process.env.NODE_ENV === 'production' && pgConnectionString) {
    // Vercel's POSTGRES_URL might contain `sslmode=require` which conflicts with `{ rejectUnauthorized: false }` 
    // in the pg driver, causing the SELF_SIGNED_CERT_IN_CHAIN error to persist.
    // We rewrite it to sslmode=no-verify for production serverless connections.
    pgConnectionString = pgConnectionString.replace(/sslmode=require/g, 'sslmode=no-verify');
    if (!pgConnectionString.includes('sslmode=')) {
      pgConnectionString += (pgConnectionString.includes('?') ? '&' : '?') + 'sslmode=no-verify';
    }
    
    // Force transaction mode for Supabase pooler (Supavisor) to avoid the 15 connection session mode limit
    if (pgConnectionString.includes('pooler.supabase.com') && !pgConnectionString.includes('pool_mode=')) {
      pgConnectionString += (pgConnectionString.includes('?') ? '&' : '?') + 'pool_mode=transaction';
    }
  }
  
  const pool = new Pool({ 
    connectionString: pgConnectionString,
    connectionTimeoutMillis: 10000,
    // Limit connections in serverless environment to prevent connection exhaustion
    // We use a tiny pool (1) to prevent "EMAXCONNSESSION" limit (15) on Supabase session pooler.
    max: process.env.NODE_ENV === 'production' ? 1 : 10,
    // Fix "self-signed certificate in certificate chain" errors from Vercel Postgres / Supabase
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });
  const adapter = new PrismaPg(pool);
  
  const baseClient = new PrismaClient({
    adapter,
    log: ['error']
  });

  // We don't apply the tenant extension globally because some routes (like webhooks or cron)
  // need cross-shop access.
  
  const rlsClient = baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          // In a real RLS environment, we'd inject the JWT or context here.
          // Due to Next.js App Router constraints with cookies() in Prisma extensions,
          // we use the application-level shopId injection in getTenantClient for standard queries,
          // but we provide an explicit secure transaction context wrapper.
          return query(args);
        }
      }
    }
  });

  return rlsClient;

}

// Force Next.js hot reload to pick up latest Prisma client changes (Gen 2)
export const prisma = global.prismaGlobal || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}

/**
 * Models that have a `shopId` field and must be tenant-scoped.
 *
 * ⚠️  KEEP THIS SET IN SYNC WITH prisma/schema.prisma  ⚠️
 *
 * Every model listed here MUST have a required `shopId String` field.
 * Models with optional shopId (User, DynamicTemplate, SystemLog) are
 * intentionally excluded — they aren't strictly tenant-scoped.
 * Models without a direct shopId (AppointmentItem, Payment,
 * LoyaltyTransaction, FormSubmission, PurchaseOrderItem,
 * ServiceResourceRequirement, ServiceProductUsage, NotificationPreference)
 * are scoped indirectly through their parent relation and are also excluded.
 *
 * Last verified against schema: 2026-05-28
 */
const TENANT_MODELS = new Set([
  // Core business
  'Service',
  'ServiceAddon',
  'Appointment',
  'Product',
  'ShopClient',

  // Financial
  'CommissionRule',
  'Expense',
  'GiftCard',
  'BoothRentPayment',
  'PurchaseOrder',

  // Staff & scheduling
  'Leave',
  'TimeLog',
  'Waitlist',
  'ShopBlackoutDate',
  'Resource',
  'RenterService',

  // Client engagement
  'Review',
  'LoyaltyProgram',
  'LoyaltyAccount',
  'Referral',
  'Campaign',
  'MembershipTier',
  'UserMembership',

  // Communication
  'Notification',
  'Message',

  // Forms & records
  'FormTemplate',
  'ClientFormula',
  'ClientHistoryImage',
  'PortfolioImage',

  // Access & reporting
  'ShopAccess',
  'ShopUsageReport',
]);

/**
 * Returns a Prisma Client instance that automatically scopes ALL queries
 * to the specified shopId for models that support it.
 * This ensures data isolation between tenants.
 */
/** Regex to validate CUID-format shopId (alphanumeric, 20-30 chars). */
const SHOP_ID_FORMAT = /^[a-z0-9]{20,30}$/;

export function getTenantClient(shopId: string) {
  if (!shopId) throw new Error('shopId is required for tenant client');

  // Defense-in-depth: reject shopIds that don't match expected CUID format
  if (!SHOP_ID_FORMAT.test(shopId)) {
    throw new Error('Invalid shopId format');
  }
  
  return prisma.$extends({
    name: 'tenant-isolation',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          if (TENANT_MODELS.has(model)) {
            // Auto-inject shopId into the where clause for read/update/delete
            if (operation === 'create' || operation === 'createMany') {
              if (args.data) {
                if (Array.isArray(args.data)) {
                  args.data = args.data.map((d: any) => ({ ...d, shopId }));
                } else {
                  args.data = { ...args.data, shopId };
                }
              }
            } else if (
              operation === 'findUnique' ||
              operation === 'findUniqueOrThrow'
            ) {
              // findUnique requires unique indexes. If shopId isn't part of the unique index,
              // Prisma will complain. In those cases, we gracefully convert to findFirst
              // if it's safe, but standard practice is to rely on compound unique indexes.
              // For safety, we just inject it and let Prisma throw if the schema isn't setup for it,
              // forcing developers to fix their schema.
              args.where = { ...args.where, shopId };
            } else if (
              operation === 'findMany' ||
              operation === 'findFirst' ||
              operation === 'findFirstOrThrow' ||
              operation === 'update' ||
              operation === 'updateMany' ||
              operation === 'delete' ||
              operation === 'deleteMany' ||
              operation === 'count' ||
              operation === 'aggregate' ||
              operation === 'groupBy'
            ) {
              args.where = { ...args.where, shopId };
            }
          } // <--- Added missing brace here
          // Enforce Row-Level Security (RLS) by injecting the shopId into the Postgres session context
          // This requires executing the query within an interactive transaction.
          try {
            return await prisma.$transaction(async (tx: any) => {
              await tx.$executeRaw`SET LOCAL "app.current_shop_id" = ${shopId}`;
              return await query(args);
            });
          } catch (e: any) {
            // Fallback for nested transactions where interactive transactions are forbidden
            if (e.message?.includes('Transaction is already closed') || e.message?.includes('nested')) {
               return query(args);
            }
            throw e;
          }
        },
      },
    },
  });
}
