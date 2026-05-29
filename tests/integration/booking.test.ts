import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../lib/prisma';
import crypto from 'crypto';

describe('Booking Transaction Integrity', () => {
  let shopId: string;
  let staffId: string;
  let serviceId: string;
  let clientId: string;

  beforeAll(async () => {
    // Setup test data
    const shop = await prisma.shop.create({
      data: { name: 'Test Booking Shop', currency: 'USD' }
    });
    shopId = shop.id;

    const staff = await prisma.user.create({
      data: {
        email: `staff-${crypto.randomBytes(4).toString('hex')}@test.com`,
        name: 'Test Staff',
        role: 'STAFF',
        shopId
      }
    });
    staffId = staff.id;

    const service = await prisma.service.create({
      data: {
        name: 'Test Service',
        duration: 30,
        price: 50,
        shopId
      }
    });
    serviceId = service.id;

    const client = await prisma.user.create({
      data: {
        email: `client-${crypto.randomBytes(4).toString('hex')}@test.com`,
        name: 'Test Client',
        role: 'CLIENT',
        shopId
      }
    });
    clientId = client.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.appointment.deleteMany({ where: { shopId } });
    await prisma.service.deleteMany({ where: { id: serviceId } });
    await prisma.user.deleteMany({ where: { id: { in: [staffId, clientId] } } });
    await prisma.shop.deleteMany({ where: { id: shopId } });
  });

  it('should prevent double booking at the exact same time', async () => {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 1); // 1 hour from now
    startTime.setMinutes(0, 0, 0);

    const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 mins later

    // First booking should succeed
    const appointment1 = await prisma.$transaction(async (tx: any) => {
      const conflict = await tx.appointment.findFirst({
        where: {
          staffId,
          status: { not: 'CANCELLED' },
          startTime: { lt: endTime },
          endTime: { gt: startTime }
        }
      });
      if (conflict) throw new Error('CONFLICT');

      return tx.appointment.create({
        data: {
          shopId, serviceId, userId: clientId, staffId, startTime, endTime
        }
      });
    }, { isolationLevel: 'Serializable' });

    expect(appointment1).toBeDefined();

    // Second booking at the exact same time should fail
    await expect(
      prisma.$transaction(async (tx: any) => {
        const conflict = await tx.appointment.findFirst({
          where: {
            staffId,
            status: { not: 'CANCELLED' },
            startTime: { lt: endTime },
            endTime: { gt: startTime }
          }
        });
        if (conflict) throw new Error('CONFLICT');

        return tx.appointment.create({
          data: {
            shopId, serviceId, userId: clientId, staffId, startTime, endTime
          }
        });
      }, { isolationLevel: 'Serializable' })
    ).rejects.toThrow('CONFLICT');
  });
});
