import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Smartphone, 
  Laptop,
  Plus
} from 'lucide-react';
import { AlbumBook, AlbumPage, PhotoItem } from '../types';
import { BookCover } from './BookCover';
import { PageSpread } from './PageSpread';
import { soundFx } from '../utils/audio';

interface Book3DViewerProps {
  album: AlbumBook;
  currentSpreadIndex: number;
  onSetSpreadIndex: (idx: number) => void;
  onUpdatePage: (updated: AlbumPage) => void;
  onUpdateAlbum: (updated: AlbumBook) => void;
  onOpenPhotoEditor: (photo: PhotoItem) => void;
  onRemoveSticker: (pageId: string, stickerId: string) => void;
  onAddNewPage: () => void;
}

export const Book3DViewer: React.FC<Book3DViewerProps> = ({
  album,
  currentSpreadIndex,
  onSetSpreadIndex,
  onUpdatePage,
  onUpdateAlbum,
  onOpenPhotoEditor,
  onRemoveSticker,
  onAddNewPage,
}) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const [viewMode, setViewMode] = useState<'two-page' | 'single-page'>('two-page');
  const [isMuted, setIsMuted] = useState(soundFx.isMuted);

  const totalPages = album.pages.length;
  // Total spreads: Spread 0 is cover, then each spread holds 2 pages
  const totalSpreads = Math.ceil(totalPages / 2) + 1; // +1 for cover

  // Auto detect screen size for single-page vs two-page mode
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('single-page');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation (Arrow keys Left / Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        flipNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        flipPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSpreadIndex, totalSpreads]);

  const toggleSound = () => {
    soundFx.isMuted = !soundFx.isMuted;
    setIsMuted(soundFx.isMuted);
    if (!soundFx.isMuted) {
      soundFx.playClick();
    }
  };

  const flipNext = () => {
    if (isFlipping || currentSpreadIndex >= totalSpreads - 1) return;
    setIsFlipping(true);
    setFlipDirection('next');
    soundFx.playPageTurn();

    setTimeout(() => {
      onSetSpreadIndex(currentSpreadIndex + 1);
      setTimeout(() => {
        setIsFlipping(false);
        setFlipDirection(null);
      }, 250);
    }, 280);
  };

  const flipPrev = () => {
    if (isFlipping || currentSpreadIndex <= 0) return;
    setIsFlipping(true);
    setFlipDirection('prev');
    soundFx.playPageTurn();

    setTimeout(() => {
      onSetSpreadIndex(currentSpreadIndex - 1);
      setTimeout(() => {
        setIsFlipping(false);
        setFlipDirection(null);
      }, 250);
    }, 280);
  };

  // Get active left & right pages for two-page spread
  const leftPageIndex = (currentSpreadIndex - 1) * 2;
  const rightPageIndex = leftPageIndex + 1;

  const leftPage = currentSpreadIndex > 0 ? album.pages[leftPageIndex] : null;
  const rightPage = currentSpreadIndex > 0 ? album.pages[rightPageIndex] : null;

  // Thickness math for stacked physical pages
  const leftStackThickness = Math.min(16, currentSpreadIndex * 3);
  const rightStackThickness = Math.min(16, (totalSpreads - currentSpreadIndex) * 3);

  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none py-4 px-2 sm:px-4">
      {/* 3D BOOK STAGE CONTAINER */}
      <div 
        id="book-3d-stage"
        className="relative w-full max-w-6xl mx-auto flex items-center justify-center min-h-[560px] md:min-h-[660px]"
        style={{
          perspective: '2200px',
        }}
      >
        {/* SPREAD 0: CLOSED FRONT COVER */}
        {currentSpreadIndex === 0 ? (
          <BookCover
            album={album}
            onUpdateAlbum={onUpdateAlbum}
            onOpenBook={() => {
              flipNext();
            }}
          />
        ) : (
          /* OPEN BOOK SPREAD */
          <div 
            id="open-book-spread-chassis"
            className="relative w-full flex items-center justify-center transition-transform duration-300"
          >
            {/* Realistic Physical Book Under-Chassis & Leather Edging */}
            <div
              className={`relative flex w-full max-w-5xl rounded-2xl shadow-2xl p-1.5 sm:p-3 transition-all duration-300 ${
                album.coverColor === 'burgundy' ? 'bg-[#431221]' :
                album.coverColor === 'forest-green' ? 'bg-[#142e20]' :
                album.coverColor === 'navy-blue' ? 'bg-[#111a2f]' :
                album.coverColor === 'velvet-black' ? 'bg-[#141416]' :
                album.coverColor === 'vintage-cream' ? 'bg-[#c5b89f]' :
                'bg-[#3b210e]'
              }`}
              style={{
                boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.7), inset 0 2px 4px rgba(255, 255, 255, 0.15)',
              }}
            >
              {/* Stacked Left Edge Page Thickness */}
              <div 
                className="hidden sm:block absolute -left-2.5 top-3 bottom-3 bg-linear-to-l from-stone-200 to-stone-400 rounded-l-xs shadow-md z-0"
                style={{
                  width: `${Math.max(4, leftStackThickness)}px`,
                  backgroundImage: 'repeating-linear-gradient(to bottom, #d1ccc0 0px, #d1ccc0 1px, #f5f4ef 1px, #f5f4ef 3px)',
                }}
              />

              {/* Stacked Right Edge Page Thickness */}
              <div 
                className="hidden sm:block absolute -right-2.5 top-3 bottom-3 bg-linear-to-r from-stone-200 to-stone-400 rounded-r-xs shadow-md z-0"
                style={{
                  width: `${Math.max(4, rightStackThickness)}px`,
                  backgroundImage: 'repeating-linear-gradient(to bottom, #d1ccc0 0px, #d1ccc0 1px, #f5f4ef 1px, #f5f4ef 3px)',
                }}
              />

              {/* Silk Bookmark Ribbon coming out of top center spine */}
              <div 
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-5 h-8 bg-linear-to-b from-amber-600 to-amber-500 rounded-t-xs shadow-md z-30 pointer-events-none"
              />

              {/* TWO PAGE SPREAD ON LARGER SCREENS / OR SINGLE PAGE ON MOBILE */}
              <div className="relative w-full flex flex-col md:flex-row items-stretch rounded-xl overflow-hidden shadow-2xl bg-stone-100">
                {/* LEFT PAGE */}
                {viewMode === 'two-page' ? (
                  <div className="w-full md:w-1/2 relative bg-stone-100 flex flex-col">
                    {leftPage ? (
                      <PageSpread
                        page={leftPage}
                        side="left"
                        onUpdatePage={onUpdatePage}
                        onOpenPhotoEditor={onOpenPhotoEditor}
                        onRemoveSticker={(stId) => onRemoveSticker(leftPage.id, stId)}
                      />
                    ) : (
                      /* Blank Page or End of Book */
                      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-8 bg-[#fdfbf7] text-stone-400 text-center font-serif">
                        <Sparkles className="w-8 h-8 text-amber-300 mb-2" />
                        <p className="text-sm">Blank Scrapbook Page</p>
                        <button
                          type="button"
                          onClick={onAddNewPage}
                          className="mt-3 px-4 py-1.5 bg-amber-100 text-amber-900 rounded-lg text-xs font-sans font-medium hover:bg-amber-200"
                        >
                          + Fill This Page
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* CENTER SPINE GROOVE & DEEP 3D LIGHTING */}
                {viewMode === 'two-page' && (
                  <div 
                    className="hidden md:block absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 z-20 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.05) 65%, rgba(0,0,0,0.3) 100%)',
                    }}
                  />
                )}

                {/* RIGHT PAGE (or Single Active Page in mobile mode) */}
                <div className={`${viewMode === 'two-page' ? 'w-full md:w-1/2' : 'w-full'} relative bg-stone-100 flex flex-col`}>
                  {rightPage ? (
                    <PageSpread
                      page={rightPage}
                      side={viewMode === 'two-page' ? 'right' : 'single'}
                      onUpdatePage={onUpdatePage}
                      onOpenPhotoEditor={onOpenPhotoEditor}
                      onRemoveSticker={(stId) => onRemoveSticker(rightPage.id, stId)}
                    />
                  ) : leftPage && viewMode === 'single-page' ? (
                    <PageSpread
                      page={leftPage}
                      side="single"
                      onUpdatePage={onUpdatePage}
                      onOpenPhotoEditor={onOpenPhotoEditor}
                      onRemoveSticker={(stId) => onRemoveSticker(leftPage.id, stId)}
                    />
                  ) : (
                    /* Final End Page */
                    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-8 bg-[#fdfbf7] text-stone-500 text-center font-serif">
                      <div className="p-3 bg-amber-100 rounded-full text-amber-800 mb-3">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <h4 className="text-lg font-bold text-stone-800">You've Reached the End</h4>
                      <p className="text-xs text-stone-500 mt-1 max-w-xs">
                        Every memory is a timeless treasure. Add more pages to keep documenting your stories.
                      </p>
                      <button
                        type="button"
                        onClick={onAddNewPage}
                        className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold rounded-xl text-xs shadow cursor-pointer transition-all"
                      >
                        <Plus className="w-4 h-4" /> Add Another Memory Page
                      </button>
                    </div>
                  )}
                </div>

                {/* 3D Dynamic Flipping Page Flap Layer */}
                {isFlipping && (
                  <div
                    className={`absolute inset-y-0 w-1/2 z-30 pointer-events-none transition-all duration-300 ${
                      flipDirection === 'next'
                        ? 'right-0 origin-left animate-page-flip-next'
                        : 'left-0 origin-right animate-page-flip-prev'
                    }`}
                    style={{
                      transformStyle: 'preserve-3d',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      background: 'linear-gradient(to right, rgba(0,0,0,0.2), #faf8f5 20%, #faf8f5 80%, rgba(0,0,0,0.2))',
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* FLOATING PREV / NEXT NAVIGATION CONTROLS */}
        {currentSpreadIndex > 0 && (
          <button
            id="book-prev-page-btn"
            type="button"
            onClick={flipPrev}
            disabled={isFlipping || currentSpreadIndex <= 0}
            className="absolute left-1 sm:-left-6 top-1/2 -translate-y-1/2 z-40 p-3 sm:p-4 bg-stone-900/90 hover:bg-amber-500 text-stone-200 hover:text-stone-950 rounded-full shadow-2xl border border-stone-700/80 hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none backdrop-blur-xs"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {currentSpreadIndex < totalSpreads - 1 && (
          <button
            id="book-next-page-btn"
            type="button"
            onClick={flipNext}
            disabled={isFlipping || currentSpreadIndex >= totalSpreads - 1}
            className="absolute right-1 sm:-right-6 top-1/2 -translate-y-1/2 z-40 p-3 sm:p-4 bg-stone-900/90 hover:bg-amber-500 text-stone-200 hover:text-stone-950 rounded-full shadow-2xl border border-stone-700/80 hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none backdrop-blur-xs"
            title="Next Page (Right Arrow)"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* BOTTOM SCRUBBER & SPREAD STATUS BAR */}
      <div 
        id="book-navigation-scrubber"
        className="w-full max-w-xl mx-auto mt-4 px-4 py-2 bg-stone-900/80 backdrop-blur-md rounded-2xl border border-stone-800 flex items-center justify-between gap-4 text-xs text-stone-400"
      >
        <button
          type="button"
          onClick={() => {
            soundFx.playPageTurn();
            onSetSpreadIndex(0);
          }}
          className="hover:text-amber-400 transition-colors font-medium cursor-pointer"
        >
          Cover
        </button>

        {/* Interactive Page Slider */}
        <div className="flex-1 flex items-center gap-2">
          <input
            id="book-page-slider"
            type="range"
            min="0"
            max={totalSpreads - 1}
            step="1"
            value={currentSpreadIndex}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (val !== currentSpreadIndex) {
                soundFx.playPageTurn();
                onSetSpreadIndex(val);
              }
            }}
            className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        <span className="font-mono text-[11px] text-amber-300 font-semibold shrink-0">
          {currentSpreadIndex === 0 ? 'Cover' : `Pages ${leftPageIndex + 1}-${Math.min(rightPageIndex + 1, totalPages)}`}
        </span>

        {/* View Mode & Sound Toggles */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            id="toggle-view-mode-btn"
            type="button"
            onClick={() => {
              soundFx.playClick();
              setViewMode(viewMode === 'two-page' ? 'single-page' : 'two-page');
            }}
            title={viewMode === 'two-page' ? 'Switch to Single Page View' : 'Switch to Two-Page Spread'}
            className="p-1.5 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer hidden md:flex"
          >
            {viewMode === 'two-page' ? <Laptop className="w-4 h-4 text-amber-400" /> : <Smartphone className="w-4 h-4 text-stone-400" />}
          </button>

          <button
            id="toggle-sound-btn"
            type="button"
            onClick={toggleSound}
            title={isMuted ? 'Turn on Page Turning Sound FX' : 'Mute Sound FX'}
            className="p-1.5 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-stone-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>
    </div>
  );
};
