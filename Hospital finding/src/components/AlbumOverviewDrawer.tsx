import React from 'react';
import { X, Plus, BookOpen, Trash2, Copy, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { AlbumBook, AlbumPage } from '../types';
import { soundFx } from '../utils/audio';

interface AlbumOverviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  album: AlbumBook;
  currentSpreadIndex: number;
  onSelectSpread: (spreadIndex: number) => void;
  onAddNewPage: () => void;
  onDuplicatePage: (pageIndex: number) => void;
  onDeletePage: (pageIndex: number) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
}

export const AlbumOverviewDrawer: React.FC<AlbumOverviewDrawerProps> = ({
  isOpen,
  onClose,
  album,
  currentSpreadIndex,
  onSelectSpread,
  onAddNewPage,
  onDuplicatePage,
  onDeletePage,
  onMovePage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="album-overview-modal"
        className="relative w-full max-w-4xl bg-stone-900 text-stone-100 border border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-100">Album Table of Contents</h3>
              <p className="text-xs text-stone-400">
                {album.pages.length} Pages • Click any page to flip directly to it
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="drawer-add-page-btn"
              type="button"
              onClick={() => {
                soundFx.playClick();
                onAddNewPage();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Page</span>
            </button>
            <button
              id="close-overview-drawer-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thumbnail Grid */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Cover Entry */}
            <div
              onClick={() => {
                soundFx.playPageTurn();
                onSelectSpread(0);
                onClose();
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-44 ${
                currentSpreadIndex === 0
                  ? 'border-amber-500 bg-amber-950/20 ring-2 ring-amber-500/50'
                  : 'border-stone-800 bg-stone-950/50 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-amber-400 font-mono">
                <span>Front Cover</span>
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="text-center py-2">
                <h4 className="font-serif font-bold text-base text-amber-200 truncate">
                  {album.title}
                </h4>
                <p className="text-xs text-stone-400 mt-1 truncate">{album.subtitle}</p>
                <p className="text-[10px] text-amber-400/80 mt-1 uppercase tracking-widest">
                  by {album.author}
                </p>
              </div>
              <div className="text-center text-[10px] text-stone-500 font-medium">
                Click to open book cover
              </div>
            </div>

            {/* Page Thumbnails */}
            {album.pages.map((page, idx) => {
              // Calculate spread index for this page: page 0 is inside spread 1 (or single page mode)
              const spreadTarget = Math.floor(idx / 2) + 1;
              const isCurrent = currentSpreadIndex === spreadTarget;

              return (
                <div
                  key={page.id}
                  id={`page-card-${page.id}`}
                  onClick={() => {
                    soundFx.playPageTurn();
                    onSelectSpread(spreadTarget);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-44 ${
                    isCurrent
                      ? 'border-amber-500 bg-amber-950/20 ring-2 ring-amber-500/50 shadow-md'
                      : 'border-stone-800 bg-stone-950/50 hover:border-stone-700 hover:bg-stone-900/60'
                  }`}
                >
                  {/* Top Bar: Page # and Quick Actions */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-stone-400 bg-stone-800 px-2 py-0.5 rounded text-[11px]">
                      Page {idx + 1}
                    </span>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => onMovePage(idx, idx - 1)}
                          title="Move page earlier"
                          className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {idx < album.pages.length - 1 && (
                        <button
                          type="button"
                          onClick={() => onMovePage(idx, idx + 1)}
                          title="Move page later"
                          className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDuplicatePage(idx)}
                        title="Duplicate page"
                        className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {album.pages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeletePage(idx)}
                          title="Delete page"
                          className="p-1 text-stone-400 hover:text-rose-400 hover:bg-stone-800 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Middle Content */}
                  <div className="my-auto text-left">
                    <h5
                      className="text-sm font-semibold text-stone-200 truncate"
                      style={{ fontFamily: page.style.fontFamily }}
                    >
                      {page.title || `Memory #${idx + 1}`}
                    </h5>
                    <p className="text-xs text-stone-400 line-clamp-2 mt-1">
                      {page.journalNotes || 'No notes added yet.'}
                    </p>
                  </div>

                  {/* Bottom Meta */}
                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-800/80">
                    <span className="capitalize">{page.layout.replace('-', ' ')}</span>
                    <span>{page.photos.filter((p) => p.url).length} Photos</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
