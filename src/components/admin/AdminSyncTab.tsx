import React, { useState } from 'react';
import { BirthdayContent } from '../../types/content.types';
import {
  generateContentTsCode,
  downloadFile,
  resetStoredContent,
} from '../../utils/storage';
import {
  Download,
  Copy,
  Check,
  Upload,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface AdminSyncTabProps {
  content: BirthdayContent;
  onResetToDefaults: () => void;
  onImportContent: (imported: BirthdayContent) => void;
}

export const AdminSyncTab: React.FC<AdminSyncTabProps> = ({
  content,
  onResetToDefaults,
  onImportContent,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyTsCode = () => {
    const code = generateContentTsCode(content);
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownloadTsFile = () => {
    const code = generateContentTsCode(content);
    downloadFile(code, 'content.ts', 'text/typescript');
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(content, null, 2);
    downloadFile(jsonStr, 'birthday-custom-content.json', 'application/json');
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.recipient && parsed.greeting) {
          onImportContent(parsed);
          alert('Custom content imported and applied successfully!');
        } else {
          alert('Invalid configuration format.');
        }
      } catch {
        alert('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all customizations back to factory defaults? All unsaved edits will be reverted.'
      )
    ) {
      resetStoredContent();
      onResetToDefaults();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h3 className="text-xl font-heading text-neutral-800 flex items-center gap-2">
          <Download className="w-5 h-5 text-rose-CTA" />
          Export, Backup & GitHub Deployment
        </h3>
        <p className="text-sm text-neutral-600 mt-1">
          Your changes are active immediately on this browser. Use the tools below to export your code for permanent deployment to GitHub Pages or download a backup.
        </p>
      </div>

      {/* GitHub Repository Code Sync */}
      <div className="bg-gradient-to-br from-rose-50 to-lavender-50 p-6 rounded-2xl border border-rose-200/80 space-y-4">
        <div className="flex items-center gap-2 text-rose-CTA font-bold text-sm">
          <Sparkles className="w-4 h-4" />
          Permanent GitHub Pages Deployment
        </div>
        <p className="text-xs text-neutral-700 leading-relaxed">
          Want Arya to see these exact customized photos, colors, and words when visiting{' '}
          <strong className="text-rose-CTA font-mono">https://bedant1424.github.io/Love/</strong> from any phone or laptop?
          Download the generated <code className="bg-white px-1.5 py-0.5 rounded border border-rose-200 font-mono text-rose-CTA">content.ts</code> file and replace <code className="bg-white px-1.5 py-0.5 rounded border border-rose-200 font-mono text-rose-CTA">src/data/content.ts</code> in this repo!
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={handleDownloadTsFile}
            className="px-5 py-2.5 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white text-xs font-bold flex items-center gap-2 shadow-md hover:scale-102 active:scale-98 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download content.ts</span>
          </button>

          <button
            type="button"
            onClick={handleCopyTsCode}
            className="px-5 py-2.5 rounded-full bg-white hover:bg-stone-50 border border-stone-300 text-neutral-800 text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy TypeScript Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Backup and Restore JSON */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4 shadow-sm">
        <h4 className="text-sm font-bold text-neutral-800">
          Configuration Backups
        </h4>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDownloadJson}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-neutral-800 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-neutral-600" />
            <span>Download JSON Backup</span>
          </button>

          <label className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-neutral-800 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-neutral-600" />
            <span>Restore from JSON File</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJsonFile}
            />
          </label>
        </div>
      </div>

      {/* Factory Reset */}
      <div className="bg-red-50/60 p-5 rounded-2xl border border-red-200 space-y-2">
        <h4 className="text-xs font-bold text-red-800">
          Factory Reset
        </h4>
        <p className="text-xs text-red-700">
          Revert all customizations back to original default content and theme.
        </p>
        <button
          type="button"
          onClick={handleConfirmReset}
          className="mt-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Factory Defaults</span>
        </button>
      </div>
    </div>
  );
};
