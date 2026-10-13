import React, { useState, useEffect } from 'react';
import { BirthdayContent } from './types/content.types';
import { getStoredContent } from './utils/storage';
import { applyThemeConfig } from './utils/themeApplier';
import { fetchLiveContent } from './utils/githubPublisher';
import { AudioController } from './components/common/AudioController';
import { ProgressBar } from './components/common/ProgressBar';
import { Scene1Greeting } from './components/scenes/Scene1Greeting';
import { Scene2Cake } from './components/scenes/Scene2Cake';
import { Scene3Letter } from './components/scenes/Scene3Letter';
import { Scene4Reasons } from './components/scenes/Scene4Reasons';
import { Scene5Gallery } from './components/scenes/Scene5Gallery';
import { SceneCustom } from './components/scenes/SceneCustom';
import { Scene10Finale } from './components/scenes/Scene10Finale';
import { AdminPortal } from './components/admin/AdminPortal';
import { Settings } from 'lucide-react';

export type ViewId = 1 | 2 | 3 | 4 | 5 | 10 | 'admin' | string;

export const App: React.FC = () => {
  const [content, setContent] = useState<BirthdayContent>(() => getStoredContent());
  const [currentView, setCurrentView] = useState<ViewId>(1);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Fetch live content directly from GitHub Pages CDN on launch
  // Ensures any visitor (e.g. Arya on her phone) loads the live published content directly!
  useEffect(() => {
    let isMounted = true;
    fetchLiveContent()
      .then((live) => {
        if (isMounted && live) {
          setContent(live);
          if (live.theme) {
            applyThemeConfig(live.theme);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load live content:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize theme and storage listener
  useEffect(() => {
    if (content.theme) {
      applyThemeConfig(content.theme);
    }

    const handleContentUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<BirthdayContent>;
      if (customEvent.detail) {
        setContent(customEvent.detail);
        if (customEvent.detail.theme) {
          applyThemeConfig(customEvent.detail.theme);
        }
      }
    };

    window.addEventListener('birthday_content_updated', handleContentUpdated);
    return () => window.removeEventListener('birthday_content_updated', handleContentUpdated);
  }, [content.theme]);

  // Sync hash and path on initial load & hash changes
  useEffect(() => {
    const parseUrl = (): ViewId => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();

      if (hash === '#admin' || path.endsWith('/admin')) return 'admin';
      if (hash === '#scene-2') return 2;
      if (hash === '#scene-3') return 3;
      if (hash === '#scene-4') return 4;
      if (hash === '#scene-5') return 5;
      if (hash.startsWith('#scene-custom-')) {
        return hash.replace('#scene-', '');
      }
      if (hash === '#scene-10') return 10;
      return 1;
    };

    const initial = parseUrl();
    setCurrentView(initial);
    if (initial !== 1) {
      setHasInteracted(true);
    }

    const handleHashChange = () => {
      const target = parseUrl();
      setCurrentView(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync document theme & URL hash when currentView changes
  useEffect(() => {
    if (currentView === 'admin') {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
      if (window.location.hash !== '#admin') {
        window.history.replaceState(null, '', '#admin');
      }
      return;
    }

    // Determine if cinematic theme applies
    const isCinematic =
      currentView === 2 ||
      currentView === 10 ||
      (typeof currentView === 'string' &&
        currentView.startsWith('custom-') &&
        content.customPages?.find((p) => p.id === currentView.replace('custom-', ''))?.theme === 'cinematic');

    if (isCinematic) {
      document.documentElement.setAttribute('data-theme', 'cinematic');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
    }

    // Update URL hash
    const targetHash =
      typeof currentView === 'number'
        ? `#scene-${currentView}`
        : `#scene-${currentView}`;
    if (window.location.hash !== targetHash) {
      window.history.replaceState(null, '', targetHash);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, content.customPages]);

  const goToView = (viewId: ViewId) => {
    setHasInteracted(true);
    setCurrentView(viewId);
  };

  // Chapter Calculations
  const customPages = content.customPages || [];
  const totalChapters = 5 + customPages.length + 1; // 1 to 5 + customs + Finale

  const getCurrentChapterInfo = (): { chapterNumber: number; title: string } => {
    if (currentView === 1) return { chapterNumber: 1, title: 'Greeting' };
    if (currentView === 2) return { chapterNumber: 2, title: 'Make a Wish' };
    if (currentView === 3) return { chapterNumber: 3, title: 'Love Letter' };
    if (currentView === 4) return { chapterNumber: 4, title: 'Reasons Why' };
    if (currentView === 5) return { chapterNumber: 5, title: 'Memories' };

    if (typeof currentView === 'string' && currentView.startsWith('custom-')) {
      const customId = currentView.replace('custom-', '');
      const idx = customPages.findIndex((p) => p.id === customId);
      if (idx !== -1) {
        return {
          chapterNumber: 6 + idx,
          title: customPages[idx].title || `Chapter ${6 + idx}`,
        };
      }
    }

    return { chapterNumber: totalChapters, title: 'Finale' };
  };

  // Navigation handlers between chapters
  const handleAfterGallery = () => {
    if (customPages.length > 0) {
      goToView(`custom-${customPages[0].id}`);
    } else {
      goToView(10);
    }
  };

  const handleAfterCustom = (currentIndex: number) => {
    if (currentIndex < customPages.length - 1) {
      goToView(`custom-${customPages[currentIndex + 1].id}`);
    } else {
      goToView(10);
    }
  };

  // If in Admin Portal Mode
  if (currentView === 'admin') {
    return (
      <AdminPortal
        initialContent={content}
        onExit={() => goToView(1)}
        onContentUpdated={(updated) => setContent(updated)}
      />
    );
  }

  const { chapterNumber, title: chapterTitle } = getCurrentChapterInfo();
  const isCinematicCurrent =
    currentView === 2 ||
    currentView === 10 ||
    (typeof currentView === 'string' &&
      currentView.startsWith('custom-') &&
      customPages.find((p) => p.id === currentView.replace('custom-', ''))?.theme === 'cinematic');

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ease-in-out relative flex flex-col justify-between ${
        isCinematicCurrent
          ? 'bg-plum-950 text-cream-50'
          : 'bg-cream-50 text-neutral-800'
      }`}
    >
      {/* Top Header / Status Bar */}
      <header className="relative z-40">
        <ProgressBar
          currentChapter={chapterNumber}
          totalChapters={totalChapters}
          chapterTitle={chapterTitle}
        />

        <AudioController
          soundtrackUrl={content.audio.soundtrackUrl}
          hasInteracted={hasInteracted}
        />
      </header>

      {/* Main Story Scene Viewport */}
      <main className="flex-1 flex flex-col items-center justify-center pt-20 pb-16 px-4">
        {currentView === 1 && (
          <Scene1Greeting
            content={content.greeting}
            recipient={content.recipient}
            onStart={() => goToView(2)}
          />
        )}

        {currentView === 2 && (
          <Scene2Cake
            content={content.birthdayMoment}
            onNext={() => goToView(3)}
          />
        )}

        {currentView === 3 && (
          <Scene3Letter
            content={content.loveLetter}
            onNext={() => goToView(4)}
          />
        )}

        {currentView === 4 && (
          <Scene4Reasons
            reasons={content.reasons}
            onNext={() => goToView(5)}
          />
        )}

        {currentView === 5 && (
          <Scene5Gallery
            gallery={content.gallery}
            onGoToFinale={handleAfterGallery}
          />
        )}

        {typeof currentView === 'string' &&
          currentView.startsWith('custom-') &&
          (() => {
            const customId = currentView.replace('custom-', '');
            const idx = customPages.findIndex((p) => p.id === customId);
            if (idx === -1) return null;
            const page = customPages[idx];
            return (
              <SceneCustom
                page={page}
                chapterNumber={6 + idx}
                totalChapters={totalChapters}
                onNext={() => handleAfterCustom(idx)}
              />
            );
          })()}

        {currentView === 10 && (
          <Scene10Finale
            content={content.finale}
            sender={content.sender}
            onReplay={() => goToView(1)}
          />
        )}
      </main>

      {/* Footer with Dedication & Admin Entrance Link */}
      <footer className="py-6 px-4 text-center text-xs opacity-75 font-body flex flex-col items-center gap-2">
        <p>Made with all my love for {content.recipient.name} 💕</p>
        <button
          type="button"
          onClick={() => goToView('admin')}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-neutral-600 dark:text-cream-50 transition-colors cursor-pointer text-[11px] font-semibold"
          aria-label="Open Admin Story Studio"
        >
          <Settings className="w-3.5 h-3.5 text-rose-CTA" />
          <span>Customize Website (Admin Studio)</span>
        </button>
      </footer>
    </div>
  );
};

export default App;
