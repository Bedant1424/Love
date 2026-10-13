import React, { useState } from 'react';
import { GalleryItem, FinaleContent } from '../../types/content.types';
import { compressImage } from '../../utils/imageCompressor';
import { PapercraftFallback } from '../common/PapercraftFallback';
import { resolveMediaUrl } from '../../data/mediaRegistry';
import { MediaAssetPickerModal } from './MediaAssetPickerModal';
import {
  Image as ImageIcon,
  UploadCloud,
  Plus,
  Trash2,
  Sparkles,
  Library,
} from 'lucide-react';

interface AdminImageManagerProps {
  gallery: GalleryItem[];
  finale: FinaleContent;
  onGalleryChange: (newGallery: GalleryItem[]) => void;
  onFinaleChange: (newFinale: FinaleContent) => void;
}

export const AdminImageManager: React.FC<AdminImageManagerProps> = ({
  gallery,
  finale,
  onGalleryChange,
  onFinaleChange,
}) => {
  const [activeSlot, setActiveSlot] = useState<'hero' | number | 'new'>('new');
  const [isDragging, setIsDragging] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'hero' | number | 'new'>('new');

  const openPickerFor = (target: 'hero' | number | 'new') => {
    setPickerTarget(target);
    setPickerOpen(true);
  };

  const handlePickerSelect = (url: string) => {
    if (pickerTarget === 'hero') {
      onFinaleChange({
        ...finale,
        heroImageUrl: url,
      });
    } else if (pickerTarget === 'new') {
      const nextId = gallery.length > 0 ? Math.max(...gallery.map((g) => g.id)) + 1 : 1;
      const rotations = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-3', 'rotate-1'];
      const rot = rotations[gallery.length % rotations.length];
      const newItem: GalleryItem = {
        id: nextId,
        imageUrl: url,
        fallbackTitle: `Special Memory #${nextId}`,
        caption: 'A wonderful moment we shared together.',
        date: 'Our Story',
        rotation: rot,
      };
      onGalleryChange([...gallery, newItem]);
    } else {
      onGalleryChange(
        gallery.map((item) =>
          item.id === pickerTarget ? { ...item, imageUrl: url } : item
        )
      );
    }
  };

  const handleProcessFile = async (file: File, target: 'hero' | number | 'new') => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP, GIF)');
      return;
    }
    setCompressing(true);
    try {
      const dataUrl = await compressImage(file, 1200, 1200, 0.82);

      if (target === 'hero') {
        onFinaleChange({
          ...finale,
          heroImageUrl: dataUrl,
        });
      } else if (target === 'new') {
        const nextId = gallery.length > 0 ? Math.max(...gallery.map((g) => g.id)) + 1 : 1;
        const rotations = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-3', 'rotate-1'];
        const rot = rotations[gallery.length % rotations.length];
        const newItem: GalleryItem = {
          id: nextId,
          imageUrl: dataUrl,
          fallbackTitle: `Special Memory #${nextId}`,
          caption: 'A wonderful moment we shared together.',
          date: 'Our Story',
          rotation: rot,
        };
        onGalleryChange([...gallery, newItem]);
      } else {
        onGalleryChange(
          gallery.map((item) =>
            item.id === target ? { ...item, imageUrl: dataUrl } : item
          )
        );
      }
    } catch {
      alert('Failed to process image. Please try a different photo.');
    } finally {
      setCompressing(false);
    }
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0], activeSlot);
    }
  };

  const handleFileInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'hero' | number | 'new'
  ) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0], target);
    }
  };

  const updateGalleryItem = (id: number, updates: Partial<GalleryItem>) => {
    onGalleryChange(
      gallery.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteGalleryItem = (id: number) => {
    if (gallery.length <= 1) {
      alert('Keep at least one memory photo card in the gallery.');
      return;
    }
    onGalleryChange(gallery.filter((item) => item.id !== id));
  };

  const addEmptyGalleryCard = () => {
    const nextId = gallery.length > 0 ? Math.max(...gallery.map((g) => g.id)) + 1 : 1;
    const rotations = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-3', 'rotate-1'];
    const rot = rotations[gallery.length % rotations.length];
    const newItem: GalleryItem = {
      id: nextId,
      imageUrl: '',
      fallbackTitle: `New Memory #${nextId}`,
      caption: 'Add your romantic caption here...',
      date: 'Sweet Moments',
      rotation: rot,
    };
    onGalleryChange([...gallery, newItem]);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h3 className="text-xl font-heading text-neutral-800 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-rose-CTA" />
          Photo Gallery & Media Manager
        </h3>
        <p className="text-sm text-neutral-600 mt-1">
          Pick photos from your 65+ personal photo library, or drag and drop new pictures from your device.
        </p>
      </div>

      {/* Main Drag & Drop / Library Hub */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleGlobalDrop}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all bg-white ${
          isDragging
            ? 'border-rose-CTA bg-rose-50/80 scale-101 ring-2 ring-rose-CTA/20'
            : 'border-stone-300 hover:border-stone-400'
        }`}
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-CTA flex items-center justify-center">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <p className="text-base font-bold text-neutral-800">
              Drag & Drop photo here, or browse personal library
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Target Slot:{' '}
              <span className="font-bold text-rose-CTA">
                {activeSlot === 'hero'
                  ? 'Grand Finale Hero Photo'
                  : activeSlot === 'new'
                  ? 'Add as New Polaroid Card'
                  : `Memory #${activeSlot}`}
              </span>
            </p>
          </div>

          {/* Quick Target Selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveSlot('new')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeSlot === 'new'
                  ? 'bg-rose-CTA text-white shadow-xs'
                  : 'bg-stone-100 text-neutral-700 hover:bg-stone-200'
              }`}
            >
              + Add as New Card
            </button>
            <button
              type="button"
              onClick={() => setActiveSlot('hero')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeSlot === 'hero'
                  ? 'bg-rose-CTA text-white shadow-xs'
                  : 'bg-stone-100 text-neutral-700 hover:bg-stone-200'
              }`}
            >
              Finale Hero Photo
            </button>
            {gallery.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveSlot(g.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeSlot === g.id
                    ? 'bg-rose-CTA text-white shadow-xs'
                    : 'bg-stone-100 text-neutral-700 hover:bg-stone-200'
                }`}
              >
                Card #{g.id}
              </button>
            ))}
          </div>

          {/* Actions: Choose from library OR upload file */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => openPickerFor(activeSlot)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <Library className="w-3.5 h-3.5" />
              <span>Choose From Personal Library (65+ Photos)</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-neutral-800 text-xs font-bold cursor-pointer transition-colors">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{compressing ? 'Processing...' : 'Upload From Device'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileInput(e, activeSlot)}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Section 1: Finale Hero Photo */}
      <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Chapter 10: Grand Finale Hero Image
          </h4>
          {finale.heroImageUrl && (
            <button
              type="button"
              onClick={() => onFinaleChange({ ...finale, heroImageUrl: '' })}
              className="text-xs text-rose-CTA hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset to Fallback
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-stone-200">
          <div className="w-24 h-24 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0 flex items-center justify-center">
            {finale.heroImageUrl ? (
              <img
                src={resolveMediaUrl(finale.heroImageUrl)}
                alt="Finale Hero"
                className="w-full h-full object-cover"
              />
            ) : (
              <PapercraftFallback title={finale.fallbackTitle} theme="gold" className="min-h-0 h-full p-2" />
            )}
          </div>

          <div className="flex-1 w-full space-y-2">
            <input
              type="text"
              value={finale.fallbackTitle}
              onChange={(e) => onFinaleChange({ ...finale, fallbackTitle: e.target.value })}
              placeholder="Photo Fallback Title"
              className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold text-neutral-800"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openPickerFor('hero')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-CTA text-white text-xs font-bold hover:bg-rose-CTA-hover transition-colors cursor-pointer"
              >
                <Library className="w-3 h-3" />
                <span>Select from Library</span>
              </button>
              <label className="inline-block px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-neutral-800 text-xs font-bold cursor-pointer transition-colors">
                Upload Custom
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileInput(e, 'hero')}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Chapter 6 Polaroid Gallery Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-neutral-800">
            Chapter 6: Polaroid Scrapbook Cards ({gallery.length} Photos)
          </h4>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openPickerFor('new')}
              className="px-3.5 py-1.5 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Library className="w-4 h-4" />
              <span>Add From Library</span>
            </button>
            <button
              type="button"
              onClick={addEmptyGalleryCard}
              className="px-3 py-1.5 rounded-full border border-stone-300 text-neutral-700 text-xs font-bold flex items-center gap-1 hover:bg-stone-50 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Blank Card</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gallery.map((card) => (
            <div
              key={card.id}
              className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between space-y-3"
            >
              {/* Card Header & Controls */}
              <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                <span className="text-xs font-bold text-neutral-500">
                  Memory #{card.id}
                </span>
                <button
                  type="button"
                  onClick={() => deleteGalleryItem(card.id)}
                  className="text-stone-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                  title="Delete card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Photo Thumbnail & Replace Trigger */}
              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-stone-100 border border-stone-200 group flex items-center justify-center">
                {card.imageUrl ? (
                  <img
                    src={resolveMediaUrl(card.imageUrl)}
                    alt={card.fallbackTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PapercraftFallback title={card.fallbackTitle} theme="rose" className="min-h-0 h-full p-2" />
                )}

                {/* Hover Replace Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 text-white transition-opacity p-2">
                  <button
                    type="button"
                    onClick={() => openPickerFor(card.id)}
                    className="px-3 py-1 rounded-full bg-rose-CTA text-white text-xs font-bold hover:scale-105 transition-transform cursor-pointer"
                  >
                    Select Photo
                  </button>
                  <label className="text-[11px] underline cursor-pointer hover:text-rose-200">
                    Upload New
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileInput(e, card.id)}
                    />
                  </label>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-0.5">
                    Memory Title
                  </label>
                  <input
                    type="text"
                    value={card.fallbackTitle}
                    onChange={(e) =>
                      updateGalleryItem(card.id, { fallbackTitle: e.target.value })
                    }
                    className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs font-bold text-neutral-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-0.5">
                    Sweet Caption
                  </label>
                  <textarea
                    rows={2}
                    value={card.caption}
                    onChange={(e) =>
                      updateGalleryItem(card.id, { caption: e.target.value })
                    }
                    className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-0.5">
                    Date / Tag Label
                  </label>
                  <input
                    type="text"
                    value={card.date || ''}
                    onChange={(e) =>
                      updateGalleryItem(card.id, { date: e.target.value })
                    }
                    placeholder="e.g. Our First Date"
                    className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Media Picker Modal */}
      <MediaAssetPickerModal
        isOpen={pickerOpen}
        onSelect={handlePickerSelect}
        onClose={() => setPickerOpen(false)}
        title={
          pickerTarget === 'hero'
            ? 'Select Finale Hero Photo'
            : pickerTarget === 'new'
            ? 'Add New Photo to Memories Gallery'
            : `Select Photo for Memory #${pickerTarget}`
        }
      />
    </div>
  );
};
