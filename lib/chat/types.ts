import { PrismaClient } from '@prisma/client';

/**
 * Shape of the shop data selected from the database.
 * Matches the `select` clause used in the route's shop query.
 */
export interface ShopData {
  id: string;
  name: string;
  timezone: string | null;
  customDomain: string | null;
  subdomain: string | null;
  customization: any;
  description: string | null;
  shopType: string;
  travelFee: number | null;
  baseLocation: string | null;
  slogan: string | null;
  googleMapsUrl: string | null;
  depositRequired: boolean;
  depositAmount: number | null;
  currency: string | null;
  paymentGateway: string | null;
  template: string | null;
}

/** Minimal service representation injected into prompts */
export interface ServiceData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
}

/** Minimal staff representation injected into prompts */
export interface StaffData {
  id: string;
  name: string | null;
  role: string;
}

/** Service add-on data */
export interface AddonData {
  name: string;
  price: number;
  durationMin: number | null;
}

/** Retail product data */
export interface ProductData {
  name: string;
  description: string | null;
  price: number;
}

/** Loyalty program data */
export interface LoyaltyProgramData {
  pointsPerDollar: number;
  pointsPerVisit: number;
  redeemThreshold: number;
  redeemValue: number;
}

/** Review aggregate stats */
export interface ReviewStatsData {
  _avg: { rating: number | null };
  _count: { id: number };
}

/**
 * Context object passed to every tool handler.
 * Contains everything a tool needs to operate without global state.
 */
export interface ToolHandlerContext {
  prisma: PrismaClient;
  shop: ShopData;
  realShopId: string;
  customization: any;
}

/**
 * Result returned from a tool handler.
 * Contains the data result plus optional UI metadata.
 */
export interface ToolHandlerResult {
  result: any;
  uiType?: string | null;
  availabilitySlots?: any[] | null;
  availabilityDate?: string | null;
  qrCodeUrl?: string | null;
}
