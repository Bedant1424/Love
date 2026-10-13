import React, { useState } from 'react';
import { GalleryItem, FinaleContent } from '../../types/content.types';
import { compressImage } from '../../utils/imageCompressor';
import { PapercraftFallback } from '../common/PapercraftFallback';
import {
  Image as ImageIcon,
  UploadCloud,
  Plus,
  Trash2,
  Sparkles,
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
        // Update existing item
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
          Drag & Drop Photo Manager
        </h3>
        <p className="text-sm text-neutral-600 mt-1">
          Upload and organize personal photos for your memories gallery and finale hero frame. Photos are automatically optimized and saved to your browser.
        </p>
      </div>

      {/* Main Drag & Drop Hub */}
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
              Drag & Drop any photo here to upload
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
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveSlot('new')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
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
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
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
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  activeSlot === g.id
                    ? 'bg-rose-CTA text-white shadow-xs'
                    : 'bg-stone-100 text-neutral-700 hover:bg-stone-200'
                }`}
              >
                Card #{g.id}
              </button>
            ))}
          </div>

          <label className="mt-2 px-4 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-neutral-800 text-xs font-bold cursor-pointer transition-colors">
            {compressing ? 'Processing Image...' : 'Or Select File from Device'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileInput(e, activeSlot)}
            />
          </label>
        </div>
      </div>

      {/* Section 1: Finale Hero Photo */}
      <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Chapter 6: Grand Finale Hero Image
          </h4>
          {finale.heroImageUrl && (
            <button
              type="button"
              onClick={() => onFinaleChange({ ...finale, heroImageUrl: '' })}
              className="text-xs text-rose-CTA hover:underline font-bold flex items-center gap-1"
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
                src={finale.heroImageUrl}
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
            <label className="inline-block px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-CTA text-xs font-bold cursor-pointer transition-colors">
              Upload New Hero Photo
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

      {/* Section 2: Chapter 5 Polaroid Gallery Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-neutral-800">
            Chapter 5: Polaroid Scrapbook Cards ({gallery.length} Photos)
          </h4>
          <button
            type="button"
            onClick={addEmptyGalleryCard}
            className="px-3.5 py-1.5 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Polaroid Card</span>
          </button>
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
                  className="text-stone-400 hover:text-red-500 transition-colors p-1"
                  title="Delete card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Photo Thumbnail & Upload Trigger */}
              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-stone-100 border border-stone-200 group flex items-center justify-center">
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={card.fallbackTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PapercraftFallback title={card.fallbackTitle} theme="rose" className="min-h-0 h-full p-2" />
                )}

                {/* Hover Replace Overlay */}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
                  <UploadCloud className="w-6 h-6 mb-1" />
                  <span className="text-xs font-bold">Replace Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileInput(e, card.id)}
                  />
                </label>
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
                    Caption
                  </label>
                  <textarea
                    rows={2}
                    value={card.caption}
                    onChange={(e) =>
                      updateGalleryItem(card.id, { caption: e.target.value })
                    }
                    className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-700"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-neutral-600 mb-0.5">
                      Tag / Date
                    </label>
                    <input
                      type="text"
                      value={card.date || ''}
                      onChange={(e) =>
                        updateGalleryItem(card.id, { date: e.target.value })
                      }
                      placeholder="e.g. Special Day"
                      className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
                    />
                  </div>

                  <div className="w-24">
                    <label className="block text-[11px] font-bold text-neutral-600 mb-0.5">
                      Tilt Angle
                    </label>
                    <select
                      value={card.rotation}
                      onChange={(e) =>
                        updateGalleryItem(card.id, { rotation: e.target.value })
                      }
                      className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
                    >
                      <option value="-rotate-3">-3°</option>
                      <option value="-rotate-2">-2°</option>
                      <option value="-rotate-1">-1°</option>
                      <option value="rotate-1">+1°</option>
                      <option value="rotate-2">+2°</option>
                      <option value="rotate-3">+3°</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
