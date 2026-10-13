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
    soundtrackUrl: 'audio/hasi-ban-gaye.m4a',
    title: 'Hasi Ban Gaye',
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
    celebrationHeader: 'Happy Birthday, My Love! 🎉',
    instructionPre: 'Close your eyes, make a sweet wish in your heart, and tap the flame to blow it out! 🕯️',
    instructionPost:
      '✨ Wish locked in! May every single dream of yours come true this year.',
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
      photoUrl: 'media/hero-pretty-dress.jpeg',
    },
    {
      id: 2,
      title: 'That Adorable Dimple ✨',
      description:
        'The sweetest feature in the entire universe. Every time you smile shyly, my heart skips a beat.',
      iconName: 'Sparkles',
      photoUrl: 'media/dimple-closeup.jpeg',
    },
    {
      id: 3,
      title: 'Our Late-Night Talks 🌙',
      description:
        'Late night video calls and quiet hours sharing our secrets, silly thoughts, and never wanting to hang up.',
      iconName: 'Moon',
      photoUrl: 'media/video-call-smile.jpeg',
    },
    {
      id: 4,
      title: 'Your Grace & Elegance 👑',
      description:
        'The way you carry yourself with so much dignity, warmth, and natural beauty. You leave me in awe.',
      iconName: 'Heart',
      photoUrl: 'media/hero-purple-saree.jpeg',
    },
    {
      id: 5,
      title: 'You Feel Like Home 🏡',
      description:
        'No matter how chaotic the day is, the moment I hold your hand or squish your cheeks, everything feels peaceful.',
      iconName: 'Home',
      photoUrl: 'media/couple-squish-cheeks.jpeg',
    },
    {
      id: 6,
      title: 'Your Pure, Golden Heart 🌟',
      description:
        'From childhood to today, your kindness and gentleness have stayed pure. You are truly one of a kind.',
      iconName: 'Star',
      photoUrl: 'media/baby-ansheeta-frame.jpeg',
    },
  ],
  chaosMuseum: {
    badge: 'Special Exhibition 🏛️',
    title: 'Cute vs. Chaos Museum',
    subtitle: 'A scientific curation of "My Pretty Girl" vs "My Little Menace"',
    cuteItems: [
      {
        id: 'cute-1',
        title: 'The Queen in Purple',
        caption: 'Breathtaking elegance in traditional saree',
        imageUrl: 'media/hero-purple-saree.jpeg',
        tag: 'Elegance',
      },
      {
        id: 'cute-2',
        title: 'Sunshine & Dimples',
        caption: 'Outdoor glow with that sweetest smile',
        imageUrl: 'media/hero-pretty-dress.jpeg',
        tag: 'Radiant',
      },
      {
        id: 'cute-3',
        title: 'Angel in White',
        caption: 'Gentle, warm, and endlessly lovely',
        imageUrl: 'media/hero-white-dress.jpeg',
        tag: 'Soft Heart',
      },
      {
        id: 'cute-4',
        title: 'Autumn Golden Hour',
        caption: 'Warm brick-wall portrait at sunset',
        imageUrl: 'media/hero-red-wall.jpeg',
        tag: 'Stunning',
      },
    ],
    chaosItems: [
      {
        id: 'chaos-1',
        title: 'Historical Menace',
        caption: 'Out-posing museum statues with unmatched flair',
        imageUrl: 'media/museum-statue-pose.jpeg',
        tag: 'Peak Drama',
      },
      {
        id: 'chaos-2',
        title: 'The Face Mask Ritual',
        caption: 'Glowing skin, zero tolerance for laughter',
        imageUrl: 'media/chaos-ubtan-mask.jpeg',
        tag: 'Spa Chaos',
      },
      {
        id: 'chaos-3',
        title: 'The Signature Scrunch',
        caption: 'When she does not get her way for 2 seconds',
        imageUrl: 'media/chaos-pout-scrunch.jpeg',
        tag: 'Drama Queen',
      },
      {
        id: 'chaos-4',
        title: 'Gulal Pink Bandit',
        caption: 'Holi festival joy and pink colored cheeks',
        imageUrl: 'media/chaos-holi-colors.jpeg',
        tag: 'Holi Joy',
      },
      {
        id: 'chaos-5',
        title: 'The Tease Tongue-Out',
        caption: 'Unstoppable comedic timing mid-photo',
        imageUrl: 'media/chaos-tongue-out.jpeg',
        tag: 'Teasing',
      },
    ],
    ctaText: 'Relive Our Memories 📷',
  },
  gallery: [
    {
      id: 1,
      imageUrl: 'media/couple-arms-linked.jpeg',
      fallbackTitle: 'Where It All Began 🌸',
      caption: 'Walking together with broad smiles and full hearts ✨',
      date: 'Our Story',
      rotation: '-rotate-2',
    },
    {
      id: 2,
      imageUrl: 'media/couple-cheek-kiss.jpeg',
      fallbackTitle: 'Sweetest Cheek Kiss 💕',
      caption: 'Gentle warmth and the softest moments.',
      date: 'Love Always',
      rotation: 'rotate-3',
    },
    {
      id: 3,
      imageUrl: 'media/food-date.jpeg',
      fallbackTitle: 'Food Date & Laughter 🍝',
      caption: 'Feeding each other first with that adorable smile.',
      date: 'Date Night',
      rotation: '-rotate-1',
    },
    {
      id: 4,
      imageUrl: 'media/couple-head-rest.jpeg',
      fallbackTitle: 'Resting On Your Shoulder 🌙',
      caption: 'My safest and most peaceful place in the world.',
      date: 'Quiet Evenings',
      rotation: 'rotate-2',
    },
    {
      id: 5,
      imageUrl: 'media/couple-scooter.jpeg',
      fallbackTitle: 'Scooter Rides & Wind 🛵',
      caption: 'Holding on tight through every road and turn.',
      date: 'Adventures',
      rotation: '-rotate-3',
    },
    {
      id: 6,
      imageUrl: 'media/couple-concert.jpeg',
      fallbackTitle: 'Concert Lights & Music 🎶',
      caption: 'Singing every favorite line at the top of our lungs.',
      date: 'Memories',
      rotation: 'rotate-1',
    },
  ],
  blessings: {
    badge: 'From My Soul to Yours 🕊️',
    title: 'Birthday Blessings For You',
    subtitle: 'Tap each little token to unlock all the sweet wishes in my heart',
    blessings: [
      {
        id: 1,
        icon: 'Sun',
        title: 'Boundless Joy 🌸',
        blessing:
          'May you wake up each morning with lightness in your chest, laughter on your lips, and a smile that reaches your eyes.',
        color: '#C2315D',
      },
      {
        id: 2,
        icon: 'Shield',
        title: 'Unshakable Peace 🕊️',
        blessing:
          'May all overthinking fade away. Whenever the world gets loud, may you always find calm and serenity right here in my arms.',
        color: '#7A4AC2',
      },
      {
        id: 3,
        icon: 'Sparkles',
        title: 'Fierce Success 🌟',
        blessing:
          'May every single dream, goal, and ambition you hold blossom into reality this year. You are capable of moving mountains.',
        color: '#E6A117',
      },
      {
        id: 4,
        icon: 'Smile',
        title: 'Radiant Health 🌿',
        blessing:
          'May you stay energized, glowing, and protected always—eating good food, sleeping peacefully, and staying safe everywhere you go.',
        color: '#2E8540',
      },
      {
        id: 5,
        icon: 'Compass',
        title: 'Pure Adventure 🚀',
        blessing:
          'May this year bring us exciting trips, late-night food runs, spontaneous drives, and memories we will treasure forever.',
        color: '#1A73E8',
      },
      {
        id: 6,
        icon: 'Heart',
        title: 'Unconditional Love 💖',
        blessing:
          'May you never doubt for a single second how deeply precious, cherished, and endlessly loved you are by me.',
        color: '#C2315D',
      },
    ],
    ctaText: 'Open When... Letters ✉️',
  },
  openWhen: {
    badge: 'Letters For Rainy Days ✉️',
    title: 'Open When...',
    subtitle: 'Six sealed notes for the exact moments you need my love the most',
    envelopes: [
      {
        id: 1,
        title: "When You're Missing Me",
        preview: 'Close your eyes and breathe...',
        message:
          'Close your eyes and take a deep breath. I am never further away than a thought. Call me right now, even if it is 3 AM. No matter where we are, half of my heart is always right there with you.',
        photoUrl: 'media/couple-face-cup.jpeg',
        icon: 'Heart',
      },
      {
        id: 2,
        title: 'When You Cannot Sleep',
        preview: 'Put the phone down and get cozy...',
        message:
          'Put your phone down, tuck yourself into the softest blanket, and picture my hand gently stroking your hair. You are completely safe, you are cherished, and tomorrow will be a peaceful day. Sweet dreams, my angel.',
        photoUrl: 'media/sleepy-pillow.jpeg',
        icon: 'Moon',
      },
      {
        id: 3,
        title: 'When You Doubt Yourself',
        preview: 'Look in the mirror, my love...',
        message:
          'Look at yourself with the same eyes I see you with. You are extraordinarily brilliant, hardworking, and strong. Whatever obstacle is in front of you right now does not stand a chance. I believe in you with every fiber of my being.',
        photoUrl: 'media/hero-white-dress.jpeg',
        icon: 'Sparkles',
      },
      {
        id: 4,
        title: "When You're Mad at Me",
        preview: 'I am so sorry for being silly...',
        message:
          'I am so sorry for whatever silly or thoughtless thing I said or did. Even when we disagree, my love for you does not waver by a single millimeter. Please let me give you a giant hug and treat you to your favorite meal right now.',
        photoUrl: 'media/couple-squish-cheeks.jpeg',
        icon: 'Frown',
      },
      {
        id: 5,
        title: 'When You Need a Laugh',
        preview: 'Remember this silly face?...',
        message:
          'Remember this moment? You are the most adorable little clown and my favorite chaos in this whole universe. Stop wrinkling your forehead and let yourself giggle—life is too short not to laugh at our silliness together!',
        photoUrl: 'media/museum-statue-pose.jpeg',
        icon: 'Laugh',
      },
      {
        id: 6,
        title: 'When You Wonder Why I Love You',
        preview: 'Because loving you is like breathing...',
        message:
          'Because you make ordinary days feel like poetry. Because the sound of your laugh is my favorite melody. Because with you, I am home. Loving you is the easiest, truest thing I have ever done and ever will do.',
        photoUrl: 'media/couple-head-rest.jpeg',
        icon: 'Heart',
      },
    ],
    ctaText: 'A Little Future With You 🌅',
  },
  futureDreams: {
    badge: 'Our Tomorrow 🌅',
    title: 'A Little Future With You',
    subtitle: 'A few little promises, road trips, and adventures waiting for us',
    dreams: [
      {
        id: 1,
        title: 'Our First Trip to the Hills ⛰️',
        description: 'Misty mornings, hot chai in giant cups, wrapped together in a giant shawl.',
        tag: 'Getaway',
        checked: false,
      },
      {
        id: 2,
        title: 'Late Night Ice Cream Runs 🍦',
        description: 'Midnight drives in pajamas just because you craved something sweet.',
        tag: 'Date Night',
        checked: false,
      },
      {
        id: 3,
        title: 'Cooking a Complete Disaster Together 🍝',
        description: 'Flour on our noses, burning the garlic bread, laughing uncontrollably.',
        tag: 'Silly Fun',
        checked: false,
      },
      {
        id: 4,
        title: 'Our Own Cozy Balcony Garden 🏡',
        description: 'A sunny spot with fairy lights, potted plants, and your favorite books.',
        tag: 'Future Home',
        checked: false,
      },
      {
        id: 5,
        title: 'Stargazing on a Quiet Rooftop 🌌',
        description: 'Lying side by side pointing at stars and talking about our forever.',
        tag: 'Romance',
        checked: false,
      },
      {
        id: 6,
        title: 'Growing Old & Still Teasing You 👵👴',
        description: 'Sixty years from now, still kissing those same sweet dimples.',
        tag: 'Forever',
        checked: false,
      },
    ],
    note: 'The best chapters of our story are the ones we have not even written yet ✨',
    ctaText: 'Our Forever Promise 💕',
  },
  finale: {
    heroImageUrl: 'media/couple-face-cup.jpeg',
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
    primaryColor: '#C2315D',
    secondaryColor: '#7A4AC2',
    surfaceBase: '#FAF7F2',
    cinematicBase: '#160B1F',
    headingFont: 'Great Vibes',
    bodyFont: 'Quicksand',
    handwritingFont: 'Caveat',
  },
};
