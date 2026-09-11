import React from 'react';
import { Sparkles, Edit2, Calendar, MapPin, Feather, Quote } from 'lucide-react';
import { AlbumPage, PhotoItem, StickerItem, PaperTexture } from '../types';
import { PhotoSlot } from './PhotoSlot';
import { RenderStickerItem } from './StickerPalette';
import { soundFx } from '../utils/audio';

interface PageSpreadProps {
  page: AlbumPage;
  side: 'left' | 'right' | 'single';
  onUpdatePage: (updated: AlbumPage) => void;
  onOpenPhotoEditor: (photo: PhotoItem) => void;
  onRemoveSticker?: (stickerId: string) => void;
}

export const PageSpread: React.FC<PageSpreadProps> = ({
  page,
  side,
  onUpdatePage,
  onOpenPhotoEditor,
  onRemoveSticker,
}) => {
  const { style, layout, photos, stickers, title, subtitle, journalNotes, pageNumber } = page;

  const handleUpdatePhotoAt = (index: number, updatedPhoto: PhotoItem) => {
    const nextPhotos = [...photos];
    nextPhotos[index] = updatedPhoto;
    onUpdatePage({ ...page, photos: nextPhotos });
  };

  const handleRemovePhotoAt = (index: number) => {
    const nextPhotos = photos.filter((_, idx) => idx !== index);
    onUpdatePage({ ...page, photos: nextPhotos });
  };

  // Helper for background paper textures
  const getPaperStyles = (texture: PaperTexture) => {
    switch (texture) {
      case 'parchment':
        return {
          bgClass: 'bg-[#fcf7ed] text-[#3d2b1f]',
          style: {
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(245, 235, 215, 0.6) 0%, rgba(230, 215, 185, 0.4) 100%),
              repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(160, 130, 90, 0.04) 31px, rgba(160, 130, 90, 0.04) 32px)
            `,
          },
        };
      case 'linen':
        return {
          bgClass: 'bg-[#fcfbfa] text-[#2c241c]',
          style: {
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '8px 8px',
          },
        };
      case 'kraft':
        return {
          bgClass: 'bg-[#ebd9c1] text-[#332314]',
          style: {
            backgroundImage: 'radial-gradient(#d3bd9f 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          },
        };
      case 'vintage-floral':
        return {
          bgClass: 'bg-[#fdfaf5] text-[#3f2a1b]',
          style: {
            backgroundImage: 'radial-gradient(circle, rgba(200,160,120,0.08) 10%, transparent 11%)',
            backgroundSize: '24px 24px',
          },
        };
      case 'grid':
        return {
          bgClass: 'bg-[#fdfdfb] text-[#25282a]',
          style: {
            backgroundImage: `
              linear-gradient(to right, rgba(100, 110, 130, 0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(100, 110, 130, 0.06) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          },
        };
      case 'watercolor':
        return {
          bgClass: 'bg-[#fbf9f4] text-[#383028]',
          style: {
            backgroundImage: 'radial-gradient(ellipse at top left, rgba(235,220,195,0.4), transparent 60%)',
          },
        };
      case 'midnight':
        return {
          bgClass: 'bg-[#181d26] text-[#e2e8f0]',
          style: {
            backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(40,55,80,0.4), transparent 70%)',
          },
        };
      default:
        return { bgClass: 'bg-[#fbf9f4] text-[#3a2e24]', style: {} };
    }
  };

  const paperConfig = getPaperStyles(style.paperTexture);

  // Spine shadow styling based on book side
  const getSpineShadowClass = () => {
    if (side === 'left') {
      return 'after:absolute after:top-0 after:right-0 after:bottom-0 after:w-8 sm:after:w-14 after:bg-linear-to-l after:from-black/25 after:via-black/5 after:to-transparent after:pointer-events-none rounded-l-md';
    }
    if (side === 'right') {
      return 'before:absolute before:top-0 before:left-0 before:bottom-0 before:w-8 sm:before:w-14 before:bg-linear-to-r before:from-black/25 before:via-black/5 before:to-transparent before:pointer-events-none rounded-r-md';
    }
    return 'rounded-xl';
  };

  return (
    <div
      id={`page-sheet-${page.id}`}
      className={`relative w-full h-full min-h-[520px] md:min-h-[620px] p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-hidden shadow-inner border border-stone-300/60 ${paperConfig.bgClass} ${getSpineShadowClass()}`}
      style={{
        ...paperConfig.style,
        fontFamily: style.fontFamily,
      }}
    >
      {/* Decorative botanical or vintage corner flourishes */}
      {style.ornamentStyle === 'botanical' && (
        <div className="absolute top-2 right-2 text-stone-400/40 text-lg select-none pointer-events-none">
          🌿
        </div>
      )}
      {style.ornamentStyle === 'vintage-flourish' && (
        <div className="absolute top-2 left-2 text-amber-700/30 text-xs font-serif select-none pointer-events-none">
          ❦
        </div>
      )}

      {/* Dynamic Stickers Layer */}
      {stickers && stickers.map((st) => (
        <RenderStickerItem
          key={st.id}
          sticker={st}
          onRemove={() => onRemoveSticker && onRemoveSticker(st.id)}
        />
      ))}

      {/* Page Header Section: Title, Subtitle, Date */}
      <div className="relative z-10 mb-3 sm:mb-4">
        <div className="flex items-center justify-between gap-2 border-b border-stone-400/30 pb-2">
          {/* Editable Page Title */}
          <input
            id={`page-title-input-${page.id}`}
            type="text"
            value={title}
            placeholder="Click to name this page..."
            onChange={(e) => onUpdatePage({ ...page, title: e.target.value })}
            className={`w-full bg-transparent font-bold tracking-tight border-b border-transparent hover:border-stone-400/60 focus:border-amber-600 focus:outline-hidden transition-colors ${
              style.titleAlignment === 'center'
                ? 'text-center'
                : style.titleAlignment === 'right'
                ? 'text-right'
                : 'text-left'
            } text-lg sm:text-xl md:text-2xl`}
            style={{
              fontFamily: style.fontFamily,
              color: style.titleColor || 'inherit',
            }}
          />
        </div>

        {/* Subtitle / Location Meta Tag */}
        <div className={`mt-1 flex items-center ${
          style.titleAlignment === 'center' ? 'justify-center' : style.titleAlignment === 'right' ? 'justify-end' : 'justify-start'
        }`}>
          <input
            id={`page-subtitle-input-${page.id}`}
            type="text"
            value={subtitle || ''}
            placeholder="Add memory date / location subtitle..."
            onChange={(e) => onUpdatePage({ ...page, subtitle: e.target.value })}
            className="text-xs sm:text-sm text-stone-500 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-amber-500 focus:outline-hidden italic"
            style={{
              fontFamily: style.fontFamily,
            }}
          />
        </div>
      </div>

      {/* Dynamic Page Layout Content */}
      <div className="relative z-10 flex-1 my-2 flex flex-col justify-center">
        {/* 1. SINGLE HERO SHOWCASE */}
        {layout === 'single-hero' && (
          <div className="space-y-4">
            <div className="max-w-md mx-auto w-full">
              <PhotoSlot
                photo={photos[0]}
                aspectRatio="landscape"
                onUpdatePhoto={(updated) => handleUpdatePhotoAt(0, updated)}
                onRemovePhoto={() => handleRemovePhotoAt(0)}
                onOpenEditor={onOpenPhotoEditor}
                fontFamily={style.fontFamily}
              />
            </div>
            {/* Journal Note Box */}
            <div className="p-3 bg-stone-900/5 rounded-xl border border-stone-300/40">
              <textarea
                value={journalNotes}
                rows={2}
                placeholder="Write your story, thoughts, and memories for this moment..."
                onChange={(e) => onUpdatePage({ ...page, journalNotes: e.target.value })}
                className="w-full bg-transparent border-none resize-none focus:outline-hidden text-xs sm:text-sm leading-relaxed"
                style={{ fontFamily: style.fontFamily }}
              />
            </div>
          </div>
        )}

        {/* 2. POLAROID DUO SNAPSHOTS */}
        {layout === 'polaroid-duo' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-center">
              <PhotoSlot
                photo={photos[0]}
                aspectRatio="portrait"
                onUpdatePhoto={(updated) => handleUpdatePhotoAt(0, updated)}
                onRemovePhoto={() => handleRemovePhotoAt(0)}
                onOpenEditor={onOpenPhotoEditor}
                fontFamily={style.fontFamily}
              />
              <PhotoSlot
                photo={photos[1]}
                aspectRatio="portrait"
                onUpdatePhoto={(updated) => handleUpdatePhotoAt(1, updated)}
                onRemovePhoto={() => handleRemovePhotoAt(1)}
                onOpenEditor={onOpenPhotoEditor}
                fontFamily={style.fontFamily}
              />
            </div>
            <div className="pt-1">
              <textarea
                value={journalNotes}
                rows={2}
                placeholder="Add notes about these snapshots..."
                onChange={(e) => onUpdatePage({ ...page, journalNotes: e.target.value })}
                className="w-full bg-transparent border-b border-stone-300/40 focus:border-amber-600 focus:outline-hidden text-xs sm:text-sm resize-none"
                style={{ fontFamily: style.fontFamily }}
              />
            </div>
          </div>
        )}

        {/* 3. TRIPLE STORY */}
        {layout === 'triple-story' && (
          <div className="space-y-2">
            <div className="max-w-xs mx-auto">
              <PhotoSlot
                photo={photos[0]}
                aspectRatio="wide"
                onUpdatePhoto={(updated) => handleUpdatePhotoAt(0, updated)}
                onRemovePhoto={() => handleRemovePhotoAt(0)}
                onOpenEditor={onOpenPhotoEditor}
                fontFamily={style.fontFamily}
                isCompact
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <PhotoSlot
                photo={photos[1]}
                aspectRatio="square"
                onUpdatePhoto={(updated) => handleUpdatePhotoAt(1, updated)}
                onRemovePhoto={() => handleRemovePhotoAt(1)}
                onOpenEditor={onOpenPhotoEditor}
                fontFamily={style.fontFamily}
                isCompact
              />
              <PhotoSlot
                photo={photos[2]}
                aspectRatio="square"
                onUpdatePhoto={(updated) => handleUpdatePhotoAt(2, updated)}
                onRemovePhoto={() => handleRemovePhotoAt(2)}
                onOpenEditor={onOpenPhotoEditor}
                fontFamily={style.fontFamily}
                isCompact
              />
            </div>
            <textarea
              value={journalNotes}
              rows={2}
              placeholder="Share what made this day unforgettable..."
              onChange={(e) => onUpdatePage({ ...page, journalNotes: e.target.value })}
              className="w-full bg-transparent border-t border-stone-300/30 pt-1 text-xs resize-none focus:outline-hidden"
              style={{ fontFamily: style.fontFamily }}
            />
          </div>
        )}

        {/* 4. QUAD SCRAPBOOK GRID */}
        {layout === 'quad-scrapbook' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((idx) => (
                <PhotoSlot
                  key={idx}
                  photo={photos[idx]}
                  aspectRatio="square"
                  onUpdatePhoto={(updated) => handleUpdatePhotoAt(idx, updated)}
                  onRemovePhoto={() => handleRemovePhotoAt(idx)}
                  onOpenEditor={onOpenPhotoEditor}
                  fontFamily={style.fontFamily}
                  isCompact
                />
              ))}
            </div>
            <textarea
              value={journalNotes}
              rows={1}
              placeholder="A collection of fast, happy memories..."
              onChange={(e) => onUpdatePage({ ...page, journalNotes: e.target.value })}
              className="w-full bg-transparent text-[11px] sm:text-xs text-center resize-none focus:outline-hidden"
              style={{ fontFamily: style.fontFamily }}
            />
          </div>
        )}

        {/* 5. JOURNAL & HEARTFELT LETTER */}
        {layout === 'journal-photo' && (
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            <div className="max-w-[240px] mx-auto w-full">
              <PhotoSlot
                photo={photos[0]}
                aspectRatio="landscape"
                onUpdatePhoto={(updated) => handleUpdatePhotoAt(0, updated)}
                onRemovePhoto={() => handleRemovePhotoAt(0)}
                onOpenEditor={onOpenPhotoEditor}
                fontFamily={style.fontFamily}
              />
            </div>
            <div className="p-3 bg-white/40 rounded-xl border border-stone-300/60 shadow-xs flex-1">
              <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1">
                <Feather className="w-3.5 h-3.5 text-amber-700" />
                <span className="font-serif italic">Personal Journal Reflection</span>
              </div>
              <textarea
                value={journalNotes}
                rows={5}
                placeholder="Write a long letter, gratitude list, or story for future you to discover..."
                onChange={(e) => onUpdatePage({ ...page, journalNotes: e.target.value })}
                className="w-full bg-transparent resize-none focus:outline-hidden text-xs sm:text-sm md:text-base leading-relaxed"
                style={{
                  fontFamily: style.fontFamily,
                  lineHeight: '1.7',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Page Footer: Page Number & Subtle Details */}
      <div className="relative z-10 pt-2 flex items-center justify-between text-[10px] sm:text-xs text-stone-400 border-t border-stone-300/30">
        <span className="capitalize text-stone-500 font-sans tracking-wide">
          {page.layout.replace('-', ' ')}
        </span>
        {style.showPageNumber && (
          <span className="font-serif font-bold text-stone-700">
            • {pageNumber} •
          </span>
        )}
        <span className="text-[10px] text-stone-400 font-sans">
          {photos.filter((p) => p.url).length} items
        </span>
      </div>
    </div>
  );
};
