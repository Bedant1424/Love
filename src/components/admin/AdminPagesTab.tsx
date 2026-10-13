import React, { useState } from 'react';
import { CustomPageItem } from '../../types/content.types';
import { compressImage } from '../../utils/imageCompressor';
import { resolveMediaUrl } from '../../data/mediaRegistry';
import { MediaAssetPickerModal } from './MediaAssetPickerModal';
import { Layers, Plus, Trash2, UploadCloud, Library } from 'lucide-react';

interface AdminPagesTabProps {
  customPages: CustomPageItem[];
  onChange: (newPages: CustomPageItem[]) => void;
}

export const AdminPagesTab: React.FC<AdminPagesTabProps> = ({
  customPages,
  onChange,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPageId, setPickerPageId] = useState<string | null>(null);

  const handleAddPage = () => {
    const newId = `custom-page-${Date.now()}`;
    const newPage: CustomPageItem = {
      id: newId,
      title: 'Our Special Promise ✨',
      subtitle: 'A sweet chapter just for us',
      badge: 'Special Chapter',
      content:
        'Write your custom thoughts, memories, cute promises, or relationship milestones here.\n\nEvery line can be separated into distinct paragraphs to create a beautiful reading experience.',
      theme: 'light',
      ctaText: 'Continue Our Story ✨',
    };
    onChange([...customPages, newPage]);
    setEditingId(newId);
  };

  const updatePage = (id: string, updates: Partial<CustomPageItem>) => {
    onChange(
      customPages.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const removePage = (id: string) => {
    onChange(customPages.filter((p) => p.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleImageUpload = async (id: string, file: File) => {
    try {
      const dataUrl = await compressImage(file, 1000, 1000, 0.8);
      updatePage(id, { imageUrl: dataUrl });
    } catch {
      alert('Could not process image file.');
    }
  };

  const openLibraryPicker = (pageId: string) => {
    setPickerPageId(pageId);
    setPickerOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-heading text-neutral-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-rose-CTA" />
            Custom Story Chapters ({customPages.length})
          </h3>
          <p className="text-sm text-neutral-600 mt-1">
            Create new custom story pages (e.g., love promises, future bucket lists, private jokes) that slot naturally between Memories and the Finale!
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddPage}
          className="px-4 py-2 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Page</span>
        </button>
      </div>

      {/* Pages List */}
      {customPages.length === 0 ? (
        <div className="p-12 text-center bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
          <Layers className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-neutral-700">No custom chapters yet</p>
          <p className="text-xs text-neutral-500 mt-1 mb-4">
            Add custom chapters with your own personal messages, promises, and photos.
          </p>
          <button
            type="button"
            onClick={handleAddPage}
            className="px-4 py-2 rounded-full bg-rose-CTA text-white text-xs font-bold cursor-pointer"
          >
            Create Your First Custom Page
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {customPages.map((page, idx) => {
            const isEditing = editingId === page.id;

            return (
              <div
                key={page.id}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs transition-all"
              >
                {/* Collapsed Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50"
                  onClick={() => setEditingId(isEditing ? null : page.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-CTA font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-800">
                        {page.title || 'Untitled Page'}
                      </h4>
                      <p className="text-xs text-neutral-500">
                        {page.badge || 'Chapter'} • {page.theme === 'cinematic' ? 'Midnight Theme' : 'Parchment Theme'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setEditingId(isEditing ? null : page.id)}
                      className="text-xs font-bold text-rose-CTA hover:underline px-2 py-1 cursor-pointer"
                    >
                      {isEditing ? 'Collapse' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removePage(page.id)}
                      className="text-stone-400 hover:text-red-500 p-1 cursor-pointer"
                      title="Delete page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Edit Form */}
                {isEditing && (
                  <div className="p-5 border-t border-stone-200 bg-stone-50 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Chapter Title
                        </label>
                        <input
                          type="text"
                          value={page.title}
                          onChange={(e) => updatePage(page.id, { title: e.target.value })}
                          className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs font-bold text-neutral-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Subtitle / Caption
                        </label>
                        <input
                          type="text"
                          value={page.subtitle || ''}
                          onChange={(e) => updatePage(page.id, { subtitle: e.target.value })}
                          className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs text-neutral-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Small Top Badge
                        </label>
                        <input
                          type="text"
                          value={page.badge || ''}
                          onChange={(e) => updatePage(page.id, { badge: e.target.value })}
                          placeholder="e.g. Special Chapter"
                          className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs text-neutral-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Theme Atmosphere
                        </label>
                        <select
                          value={page.theme || 'light'}
                          onChange={(e) =>
                            updatePage(page.id, {
                              theme: e.target.value as 'light' | 'cinematic',
                            })
                          }
                          className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs font-bold text-neutral-800"
                        >
                          <option value="light">Warm Parchment (Light)</option>
                          <option value="cinematic">Midnight Plum (Cinematic Dark)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Page Content (Paragraphs)
                      </label>
                      <textarea
                        rows={4}
                        value={page.content}
                        onChange={(e) => updatePage(page.id, { content: e.target.value })}
                        placeholder="Write paragraphs separated by new lines..."
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs text-neutral-800 leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Continue Button Text
                        </label>
                        <input
                          type="text"
                          value={page.ctaText || ''}
                          onChange={(e) => updatePage(page.id, { ctaText: e.target.value })}
                          placeholder="Continue Our Story ✨"
                          className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs text-neutral-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Illustration / Image
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openLibraryPicker(page.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-CTA text-white text-xs font-bold cursor-pointer hover:bg-rose-CTA-hover transition-colors flex items-center gap-1.5"
                          >
                            <Library className="w-3.5 h-3.5" />
                            <span>From Library</span>
                          </button>
                          <label className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-neutral-800 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload File</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleImageUpload(page.id, e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                          {page.imageUrl && (
                            <button
                              type="button"
                              onClick={() => updatePage(page.id, { imageUrl: '' })}
                              className="text-stone-400 hover:text-red-500 p-1 cursor-pointer"
                              title="Remove image"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {page.imageUrl && (
                      <div className="mt-2 flex items-center gap-3 p-2 bg-white rounded-lg border border-stone-200">
                        <div className="w-12 h-12 rounded overflow-hidden bg-stone-100 flex-shrink-0">
                          <img
                            src={resolveMediaUrl(page.imageUrl)}
                            alt="Page preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs text-neutral-600 truncate flex-1">
                          Image attached: {page.imageUrl.slice(0, 40)}...
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Visual Library Picker */}
      <MediaAssetPickerModal
        isOpen={pickerOpen}
        title="Select Image for Custom Chapter"
        onSelect={(url) => {
          if (pickerPageId) {
            updatePage(pickerPageId, { imageUrl: url });
          }
        }}
        onClose={() => {
          setPickerOpen(false);
          setPickerPageId(null);
        }}
      />
    </div>
  );
};
