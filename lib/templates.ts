export type TemplateType = 'modern' | 'classic' | 'minimal' | 'vibrant' | 'noir' | 'sunset' | 'corporate' | 'sporty';

export interface Template {
  name: string;
  description: string;
  id: TemplateType;
}

export const AVAILABLE_TEMPLATES: Record<TemplateType, Template> = {
  modern: {
    name: 'Modern',
    description: 'Clean, contemporary design with gradient backgrounds',
    id: 'modern',
  },
  classic: {
    name: 'Classic',
    description: 'Traditional professional design with serif fonts',
    id: 'classic',
  },
  minimal: {
    name: 'Minimal',
    description: 'A clean, simple, and minimalist layout',
    id: 'minimal',
  },
  noir: {
    name: 'Noir',
    description: 'A stylish, high-contrast black and white theme',
    id: 'noir',
  },
  sunset: {
    name: 'Sunset',
    description: 'A warm, vibrant theme with orange & purple gradients',
    id: 'sunset',
  },
  corporate: {
    name: 'Corporate',
    description: 'A clean, professional look with a strong brand color',
    id: 'corporate',
  },
  sporty: {
    name: 'Sporty',
    description: 'A bold, energetic layout with a focus on quick action',
    id: 'sporty',
  },
  vibrant: {
    name: 'Vibrant',
    description: 'Bold colors and dynamic layouts (placeholder)',
    id: 'vibrant',
  },
};

export interface Customization {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundDark: string;
  backgroundLight: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  businessHours: Record<string, { open: string; close: string } | null>;
  phone: string | null;
  email: string | null;
  address: string | null;
  social: {
    facebook: string | null;
    instagram: string | null;
    twitter: string | null;
  };
  pages?: {
    id: string;
    title: string;
    content: string;
    isVisible: boolean;
  }[];
}

export const DEFAULT_CUSTOMIZATION: Customization = {
  primaryColor: '#3b82f6', // blue-500
  secondaryColor: '#06b6d4', // cyan-500
  accentColor: '#ec4899', // pink-500
  backgroundDark: '#0f172a', // slate-900
  backgroundLight: '#1e293b', // slate-800
  logoUrl: null,
  heroImageUrl: null,
  businessHours: {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: { open: '10:00', close: '16:00' },
    sunday: null,
  },
  phone: null,
  email: null,
  address: null,
  social: {
    facebook: null,
    instagram: null,
    twitter: null,
  },
  pages: [
    {
      id: 'about-us',
      title: 'About Us',
      content: 'Welcome to our shop! We are dedicated to providing the best service.',
      isVisible: true,
    }
  ],
};
