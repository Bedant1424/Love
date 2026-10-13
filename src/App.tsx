import React, { useState, useEffect } from 'react';
import { birthdayContent } from './data/content';
import { AudioController } from './components/common/AudioController';
import { ProgressBar } from './components/common/ProgressBar';
import { Scene1Greeting } from './components/scenes/Scene1Greeting';
import { Scene2Cake } from './components/scenes/Scene2Cake';
import { Scene3Letter } from './components/scenes/Scene3Letter';
import { Scene4Reasons } from './components/scenes/Scene4Reasons';
import { Scene5Gallery } from './components/scenes/Scene5Gallery';
import { Scene10Finale } from './components/scenes/Scene10Finale';

// P0 flow scenes: 1 -> 2 -> 3 -> 4 -> 5 -> 10
export type SceneId = 1 | 2 | 3 | 4 | 5 | 10;

interface ChapterInfo {
  chapter: number;
  title: string;
  theme: 'light' | 'cinematic';
}

const CHAPTER_METADATA: Record<SceneId, ChapterInfo> = {
  1: { chapter: 1, title: 'Greeting', theme: 'light' },
  2: { chapter: 2, title: 'Make a Wish', theme: 'cinematic' },
  3: { chapter: 3, title: 'Love Letter', theme: 'light' },
  4: { chapter: 4, title: 'Reasons Why', theme: 'light' },
  5: { chapter: 5, title: 'Memories', theme: 'light' },
  10: { chapter: 6, title: 'Finale', theme: 'cinematic' },
};

export const App: React.FC = () => {
  const [currentScene, setCurrentScene] = useState<SceneId>(1);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Sync hash on initial load
  useEffect(() => {
    const parseHash = (): SceneId => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#scene-2') return 2;
      if (hash === '#scene-3') return 3;
      if (hash === '#scene-4') return 4;
      if (hash === '#scene-5') return 5;
      if (hash === '#scene-10') return 10;
      return 1;
    };

    const initial = parseHash();
    setCurrentScene(initial);
    if (initial !== 1) {
      setHasInteracted(true);
    }

    const handleHashChange = () => {
      const target = parseHash();
      setCurrentScene(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update theme and hash when scene changes
  useEffect(() => {
    const meta = CHAPTER_METADATA[currentScene];
    if (meta.theme === 'cinematic') {
      document.documentElement.setAttribute('data-theme', 'cinematic');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
    }

    // Keep hash in sync
    const targetHash = `#scene-${currentScene}`;
    if (window.location.hash !== targetHash) {
      window.history.replaceState(null, '', targetHash);
    }

    // Scroll to top on scene transition
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentScene]);

  const goToScene = (sceneId: SceneId) => {
    setHasInteracted(true);
    setCurrentScene(sceneId);
  };

  const currentMeta = CHAPTER_METADATA[currentScene];

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ease-in-out relative flex flex-col justify-between ${
        currentMeta.theme === 'cinematic'
          ? 'bg-plum-950 text-cream-50'
          : 'bg-cream-50 text-neutral-800'
      }`}
    >
      {/* Top Header / Status Bar */}
      <header className="relative z-40">
        {/* Progress Tracker (Chapter X of 6) */}
        <ProgressBar
          currentChapter={currentMeta.chapter}
          totalChapters={6}
          chapterTitle={currentMeta.title}
        />

        {/* Global Floating Sound / Music Controller */}
        <AudioController
          soundtrackUrl={birthdayContent.audio.soundtrackUrl}
          hasInteracted={hasInteracted}
        />
      </header>

      {/* Main Story Scene Viewport */}
      <main className="flex-1 flex flex-col items-center justify-center pt-20 pb-16 px-4">
        {currentScene === 1 && (
          <Scene1Greeting
            content={birthdayContent.greeting}
            recipient={birthdayContent.recipient}
            onStart={() => goToScene(2)}
          />
        )}

        {currentScene === 2 && (
          <Scene2Cake
            content={birthdayContent.birthdayMoment}
            onNext={() => goToScene(3)}
          />
        )}

        {currentScene === 3 && (
          <Scene3Letter
            content={birthdayContent.loveLetter}
            onNext={() => goToScene(4)}
          />
        )}

        {currentScene === 4 && (
          <Scene4Reasons
            reasons={birthdayContent.reasons}
            onNext={() => goToScene(5)}
          />
        )}

        {currentScene === 5 && (
          <Scene5Gallery
            gallery={birthdayContent.gallery}
            onGoToFinale={() => goToScene(10)}
          />
        )}

        {currentScene === 10 && (
          <Scene10Finale
            content={birthdayContent.finale}
            sender={birthdayContent.sender}
            onReplay={() => goToScene(1)}
          />
        )}
      </main>

      {/* Subtle Footer with Dedication */}
      <footer className="py-6 text-center text-xs opacity-60 font-body select-none">
        <p>Made with all my love for {birthdayContent.recipient.name} 💕</p>
      </footer>
    </div>
  );
};

export default App;
