import React, { useState, useEffect } from 'react';
import { BirthdayContent } from '../../types/content.types';
import {
  generateContentTsCode,
  downloadFile,
  resetStoredContent,
} from '../../utils/storage';
import {
  publishContentToGitHub,
  TOKEN_STORAGE_KEY,
  GITHUB_REPO_OWNER,
  GITHUB_REPO_NAME,
} from '../../utils/githubPublisher';
import {
  Download,
  Copy,
  Check,
  Upload,
  RotateCcw,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
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
  const [githubToken, setGithubToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [publishStatus, setPublishStatus] = useState<
    'idle' | 'publishing' | 'success' | 'error'
  >('idle');
  const [publishMessage, setPublishMessage] = useState('');

  // Load saved token from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved) setGithubToken(saved);
  }, []);

  const handleSaveToken = (val: string) => {
    setGithubToken(val);
    localStorage.setItem(TOKEN_STORAGE_KEY, val.trim());
  };

  const handlePublishDirectly = async () => {
    if (!githubToken || !githubToken.trim()) {
      setPublishStatus('error');
      setPublishMessage(
        'Please enter a GitHub Personal Access Token (PAT) with repo/contents write permissions.'
      );
      return;
    }

    setPublishStatus('publishing');
    setPublishMessage('Connecting to GitHub API & pushing changes to live website...');

    try {
      const result = await publishContentToGitHub(githubToken, content);
      setPublishStatus('success');
      setPublishMessage(result.message);
    } catch (err: unknown) {
      setPublishStatus('error');
      const msg = err instanceof Error ? err.message : 'Unknown error during publish';
      setPublishMessage(`Publish failed: ${msg}`);
    }
  };

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
    downloadFile(jsonStr, 'content.json', 'application/json');
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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h3 className="text-xl font-heading text-neutral-800 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-rose-CTA" />
          Publish Directly to Live Website
        </h3>
        <p className="text-sm text-neutral-600 mt-1">
          Publish your customizations directly to the live GitHub Pages website so that Arya sees them on her phone, tablet, or laptop without needing local storage!
        </p>
      </div>

      {/* Primary Section: 1-Click Live GitHub API Publisher */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-lavender-50 p-6 sm:p-7 rounded-2xl border-2 border-rose-CTA/40 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-rose-CTA font-bold text-base">
          <Sparkles className="w-5 h-5" />
          <span>Direct Live Website Sync (GitHub API)</span>
        </div>

        <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
          When you click <strong>Publish to Live Website</strong>, this studio directly updates{' '}
          <code className="bg-white px-1.5 py-0.5 rounded border border-rose-200 font-mono text-rose-CTA">content.json</code>{' '}
          in repository <strong className="font-mono text-neutral-800">{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}</strong>.
          Every visitor who opens <strong className="text-rose-CTA font-mono">https://bedant1424.github.io/Love/</strong> immediately downloads and displays your latest changes!
        </p>

        {/* GitHub Token Input */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-2">
          <label className="block text-xs font-bold text-neutral-800">
            GitHub Personal Access Token (PAT)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showToken ? 'text' : 'password'}
                value={githubToken}
                onChange={(e) => handleSaveToken(e.target.value)}
                placeholder="ghp_... or github_pat_..."
                className="w-full p-2.5 pr-10 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-CTA"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                title={showToken ? 'Hide token' : 'Show token'}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-neutral-500">
            Tip: You can use your token from <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">gh auth token</code> or create a fine-grained token with <strong>Contents: Read and write</strong> permissions on GitHub. Token is stored only inside your browser.
          </p>
        </div>

        {/* Status Message */}
        {publishStatus !== 'idle' && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              publishStatus === 'publishing'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : publishStatus === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {publishStatus === 'publishing' ? (
              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : publishStatus === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{publishMessage}</span>
          </div>
        )}

        {/* Big Publish Button */}
        <div>
          <button
            type="button"
            disabled={publishStatus === 'publishing'}
            onClick={handlePublishDirectly}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white text-sm sm:text-base font-bold shadow-floating hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UploadCloud className="w-5 h-5" />
            <span>
              {publishStatus === 'publishing'
                ? 'Publishing to Live Site...'
                : '🚀 Publish Directly to Live Website'}
            </span>
          </button>
        </div>
      </div>

      {/* Secondary Section: Download code files */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4 shadow-sm">
        <h4 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
          <Download className="w-4 h-4 text-neutral-600" />
          Code Files & Local Workspace Sync
        </h4>

        <p className="text-xs text-neutral-600 leading-relaxed">
          Alternatively, if you are working locally in the repository, you can copy or download <code className="font-mono text-rose-CTA font-bold">content.ts</code> to permanently replace <code className="font-mono text-neutral-700">src/data/content.ts</code>:
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDownloadTsFile}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-neutral-800 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download content.ts</span>
          </button>

          <button
            type="button"
            onClick={handleCopyTsCode}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-neutral-800 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-neutral-600" />
                <span>Copy TypeScript Code</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-neutral-800 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-neutral-600" />
            <span>Download content.json</span>
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
