import { BirthdayContent } from '../types/content.types';

export const birthdayContent: BirthdayContent = {
  recipient: {
    name: 'Ansheeta',
    nickname: 'Rose',
    birthDate: '2026-10-14',
  },
  sender: {
    name: 'Bedant',
  },
  audio: {
    soundtrackUrl: '',
    title: 'Romantic Melody',
  },
  greeting: {
    badge: 'For the most wonderful girl in the world 🌸',
    title: 'Happy Birthday, Beautiful!',
    invitation:
      'Today is all about you—your smile, your laughter, and every single moment you make life magical. I built this little world to celebrate you on your special day.',
    ctaText: 'Begin Our Story ✨',
    audioHint: 'Tip: Tap with sound on for the sweetest experience 🎶',
  },
  birthdayMoment: {
    countdownHeader: 'Counting down the moments until your special day... ⏳',
    celebrationHeader: "🎉 IT'S FINALLY HERE! HAPPY BIRTHDAY, MY LOVE! 🎉",
    instructionPre: 'Close your eyes, make the sweetest wish in your heart, and tap the flame to blow it out! 🕯️',
    instructionPost:
      '✨ Wish locked in! May every single dream of yours come true this year. You deserve all the happiness in the universe.',
    ctaText: 'Open Your Birthday Letter 💌',
  },
  loveLetter: {
    envelopeLabel: 'A Letter Just for You 💕',
    waxSealHint: 'Tap the seal to open 🗝️',
    salutation: 'My Dearest Love,',
    paragraphs: [
      "As another year begins in your life, I find myself looking back at all the ordinary days you've turned into my most cherished memories.",
      'From the moment you came into my life, you brought a warmth and brightness that I never knew was missing. Your kindness, the sound of your laughter, the way your eyes crinkle when you are truly happy, and the way you always know how to make me smile—those are the greatest gifts I have ever known.',
      'You inspire me every day with your gentle heart and quiet strength. On your birthday, I want to promise you that no matter where life leads us, I will always be right beside you—celebrating your triumphs, holding your hand through the hard days, and loving you more with every passing sunrise.',
      'Happy Birthday, my wonderful girl. Thank you for simply existing and choosing to share your life with me.',
    ],
    signOff: 'Forever and always yours,',
    signature: 'Bedant 💕',
    ctaText: 'Reasons Why I Love You 💖',
  },
  reasons: [
    {
      id: 1,
      title: 'Your Contagious Laugh 🌸',
      description:
        'The way your whole face lights up when you laugh, especially at silly jokes only the two of us understand.',
      iconName: 'Smile',
    },
    {
      id: 2,
      title: 'Your Gentle Heart 🕊️',
      description:
        'How deeply you care about the people around you. You have the softest, most genuine kindness.',
      iconName: 'Heart',
    },
    {
      id: 3,
      title: 'Our Late-Night Talks 🌙',
      description:
        'Those quiet hours when the rest of the world is asleep, sharing our dreams, silly thoughts, and everything in between.',
      iconName: 'Moon',
    },
    {
      id: 4,
      title: 'The Way You Smile ✨',
      description:
        'That tiny, adorable expression you make when you are truly happy, teasing me, or trying not to giggle.',
      iconName: 'Sparkles',
    },
    {
      id: 5,
      title: 'You Feel Like Home 🏡',
      description:
        'No matter how chaotic the day is, the moment I hear your voice or hold your hand, everything feels peaceful.',
      iconName: 'Home',
    },
    {
      id: 6,
      title: 'Your Bright Ambition 🌟',
      description:
        'Watching you chase your passions with such grace, intelligence, and determination inspires me every day.',
      iconName: 'Star',
    },
  ],
  gallery: [
    {
      id: 1,
      imageUrl: '',
      fallbackTitle: 'Where It All Began 🌸',
      caption: 'The day that started our favorite story ✨',
      date: 'Special Memory',
      rotation: '-rotate-2',
    },
    {
      id: 2,
      imageUrl: '',
      fallbackTitle: 'Golden Hour Smiles 🌅',
      caption: 'Sunsets, smiles, and unforgettable evenings together.',
      date: 'Sweet Moments',
      rotation: 'rotate-3',
    },
    {
      id: 3,
      imageUrl: '',
      fallbackTitle: 'Laughter & Little Things 🍝',
      caption: 'Messy hair, great food, and our favorite inside jokes.',
      date: 'Pure Joy',
      rotation: '-rotate-1',
    },
    {
      id: 4,
      imageUrl: '',
      fallbackTitle: 'Quiet Mornings ☕',
      caption: 'A quiet afternoon that felt like pure happiness.',
      date: 'Peaceful Days',
      rotation: 'rotate-2',
    },
    {
      id: 5,
      imageUrl: '',
      fallbackTitle: 'Adventures Side by Side 🌿',
      caption: 'Exploring new places and creating memories to cherish forever.',
      date: 'Our Journey',
      rotation: '-rotate-3',
    },
    {
      id: 6,
      imageUrl: '',
      fallbackTitle: 'Still Falling for You 💕',
      caption: 'Still completely in love with that smile, every single day.',
      date: 'Today & Always',
      rotation: 'rotate-1',
    },
  ],
  finale: {
    heroImageUrl: '',
    fallbackTitle: 'You & Me Forever 💖',
    title: 'Happy Birthday, My Whole Universe.',
    paragraphs: [
      'No matter how many miles we travel, how many candles we light, or how many years go by, you will always be my greatest adventure and my favorite love story.',
      'I love you beyond measure. Happy Birthday, my love! 💖',
    ],
    signOff: 'Forever and always,',
    replayText: 'Replay Our Story 🔄',
  },
  theme: {
    primaryColor: '#9E3D89',
    secondaryColor: '#D4A338',
    surfaceBase: '#FAF6FD',
    cinematicBase: '#12091A',
    headingFont: 'Great Vibes',
    bodyFont: 'Quicksand',
    handwritingFont: 'Great Vibes',
  },
  customPages: [
    {
      id: 'custom-page-1791887982563',
      title: 'Our Special Promise ✨',
      subtitle: 'A sweet chapter just for us',
      badge: 'Special Chapter',
      content:
        'Write your custom thoughts, memories, cute promises, or relationship milestones here.\n\nEvery line can be separated into distinct paragraphs to create a beautiful reading experience.',
      theme: 'light',
      ctaText: 'Continue Our Story ✨',
    },
  ],
};
