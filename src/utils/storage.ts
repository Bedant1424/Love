import { BirthdayContent } from '../types/content.types';
import { birthdayContent } from '../data/content';
import { applyThemeConfig } from './themeApplier';

export const STORAGE_KEY = 'birthday_custom_content';

/**
 * Retrieve content from localStorage, falling back to default content.ts
 */
export const getStoredContent = (): BirthdayContent => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(birthdayContent));

    const parsed = JSON.parse(raw);
    // Deep merge with default to ensure no missing keys
    const merged: BirthdayContent = {
      ...birthdayContent,
      ...parsed,
      recipient: { ...birthdayContent.recipient, ...(parsed.recipient || {}) },
      sender: { ...birthdayContent.sender, ...(parsed.sender || {}) },
      audio: { ...birthdayContent.audio, ...(parsed.audio || {}) },
      greeting: { ...birthdayContent.greeting, ...(parsed.greeting || {}) },
      birthdayMoment: { ...birthdayContent.birthdayMoment, ...(parsed.birthdayMoment || {}) },
      loveLetter: { ...birthdayContent.loveLetter, ...(parsed.loveLetter || {}) },
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : birthdayContent.reasons,
      gallery: Array.isArray(parsed.gallery) ? parsed.gallery : birthdayContent.gallery,
      customPages: Array.isArray(parsed.customPages) ? parsed.customPages : [],
      finale: { ...birthdayContent.finale, ...(parsed.finale || {}) },
      theme: parsed.theme || undefined,
    };

    if (merged.theme) {
      applyThemeConfig(merged.theme);
    }

    return merged;
  } catch {
    return JSON.parse(JSON.stringify(birthdayContent));
  }
};

/**
 * Save content to localStorage and notify active views
 */
export const saveStoredContent = (content: BirthdayContent): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
    if (content.theme) {
      applyThemeConfig(content.theme);
    }
    window.dispatchEvent(new CustomEvent('birthday_content_updated', { detail: content }));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
    throw err;
  }
};

/**
 * Reset content back to code defaults
 */
export const resetStoredContent = (): BirthdayContent => {
  localStorage.removeItem(STORAGE_KEY);
  const defaults = JSON.parse(JSON.stringify(birthdayContent));
  window.dispatchEvent(new CustomEvent('birthday_content_updated', { detail: defaults }));
  return defaults;
};

/**
 * Generate formatted TypeScript string for src/data/content.ts
 */
export const generateContentTsCode = (content: BirthdayContent): string => {
  const json = JSON.stringify(content, null, 2);
  return `import { BirthdayContent } from '../types/content.types';\n\nexport const birthdayContent: BirthdayContent = ${json};\n`;
};

/**
 * Download text or JSON as file
 */
export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
