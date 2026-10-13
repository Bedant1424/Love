import React, { useState } from 'react';
import { CURATED_MEDIA, ALL_MEDIA_FILES, resolveMediaUrl } from '../../data/mediaRegistry';
import { X, Search, Image as ImageIcon, Check, Video, UploadCloud } from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';

interface MediaAssetPickerModalProps {
  isOpen: boolean;
  currentValue?: string;
  title?: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

export const MediaAssetPickerModal: React.FC<MediaAssetPickerModalProps> = ({
  isOpen,
  currentValue,
  title = 'Select Media Photo or Video',
  onSelect,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Curated 🌟' },
    { id: 'hero', label: 'Pretty Girl 🌸' },
    { id: 'couple', label: 'Couple & Love 💕' },
    { id: 'cute', label: 'Cute & Dimples ✨' },
    { id: 'chaos', label: 'Little Menace 😈' },
    { id: 'sleepy', label: 'Sleepy / Cozy 🌙' },
    { id: 'date', label: 'Food & Dates 🍝' },
    { id: 'baby', label: 'Nostalgia 👶' },
    { id: 'video', label: 'Videos 🎥' },
    { id: 'raw', label: 'All 65 Raw Photos 📷' },
  ];

  let displayItems: { id: string; name: string; url: string; title: string; subtitle?: string; isVideo?: boolean }[] = [];

  if (selectedCategory === 'raw') {
    displayItems = ALL_MEDIA_FILES.map((f) => ({
      id: f.id,
      name: f.name,
      url: f.url,
      title: f.name,
      isVideo: f.isVideo,
    }));
  } else {
    displayItems = CURATED_MEDIA.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      return true;
    }).map((item) => ({
      id: item.id,
      name: item.name,
      url: item.url,
      title: item.title,
      subtitle: item.subtitle,
      isVideo: item.category === 'video',
    }));
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayItems = displayItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsUploading(true);
    try {
      const dataUrl = await compressImage(file, 1200, 1200, 0.85);
      onSelect(dataUrl);
      onClose();
    } catch {
      alert('Failed to process image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-950/75 backdrop-blur-xs select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90dvh] bg-[#FDFAFF] text-[#2D2635] rounded-2xl shadow-2xl border-2 border-[#DFD2F5] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-lavender-200 bg-white/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-CTA">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading text-base sm:text-lg font-bold text-[#2D2635]">
                {title}
              </h3>
              <p className="text-[11px] text-[#5C4D6B]">
                Choose from Arya & Bedant's curated media library or upload a new photo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-CTA flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter bar & search */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-2.5 bg-cream-50/70 border-b border-lavender-100 space-y-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-rose-CTA text-white shadow-xs font-semibold'
                    : 'bg-white text-[#5C4D6B] border border-lavender-200 hover:bg-rose-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search bar & upload */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search photo titles or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-lavender-200 rounded-xl text-xs text-[#2D2635] focus:outline-none focus:ring-2 focus:ring-rose-CTA/40"
              />
            </div>

            <label className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-lavender-200 text-xs font-semibold text-[#5C4D6B] hover:text-rose-CTA hover:border-rose-200 transition-colors cursor-pointer">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Uploading...' : 'Upload Device Photo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Grid of Thumbnails (Scrollable) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 touch-pan-y">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {displayItems.map((item) => {
              const isSelected = currentValue === item.url;
              const resolved = resolveMediaUrl(item.url);

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onSelect(item.url);
                    onClose();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(item.url);
                      onClose();
                    }
                  }}
                  className={`group relative bg-white rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-rose-CTA ring-3 ring-rose-200 shadow-md scale-102'
                      : 'border-lavender-200/80 hover:border-rose-300 hover:shadow-card'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-full aspect-square bg-cream-100 overflow-hidden">
                    {item.isVideo ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-plum-900 text-white p-2 text-center">
                        <Video className="w-8 h-8 text-rose-300 mb-1" />
                        <span className="text-[10px] font-bold">Video Clip</span>
                      </div>
                    ) : (
                      <img
                        src={resolved}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    )}

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-CTA text-white flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Placard */}
                  <div className="p-2 text-left">
                    <p className="font-heading text-xs font-bold text-[#2D2635] truncate">
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="font-body text-[10px] text-[#5C4D6B] truncate">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {displayItems.length === 0 && (
            <div className="text-center py-12 text-[#5C4D6B]">
              <p className="text-sm font-semibold">No photos match your filter</p>
            </div>
          )}
        </div>

        {/* Footer with direct URL entry */}
        <div className="flex-shrink-0 p-3 sm:px-6 bg-cream-50/90 border-t border-lavender-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <input
              type="text"
              placeholder="Or enter custom image path (e.g. media/hero-purple-saree.jpeg)"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-lavender-200 rounded-xl text-xs text-[#2D2635] focus:outline-none"
            />
            {customUrl && (
              <button
                type="button"
                onClick={() => {
                  onSelect(customUrl);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-CTA text-white font-semibold text-xs hover:bg-rose-CTA-hover transition-colors cursor-pointer"
              >
                Use URL
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-lavender-300 text-[#5C4D6B] text-xs font-semibold hover:bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
