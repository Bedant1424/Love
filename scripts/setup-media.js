import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const sourceDir = path.join(projectRoot, 'WhatsApp Unknown 2026-10-13 at 9.25.32 PM');
const targetMediaDir = path.join(projectRoot, 'public', 'media');

if (!fs.existsSync(targetMediaDir)) {
  fs.mkdirSync(targetMediaDir, { recursive: true });
}

// Map of curated semantic names -> original filenames
const curatedMapping = {
  // Hero portraits / Pretty
  'hero-purple-saree.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.05 PM (1).jpeg',
  'hero-pretty-dress.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.20 PM.jpeg',
  'hero-white-dress.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.01 PM (1).jpeg',
  'hero-red-wall.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.04 PM.jpeg',
  
  // Couple & Romantic
  'couple-face-cup.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.06 PM (1).jpeg',
  'couple-head-rest.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.17 PM (2).jpeg',
  'couple-cheek-kiss.jpeg': 'WhatsApp Image 2026-10-13 at 6.08.10 PM.jpeg',
  'couple-arms-linked.jpeg': 'WhatsApp Image 2026-10-13 at 6.08.09 PM.jpeg',
  'couple-scooter.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.02 PM.jpeg',
  'couple-night-selfie.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.03 PM (1).jpeg',
  'couple-concert.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.03 PM (2).jpeg',
  'couple-squish-cheeks.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.02 PM (1).jpeg',
  'couple-park-bench.jpeg': 'WhatsApp Image 2026-10-13 at 6.08.10 PM (1).jpeg',
  
  // Expressions / Cute / Dimples
  'dimple-closeup.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.16 PM (1).jpeg',
  'food-date.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.24 PM (1).jpeg',
  'video-call-smile.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.12 PM.jpeg',
  
  // Chaos Museum / Menace
  'museum-statue-pose.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.25 PM (2).jpeg',
  'chaos-ubtan-mask.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.01 PM (2).jpeg',
  'chaos-pout-scrunch.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.15 PM (1).jpeg',
  'chaos-holi-colors.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.06 PM.jpeg',
  'chaos-sunglasses-pout.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.05 PM.jpeg',
  'chaos-tongue-out.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.08 PM.jpeg',
  'chaos-lip-crunch.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.11 PM (1).jpeg',
  
  // Sleepy / Cozy
  'sleepy-pillow.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.09 PM.jpeg',
  'sleepy-peace.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.06 PM (2).jpeg',
  
  // Nostalgia / Special
  'baby-ansheeta-frame.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.00 PM.jpeg',
  'baby-stages-collage.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.01 PM.jpeg',
  'candy-wrapper-ansheeta.jpeg': 'WhatsApp Image 2026-10-13 at 6.09.04 PM (2).jpeg',
  
  // Videos
  'video-moment-1.mp4': 'WhatsApp Video 2026-10-13 at 6.08.20 PM.mp4',
  'video-moment-2.mp4': 'WhatsApp Video 2026-10-13 at 6.09.07 PM.mp4',
};

// Also copy all files with sanitized filenames (e.g. img-01.jpeg, etc.)
const files = fs.readdirSync(sourceDir);
const allMediaEntries = [];

let imgIndex = 1;
let vidIndex = 1;

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  const srcPath = path.join(sourceDir, file);
  let safeName = '';
  let type = 'photo';
  
  if (ext === '.mp4') {
    safeName = `raw-video-${String(vidIndex++).padStart(2, '0')}.mp4`;
    type = 'video';
  } else if (ext === '.jpeg' || ext === '.jpg' || ext === '.png') {
    safeName = `raw-photo-${String(imgIndex++).padStart(2, '0')}.jpeg`;
    type = 'photo';
  } else {
    continue;
  }
  
  const destPath = path.join(targetMediaDir, safeName);
  fs.copyFileSync(srcPath, destPath);
  
  allMediaEntries.push({
    originalName: file,
    safeName,
    url: `media/${safeName}`,
    type
  });
}

// Now copy curated files
for (const [curatedName, origName] of Object.entries(curatedMapping)) {
  const src = path.join(sourceDir, origName);
  if (fs.existsSync(src)) {
    const dest = path.join(targetMediaDir, curatedName);
    fs.copyFileSync(src, dest);
    console.log(`Curated copied: ${curatedName} <- ${origName}`);
  } else {
    console.warn(`Warning: source file not found for ${curatedName}: ${origName}`);
  }
}

console.log(`Copied ${files.length} media files into public/media/`);
