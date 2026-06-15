/**
 * KutzApp Client SDK — TypeScript Declarations
 *
 * Include this file in your project for type-safe access to the KutzApp SDK.
 * The SDK is loaded via `<script src="/kutzapp-sdk.js">` and exposes
 * `window.KutzApp`, `window.BarberBooking`, `window.BarberAppointments`,
 * and `window.BarberSignIn` as global objects.
 */

// ── Data Types ──────────────────────────────────────────────────────

interface KutzAppShop {
  id: string;
  name: string;
  locationName: string;
  companyName: string;
  description: string | null;
  timezone: string | null;
  template: string | null;
  customDomain: string | null;
  logoUrl: string | null;
  heroImageUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  /** Formatted address string */
  address: string | null;
  /** Phone number */
  phone: string | null;
  /** Email address */
  email: string | null;
  /** Business hours by day of week */
  businessHours: Record<string, { open: string; close: string; isClosed?: boolean }> | null;
  customization: KutzAppCustomization;
}

interface KutzAppCustomization {
  address?: any;
  contact?: { phone?: string; email?: string; website?: string; facebook?: string; instagram?: string; twitter?: string };
  branding?: any;
  seo?: { title?: string; description?: string; ogImageUrl?: string };
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  businessHours?: Record<string, { open: string; close: string; isClosed?: boolean }>;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  buttonShape?: 'rounded' | 'sharp' | 'pill';
  buttonVariant?: 'solid' | 'outline' | 'ghost';
  colorTheme?: 'light' | 'dark';
  customHtml?: string;
  authPosition?: string;
  chatbotPosition?: string;
  announcement?: { text?: string; url?: string; isActive?: boolean };
}

interface KutzAppProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  type: string | null;
  trackInventory: boolean;
  inventoryCount: number;
}

interface KutzAppService {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  duration: number;
}

interface KutzAppStaff {
  id: string;
  name: string;
  imageUrl: string | null;
  role: string;
  workingHours: any;
}

interface KutzAppReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string | null };
}

interface KutzAppPortfolioImage {
  id: string;
  imageUrl: string;
  caption: string | null;
  displayOrder: number;
  staffId: string;
}

interface KutzAppLoyaltyProgram {
  id: string;
  pointsPerDollar: number;
  pointsPerVisit: number;
  redeemThreshold: number;
  redeemValue: number;
  tiers: any;
}

interface KutzAppMembershipTier {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: string;
}

interface KutzAppPublicData {
  shop: KutzAppShop;
  products: KutzAppProduct[];
  services: KutzAppService[];
  staff: KutzAppStaff[];
  reviews: KutzAppReview[];
  portfolioImages: KutzAppPortfolioImage[];
  loyaltyProgram: KutzAppLoyaltyProgram | null;
  membershipTiers: KutzAppMembershipTier[];
}

interface KutzAppSlot {
  time: string;
  staffId: string;
  staffName: string;
}

interface KutzAppWaitlistEntry {
  id: string;
  clientName: string;
  clientPhone: string | null;
  position: number;
  status: string;
  serviceId: string | null;
  createdAt: string;
}

interface KutzAppCheckoutResult {
  url: string;
  sessionId: string;
}

// ── Init Options ────────────────────────────────────────────────────

interface KutzAppInitOptions {
  apiUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
}

// ── Booking Details ─────────────────────────────────────────────────

interface KutzAppBookingDetails {
  serviceId: string;
  staffId: string;
  startTime: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  notes?: string;
  addonIds?: string[];
}

interface KutzAppReviewDetails {
  rating: number;
  comment?: string;
  appointmentId?: string;
}

interface KutzAppWaitlistDetails {
  clientName: string;
  clientPhone?: string;
  serviceId?: string;
  partySize?: number;
}

// ── SDK Client ──────────────────────────────────────────────────────

interface KutzAppClient {
  shopId: string | null;
  apiUrl: string;
  primaryColor: string | null;
  secondaryColor: string | null;

  /** Initialize the SDK with a shop ID and optional configuration. */
  init(shopId?: string, options?: KutzAppInitOptions | string): void;

  /** Fetch all public data (shop, services, products, staff, reviews, gallery, loyalty, memberships). Cached locally. */
  getPublicData(forceRefresh?: boolean): Promise<KutzAppPublicData>;

  /** Get shop details (name, branding, customization). */
  getShopDetails(): Promise<KutzAppShop>;

  /** Get the shop's formatted address string. */
  getAddress(): Promise<string | null>;

  /** Get the shop's phone number. */
  getPhone(): Promise<string | null>;

  /** Get the shop's email address. */
  getEmail(): Promise<string | null>;

  /** Get all sellable retail products. */
  getSellableProducts(): Promise<KutzAppProduct[]>;

  /** Get all bookable services. */
  getBookableServices(): Promise<KutzAppService[]>;

  /** Get public staff members. */
  getPublicStaff(): Promise<KutzAppStaff[]>;

  /** Get latest reviews. */
  getReviews(): Promise<KutzAppReview[]>;

  /** Get a specific product by ID. */
  getProductDetails(productId: string): Promise<KutzAppProduct>;

  /** Get a specific service by ID. */
  getServiceDetails(serviceId: string): Promise<KutzAppService>;

  /** Get all portfolio/gallery images. */
  getPortfolioImages(): Promise<KutzAppPortfolioImage[]>;

  /** Get the active loyalty program configuration, or null. */
  getLoyaltyProgram(): Promise<KutzAppLoyaltyProgram | null>;

  /** Get all membership tiers. */
  getMembershipTiers(): Promise<KutzAppMembershipTier[]>;

  /** Get business hours from shop customization. */
  getBusinessHours(): Promise<Record<string, { open: string; close: string; isClosed?: boolean }> | null>;

  /** Get available time slots for a service on a given date. */
  getAvailableSlots(serviceId: string, date: string, staffId?: string): Promise<KutzAppSlot[]>;

  /** Join the walk-in waitlist (no auth required). */
  joinWaitlist(details: KutzAppWaitlistDetails): Promise<KutzAppWaitlistEntry>;

  /** Book an appointment. */
  bookService(bookingDetails: KutzAppBookingDetails): Promise<any>;

  /** Submit a review. */
  submitReview(reviewDetails: KutzAppReviewDetails): Promise<any>;

  /** Buy a product via Stripe Checkout. Redirects to Stripe. */
  buyProduct(productId: string, quantity?: number): Promise<KutzAppCheckoutResult>;

  /** Clean up the SDK instance. */
  destroy(): void;
}

// ── Widget Interfaces ───────────────────────────────────────────────

interface BarberBookingWidget {
  /** Open the booking modal. Optionally pre-select a service. */
  open(serviceId?: string): void;
}

interface BarberOverlayWidget {
  /** Open the overlay modal. */
  open(): void;
  /** Close the overlay modal. */
  close(): void;
}

interface BarberProductDetailsWidget {
  /** Open the product details modal. */
  open(productName: string, productPrice: string, productDesc: string, productId?: string): void;
}

interface BarberReviewsWidget {
  /** Open the reviews modal. Pass true to show the write form. */
  open(showWriteForm?: boolean): void;
}

// ── Global Declarations ─────────────────────────────────────────────

declare global {
  var KutzApp: KutzAppClient;
  var BarberBooking: BarberBookingWidget;
  var BarberAppointments: BarberOverlayWidget;
  var BarberSignIn: BarberOverlayWidget;
  var BarberProductDetails: BarberProductDetailsWidget;
  var BarberReviews: BarberReviewsWidget;
  var openKutzAppChat: (serviceName?: string) => void;
}

export {};
