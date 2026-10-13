import React, { useState } from 'react';
import { BirthdayContent, ThemeConfig, CustomPageItem } from '../../types/content.types';
import { saveStoredContent } from '../../utils/storage';
import { applyThemeConfig } from '../../utils/themeApplier';
import { AdminThemeTab } from './AdminThemeTab';
import { AdminAudioTab } from './AdminAudioTab';
import { AdminImageManager } from './AdminImageManager';
import { AdminTextTab } from './AdminTextTab';
import { AdminPagesTab } from './AdminPagesTab';
import { AdminSyncTab } from './AdminSyncTab';
import {
  Palette,
  Music,
  Image as ImageIcon,
  FileText,
  Layers,
  Save,
  Eye,
  CheckCircle2,
  UploadCloud,
} from 'lucide-react';

interface AdminPortalProps {
  initialContent: BirthdayContent;
  onExit: () => void;
  onContentUpdated: (updated: BirthdayContent) => void;
}

export type AdminTab = 'theme' | 'audio' | 'images' | 'text' | 'pages' | 'sync';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  initialContent,
  onExit,
  onContentUpdated,
}) => {
  const [content, setContent] = useState<BirthdayContent>(initialContent);
  const [activeTab, setActiveTab] = useState<AdminTab>('theme');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = async () => {
    try {
      saveStoredContent(content);
      onContentUpdated(content);

      // Also try saving directly to project files via local Vite dev server
      try {
        const res = await fetch('/api/save-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(content),
        });
        if (res.ok) {
          showToast('✨ Changes saved directly to project files (content.json & content.ts)!');
          return;
        }
      } catch {
        // Not running in local dev server
      }

      showToast('✨ Changes saved & applied! Head to Publish tab to push live 🚀');
    } catch {
      showToast('❌ Failed to save. Check storage quota.');
    }
  };

  const handleThemeChange = (newTheme: ThemeConfig) => {
    const updated = { ...content, theme: newTheme };
    setContent(updated);
    saveStoredContent(updated);
    onContentUpdated(updated);
  };

  const handleAudioChange = (newAudio: BirthdayContent['audio']) => {
    const updated = { ...content, audio: newAudio };
    setContent(updated);
    saveStoredContent(updated);
    onContentUpdated(updated);
  };

  const handleGalleryChange = (newGallery: BirthdayContent['gallery']) => {
    const updated = { ...content, gallery: newGallery };
    setContent(updated);
    saveStoredContent(updated);
    onContentUpdated(updated);
  };

  const handleFinaleChange = (newFinale: BirthdayContent['finale']) => {
    const updated = { ...content, finale: newFinale };
    setContent(updated);
    saveStoredContent(updated);
    onContentUpdated(updated);
  };

  const handleTextChange = (updatedContent: BirthdayContent) => {
    setContent(updatedContent);
    saveStoredContent(updatedContent);
    onContentUpdated(updatedContent);
  };

  const handlePagesChange = (newPages: CustomPageItem[]) => {
    const updated = { ...content, customPages: newPages };
    setContent(updated);
    saveStoredContent(updated);
    onContentUpdated(updated);
  };

  const handleResetToDefaults = () => {
    window.location.reload();
  };

  const handleImportContent = (imported: BirthdayContent) => {
    setContent(imported);
    saveStoredContent(imported);
    onContentUpdated(imported);
    if (imported.theme) applyThemeConfig(imported.theme);
    showToast('Imported configuration applied!');
  };

  const currentTheme = content.theme || {
    primaryColor: '#C2315D',
    secondaryColor: '#7A4AC2',
    surfaceBase: '#FAF7F2',
    cinematicBase: '#160B1F',
    headingFont: 'Pacifico',
    bodyFont: 'Quicksand',
    handwritingFont: 'Caveat',
  };

  return (
    <div className="min-h-screen bg-stone-100 text-neutral-800 flex flex-col font-body selection:bg-rose-100 selection:text-rose-CTA">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-sm font-bold border border-white/10 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Sticky Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-lavender-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            🌸
          </div>
          <div>
            <h1 className="font-heading text-lg sm:text-xl text-neutral-900 leading-tight">
              Birthday Story Studio
            </h1>
            <p className="text-[11px] text-neutral-500 font-medium hidden sm:block">
              Editing experience for {content.recipient.name} 💕
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onExit}
            className="px-4 py-2 rounded-full border border-stone-300 hover:bg-stone-50 text-neutral-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-4 h-4 text-rose-CTA" />
            <span>Preview Story</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-full border border-stone-300 hover:bg-stone-50 text-neutral-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-4 h-4 text-stone-600" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-rose-CTA to-purple-600 hover:from-rose-CTA-hover hover:to-purple-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md hover:scale-102 active:scale-98 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Publish Live 🚀</span>
          </button>
        </div>
      </header>

      {/* Main Admin Container */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 flex-1 flex flex-col md:flex-row gap-8">
        {/* Left Side Navigation Tabs */}
        <aside className="w-full md:w-60 flex-shrink-0">
          <div className="sticky top-20 bg-white rounded-2xl border border-stone-200 p-2 shadow-xs space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('theme')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                activeTab === 'theme'
                  ? 'bg-rose-50 text-rose-CTA shadow-xs'
                  : 'text-neutral-600 hover:bg-stone-50 hover:text-neutral-900'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Colors & Fonts</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audio')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                activeTab === 'audio'
                  ? 'bg-rose-50 text-rose-CTA shadow-xs'
                  : 'text-neutral-600 hover:bg-stone-50 hover:text-neutral-900'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Music & Audio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('images')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                activeTab === 'images'
                  ? 'bg-rose-50 text-rose-CTA shadow-xs'
                  : 'text-neutral-600 hover:bg-stone-50 hover:text-neutral-900'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Photos (Drag & Drop)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                activeTab === 'text'
                  ? 'bg-rose-50 text-rose-CTA shadow-xs'
                  : 'text-neutral-600 hover:bg-stone-50 hover:text-neutral-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Story Text</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pages')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                activeTab === 'pages'
                  ? 'bg-rose-50 text-rose-CTA shadow-xs'
                  : 'text-neutral-600 hover:bg-stone-50 hover:text-neutral-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Custom Pages ({content.customPages?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sync')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                activeTab === 'sync'
                  ? 'bg-rose-50 text-rose-CTA shadow-xs'
                  : 'text-neutral-600 hover:bg-stone-50 hover:text-neutral-900'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-rose-CTA" />
              <span>Publish to Live Site 🚀</span>
            </button>
          </div>
        </aside>

        {/* Right Tab Content Viewport */}
        <main className="flex-1 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
          {activeTab === 'theme' && (
            <AdminThemeTab
              theme={currentTheme}
              onChange={handleThemeChange}
            />
          )}

          {activeTab === 'audio' && (
            <AdminAudioTab
              audio={content.audio}
              onChange={handleAudioChange}
            />
          )}

          {activeTab === 'images' && (
            <AdminImageManager
              gallery={content.gallery}
              finale={content.finale}
              onGalleryChange={handleGalleryChange}
              onFinaleChange={handleFinaleChange}
            />
          )}

          {activeTab === 'text' && (
            <AdminTextTab
              content={content}
              onChange={handleTextChange}
            />
          )}

          {activeTab === 'pages' && (
            <AdminPagesTab
              customPages={content.customPages || []}
              onChange={handlePagesChange}
            />
          )}

          {activeTab === 'sync' && (
            <AdminSyncTab
              content={content}
              onResetToDefaults={handleResetToDefaults}
              onImportContent={handleImportContent}
            />
          )}
        </main>
      </div>
    </div>
  );
};
