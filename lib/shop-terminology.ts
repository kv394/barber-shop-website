import { IndustryType } from '@prisma/client';

export type TerminologyKey = 
  | 'provider' 
  | 'providers' 
  | 'client' 
  | 'clients' 
  | 'service' 
  | 'services' 
  | 'booking' 
  | 'bookings';

const TERMINOLOGY: Record<IndustryType, Record<TerminologyKey, string>> = {
  BARBER: {
    provider: 'Barber',
    providers: 'Barbers',
    client: 'Client',
    clients: 'Clients',
    service: 'Service',
    services: 'Services',
    booking: 'Appointment',
    bookings: 'Appointments',
  },
  SALON: {
    provider: 'Stylist',
    providers: 'Stylists',
    client: 'Client',
    clients: 'Clients',
    service: 'Service',
    services: 'Services',
    booking: 'Appointment',
    bookings: 'Appointments',
  },
  NAIL_SALON: {
    provider: 'Nail Tech',
    providers: 'Nail Techs',
    client: 'Client',
    clients: 'Clients',
    service: 'Service',
    services: 'Services',
    booking: 'Appointment',
    bookings: 'Appointments',
  },
  DANCE_STUDIO: {
    provider: 'Instructor',
    providers: 'Instructors',
    client: 'Student',
    clients: 'Students',
    service: 'Class',
    services: 'Classes',
    booking: 'Class',
    bookings: 'Classes',
  },
  MARTIAL_ARTS: {
    provider: 'Instructor',
    providers: 'Instructors',
    client: 'Student',
    clients: 'Students',
    service: 'Class',
    services: 'Classes',
    booking: 'Class',
    bookings: 'Classes',
  },
  MUSIC_SCHOOL: {
    provider: 'Teacher',
    providers: 'Teachers',
    client: 'Student',
    clients: 'Students',
    service: 'Lesson',
    services: 'Lessons',
    booking: 'Lesson',
    bookings: 'Lessons',
  },
  FITNESS: {
    provider: 'Trainer',
    providers: 'Trainers',
    client: 'Member',
    clients: 'Members',
    service: 'Class',
    services: 'Classes',
    booking: 'Session',
    bookings: 'Sessions',
  },
  OTHER: {
    provider: 'Staff',
    providers: 'Staff',
    client: 'Client',
    clients: 'Clients',
    service: 'Service',
    services: 'Services',
    booking: 'Booking',
    bookings: 'Bookings',
  },
};

export function getTerminology(industryType: IndustryType | null | undefined, key: TerminologyKey): string {
  if (!industryType || !TERMINOLOGY[industryType]) {
    return TERMINOLOGY.OTHER[key];
  }
  return TERMINOLOGY[industryType][key];
}
