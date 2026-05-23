import { getTenantClient } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Create a new service for the shop.
 * args: { name: string, price: number, durationMinutes: number }
 */
export async function createService(args: { name: string; price: number; durationMinutes: number }, shopId: string) {
  const db = getTenantClient(shopId);
  const service = await db.service.create({
    data: {
      name: args.name,
      price: args.price,
      durationMinutes: args.durationMinutes,
    },
  });
  return service;
}

/** List all services for the shop */
export async function listServices(_args: {}, shopId: string) {
  const db = getTenantClient(shopId);
  const services = await db.service.findMany();
  return services;
}

/** Create a staff member */
export async function createStaff(args: { name: string; role: string }, shopId: string) {
  const db = getTenantClient(shopId);
  const staff = await db.staff.create({
    data: {
      name: args.name,
      role: args.role,
    },
  });
  return staff;
}

/** List staff for the shop */
export async function listStaff(_args: {}, shopId: string) {
  const db = getTenantClient(shopId);
  const staff = await db.staff.findMany();
  return staff;
}
