import { getTenantClient } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Create a new service for the shop.
 * args: { name: string, price: number, durationMinutes: number }
 */
export async function createService(args: { name: string; price: number; durationMinutes: number }, shopId: string) {
  const db = await getTenantClient(shopId);
  const service = await db.service.create({
    data: {
      name: args.name,
      price: args.price,
      duration: args.durationMinutes,
      shopId: shopId,
    },
  });
  return service;
}

/** List all services for the shop */
export async function listServices(_args: {}, shopId: string) {
  const db = await getTenantClient(shopId);
  const services = await db.service.findMany({ where: { shopId } });
  return services;
}

/** Create a staff member */
export async function createStaff(args: { name: string; role: string }, shopId: string) {
  const db = await getTenantClient(shopId);
  const staff = await db.user.create({
    data: {
      name: args.name,
      role: 'STAFF',
      email: `staff-${Date.now()}@example.com`,
      shopId: shopId,
    },
  });
  return staff;
}

/** List staff for the shop */
export async function listStaff(_args: {}, shopId: string) {
  const db = await getTenantClient(shopId);
  const staff = await db.user.findMany({ where: { shopId, role: 'STAFF' } });
  return staff;
}
