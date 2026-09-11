import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Plus, 
  Download, 
  Upload, 
  RotateCcw, 
  List, 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  Printer, 
  HelpCircle, 
  ChevronRight,
  Smile,
  FileCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AlbumBook, AlbumPage, PhotoItem, StickerType } from './types';
import { loadAlbum, saveAlbum, resetAlbumToDefault, exportAlbumJSON } from './utils/storage';
import { createNewPage } from './utils/initialData';
import { soundFx } from './utils/audio';
import { Book3DViewer } from './components/Book3DViewer';
import { PageStyleToolbar } from './components/PageStyleToolbar';
import { PhotoEditModal } from './components/PhotoEditModal';
import { StickerPalette } from './components/StickerPalette';
import { AlbumOverviewDrawer } from './components/AlbumOverviewDrawer';
import { SingleHtmlExportModal } from './components/SingleHtmlExportModal';

export default function App() {
  const [album, setAlbum] = useState<AlbumBook>(() => loadAlbum());
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0); // 0 = Cover
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('left');
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isStickerPaletteOpen, setIsStickerPaletteOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);

  const importFileRef = useRef<HTMLInputElement>(null);

  // Autosave to localStorage on album changes
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      saveAlbum(album);
      setSaveStatus('saved');
    }, 400);
    return () => clearTimeout(timer);
  }, [album]);

  // Determine active page for styling toolbar
  const getActivePage = (): AlbumPage | null => {
    if (currentSpreadIndex === 0) return null;
    const leftIndex = (currentSpreadIndex - 1) * 2;
    const rightIndex = leftIndex + 1;

    if (activeSide === 'right' && album.pages[rightIndex]) {
      return album.pages[rightIndex];
    }
    return album.pages[leftIndex] || null;
  };

  const handleUpdatePage = (updatedPage: AlbumPage) => {
    const updatedPages = album.pages.map((p) => (p.id === updatedPage.id ? updatedPage : p));
    setAlbum({ ...album, pages: updatedPages });
  };

  const handleUpdateAlbum = (updatedAlbum: AlbumBook) => {
    setAlbum(updatedAlbum);
  };

  const handleOpenPhotoEditor = (photo: PhotoItem) => {
    setEditingPhoto(photo);
    setIsPhotoModalOpen(true);
  };

  const handleSavePhotoEdits = (updatedPhoto: PhotoItem) => {
    // Find which page contains this photo and update it
    const updatedPages = album.pages.map((p) => {
      const photoIdx = p.photos.findIndex((ph) => ph.id === updatedPhoto.id);
      if (photoIdx !== -1) {
        const nextPhotos = [...p.photos];
        nextPhotos[photoIdx] = updatedPhoto;
        return { ...p, photos: nextPhotos };
      }
      return p;
    });
    setAlbum({ ...album, pages: updatedPages });
  };

  const handleAddSticker = (type: StickerType) => {
    const active = getActivePage();
    if (!active) return;

    const newSticker = {
      id: 'sticker-' + Date.now(),
      type,
      x: 35 + Math.random() * 30, // center area
      y: 35 + Math.random() * 30,
      rotation: (Math.random() * 24) - 12,
      scale: 1,
    };

    const updated = {
      ...active,
      stickers: [...(active.stickers || []), newSticker],
    };

    handleUpdatePage(updated);
  };

  const handleRemoveSticker = (pageId: string, stickerId: string) => {
    const updatedPages = album.pages.map((p) => {
      if (p.id === pageId) {
        return {
          ...p,
          stickers: p.stickers.filter((s) => s.id !== stickerId),
        };
      }
      return p;
    });
    setAlbum({ ...album, pages: updatedPages });
  };

  const handleAddNewPage = () => {
    soundFx.playClick();
    const newPageNum = album.pages.length + 1;
    const newPage = createNewPage(newPageNum, 'polaroid-duo');
    const nextPages = [...album.pages, newPage];
    setAlbum({ ...album, pages: nextPages });

    // Calculate spread for the newly created page and flip there
    const newSpread = Math.ceil(nextPages.length / 2);
    setCurrentSpreadIndex(newSpread);

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#ec4899', '#3b82f6'],
      });
    } catch {
      // ignore
    }
  };

  const handleDeletePage = (pageIndex?: number) => {
    soundFx.playClick();
    let targetIndex = pageIndex;
    if (targetIndex === undefined) {
      const active = getActivePage();
      if (!active) return;
      targetIndex = album.pages.findIndex((p) => p.id === active.id);
    }
    if (targetIndex === -1 || album.pages.length <= 1) return;

    const filtered = album.pages.filter((_, idx) => idx !== targetIndex);
    // re-number pages
    const renumbered = filtered.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    setAlbum({ ...album, pages: renumbered });

    // adjust current spread if needed
    const maxSpreads = Math.ceil(renumbered.length / 2);
    if (currentSpreadIndex > maxSpreads) {
      setCurrentSpreadIndex(Math.max(1, maxSpreads));
    }
  };

  const handleDuplicatePage = (pageIndex: number) => {
    soundFx.playClick();
    const source = album.pages[pageIndex];
    if (!source) return;

    const duplicate: AlbumPage = {
      ...JSON.parse(JSON.stringify(source)),
      id: 'page-' + Date.now(),
      title: `${source.title} (Copy)`,
      pageNumber: pageIndex + 2,
    };

    const nextPages = [
      ...album.pages.slice(0, pageIndex + 1),
      duplicate,
      ...album.pages.slice(pageIndex + 1),
    ].map((p, idx) => ({ ...p, pageNumber: idx + 1 }));

    setAlbum({ ...album, pages: nextPages });
  };

  const handleMovePage = (fromIndex: number, toIndex: number) => {
    soundFx.playClick();
    if (toIndex < 0 || toIndex >= album.pages.length) return;
    const nextPages = [...album.pages];
    const [moved] = nextPages.splice(fromIndex, 1);
    nextPages.splice(toIndex, 0, moved);
    const renumbered = nextPages.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    setAlbum({ ...album, pages: renumbered });
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as AlbumBook;
        if (parsed && Array.isArray(parsed.pages)) {
          soundFx.playCameraShutter();
          setAlbum(parsed);
          setCurrentSpreadIndex(0);
          saveAlbum(parsed);
        }
      } catch (err) {
        console.error('Invalid JSON file', err);
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset all pages to original memory album demo? (Your current customizations will be replaced)')) {
      soundFx.playPageTurn();
      const resetData = resetAlbumToDefault();
      setAlbum(resetData);
      setCurrentSpreadIndex(0);
    }
  };

  const handlePrintAlbum = () => {
    soundFx.playClick();
    window.print();
  };

  const activePage = getActivePage();
  const leftPageIdx = (currentSpreadIndex - 1) * 2;
  const rightPageIdx = leftPageIdx + 1;
  const hasRightPage = currentSpreadIndex > 0 && !!album.pages[rightPageIdx];

  return (
    <div className="min-h-screen flex flex-col bg-radial from-stone-900 via-stone-950 to-black text-stone-100 selection:bg-amber-500/30 selection:text-amber-200">
      <input
        ref={importFileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportJSON}
      />

      {/* TOP APPLICATION HEADER */}
      <header className="sticky top-0 z-40 w-full bg-stone-950/80 backdrop-blur-md border-b border-stone-800/80 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 shadow-md shadow-amber-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold font-serif tracking-wide text-stone-100">
                  {album.title}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-2.5 h-2.5" /> 3D Album
                </span>
              </div>
              <p className="text-[11px] text-stone-400 truncate max-w-[180px] sm:max-w-xs">
                {album.pages.length} Pages • {saveStatus === 'saved' ? 'Saved locally' : 'Saving...'}
              </p>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Table of Contents / Pages Overview */}
            <button
              id="header-toc-btn"
              type="button"
              onClick={() => {
                soundFx.playClick();
                setIsOverviewOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-medium transition-colors cursor-pointer border border-stone-700/60"
            >
              <List className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Pages</span>
            </button>

            {/* Add New Page Button */}
            <button
              id="header-add-page-btn"
              type="button"
              onClick={handleAddNewPage}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Page</span>
            </button>

            {/* Export Single-File HTML */}
            <button
              id="header-export-html-btn"
              type="button"
              onClick={() => {
                soundFx.playClick();
                setIsHtmlModalOpen(true);
              }}
              title="Get Single-File HTML code"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Single HTML</span>
            </button>

            {/* Export JSON Backup */}
            <button
              id="header-export-btn"
              type="button"
              onClick={() => exportAlbumJSON(album)}
              title="Download Album Backup (.json)"
              className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Import JSON */}
            <button
              id="header-import-btn"
              type="button"
              onClick={() => importFileRef.current?.click()}
              title="Import Album from File"
              className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Print / Save PDF */}
            <button
              id="header-print-btn"
              type="button"
              onClick={handlePrintAlbum}
              title="Print Album / Save as PDF"
              className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer hidden sm:flex"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Reset to Sample Demo */}
            <button
              id="header-reset-btn"
              type="button"
              onClick={handleResetToDefault}
              title="Reset to Sample Album"
              className="p-2 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* PAGE CUSTOMIZATION TOOLBAR (Visible on open spreads) */}
      {currentSpreadIndex > 0 && activePage && (
        <div className="w-full bg-stone-950/40 border-b border-stone-800/40">
          <div className="max-w-4xl mx-auto px-4 pt-2 flex items-center justify-between">
            {/* Side selector if two pages are open */}
            {hasRightPage && (
              <div className="flex items-center gap-1 bg-stone-900/90 rounded-xl p-1 border border-stone-800 text-xs">
                <span className="text-stone-400 text-[11px] px-2">Customize:</span>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setActiveSide('left');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeSide === 'left'
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Left (Page {leftPageIdx + 1})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setActiveSide('right');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeSide === 'right'
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Right (Page {rightPageIdx + 1})
                </button>
              </div>
            )}
          </div>

          <PageStyleToolbar
            currentPage={activePage}
            onUpdatePage={handleUpdatePage}
            onOpenStickerPalette={() => setIsStickerPaletteOpen(true)}
            onAddNewPage={handleAddNewPage}
            onDeletePage={() => handleDeletePage()}
            canDelete={album.pages.length > 1}
          />
        </div>
      )}

      {/* MAIN 3D INTERACTIVE BOOK AREA */}
      <main className="flex-1 flex flex-col justify-center items-center py-2 sm:py-6 overflow-hidden">
        <Book3DViewer
          album={album}
          currentSpreadIndex={currentSpreadIndex}
          onSetSpreadIndex={setCurrentSpreadIndex}
          onUpdatePage={handleUpdatePage}
          onUpdateAlbum={handleUpdateAlbum}
          onOpenPhotoEditor={handleOpenPhotoEditor}
          onRemoveSticker={handleRemoveSticker}
          onAddNewPage={handleAddNewPage}
        />
      </main>

      {/* QUICK FLOATING STICKERS BUTTON */}
      {currentSpreadIndex > 0 && (
        <button
          id="floating-stickers-btn"
          type="button"
          onClick={() => {
            soundFx.playClick();
            setIsStickerPaletteOpen(!isStickerPaletteOpen);
          }}
          className="fixed bottom-6 right-6 z-30 p-3.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer font-semibold text-xs border-2 border-stone-950"
        >
          <Smile className="w-5 h-5" />
          <span className="hidden sm:inline">Stickers</span>
        </button>
      )}

      {/* MODALS & DRAWERS */}
      <PhotoEditModal
        photo={editingPhoto}
        isOpen={isPhotoModalOpen}
        onClose={() => {
          setIsPhotoModalOpen(false);
          setEditingPhoto(null);
        }}
        onSave={handleSavePhotoEdits}
      />

      <StickerPalette
        isOpen={isStickerPaletteOpen}
        onClose={() => setIsStickerPaletteOpen(false)}
        onAddSticker={handleAddSticker}
      />

      <AlbumOverviewDrawer
        isOpen={isOverviewOpen}
        onClose={() => setIsOverviewOpen(false)}
        album={album}
        currentSpreadIndex={currentSpreadIndex}
        onSelectSpread={setCurrentSpreadIndex}
        onAddNewPage={handleAddNewPage}
        onDuplicatePage={handleDuplicatePage}
        onDeletePage={handleDeletePage}
        onMovePage={handleMovePage}
      />

      <SingleHtmlExportModal
        isOpen={isHtmlModalOpen}
        onClose={() => setIsHtmlModalOpen(false)}
        album={album}
      />
    </div>
  );
}
