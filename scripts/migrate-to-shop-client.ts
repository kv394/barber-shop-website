import { prisma } from '../lib/prisma';

async function main() {
  console.log("Starting ShopClient data migration...");
  
  // Create ShopClient records for any user that has an appointment at a shop
  await prisma.$executeRaw`
    INSERT INTO "ShopClient" ("id", "userId", "shopId", "clientNotes", "allergies", "preferences", "phone", "birthday", "stripeCustomerId", "stripePaymentMethodId", "createdAt", "updatedAt")
    SELECT 
      gen_random_uuid()::text,
      u."id",
      a."shopId",
      u."clientNotes",
      u."allergies",
      u."preferences",
      u."phone",
      u."birthday",
      u."stripeCustomerId",
      u."stripePaymentMethodId",
      NOW(),
      NOW()
    FROM "User" u
    JOIN "Appointment" a ON a."userId" = u."id"
    GROUP BY u."id", a."shopId"
    ON CONFLICT ("userId", "shopId") DO NOTHING;
  `;
  console.log("Migrated users with appointments.");

  // Also catch users who have ShopAccess as CLIENT but no appointments
  await prisma.$executeRaw`
    INSERT INTO "ShopClient" ("id", "userId", "shopId", "clientNotes", "allergies", "preferences", "phone", "birthday", "stripeCustomerId", "stripePaymentMethodId", "createdAt", "updatedAt")
    SELECT 
      gen_random_uuid()::text,
      u."id",
      sa."shopId",
      u."clientNotes",
      u."allergies",
      u."preferences",
      u."phone",
      u."birthday",
      u."stripeCustomerId",
      u."stripePaymentMethodId",
      NOW(),
      NOW()
    FROM "User" u
    JOIN "ShopAccess" sa ON sa."userId" = u."id"
    WHERE sa."role" = 'CLIENT'
    ON CONFLICT ("userId", "shopId") DO NOTHING;
  `;
  console.log("Migrated users with explicit client access.");

  console.log("Migration completed.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
