import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma, getTenantClient } from '../../lib/prisma';
import crypto from 'crypto';

describe('Tenant Isolation', () => {
  let shopA: string;
  let shopB: string;

  beforeAll(async () => {
    const sa = await prisma.shop.create({ data: { name: 'Shop A' } });
    shopA = sa.id;

    const sb = await prisma.shop.create({ data: { name: 'Shop B' } });
    shopB = sb.id;

    await prisma.service.create({ data: { name: 'Service A', duration: 30, price: 10, shopId: shopA } });
    await prisma.service.create({ data: { name: 'Service B', duration: 30, price: 20, shopId: shopB } });
  });

  afterAll(async () => {
    await prisma.service.deleteMany({ where: { shopId: { in: [shopA, shopB] } } });
    await prisma.shop.deleteMany({ where: { id: { in: [shopA, shopB] } } });
  });

  it('tenant client for Shop A should only see Shop A data', async () => {
    const tenantA = getTenantClient(shopA);
    const services = await tenantA.service.findMany();
    
    expect(services.length).toBe(1);
    expect(services[0].name).toBe('Service A');
  });

  it('tenant client for Shop B should only see Shop B data', async () => {
    const tenantB = getTenantClient(shopB);
    const services = await tenantB.service.findMany();
    
    expect(services.length).toBe(1);
    expect(services[0].name).toBe('Service B');
  });

  it('global prisma client should see both', async () => {
    const services = await prisma.service.findMany({
      where: { shopId: { in: [shopA, shopB] } }
    });
    
    expect(services.length).toBe(2);
  });
});
