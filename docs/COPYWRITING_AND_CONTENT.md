# Copywriting & Content Specification

**Project:** Girlfriend Birthday Website  
**Tone & Voice:** Intimate, tender, romantic, playful, authentic, and warmly celebratory  
**Audience:** Girlfriend (Candidate names "Rose" / "Arya" supported with publication-safe fallbacks)  
**Content Strategy:** Clean separation of personal narrative content from layout code via a typed configuration file (`content.ts`)  

---

## 1. Personal Content Strategy & Publication-Safe Fallbacks

### 1.1 Unconfirmed Data Reconciliation
- **Candidate Context:** "Rose" and "Arya" are candidate names inferred from repo/folder names, but the user has not formally confirmed the recipient's preferred name, birthday date, or personal memories.
- **Strict Publication Rule:**
  - **Zero Raw Bracket Text:** The website UI must **never** render raw bracket placeholders like `"[HER NAME]"`, `"[DATE]"`, or `"[PERSONAL MEMORY]"` to the recipient.
  - **Production-Ready Default Copy:** If the user publishes the website without customizing certain fields, the application will render beautiful, universally romantic default text (e.g., *"Happy Birthday, Beautiful! 💕"* instead of a bracket string).
- **Missing Media Fallback Rule:**
  - **No Broken Images or Fake Stock Photos:** If user photos are missing or fail to load, the UI renders an illustrated papercraft SVG card (cute pastel birthday cake, heart cluster, starry night) with a heartwarming caption (e.g., *"Every moment with you is my favorite memory 💕"*). It will never render broken image icons or unrelated stock photography presented as real memories.
  - **No Broken Audio Requests:** If no custom MP3 audio file is placed in `public/audio/`, the audio controller gracefully falls back to a bundled royalty-free acoustic chime or disables sound cleanly without console 404 errors.

---

## 2. Scene-by-Scene Copy & Content Specifications (P0 Flow)

### Scene 1: Opening Greeting & Invitation
- **Header Badge:** `"For the most wonderful girl in the world 🌸"`
- **Main Heading (Customizable / Safe Default):**  
  `"Happy Birthday, Beautiful!"` *(Or: "Happy Birthday, Arya! 💕" / "Happy Birthday, Rose! 💕")*
- **Subheading / Invitation:**  
  *"Today is all about you—your smile, your laughter, and every little moment you make my world brighter. I built this special journey to celebrate you on your birthday."*
- **Primary CTA Button:** `"Begin Our Story ✨"`
- **Audio Hint:** `"Tip: Tap with sound on for the sweetest experience 🎶"`

---

### Scene 2: The Birthday Moment & The Candle Wish
- **Atmosphere:** Transitions into intimate Midnight Plum (`#160B1F`).
- **Countdown Header (Conditional - Before Birthday):**  
  *"Counting down the moments until your special day... ⏳"*  
  `XX Hours : XX Minutes : XX Seconds`
- **Celebration Header (Conditional - On Birthday):**  
  *"🎉 IT'S FINALLY HERE! HAPPY BIRTHDAY, MY LOVE! 🎉"*
- **Pre-Extinguish Instruction:**  
  *"Close your eyes, make the sweetest wish in your heart, and tap the flame to blow it out! 🕯️"*
- **Post-Extinguish Message (Dynamic upon tap):**  
  *"✨ Wish locked in! May every single dream of yours come true this year. You deserve all the happiness in the universe."*
- **Proceed Button:** `"Open Your Birthday Letter 💌"`

---

### Scene 3: The Love Letter (3D Envelope Reveal)
- **Envelope Front Label:** `"A Letter Just for You 💕"`
- **Wax Seal Hint:** `"Tap the seal to open 🗝️"`
- **Letter Greeting:** `"My Dearest Love,"`
- **Letter Body (Polished Romantic Default):**  
  *"As another year begins in your life, I find myself looking back at all the ordinary days you've turned into my most cherished memories.*  
  
  *From the moment you came into my life, you brought a warmth and brightness that I never knew was missing. Your kindness, the sound of your laughter, the way your eyes crinkle when you're truly happy, and the way you always know how to make me smile—those are the greatest gifts I have ever known.*  
  
  *You inspire me every day with your gentle heart and quiet strength. On your birthday, I want to promise you that no matter where life leads us, I will always be right beside you—celebrating your triumphs, holding your hand through the hard days, and loving you more with every passing sunrise.*  
  
  *Happy Birthday, my wonderful girl. Thank you for simply existing and choosing to share your life with me."*
- **Letter Sign-off:**  
  *"Forever and always yours,"*  
  *"Bedant 💕"* *(Customizable via `content.ts`)*
- **Letter Navigation Action:** `"Reasons Why I Love You 💖"`

---

### Scene 4: Reasons I Love You (Card Deck)
- **Section Heading:** `"Little Things, Big Love 💖"`
- **Section Subheading:** `"A few of the million reasons why falling for you is the easiest thing I've ever done:"`
- **Card 1:**  
  - *Title:* `"Your Contagious Laugh 🌸"`  
  - *Body:* `"The way your whole face lights up when you laugh, especially at silly jokes that only the two of us understand."`
- **Card 2:**  
  - *Title:* `"Your Gentle Heart 🕊️"`  
  - *Body:* `"How deeply you care about the people around you. You have the softest, most genuine kindness I've ever known."`
- **Card 3:**  
  - *Title:* `"Our Late-Night Talks 🌙"`  
  - *Body:* `"Those quiet hours when the rest of the world is asleep, sharing our dreams, silly thoughts, and everything in between."`
- **Card 4:**  
  - *Title:* `"The Way You Smile ✨"`  
  - *Body:* `"That tiny, adorable expression you make when you're happy, teasing me, or trying not to giggle."`
- **Card 5:**  
  - *Title:* `"You Feel Like Home 🏡"`  
  - *Body:* `"No matter how chaotic the day is, the moment I hear your voice or hold your hand, everything feels peaceful."`
- **Card 6:**  
  - *Title:* `"Your Bright Ambition 🌟"`  
  - *Body:* `"Watching you chase your goals with such grace, intelligence, and determination inspires me every single day."`
- **Progress Counter:** `"Reasons Unlocked: 6 of 6"`
- **Proceed Button:** `"Look Back at Our Memories 📸"`

---

### Scene 5: Memories Gallery (Polaroid Scrapbook)
- **Section Heading:** `"Captured Moments 📸"`
- **Section Subheading:** `"A scrapbook of adventures, quiet moments, and memories frozen in time:"`
- **Polaroid Items (6 Illustrated/Photo Cards):**  
  - Card 1: Caption: `"The day that started our favorite story ✨"`
  - Card 2: Caption: `"Sunsets, smiles, and unforgettable evenings 🌅"`
  - Card 3: Caption: `"Messy hair, good food, and our favorite inside jokes 🍝"`
  - Card 4: Caption: `"A quiet afternoon that felt like pure happiness ☕"`
  - Card 5: Caption: `"Exploring new places side by side 🌿"`
  - Card 6: Caption: `"Still completely in love with that smile, every single day 💕"`
- **Direct P0 Route Action:**  
  `"See Your Birthday Finale ✨"` *(Navigates directly to Scene 10 in P0 mode)*

---

### Scene 10: Final Reveal & Grand Finale (P0 Climax)
- **Atmosphere:** Deep Midnight Plum with glowing golden starlight and celebratory confetti.
- **Hero Frame:** Couples photo or celebratory birthday art in golden floral border.
- **Main Heading:** `"Happy Birthday, My Whole Universe."`
- **Closing Declaration:**  
  *"No matter how many miles we travel, how many candles we light, or how many years go by, you will always be my greatest adventure and my favorite love story.*  
  
  *I love you beyond measure. Happy Birthday! 💖"*
- **Replay Button:** `"Replay Our Story 🔄"` *(Smoothly navigates back to Scene 1 without resetting unlocked states)*

---

## 3. P1 & P2 Optional Enhancement Copy (When Activated)

- **Scene 6 (Timeline - P1):** Chronological milestone nodes ("Where It All Began", "Our First Date", "Saying I Love You", "Our Favorite Trip", "Celebrating You Today").
- **Scene 7 (Quiz - P2):** 3-question trivia ("Who fell in love first?", "Bedant's favorite thing about you?", "Plan for our next date?") with humorous feedback and 100% award.
- **Scene 8 (Gifts - P1):** 3 gift boxes ("Romantic Dinner Voucher", "Weekend Getaway Promise", "The Real Gift Clue").
- **Scene 9 (Coupons - P2):** 4 redeemable love coupons ("30-Minute Massage", "Remote Control Pass", "Home Cooked Dinner", "Get-Out-of-Chore Card").

---

## 4. Media Manifest & Typed Content Structure (`content.ts`)

```typescript
export interface BirthdayContent {
  recipient: {
    name: string;        // Default fallback: "Beautiful"
    nickname: string;    // Default fallback: "My Love"
    birthDate: string;   // ISO format: 'YYYY-MM-DD'
  };
  sender: {
    name: string;        // Default fallback: "Bedant"
  };
  audio: {
    soundtrackUrl: string; // Path or empty string for bundled fallback
    title: string;
  };
  loveLetter: {
    salutation: string;
    paragraphs: string[];
    signOff: string;
    signature: string;
  };
  reasons: Array<{
    id: number;
    title: string;
    description: string;
    icon: string;
  }>;
  gallery: Array<{
    id: number;
    imageUrl: string;      // If image fails to load, fallback SVG is used
    fallbackTitle: string; // Used in SVG fallback card
    caption: string;
    rotation: string;
  }>;
}
```
