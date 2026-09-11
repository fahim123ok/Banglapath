import React, { useState } from 'react';
import { BookOpen, Sparkles, Edit3, Check, Palette } from 'lucide-react';
import { AlbumBook, CoverColor } from '../types';
import { soundFx } from '../utils/audio';

interface BookCoverProps {
  album: AlbumBook;
  onUpdateAlbum: (updated: AlbumBook) => void;
  onOpenBook: () => void;
}

const COVER_THEMES: { id: CoverColor; label: string; bgClass: string; borderClass: string; textGold: string }[] = [
  { id: 'leather-brown', label: 'Rich Saddle Leather', bgClass: 'bg-[#4a2e18]', borderClass: 'border-[#6e4624]', textGold: 'text-[#f5d77f]' },
  { id: 'burgundy', label: 'Vintage Burgundy', bgClass: 'bg-[#4a1525]', borderClass: 'border-[#6b2539]', textGold: 'text-[#fce4a6]' },
  { id: 'forest-green', label: 'Imperial Forest Green', bgClass: 'bg-[#183a27]', borderClass: 'border-[#26573c]', textGold: 'text-[#e8d89e]' },
  { id: 'navy-blue', label: 'Midnight Navy', bgClass: 'bg-[#15233e]', borderClass: 'border-[#22375e]', textGold: 'text-[#f3d990]' },
  { id: 'velvet-black', label: 'Velvet Noir', bgClass: 'bg-[#1c1c1e]', borderClass: 'border-[#333336]', textGold: 'text-[#e6ca70]' },
  { id: 'vintage-cream', label: 'Heirloom Linen Cream', bgClass: 'bg-[#e5dac5]', borderClass: 'border-[#c8bba4]', textGold: 'text-[#5a4224]' },
];

export const BookCover: React.FC<BookCoverProps> = ({
  album,
  onUpdateAlbum,
  onOpenBook,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const currentTheme = COVER_THEMES.find((c) => c.id === album.coverColor) || COVER_THEMES[0];

  return (
    <div className="relative w-full max-w-lg mx-auto py-8 px-4 flex flex-col items-center">
      {/* 3D Book Container */}
      <div 
        id="3d-book-cover-container"
        className="relative group transition-transform duration-500 hover:scale-[1.01]"
        style={{
          perspective: '1500px',
        }}
      >
        {/* Book Edge Thickness / Stacked Pages Behind Right & Bottom */}
        <div 
          className="absolute top-2 -right-3 bottom-2 w-5 bg-linear-to-r from-stone-300 via-stone-100 to-stone-300 rounded-r-xs shadow-xl transform rotate-y-[8deg] z-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(to bottom, #d6d3cd 0px, #d6d3cd 1px, #f5f5f4 1px, #f5f5f4 3px)',
            boxShadow: '4px 0 10px rgba(0,0,0,0.4)',
          }}
        />
        <div 
          className="absolute -bottom-2.5 left-3 right-0 h-4 bg-linear-to-b from-stone-200 to-stone-400 rounded-b-xs shadow-md z-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(to right, #d6d3cd 0px, #d6d3cd 1px, #f5f5f4 1px, #f5f5f4 3px)',
          }}
        />

        {/* The Front Cover Surface */}
        <div
          id="book-cover-front-face"
          onClick={() => {
            if (!isEditing) {
              soundFx.playPageTurn();
              onOpenBook();
            }
          }}
          className={`relative z-10 w-[300px] sm:w-[380px] md:w-[440px] aspect-4/5 rounded-r-2xl rounded-l-md shadow-2xl p-6 sm:p-8 flex flex-col justify-between cursor-pointer border-t-2 border-r-2 border-b-2 transition-all duration-300 ${currentTheme.bgClass} ${currentTheme.borderClass}`}
          style={{
            boxShadow: '12px 18px 40px -8px rgba(0, 0, 0, 0.7), inset 0 0 40px rgba(0, 0, 0, 0.4)',
            backgroundImage: `
              radial-gradient(circle at 50% 30%, rgba(255,255,255,0.06), transparent 70%),
              linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 5%, transparent 12%, transparent 95%, rgba(0,0,0,0.4) 100%)
            `,
          }}
        >
          {/* Spine Hinge Indentation line on the left */}
          <div className="absolute left-6 top-0 bottom-0 w-1 bg-black/40 shadow-[inset_1px_0_2px_rgba(0,0,0,0.8)] pointer-events-none" />
          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-white/10 pointer-events-none" />

          {/* Ornate Gold Metal Corner Protectors */}
          <div className="absolute top-2 right-2 w-7 h-7 border-t-2 border-r-2 border-amber-300/80 rounded-tr-md pointer-events-none shadow-xs" />
          <div className="absolute bottom-2 right-2 w-7 h-7 border-b-2 border-r-2 border-amber-300/80 rounded-br-md pointer-events-none shadow-xs" />
          <div className="absolute top-2 left-2 w-7 h-7 border-t-2 border-l-2 border-amber-300/80 rounded-tl-sm pointer-events-none shadow-xs" />
          <div className="absolute bottom-2 left-2 w-7 h-7 border-b-2 border-l-2 border-amber-300/80 rounded-bl-sm pointer-events-none shadow-xs" />

          {/* Golden Satin Bookmark Ribbon hanging from bottom */}
          <div 
            className="absolute -bottom-7 left-1/3 w-6 h-12 bg-linear-to-b from-amber-600 via-amber-400 to-amber-500 shadow-lg transform -rotate-3 rounded-b-xs pointer-events-none"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)',
            }}
          />

          {/* Top Crest / Header */}
          <div className="text-center pt-2">
            <div className="inline-flex items-center justify-center p-3 rounded-full border border-amber-400/50 bg-amber-400/10 mb-2 shadow-inner">
              <Sparkles className={`w-6 h-6 ${currentTheme.textGold}`} />
            </div>
            <p className={`text-[11px] sm:text-xs uppercase tracking-[0.3em] font-semibold opacity-90 ${currentTheme.textGold}`}>
              Memory Keepsake
            </p>
          </div>

          {/* Center Ornate Golden Embossed Title Box */}
          <div className="my-auto py-6 px-4 border-2 border-dashed border-amber-400/40 rounded-xl bg-black/20 backdrop-blur-xs text-center relative">
            {/* Corner flourishes */}
            <div className="absolute -top-2 -left-2 text-amber-400/60 text-xs">✦</div>
            <div className="absolute -top-2 -right-2 text-amber-400/60 text-xs">✦</div>
            <div className="absolute -bottom-2 -left-2 text-amber-400/60 text-xs">✦</div>
            <div className="absolute -bottom-2 -right-2 text-amber-400/60 text-xs">✦</div>

            {isEditing ? (
              <div className="space-y-2.5" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={album.title}
                  placeholder="Album Title..."
                  onChange={(e) => onUpdateAlbum({ ...album, title: e.target.value })}
                  className="w-full text-center text-lg sm:text-xl font-bold bg-stone-900/80 border border-amber-400 rounded-lg px-2 py-1 text-amber-200 focus:outline-hidden font-serif"
                />
                <input
                  type="text"
                  value={album.subtitle}
                  placeholder="Subtitle or Year..."
                  onChange={(e) => onUpdateAlbum({ ...album, subtitle: e.target.value })}
                  className="w-full text-center text-xs bg-stone-900/80 border border-amber-400/60 rounded-lg px-2 py-1 text-stone-200 focus:outline-hidden"
                />
                <input
                  type="text"
                  value={album.author}
                  placeholder="Author / Name..."
                  onChange={(e) => onUpdateAlbum({ ...album, author: e.target.value })}
                  className="w-full text-center text-[11px] bg-stone-900/80 border border-amber-400/60 rounded-lg px-2 py-1 text-amber-300 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-amber-500 text-stone-950 text-xs font-semibold rounded-lg shadow cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Done Editing
                </button>
              </div>
            ) : (
              <div>
                <h1
                  className={`text-xl sm:text-2xl md:text-3xl font-serif font-bold tracking-wide drop-shadow-md leading-tight ${currentTheme.textGold}`}
                  style={{
                    textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                  }}
                >
                  {album.title}
                </h1>
                <p className="text-xs sm:text-sm text-stone-300/90 font-light mt-2 italic">
                  {album.subtitle}
                </p>
                <div className="mt-4 pt-3 border-t border-amber-400/30">
                  <p className={`text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium ${currentTheme.textGold}`}>
                    Compiled by {album.author}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action */}
          <div className="text-center pt-2">
            <button
              id="open-book-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundFx.playPageTurn();
                onOpenBook();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-amber-400 via-amber-300 to-amber-500 text-stone-950 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg hover:brightness-110 active:scale-98 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Open Photo Album</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cover Quick Customization Controls */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          id="edit-cover-title-btn"
          type="button"
          onClick={() => {
            soundFx.playClick();
            setIsEditing(!isEditing);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-xl border border-stone-700 transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
          <span>{isEditing ? 'Close Title Edit' : 'Edit Book Title'}</span>
        </button>

        <button
          id="pick-cover-theme-btn"
          type="button"
          onClick={() => {
            soundFx.playClick();
            setShowColorPicker(!showColorPicker);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-xl border border-stone-700 transition-colors cursor-pointer"
        >
          <Palette className="w-3.5 h-3.5 text-amber-400" />
          <span>Cover Binding Color</span>
        </button>
      </div>

      {/* Color Palette Popover */}
      {showColorPicker && (
        <div className="mt-3 p-3 bg-stone-900 border border-stone-700 rounded-2xl shadow-xl flex flex-wrap gap-2 justify-center animate-in fade-in duration-150">
          {COVER_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => {
                soundFx.playClick();
                onUpdateAlbum({ ...album, coverColor: theme.id });
                setShowColorPicker(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                album.coverColor === theme.id
                  ? 'border-amber-500 bg-amber-500/20 text-white'
                  : 'border-stone-700 bg-stone-800 text-stone-300 hover:border-stone-600'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full border border-white/20 ${theme.bgClass}`} />
              <span>{theme.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
