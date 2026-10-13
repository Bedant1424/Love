export interface MediaItem {
  id: string;
  name: string;
  url: string;
  category: 'hero' | 'couple' | 'cute' | 'chaos' | 'sleepy' | 'memory' | 'date' | 'baby' | 'video';
  title: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape' | 'square';
  tag?: string;
}

export function resolveMediaUrl(pathOrUrl: string | undefined): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }
  const clean = pathOrUrl.replace(/^\.?\//, '');
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${clean}`;
}

export const CURATED_MEDIA: MediaItem[] = [
  // Hero portraits / Pretty
  {
    id: 'hero-purple-saree',
    name: 'hero-purple-saree.jpeg',
    url: 'media/hero-purple-saree.jpeg',
    category: 'hero',
    title: 'The Queen in Purple',
    subtitle: 'Breathtaking elegance in traditional saree',
    orientation: 'portrait',
    tag: 'Pretty Girl'
  },
  {
    id: 'hero-pretty-dress',
    name: 'hero-pretty-dress.jpeg',
    url: 'media/hero-pretty-dress.jpeg',
    category: 'hero',
    title: 'Sunshine & Dimples',
    subtitle: 'That glowing smile that brightens any room',
    orientation: 'portrait',
    tag: 'Pretty Girl'
  },
  {
    id: 'hero-white-dress',
    name: 'hero-white-dress.jpeg',
    url: 'media/hero-white-dress.jpeg',
    category: 'hero',
    title: 'Angel in White',
    subtitle: 'Gentle, radiant, and endlessly beautiful',
    orientation: 'portrait',
    tag: 'Pretty Girl'
  },
  {
    id: 'hero-red-wall',
    name: 'hero-red-wall.jpeg',
    url: 'media/hero-red-wall.jpeg',
    category: 'hero',
    title: 'Autumn Warmth',
    subtitle: 'Golden hour portrait by the brick wall',
    orientation: 'portrait',
    tag: 'Pretty Girl'
  },

  // Couple & Romantic
  {
    id: 'couple-face-cup',
    name: 'couple-face-cup.jpeg',
    url: 'media/couple-face-cup.jpeg',
    category: 'couple',
    title: 'My Whole Heart',
    subtitle: 'Arya cupping my face with tender love',
    orientation: 'portrait',
    tag: 'Forever Love'
  },
  {
    id: 'couple-head-rest',
    name: 'couple-head-rest.jpeg',
    url: 'media/couple-head-rest.jpeg',
    category: 'couple',
    title: 'Resting On Your Shoulder',
    subtitle: 'My safest place in the entire world',
    orientation: 'landscape',
    tag: 'Forever Love'
  },
  {
    id: 'couple-cheek-kiss',
    name: 'couple-cheek-kiss.jpeg',
    url: 'media/couple-cheek-kiss.jpeg',
    category: 'couple',
    title: 'Sweetest Cheek Kiss',
    subtitle: 'Pure love and gentle warmth',
    orientation: 'portrait',
    tag: 'Forever Love'
  },
  {
    id: 'couple-arms-linked',
    name: 'couple-arms-linked.jpeg',
    url: 'media/couple-arms-linked.jpeg',
    category: 'couple',
    title: 'Walking Hand in Hand',
    subtitle: 'Always by each other\'s side',
    orientation: 'portrait',
    tag: 'Forever Love'
  },
  {
    id: 'couple-scooter',
    name: 'couple-scooter.jpeg',
    url: 'media/couple-scooter.jpeg',
    category: 'couple',
    title: 'Scooter Adventures',
    subtitle: 'Wind in your hair, holding on tight',
    orientation: 'portrait',
    tag: 'Adventures'
  },
  {
    id: 'couple-night-selfie',
    name: 'couple-night-selfie.jpeg',
    url: 'media/couple-night-selfie.jpeg',
    category: 'couple',
    title: 'Midnight Strolls',
    subtitle: 'Quiet conversations under the night sky',
    orientation: 'portrait',
    tag: 'Adventures'
  },
  {
    id: 'couple-concert',
    name: 'couple-concert.jpeg',
    url: 'media/couple-concert.jpeg',
    category: 'couple',
    title: 'Concert Lights & Warm Hugs',
    subtitle: 'Singing every word together',
    orientation: 'portrait',
    tag: 'Memories'
  },
  {
    id: 'couple-squish-cheeks',
    name: 'couple-squish-cheeks.jpeg',
    url: 'media/couple-squish-cheeks.jpeg',
    category: 'couple',
    title: 'Squishy Cheek Love',
    subtitle: 'Can never resist squishing your cheeks',
    orientation: 'portrait',
    tag: 'Cute'
  },

  // Cute & Dimples
  {
    id: 'dimple-closeup',
    name: 'dimple-closeup.jpeg',
    url: 'media/dimple-closeup.jpeg',
    category: 'cute',
    title: 'The Signature Dimple',
    subtitle: 'The cutest feature on the planet',
    orientation: 'portrait',
    tag: 'Cute'
  },
  {
    id: 'video-call-smile',
    name: 'video-call-smile.jpeg',
    url: 'media/video-call-smile.jpeg',
    category: 'cute',
    title: 'Late Night Video Calls',
    subtitle: 'Never wanting to hang up',
    orientation: 'portrait',
    tag: 'Cute'
  },

  // Food & Dates
  {
    id: 'food-date',
    name: 'food-date.jpeg',
    url: 'media/food-date.jpeg',
    category: 'date',
    title: 'Here, Try A Bite!',
    subtitle: 'You always feeding me first with that sweet smile',
    orientation: 'portrait',
    tag: 'Date Night'
  },

  // Chaos Museum / Menace
  {
    id: 'museum-statue-pose',
    name: 'museum-statue-pose.jpeg',
    url: 'media/museum-statue-pose.jpeg',
    category: 'chaos',
    title: 'The Museum Menace',
    subtitle: 'Out-posing historical artifacts with flair',
    orientation: 'landscape',
    tag: 'Little Menace'
  },
  {
    id: 'chaos-ubtan-mask',
    name: 'chaos-ubtan-mask.jpeg',
    url: 'media/chaos-ubtan-mask.jpeg',
    category: 'chaos',
    title: 'Glowing & Untamed',
    subtitle: 'Face mask ritual with 100% sass',
    orientation: 'portrait',
    tag: 'Little Menace'
  },
  {
    id: 'chaos-pout-scrunch',
    name: 'chaos-pout-scrunch.jpeg',
    url: 'media/chaos-pout-scrunch.jpeg',
    category: 'chaos',
    title: 'The Dramatic Scrunch',
    subtitle: 'When things are slightly not according to plan',
    orientation: 'portrait',
    tag: 'Little Menace'
  },
  {
    id: 'chaos-holi-colors',
    name: 'chaos-holi-colors.jpeg',
    url: 'media/chaos-holi-colors.jpeg',
    category: 'chaos',
    title: 'Gulal Champion',
    subtitle: 'Pink Holi colors and pure laughter',
    orientation: 'portrait',
    tag: 'Little Menace'
  },
  {
    id: 'chaos-sunglasses-pout',
    name: 'chaos-sunglasses-pout.jpeg',
    url: 'media/chaos-sunglasses-pout.jpeg',
    category: 'chaos',
    title: 'Don\'t Mess With Me Pout',
    subtitle: 'Tiny girl, maximum attitude',
    orientation: 'portrait',
    tag: 'Little Menace'
  },
  {
    id: 'chaos-tongue-out',
    name: 'chaos-tongue-out.jpeg',
    url: 'media/chaos-tongue-out.jpeg',
    category: 'chaos',
    title: 'The Unstoppable Tease',
    subtitle: 'Sticking your tongue out mid-argument',
    orientation: 'portrait',
    tag: 'Little Menace'
  },
  {
    id: 'chaos-lip-crunch',
    name: 'chaos-lip-crunch.jpeg',
    url: 'media/chaos-lip-crunch.jpeg',
    category: 'chaos',
    title: 'Silly Lip Crunch',
    subtitle: 'Peak Arya comedic timing',
    orientation: 'portrait',
    tag: 'Little Menace'
  },

  // Sleepy / Gentle
  {
    id: 'sleepy-pillow',
    name: 'sleepy-pillow.jpeg',
    url: 'media/sleepy-pillow.jpeg',
    category: 'sleepy',
    title: 'Sleeping Beauty',
    subtitle: 'Peaceful dreams and soft breathing',
    orientation: 'portrait',
    tag: 'Sleepy'
  },
  {
    id: 'sleepy-peace',
    name: 'sleepy-peace.jpeg',
    url: 'media/sleepy-peace.jpeg',
    category: 'sleepy',
    title: 'Half-Asleep Peace Sign',
    subtitle: 'Too tired to stay awake, still throwing peace signs',
    orientation: 'portrait',
    tag: 'Sleepy'
  },

  // Memories & Nostalgia
  {
    id: 'baby-ansheeta-frame',
    name: 'baby-ansheeta-frame.jpeg',
    url: 'media/baby-ansheeta-frame.jpeg',
    category: 'baby',
    title: 'Baby Ansheeta',
    subtitle: 'Destined to be the most wonderful girl',
    orientation: 'square',
    tag: 'Childhood'
  },
  {
    id: 'baby-stages-collage',
    name: 'baby-stages-collage.jpeg',
    url: 'media/baby-stages-collage.jpeg',
    category: 'baby',
    title: 'Growing Up Rose',
    subtitle: 'From tiny toddler to the woman I adore',
    orientation: 'square',
    tag: 'Childhood'
  },
  {
    id: 'candy-wrapper-ansheeta',
    name: 'candy-wrapper-ansheeta.jpeg',
    url: 'media/candy-wrapper-ansheeta.jpeg',
    category: 'memory',
    title: 'Ans-heta Sweet Wrapper',
    subtitle: 'Little tokens that bring instant smiles',
    orientation: 'square',
    tag: 'Memory'
  },

  // Videos
  {
    id: 'video-moment-1',
    name: 'video-moment-1.mp4',
    url: 'media/video-moment-1.mp4',
    category: 'video',
    title: 'Our Sweet Little Memory',
    subtitle: 'Tap to relive this candid moment together',
    orientation: 'portrait',
    tag: 'Video'
  },
  {
    id: 'video-moment-2',
    name: 'video-moment-2.mp4',
    url: 'media/video-moment-2.mp4',
    category: 'video',
    title: 'Laughter Caught on Tape',
    subtitle: 'Your laugh will always be my favorite song',
    orientation: 'portrait',
    tag: 'Video'
  }
];

// All 65 raw photos + 2 videos for full gallery selection in Admin
export const ALL_MEDIA_FILES: { id: string; name: string; url: string; isVideo?: boolean }[] = [
  ...CURATED_MEDIA.map(m => ({ id: m.id, name: m.name, url: m.url, isVideo: m.category === 'video' })),
  ...Array.from({ length: 65 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    return {
      id: `raw-photo-${num}`,
      name: `Photo #${i + 1}`,
      url: `media/raw-photo-${num}.jpeg`,
      isVideo: false
    };
  })
];
