import { Type, FunctionDeclaration } from '@google/genai';

export const checkAvailabilityDecl: FunctionDeclaration = {
  name: 'check_availability',
  description: 'Check available time slots for a specific date, service, and optionally staff member',
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format. MUST calculate internally if user provides relative date.' },
      serviceId: { type: Type.STRING, description: 'The ID of the service. MUST map from service name internally.' },
      staffId: { type: Type.STRING, description: 'Optional staff ID. MUST map from staff name internally. If not provided, checks any staff.' }
    },
    required: ['date', 'serviceId']
  }
};

export const bookAppointmentDecl: FunctionDeclaration = {
  name: 'book_appointment',
  description: 'Book an appointment for the user',
  parameters: {
    type: Type.OBJECT,
    properties: {
      serviceId: { type: Type.STRING, description: 'The ID of the service. MUST map from service name internally.' },
      staffId: { type: Type.STRING, description: 'The ID of the staff. MUST map from staff name internally.' },
      date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format. MUST calculate internally.' },
      time: { type: Type.STRING, description: 'Time in HH:MM format (24-hour, local to shop timezone)' },
      clientName: { type: Type.STRING },
      clientPhone: { type: Type.STRING },
      clientEmail: { type: Type.STRING, description: 'Optional client email' },
      serviceLocation: { type: Type.STRING, description: 'Optional physical address for mobile/house call services' },
      recurrenceRule: { type: Type.STRING, description: 'Optional recurrence rule: WEEKLY, BIWEEKLY, EVERY_3_WEEKS, or MONTHLY' }
    },
    required: ['serviceId', 'staffId', 'date', 'time', 'clientName', 'clientPhone']
  }
};

export const checkAppointmentsDecl: FunctionDeclaration = {
  name: 'check_appointments',
  description: 'Check existing upcoming appointments for a user',
  parameters: {
    type: Type.OBJECT,
    properties: {
      clientName: { type: Type.STRING, description: 'Client name' },
      clientPhone: { type: Type.STRING, description: 'Client phone number' },
      clientEmail: { type: Type.STRING, description: 'Client email address' }
    }
  }
};

export const sendCalendarInviteDecl: FunctionDeclaration = {
  name: 'send_calendar_invite',
  description: 'Send an email with a calendar invite to the user for an appointment',
  parameters: {
    type: Type.OBJECT,
    properties: {
      clientEmail: { type: Type.STRING, description: 'The email address of the client' },
      appointmentId: { type: Type.STRING, description: 'The ID of the appointment' }
    },
    required: ['clientEmail', 'appointmentId']
  }
};

export const cancelAppointmentDecl: FunctionDeclaration = {
  name: 'cancel_appointment',
  description: 'Cancel an existing appointment',
  parameters: {
    type: Type.OBJECT,
    properties: {
      appointmentId: { type: Type.STRING, description: 'The ID of the appointment to cancel' }
    },
    required: ['appointmentId']
  }
};

export const rescheduleAppointmentDecl: FunctionDeclaration = {
  name: 'reschedule_appointment',
  description: 'Reschedule an existing appointment to a new date and time',
  parameters: {
    type: Type.OBJECT,
    properties: {
      appointmentId: { type: Type.STRING, description: 'The ID of the appointment to reschedule' },
      date: { type: Type.STRING, description: 'New date in YYYY-MM-DD format' },
      time: { type: Type.STRING, description: 'New time in HH:MM format (24-hour)' }
    },
    required: ['appointmentId', 'date', 'time']
  }
};

/** All tool declarations as a single array for the Gemini config */
export const allToolDeclarations: FunctionDeclaration[] = [
  checkAvailabilityDecl,
  bookAppointmentDecl,
  checkAppointmentsDecl,
  sendCalendarInviteDecl,
  cancelAppointmentDecl,
  rescheduleAppointmentDecl,
];
