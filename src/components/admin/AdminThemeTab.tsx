import React from 'react';
import { ThemeConfig } from '../../types/content.types';
import { THEME_PRESETS, AVAILABLE_FONTS, applyThemeConfig } from '../../utils/themeApplier';
import { Sparkles, Palette } from 'lucide-react';

interface AdminThemeTabProps {
  theme: ThemeConfig;
  onChange: (newTheme: ThemeConfig) => void;
}

export const AdminThemeTab: React.FC<AdminThemeTabProps> = ({
  theme,
  onChange,
}) => {
  const handlePresetSelect = (presetConfig: ThemeConfig) => {
    onChange({ ...presetConfig });
    applyThemeConfig(presetConfig);
  };

  const updateField = <K extends keyof ThemeConfig>(field: K, value: ThemeConfig[K]) => {
    const next = { ...theme, [field]: value };
    onChange(next);
    applyThemeConfig(next);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h3 className="text-xl font-heading text-neutral-800 flex items-center gap-2">
          <Palette className="w-5 h-5 text-rose-CTA" />
          Color Palette & Font Styling
        </h3>
        <p className="text-sm text-neutral-600 mt-1">
          Select a romantic designer preset or customize colors and typography. Changes preview immediately.
        </p>
      </div>

      {/* Preset Cards */}
      <div>
        <label className="block text-sm font-bold text-neutral-800 mb-3">
          Curated Romantic Presets
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {THEME_PRESETS.map((p) => {
            const isSelected =
              theme.primaryColor.toLowerCase() === p.config.primaryColor.toLowerCase() &&
              theme.secondaryColor.toLowerCase() === p.config.secondaryColor.toLowerCase();

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetSelect(p.config)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-rose-CTA bg-rose-50/60 shadow-md scale-102 ring-2 ring-rose-CTA/20'
                    : 'border-stone-200 bg-white hover:border-rose-300 hover:bg-stone-50'
                }`}
              >
                <span className="text-2xl">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-neutral-800 truncate">
                    {p.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: p.config.primaryColor }}
                      title="Primary CTA"
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: p.config.secondaryColor }}
                      title="Secondary CTA"
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: p.config.surfaceBase }}
                      title="Surface Base"
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: p.config.cinematicBase }}
                      title="Cinematic Darkness"
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Pickers */}
      <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
        <h4 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Custom Color Tokens
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Primary CTA */}
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-neutral-800 block">
                Primary Button / Accent
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">
                {theme.primaryColor}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => updateField('primaryColor', e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent p-0"
              />
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-neutral-800 block">
                Secondary Button / Badge
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">
                {theme.secondaryColor}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.secondaryColor}
                onChange={(e) => updateField('secondaryColor', e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent p-0"
              />
            </div>
          </div>

          {/* Light Surface Base */}
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-neutral-800 block">
                Parchment Surface Tint
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">
                {theme.surfaceBase}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.surfaceBase}
                onChange={(e) => updateField('surfaceBase', e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent p-0"
              />
            </div>
          </div>

          {/* Cinematic Base */}
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-neutral-800 block">
                Cinematic Midnight Plum
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">
                {theme.cinematicBase}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.cinematicBase}
                onChange={(e) => updateField('cinematicBase', e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent p-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Font Family Selection */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-neutral-800">Typography Pairings</h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Heading Font */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Title / Heading Font
            </label>
            <select
              value={theme.headingFont}
              onChange={(e) => updateField('headingFont', e.target.value)}
              className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-CTA"
            >
              {AVAILABLE_FONTS.headings.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          {/* Body Font */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Body & Story Text Font
            </label>
            <select
              value={theme.bodyFont}
              onChange={(e) => updateField('bodyFont', e.target.value)}
              className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-CTA"
            >
              {AVAILABLE_FONTS.bodies.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          {/* Handwriting Font */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Handwriting & Signature Font
            </label>
            <select
              value={theme.handwritingFont}
              onChange={(e) => updateField('handwritingFont', e.target.value)}
              className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-CTA"
            >
              {AVAILABLE_FONTS.handwritings.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Live Preview Box */}
      <div
        className="p-6 rounded-2xl border-2 shadow-sm transition-all text-center space-y-3"
        style={{
          backgroundColor: theme.surfaceBase,
          borderColor: theme.secondaryColor + '40',
        }}
      >
        <span
          className="text-xs uppercase tracking-wider font-bold px-3 py-1 rounded-full text-white inline-block"
          style={{ backgroundColor: theme.secondaryColor }}
        >
          Live Typography & Color Preview
        </span>
        <h2
          className="text-3xl font-bold"
          style={{
            fontFamily: `'${theme.headingFont}', cursive, serif`,
            color: theme.primaryColor,
          }}
        >
          Happy Birthday, My Love!
        </h2>
        <p
          className="text-base text-neutral-700 max-w-md mx-auto"
          style={{ fontFamily: `'${theme.bodyFont}', sans-serif` }}
        >
          Every single sunrise with you is a celebration. This preview reflects your exact selected styling.
        </p>
        <p
          className="text-2xl font-bold"
          style={{
            fontFamily: `'${theme.handwritingFont}', cursive`,
            color: theme.primaryColor,
          }}
        >
          Forever & always yours 💕
        </p>
        <button
          type="button"
          className="px-6 py-2.5 rounded-full text-white font-bold shadow-md hover:opacity-90 transition-opacity"
          style={{ backgroundColor: theme.primaryColor }}
        >
          Sample Button ✨
        </button>
      </div>
    </div>
  );
};
