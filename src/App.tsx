import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BirthdayContent, CustomPageItem } from './types/content.types';
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

  const customPages = useMemo(
    () => content.customPages || [],
    [content.customPages]
  );
  const totalChapters = 5 + customPages.length + 1; // 1 to 5 + customs + Finale

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

  // Helper to reliably match custom pages regardless of ID prefixing
  const findCustomPage = useCallback(
    (viewId: ViewId): { page: CustomPageItem; index: number } | null => {
      if (typeof viewId !== 'string' || viewId === 'admin') return null;
      const cleanId = viewId.replace(/^scene-/, '').replace(/^custom-/, '');
      for (let i = 0; i < customPages.length; i++) {
        const p = customPages[i];
        if (
          p.id === viewId ||
          p.id === cleanId ||
          p.id === `custom-${cleanId}` ||
          p.id.replace(/^custom-/, '') === cleanId
        ) {
          return { page: p, index: i };
        }
      }
      return null;
    },
    [customPages]
  );

  // Sync hash and path on initial load & hash changes
  useEffect(() => {
    const parseUrl = (): ViewId => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();

      if (hash === '#admin' || path.endsWith('/admin')) return 'admin';
      if (hash === '#scene-1' || hash === '' || hash === '#') return 1;
      if (hash === '#scene-2') return 2;
      if (hash === '#scene-3') return 3;
      if (hash === '#scene-4') return 4;
      if (hash === '#scene-5') return 5;
      if (hash === '#scene-10') return 10;
      if (hash.startsWith('#scene-')) {
        return hash.replace('#scene-', '');
      }
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

    const customMatch = findCustomPage(currentView);
    const isCinematic =
      currentView === 2 ||
      currentView === 10 ||
      customMatch?.page.theme === 'cinematic';

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
        : `#scene-${currentView.replace(/^scene-/, '')}`;
    if (window.location.hash !== targetHash) {
      window.history.replaceState(null, '', targetHash);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, findCustomPage]);

  const goToView = (viewId: ViewId) => {
    setHasInteracted(true);
    setCurrentView(viewId);
  };

  const getCurrentChapterInfo = (): { chapterNumber: number; title: string } => {
    if (currentView === 1) return { chapterNumber: 1, title: 'Greeting' };
    if (currentView === 2) return { chapterNumber: 2, title: 'Make a Wish' };
    if (currentView === 3) return { chapterNumber: 3, title: 'Love Letter' };
    if (currentView === 4) return { chapterNumber: 4, title: 'Reasons Why' };
    if (currentView === 5) return { chapterNumber: 5, title: 'Memories' };

    const customMatch = findCustomPage(currentView);
    if (customMatch) {
      return {
        chapterNumber: 6 + customMatch.index,
        title: customMatch.page.title || `Chapter ${6 + customMatch.index}`,
      };
    }

    return { chapterNumber: totalChapters, title: 'Finale' };
  };

  // Navigation handlers between chapters
  const handleAfterGallery = () => {
    if (customPages.length > 0) {
      goToView(customPages[0].id);
    } else {
      goToView(10);
    }
  };

  const handleAfterCustom = (currentIndex: number) => {
    if (currentIndex < customPages.length - 1) {
      goToView(customPages[currentIndex + 1].id);
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
      className={`w-full h-screen h-[100dvh] overflow-hidden transition-colors duration-700 ease-in-out relative flex flex-col justify-between ${
        isCinematicCurrent
          ? 'bg-plum-950 text-cream-50'
          : 'bg-cream-50 text-neutral-800'
      }`}
    >
      {/* Top Header / Status Bar */}
      <header className="flex-shrink-0 w-full z-40 px-3 sm:px-6 pt-1.5 sm:pt-2.5 pb-1 flex items-center justify-between">
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
      <main className="flex-1 min-h-0 w-full overflow-hidden flex flex-col items-center justify-center p-2 sm:p-4">
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

        {(() => {
          const customMatch = findCustomPage(currentView);
          if (!customMatch) return null;
          return (
            <SceneCustom
              page={customMatch.page}
              chapterNumber={6 + customMatch.index}
              totalChapters={totalChapters}
              onNext={() => handleAfterCustom(customMatch.index)}
            />
          );
        })()}

        {currentView === 10 && (
          <Scene10Finale
            content={content.finale}
            sender={content.sender}
            chapterNumber={totalChapters}
            onReplay={() => goToView(1)}
          />
        )}
      </main>

      {/* Footer with Dedication & Admin Entrance Link */}
      <footer className="flex-shrink-0 w-full py-1 px-3 text-center text-[11px] opacity-80 font-body flex items-center justify-center gap-3">
        <p className="truncate">Made with all my love for {content.recipient.name} 💕</p>
        <button
          type="button"
          onClick={() => goToView('admin')}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-neutral-600 dark:text-cream-50 transition-colors cursor-pointer text-[11px] font-semibold flex-shrink-0"
          aria-label="Open Admin Story Studio"
        >
          <Settings className="w-3 h-3 text-rose-CTA" />
          <span>Admin Studio</span>
        </button>
      </footer>
    </div>
  );
};

export default App;
