import { ThemeConfig } from '../types/content.types';

export interface ThemePreset {
  id: string;
  name: string;
  emoji: string;
  config: ThemeConfig;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'lavender-rose',
    name: 'Lavender & Blush Rose (Default)',
    emoji: '🌸',
    config: {
      primaryColor: '#C2315D',
      secondaryColor: '#7A4AC2',
      surfaceBase: '#FAF7F2',
      cinematicBase: '#160B1F',
      headingFont: 'Pacifico',
      bodyFont: 'Quicksand',
      handwritingFont: 'Caveat',
    },
  },
  {
    id: 'sunset-peach',
    name: 'Peach Sunset & Coral',
    emoji: '🌅',
    config: {
      primaryColor: '#E0533C',
      secondaryColor: '#9C4182',
      surfaceBase: '#FFF8F4',
      cinematicBase: '#201018',
      headingFont: 'Caveat',
      bodyFont: 'Quicksand',
      handwritingFont: 'Caveat',
    },
  },
  {
    id: 'velvet-crimson',
    name: 'Velvet Crimson & Gold',
    emoji: '🍷',
    config: {
      primaryColor: '#A82046',
      secondaryColor: '#C27803',
      surfaceBase: '#FDF7F5',
      cinematicBase: '#220814',
      headingFont: 'Playfair Display',
      bodyFont: 'Quicksand',
      handwritingFont: 'Dancing Script',
    },
  },
  {
    id: 'midnight-champagne',
    name: 'Midnight Plum & Champagne',
    emoji: '✨',
    config: {
      primaryColor: '#9E3D89',
      secondaryColor: '#D4A338',
      surfaceBase: '#FAF6FD',
      cinematicBase: '#12091A',
      headingFont: 'Pacifico',
      bodyFont: 'Quicksand',
      handwritingFont: 'Great Vibes',
    },
  },
  {
    id: 'sage-blossom',
    name: 'Sage Garden & Wildflower',
    emoji: '🌿',
    config: {
      primaryColor: '#BD4B76',
      secondaryColor: '#3D7860',
      surfaceBase: '#F7FAF7',
      cinematicBase: '#0D1A14',
      headingFont: 'Caveat',
      bodyFont: 'Quicksand',
      handwritingFont: 'Dancing Script',
    },
  },
];

export const AVAILABLE_FONTS = {
  headings: [
    'Pacifico',
    'Caveat',
    'Playfair Display',
    'Dancing Script',
    'Great Vibes',
    'Cinzel',
    'Montserrat',
  ],
  bodies: [
    'Quicksand',
    'Poppins',
    'Nunito',
    'Inter',
    'Lora',
    'Open Sans',
  ],
  handwritings: [
    'Caveat',
    'Dancing Script',
    'Great Vibes',
    'Satisfy',
    'Sacramento',
    'Marck Script',
  ],
};

/**
 * Dynamically load Google Font if not already loaded in document
 */
export const loadGoogleFont = (fontName: string): void => {
  if (!fontName) return;
  const fontId = `google-font-${fontName.toLowerCase().replace(/\s+/g, '-')}`;
  if (document.getElementById(fontId)) return;

  const link = document.createElement('link');
  link.id = fontId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
};

/**
 * Apply theme configuration to document root custom properties
 */
export const applyThemeConfig = (theme?: ThemeConfig): void => {
  if (!theme) return;

  const root = document.documentElement;

  // Colors
  if (theme.primaryColor) {
    root.style.setProperty('--cta-primary', theme.primaryColor);
    root.style.setProperty('--text-accent', theme.primaryColor);
  }
  if (theme.secondaryColor) {
    root.style.setProperty('--cta-secondary', theme.secondaryColor);
  }
  if (theme.surfaceBase) {
    root.style.setProperty('--surface-base', theme.surfaceBase);
  }
  if (theme.cinematicBase) {
    root.style.setProperty('--surface-cinematic', theme.cinematicBase);
  }

  // Fonts
  if (theme.headingFont) {
    loadGoogleFont(theme.headingFont);
    root.style.setProperty('--font-heading', `'${theme.headingFont}', cursive, serif`);
  }
  if (theme.bodyFont) {
    loadGoogleFont(theme.bodyFont);
    root.style.setProperty('--font-body', `'${theme.bodyFont}', sans-serif`);
  }
  if (theme.handwritingFont) {
    loadGoogleFont(theme.handwritingFont);
    root.style.setProperty('--font-handwriting', `'${theme.handwritingFont}', cursive`);
  }
};
