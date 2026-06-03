import { requireShopRole, isAuthError, safeErrorResponse } from '@/lib/auth';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock dependencies
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    shopAccess: {
      findUnique: vi.fn(),
    },
    shop: {
      findUnique: vi.fn(),
    },
  },
}));

import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

describe('auth.ts helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isAuthError', () => {
    it('returns true if object is NextResponse', () => {
      expect(isAuthError(new NextResponse())).toBe(true);
    });

    it('returns false for valid auth result', () => {
      expect(isAuthError({ user: { id: '1', role: 'ADMIN', shopId: null, email: 'a@a.com', name: 'a' }, userId: '1' })).toBe(false);
    });
  });

  describe('safeErrorResponse', () => {
    it('returns a generic error response', async () => {
      const response = safeErrorResponse(new Error('Sensitive info'), 'Generic Error', 400);
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'Generic Error' });
    });
  });

  describe('requireShopRole', () => {
    it('returns 401 if user is not authenticated in supabase', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } })
        }
      } as any);

      const result = await requireShopRole('shop_1', ['STAFF']);
      expect(isAuthError(result)).toBe(true);
      if (isAuthError(result)) {
        expect(result.status).toBe(401);
      }
    });

    it('returns 401 if user not found in db', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { email: 'test@test.com' } } })
        }
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await requireShopRole('shop_1', ['STAFF']);
      expect(isAuthError(result)).toBe(true);
      if (isAuthError(result)) {
        expect(result.status).toBe(401);
      }
    });

    it('allows SITE_ADMIN to bypass shop checks', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { email: 'admin@test.com' } } })
        }
      } as any);

      const dbUser = { id: 'u1', role: 'SITE_ADMIN', shopId: null, email: 'admin@test.com', name: 'Admin' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as any);
      vi.mocked(prisma.shop.findUnique).mockResolvedValue({ supportAccessEnabled: true, supportAccessExpiresAt: null } as any);

      const result = await requireShopRole('shop_1', ['STAFF']); // Allowed despite requesting STAFF
      expect(isAuthError(result)).toBe(false);
      if (!isAuthError(result)) {
        expect(result.userId).toBe('u1');
      }
    });

    it('allows user if they belong to shop and have correct role', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { email: 'staff@test.com' } } })
        }
      } as any);

      const dbUser = { id: 'u1', role: 'STAFF', shopId: 'shop_1', email: 'staff@test.com', name: 'Staff' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as any);

      const result = await requireShopRole('shop_1', ['STAFF']);
      expect(isAuthError(result)).toBe(false);
      if (!isAuthError(result)) {
        expect(result.user.role).toBe('STAFF');
      }
    });

    it('returns 403 if user belongs to shop but wrong role', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { email: 'client@test.com' } } })
        }
      } as any);

      const dbUser = { id: 'u1', role: 'CLIENT', shopId: 'shop_1', email: 'client@test.com', name: 'Client' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as any);

      const result = await requireShopRole('shop_1', ['STAFF', 'SHOP_ADMIN']);
      expect(isAuthError(result)).toBe(true);
      if (isAuthError(result)) {
        expect(result.status).toBe(403);
      }
    });

    it('allows user if they have ShopAccess record for shop', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { email: 'staff@test.com' } } })
        }
      } as any);

      // User belongs to different shop
      const dbUser = { id: 'u1', role: 'CLIENT', shopId: 'shop_2', email: 'staff@test.com', name: 'Staff' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as any);

      // But has ShopAccess for shop_1 as STAFF
      vi.mocked(prisma.shopAccess.findUnique).mockResolvedValue({ role: 'STAFF' } as any);

      const result = await requireShopRole('shop_1', ['STAFF']);
      expect(isAuthError(result)).toBe(false);
      if (!isAuthError(result)) {
        expect(result.user.role).toBe('STAFF'); // effective role
      }
    });

    it('returns 403 if user belongs to different shop and no ShopAccess', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { email: 'staff@test.com' } } })
        }
      } as any);

      const dbUser = { id: 'u1', role: 'STAFF', shopId: 'shop_2', email: 'staff@test.com', name: 'Staff' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as any);
      vi.mocked(prisma.shopAccess.findUnique).mockResolvedValue(null);

      const result = await requireShopRole('shop_1', ['STAFF']);
      expect(isAuthError(result)).toBe(true);
      if (isAuthError(result)) {
        expect(result.status).toBe(403);
      }
    });
  });
});
