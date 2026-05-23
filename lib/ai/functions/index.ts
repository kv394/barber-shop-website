import { createService, listServices, createStaff, listStaff } from '@/lib/ai/functions/services';

// OpenAI function definitions – used for function calling
export const functionDefinitions = [
  // Booking management
  {
    name: 'createBooking',
    description: 'Create a new booking for a client',
    parameters: {
      type: 'object',
      properties: {
        serviceId: { type: 'string', description: 'ID of the service' },
        staffId: { type: 'string', description: 'ID of the staff member' },
        startTime: { type: 'string', description: 'ISO timestamp for booking start' },
        clientId: { type: 'string', description: 'ID of the client' },
      },
      required: ['serviceId', 'staffId', 'startTime', 'clientId'],
    },
  },
  {
    name: 'updateBooking',
    description: 'Update an existing booking (time or staff)',
    parameters: {
      type: 'object',
      properties: {
        bookingId: { type: 'string', description: 'ID of the booking' },
        startTime: { type: 'string', description: 'New ISO timestamp (optional)' },
        staffId: { type: 'string', description: 'New staff ID (optional)' },
      },
      required: ['bookingId'],
    },
  },
  {
    name: 'cancelBooking',
    description: 'Cancel a booking',
    parameters: {
      type: 'object',
      properties: {
        bookingId: { type: 'string', description: 'ID of the booking to cancel' },
      },
      required: ['bookingId'],
    },
  },
  {
    name: 'listBookings',
    description: 'List bookings, optionally filtered by client or staff',
    parameters: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Filter by client ID (optional)' },
        staffId: { type: 'string', description: 'Filter by staff ID (optional)' },
      },
      required: [],
    },
  },
  // Loyalty management
  {
    name: 'addPoints',
    description: 'Add loyalty points to a member',
    parameters: {
      type: 'object',
      properties: {
        memberId: { type: 'string' },
        points: { type: 'integer' },
      },
      required: ['memberId', 'points'],
    },
  },
  {
    name: 'getMemberTier',
    description: 'Retrieve the loyalty tier of a member',
    parameters: {
      type: 'object',
      properties: { memberId: { type: 'string' } },
      required: ['memberId'],
    },
  },
  {
    name: 'listRewards',
    description: 'List available loyalty rewards',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  // Payments
  {
    name: 'createInvoice',
    description: 'Create a new invoice for a client',
    parameters: {
      type: 'object',
      properties: {
        clientId: { type: 'string' },
        amount: { type: 'number' },
        description: { type: 'string' },
      },
      required: ['clientId', 'amount', 'description'],
    },
  },
  {
    name: 'refundPayment',
    description: 'Refund a payment by its transaction ID',
    parameters: {
      type: 'object',
      properties: { transactionId: { type: 'string' } },
      required: ['transactionId'],
    },
  },
  {
    name: 'listTransactions',
    description: 'List payment transactions, optional date range',
    parameters: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'ISO start date (optional)' },
        endDate: { type: 'string', description: 'ISO end date (optional)' },
      },
      required: [],
    },
  },
  // Notifications
  {
    name: 'sendEmail',
    description: 'Send an email notification',
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'sendSMS',
    description: 'Send an SMS notification',
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['to', 'message'],
    },
  },
  {
    name: 'listTemplates',
    description: 'List stored notification templates',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  // Reports
  {
    name: 'generateSalesReport',
    description: 'Generate a sales report for a date range',
    parameters: {
      type: 'object',
      properties: {
        startDate: { type: 'string' },
        endDate: { type: 'string' },
      },
      required: ['startDate', 'endDate'],
    },
  },
  {
    name: 'generateStaffReport',
    description: 'Generate a performance report for staff members',
    parameters: {
      type: 'object',
      properties: {
        startDate: { type: 'string' },
        endDate: { type: 'string' },
      },
      required: ['startDate', 'endDate'],
    },
  },
  // Settings
  {
    name: 'updateShopSettings',
    description: 'Update shop configuration settings',
    parameters: {
      type: 'object',
      properties: {
        settings: { type: 'object', description: 'Key‑value pairs of settings' },
      },
      required: ['settings'],
    },
  },
  {
    name: 'getShopSettings',
    description: 'Retrieve current shop settings',
    parameters: { type: 'object', properties: {}, required: [] },
  },

  {
    name: 'createService',
    description: 'Create a new service for the shop',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the service' },
        price: { type: 'number', description: 'Price in cents or dollars' },
        durationMinutes: { type: 'integer', description: 'Duration of the service in minutes' },
      },
      required: ['name', 'price', 'durationMinutes'],
    },
  },
  {
    name: 'listServices',
    description: 'List all services for the shop',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'createStaff',
    description: 'Add a new staff member to the shop',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Full name of the staff member' },
        role: { type: 'string', description: 'Role of the staff member (e.g., barber, manager)' },
      },
      required: ['name', 'role'],
    },
  },
  {
    name: 'listStaff',
    description: 'List all staff members for the shop',
    parameters: { type: 'object', properties: {}, required: [] },
  },
];
