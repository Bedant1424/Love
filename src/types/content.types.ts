export interface RecipientInfo {
  name: string;
  nickname: string;
  birthDate: string; // ISO format string: YYYY-MM-DD
}

export interface SenderInfo {
  name: string;
}

export interface AudioConfig {
  soundtrackUrl: string;
  title: string;
}

export interface GreetingSceneContent {
  badge: string;
  title: string;
  invitation: string;
  ctaText: string;
  audioHint: string;
}

export interface BirthdayMomentContent {
  countdownHeader: string;
  celebrationHeader: string;
  instructionPre: string;
  instructionPost: string;
  ctaText: string;
}

export interface LoveLetterContent {
  envelopeLabel: string;
  waxSealHint: string;
  salutation: string;
  paragraphs: string[];
  signOff: string;
  signature: string;
  ctaText: string;
}

export interface ReasonItem {
  id: number;
  title: string;
  description: string;
  iconName: string;
}

export interface GalleryItem {
  id: number;
  imageUrl: string;
  fallbackTitle: string;
  caption: string;
  date?: string;
  rotation: string; // e.g. "-rotate-2", "rotate-3"
}

export interface FinaleContent {
  heroImageUrl: string;
  fallbackTitle: string;
  title: string;
  paragraphs: string[];
  signOff: string;
  replayText: string;
}

export interface CustomPageItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  content: string; // Paragraphs separated by newlines
  imageUrl?: string;
  theme?: 'light' | 'cinematic';
  ctaText?: string;
}

export interface ThemeConfig {
  primaryColor: string; // e.g. '#C2315D'
  secondaryColor: string; // e.g. '#7A4AC2'
  surfaceBase: string; // e.g. '#FAF7F2'
  cinematicBase: string; // e.g. '#160B1F'
  headingFont: string; // e.g. 'Pacifico'
  bodyFont: string; // e.g. 'Quicksand'
  handwritingFont: string; // e.g. 'Caveat'
}

export interface BirthdayContent {
  recipient: RecipientInfo;
  sender: SenderInfo;
  audio: AudioConfig;
  greeting: GreetingSceneContent;
  birthdayMoment: BirthdayMomentContent;
  loveLetter: LoveLetterContent;
  reasons: ReasonItem[];
  gallery: GalleryItem[];
  customPages?: CustomPageItem[];
  finale: FinaleContent;
  theme?: ThemeConfig;
}
