export type TemplateType = 'modern' | 'classic' | 'minimal' | 'vibrant' | 'noir' | 'sunset' | 'corporate' | 'sporty' | 'editorial';

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
  editorial: {
    name: 'Editorial',
    description: 'High-end, elegant editorial style for salons and spas',
    id: 'editorial',
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
  heroVideoUrl?: string | null;
  fontFamily?: string;
  headingFont?: string;
  bodyFont?: string;
  buttonShape?: string;
  buttonVariant?: string;
  colorTheme?: string;
  headerStyle?: string;
  heroLayout?: string;
  heroOverlayOpacity?: number;
  heroOverlayColor?: string;
  enableScrollAnimations?: boolean;
  faviconUrl?: string | null;
  customCss?: string;
  sectionOrder?: string[];
  ctaText?: string;
  announcement?: {
    text: string;
    url?: string;
    isActive: boolean;
  };
  seo?: {
    title: string;
    description: string;
    ogImageUrl: string | null;
  };
  editorialCustomization?: {
    heroTitle: string;
    heroSubtitle: string;
    heroTagline: string;
    heroImage: string;
    servicesTitle: string;
    servicesSubtitle: string;
    galleryTitle: string;
    gallerySubtitle: string;
    galleryImages: string[];
    testimonialsTitle: string;
    testimonials: { quote: string; author: string; role: string }[];
    visitUsTitle: string;
    mapImageUrl: string;
  };
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
  heroVideoUrl: null,
  fontFamily: 'Inter',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  buttonShape: 'rounded',
  buttonVariant: 'solid',
  colorTheme: 'light',
  headerStyle: 'classic',
  heroLayout: 'full',
  heroOverlayOpacity: 0,
  heroOverlayColor: '#000000',
  enableScrollAnimations: false,
  faviconUrl: null,
  customCss: '',
  sectionOrder: ['hero', 'services', 'team', 'gallery', 'reviews', 'contact'],
  ctaText: 'Book Appointment',
  announcement: {
    text: 'Welcome to our new booking portal!',
    isActive: false,
  },
  seo: {
    title: '',
    description: '',
    ogImageUrl: null,
  },
  editorialCustomization: {
    heroTitle: 'Your Sanctuary of Sophisticated Care',
    heroSubtitle: 'Experience beauty as an art form. Our atelier provides a curated space for those who appreciate the finer details of self-ceremony.',
    heroTagline: 'Editorial Excellence',
    heroImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPRu8QRu8seSz1ZA0n6LiPGRgqS7aZEcjxutc8fOcO1ZIkoJH2Umtws1TFTbdJwWCpmXEE_T0bVF00Q1EwlHR5KpYdbkMHCu2nUg2NAe5C2pfVotvKBcYkKM63pa2s4XXMCSh4EVxf389QPikRuNYPp_EHSwR5QQSbPcaysTObNr3wOBttSWwh41x9HEbYtenN4fQFtQfUC-criMC9c8Li4jj4D1-zB8_8LZYeg0ReRDBSudtfcTLc4qJDHasnl5yxlX6EAv0YYbw',
    servicesTitle: 'Our Services',
    servicesSubtitle: 'A curated selection of rituals designed to restore your glow and refine your natural elegance.',
    galleryTitle: 'The Gallery',
    gallerySubtitle: 'Our Work',
    galleryImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBwSozMBHwl8bHQlElWMvoOMnVDP5yDaZ_PK77b245sloiZdJcW0U1blou5TuyYzO55Bgu-Jwe-6KJMPDUh9-Ykm91lx2AsAf01I0silTMpi1984WTttXlxHpWtz6MerUn5OT9z7Kb_LQwdpoJSy6N7x1ar6g1eWa_RmtdNfSoNy4EL51JFViAbUYH1wM9iU4Tcm5mx-0hIGMzx5GFZtnghvse_gGrtIwlW2iKzRfu0raaXjx9X8Hslr8TkxQqVY1MSQNeLPV1GUzg',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCxaHOhHjLo5EYoIJfRc9lAXM44-heAnQQatjRONvKBiogsIgBQymijLd4sMR9Dz-NTADWWdq9zT5zF6VY_ejuArqq_n4jFFVTm5bo_t2a3DlwjkC0kG9GG9wSC_P42HnSxY3ueK7saQBNuKc3dERyEyOcG28R7CF8meIrOCvb22zONhyMLFJa5PO_i6SQYbJlYnrXQao5K_MW0feYnu811fmsr85XUcqVlq_RHFfM3SXQMGJfuBrlyte33fE98F-wevp75VVjWumM',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAWENY22K-hYyn9EPMP55xJ8cgezkMNfQEtN624h_GkJNj_2mLzfBM7Op4ELoy_IrGngxzGiswieu34LsITYRCfD1WAuu26IOH2D8cYoyM0ErzeSDvz-KDvyMpjWiyG8qrMSvzm35fA2utOw2r7UAmLAT0SDRQ7TGdDKKohl_ZQTXAShqVufYJqe0Q9CSYE2_fVrX6plM2pipcN4NtDckDi4aqb00D4cR0kJwdHKGGqZSz3L9XRRmzdoobqtjHGiTQAhBPBhc0HDNs',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCTBMFK1nMTJjrslNddeybgkJGgiQKrAdgtiOF8WaCH33-kXHsBW3y30dWHACdd9DT2IrZNoqXXIbJG7aUpKr_fujefCsk1Ouks7AM9BHsjFoyFN_s6WRuSfyrZqKvFSKWwK-YVOU-JHOhyBpdGw9QBLQvv7y8PwZ7XAZ8fU1XgkuS5SgRSJDETJuRhU3yVvtVVKa6aL-PGoozjGNdy-klKPeriQQdTtdv_8W7wZpc7YGFPzO9LRZ8FF5ln9wl8EuzF7gllUriShac'
    ],
    testimonialsTitle: 'Reflections from Our Atelier Guests',
    testimonials: [
      {
        quote: "The attention to detail at L'Atelier is unmatched. It's not just a manicure; it's a meditative experience that leaves me feeling renewed every time.",
        author: "Elena Vance",
        role: "Editorial Stylist"
      },
      {
        quote: "Finally found a space that understands the balance between clinical perfection and soulful hospitality. A true sanctuary in the city.",
        author: "Julianne Moore",
        role: "Interior Designer"
      }
    ],
    visitUsTitle: 'Visit the Atelier',
    mapImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPBUELt3H48sCkgUERZL-bYjLp_g4nyaMrAaWgWqv1QMVuCaaZub4OKguOms2xp_UClFnqWJd5F1jE8c8_9V8GbtLNhZwardBznAcbPP6O5ofImMcqWosMtI8MOhCDK6ERy1aepwuU8Jjoomg4v3oHOH1T-k1vmTJMASUVHIRN_wlzdQm3IGpjqWBgBHRYOEeLiJKp7GgD_lnnDst0M8NdV_0egB1TFqQmXLS5pgBlZELH0ExIL_x5_OEryY1I7lK2NPfP3cKIUjs'
  },
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
