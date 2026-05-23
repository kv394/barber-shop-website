import { createService, listServices, createStaff, listStaff } from '@/lib/ai/functions/services';
import { createBooking, updateBooking, cancelBooking, listBookings } from '@/lib/ai/functions/bookings';
import { addPoints, getMemberTier, listRewards } from '@/lib/ai/functions/loyalty';
import { createInvoice, refundPayment, listTransactions } from '@/lib/ai/functions/payments';
import { sendEmail, sendSMS, listTemplates } from '@/lib/ai/functions/notifications';
import { generateSalesReport, generateStaffReport } from '@/lib/ai/functions/reports';
import { updateShopSettings, getShopSettings } from '@/lib/ai/functions/settings';

// Map function names to their implementations
export const functionMap: Record<string, (args: any, shopId: string) => Promise<any>> = {
  // services
  createService,
  listServices,
  createStaff,
  listStaff,
  // bookings
  createBooking,
  updateBooking,
  cancelBooking,
  listBookings,
  // loyalty
  addPoints,
  getMemberTier,
  listRewards,
  // payments
  createInvoice,
  refundPayment,
  listTransactions,
  // notifications
  sendEmail,
  sendSMS,
  listTemplates,
  // reports
  generateSalesReport,
  generateStaffReport,
  // settings
  updateShopSettings,
  getShopSettings,
};

// Define role permissions
const adminFunctions = new Set([
  'createService', 'listServices', 'createStaff', 'listStaff',
  'createBooking', 'updateBooking', 'cancelBooking', 'listBookings',
  'addPoints', 'getMemberTier', 'listRewards',
  'createInvoice', 'refundPayment', 'listTransactions',
  'sendEmail', 'sendSMS', 'listTemplates',
  'generateSalesReport', 'generateStaffReport',
  'updateShopSettings', 'getShopSettings',
]);
// Staff can read services, bookings, loyalty tier, rewards, own bookings, reports, and settings read, plus send notifications
const staffFunctions = new Set([
  'listServices', 'listStaff',
  'createBooking', 'updateBooking', 'cancelBooking', 'listBookings',
  'getMemberTier', 'listRewards',
  'listTransactions',
  'sendEmail', 'sendSMS',
  'generateSalesReport', 'generateStaffReport',
  'getShopSettings',
]);

/**
 * Returns true if the given role is allowed to invoke the function.
 */
export function isAllowed(userRole: string, functionName: string): boolean {
  if (userRole === 'SHOP_ADMIN') return adminFunctions.has(functionName);
  if (userRole === 'SHOP_STAFF') return staffFunctions.has(functionName);
  // fallback deny
  return false;
}

/**
 * Executes the function with tenant isolation.
 */
export async function handleFunctionCall(name: string, args: any, shopId: string) {
  const fn = functionMap[name];
  if (!fn) throw new Error(`Function ${name} not implemented`);
  return await fn(args, shopId);
}
