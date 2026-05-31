import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  sku: z.string().max(50).optional().nullable(),
  barcode: z.string().max(50).optional().nullable(),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  cost: z.coerce.number().min(0, "Cost must be non-negative").optional().nullable(),
  taxRate: z.coerce.number().min(0).max(1).optional().default(0),
  trackInventory: z.coerce.boolean().optional().default(false),
  inventoryCount: z.coerce.number().int().min(0).optional().default(0),
  reorderPoint: z.coerce.number().int().min(0).optional().default(0),
  type: z.enum(['RETAIL', 'PROFESSIONAL', 'CONSUMABLE', 'BACKBAR']).default('RETAIL'),
  supplier: z.string().max(200).optional().nullable(),
  isSellable: z.coerce.boolean().optional().default(true),
  imageUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
});

export const clientSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal('')),
  phone: z.string().max(20).optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
});

export const clientPatchSchema = z.object({
  clientNotes: z.string().max(5000).optional().nullable(),
  preferences: z.string().max(2000).optional().nullable(),
  allergies: z.string().max(2000).optional().nullable(),
  marketingConsent: z.coerce.boolean().optional(),
  smsConsent: z.coerce.boolean().optional(),
});

export const giftCardSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0").max(10000, "Amount must be less than 10000"),
  purchaserName: z.string().optional().nullable(),
  purchaserEmail: z.string().email("Invalid email").optional().nullable().or(z.literal('')),
  recipientName: z.string().optional().nullable(),
  recipientEmail: z.string().email("Invalid email").optional().nullable().or(z.literal('')),
  message: z.string().optional().nullable(),
  expiresInDays: z.coerce.number().min(1).max(3650).optional().nullable(),
});

export const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  type: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'MULTI_CHANNEL', 'PROMO', 'REACTIVATION', 'BIRTHDAY', 'ANNOUNCEMENT', 'WINBACK', 'CUSTOM']),
  channel: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'BOTH']).default('EMAIL'),
  status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'SENT', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
  targetSegment: z.string().optional().nullable(),
  scheduledFor: z.string().datetime().optional().nullable(),
  message: z.string().optional().nullable(),
  emailSubject: z.string().optional().nullable(),
  emailHtml: z.string().optional().nullable(),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().optional().nullable(),
  appointmentId: z.string().optional().nullable(),
});

export const expenseSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional().nullable(),
  date: z.string().datetime().optional(),
  receiptUrl: z.string().url().optional().nullable().or(z.literal('')),
  taxDeductible: z.coerce.boolean().default(false),
  vendor: z.string().optional().nullable(),
});

export const userSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name is required").optional(),
  role: z.enum(['SITE_ADMIN', 'SHOP_ADMIN', 'STAFF', 'BOOTH_RENTER', 'CLIENT', 'ATTENDANCE_KIOSK']).default('STAFF'),
  phone: z.string().optional().nullable().or(z.literal('')),
  canManageInventory: z.coerce.boolean().optional().default(false),
});

export const boothRentSchema = z.object({
  amount: z.coerce.number().min(0, "Amount must be positive"),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  renterId: z.string().min(1, "Renter ID is required"),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).default('PENDING'),
});
