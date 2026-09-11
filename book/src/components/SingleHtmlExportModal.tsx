import React, { useState } from 'react';
import { Download, Copy, Check, Code, FileCode, X } from 'lucide-react';
import { AlbumBook } from '../types';
import { generateSingleFileHTML } from '../utils/exportSingleHtml';

interface SingleHtmlExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  album: AlbumBook;
}

export function SingleHtmlExportModal({ isOpen, onClose, album }: SingleHtmlExportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const htmlCode = generateSingleFileHTML(album);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(htmlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = htmlCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadFile = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${album.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'photo-album'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-100 font-serif">
                Single-File HTML Exporter
              </h3>
              <p className="text-xs text-stone-400">
                Self-contained HTML file with embedded scripts, styling, 3D book physics, and all your current photos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Code Preview */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200/90 leading-relaxed">
            <p className="font-semibold text-amber-300 mb-1">💡 How to use this single file:</p>
            <ol className="list-decimal list-inside space-y-1 text-stone-300">
              <li>Click <strong>&quot;Copy HTML Code&quot;</strong> or <strong>&quot;Download index.html&quot;</strong> below.</li>
              <li>Paste it directly into an <code>index.html</code> file in VS Code, Sublime, or any IDE.</li>
              <li>Double-click the <code>index.html</code> file to open and run directly in any browser (no npm install or server needed)!</li>
            </ol>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between text-xs text-stone-400 mb-1 px-1">
              <span className="flex items-center gap-1 font-mono">
                <Code className="w-3.5 h-3.5 text-amber-400" /> index.html ({Math.round(htmlCode.length / 1024)} KB)
              </span>
              <span>{album.pages.length} Pages Included</span>
            </div>
            <pre className="bg-stone-950 p-4 rounded-2xl border border-stone-800 text-stone-300 font-mono text-[11px] h-64 overflow-auto selection:bg-amber-500/30">
              <code>{htmlCode}</code>
            </pre>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-400 hover:text-stone-200 cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-xl text-xs font-semibold border border-stone-700 transition cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-300" />
                  <span>Copy HTML Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadFile}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download HTML File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
