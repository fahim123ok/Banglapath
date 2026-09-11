import React from 'react';
import { 
  Type, 
  Palette, 
  Layout, 
  Sparkles, 
  Plus, 
  Trash2, 
  Smile, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { AlbumPage, FontFamily, PaperTexture, PageLayout } from '../types';
import { soundFx } from '../utils/audio';

interface PageStyleToolbarProps {
  currentPage: AlbumPage;
  onUpdatePage: (updated: AlbumPage) => void;
  onOpenStickerPalette: () => void;
  onAddNewPage: () => void;
  onDeletePage: () => void;
  canDelete: boolean;
}

export const FONT_OPTIONS: { family: FontFamily; label: string; preview: string }[] = [
  { family: 'Playfair Display', label: 'Playfair Display (Romantic)', preview: 'Playfair' },
  { family: 'Caveat', label: 'Caveat (Handwritten)', preview: 'Caveat' },
  { family: 'Dancing Script', label: 'Dancing Script (Cursive)', preview: 'Dancing' },
  { family: 'Kalam', label: 'Kalam (Journal Note)', preview: 'Kalam' },
  { family: 'Courier Prime', label: 'Courier Prime (Typewriter)', preview: 'Courier' },
  { family: 'Cinzel', label: 'Cinzel (Luxury Serif)', preview: 'Cinzel' },
  { family: 'Outfit', label: 'Outfit (Modern Sans)', preview: 'Outfit' },
  { family: 'Plus Jakarta Sans', label: 'Jakarta (Clean Sans)', preview: 'Jakarta' },
];

export const PAPER_OPTIONS: { id: PaperTexture; label: string; color: string; desc: string }[] = [
  { id: 'parchment', label: 'Aged Parchment', color: 'bg-[#f7f1e5] border-[#dfd5c2]', desc: 'Warm antique library paper' },
  { id: 'linen', label: 'French Linen', color: 'bg-[#fbf9f4] border-[#e8e2d4]', desc: 'Woven ivory texture' },
  { id: 'kraft', label: 'Natural Kraft', color: 'bg-[#e8d8c3] border-[#cfba9e]', desc: 'Warm recycled scrapbook paper' },
  { id: 'vintage-floral', label: 'Vintage Cream', color: 'bg-[#fdfaf2] border-[#ebdcc7]', desc: 'Soft nostalgic stationery' },
  { id: 'grid', label: 'Notebook Grid', color: 'bg-[#fcfbf9] border-[#e2ded6]', desc: 'Subtle journal grid' },
  { id: 'watercolor', label: 'Watercolor Press', color: 'bg-[#f9f7f2] border-[#ded7c8]', desc: 'Textured cold-press paper' },
  { id: 'midnight', label: 'Midnight Slate', color: 'bg-[#1e2430] border-[#333d4e]', desc: 'Dark velvet photo paper' },
];

export const LAYOUT_OPTIONS: { id: PageLayout; label: string; icon: string; count: number }[] = [
  { id: 'single-hero', label: 'Single Hero Showcase', icon: '🖼️ 1 Large Photo', count: 1 },
  { id: 'polaroid-duo', label: 'Double Polaroid Snapshots', icon: '📸 2 Polaroids', count: 2 },
  { id: 'triple-story', label: 'Triple Story Moments', icon: '📸 3 Photos', count: 3 },
  { id: 'quad-scrapbook', label: '4-Photo Scrapbook Grid', icon: '📷 4 Photos Grid', count: 4 },
  { id: 'journal-photo', label: 'Photo & Heartfelt Letter', icon: '✉️ 1 Photo + Letter', count: 1 },
];

export const PageStyleToolbar: React.FC<PageStyleToolbarProps> = ({
  currentPage,
  onUpdatePage,
  onOpenStickerPalette,
  onAddNewPage,
  onDeletePage,
  canDelete,
}) => {
  const [activeTab, setActiveTab] = React.useState<'fonts' | 'paper' | 'layout' | 'tools' | null>(null);

  const toggleTab = (tab: 'fonts' | 'paper' | 'layout' | 'tools') => {
    soundFx.playClick();
    setActiveTab(activeTab === tab ? null : tab);
  };

  const handleFontChange = (font: FontFamily) => {
    soundFx.playClick();
    onUpdatePage({
      ...currentPage,
      style: { ...currentPage.style, fontFamily: font },
    });
  };

  const handlePaperChange = (paper: PaperTexture) => {
    soundFx.playClick();
    onUpdatePage({
      ...currentPage,
      style: { ...currentPage.style, paperTexture: paper },
    });
  };

  const handleLayoutChange = (layout: PageLayout) => {
    soundFx.playClick();
    const opt = LAYOUT_OPTIONS.find((l) => l.id === layout);
    const targetCount = opt?.count || 1;
    let currentPhotos = [...currentPage.photos];

    // Adjust photo array length to match new layout structure
    if (currentPhotos.length < targetCount) {
      for (let i = currentPhotos.length; i < targetCount; i++) {
        currentPhotos.push({
          id: `photo-${Date.now()}-${i}`,
          url: '',
          caption: 'Add a new memory...',
          date: '',
          location: '',
          frameStyle: layout === 'polaroid-duo' ? 'polaroid' : 'vintage-tape',
          filter: 'none',
          rotation: layout === 'polaroid-duo' ? (i % 2 === 0 ? -3 : 3) : 0,
          tapeStyle: layout === 'polaroid-duo' ? 'washi-gold' : 'none',
        });
      }
    }

    onUpdatePage({
      ...currentPage,
      layout,
      photos: currentPhotos,
    });
  };

  const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
    soundFx.playClick();
    onUpdatePage({
      ...currentPage,
      style: { ...currentPage.style, titleAlignment: alignment },
    });
  };

  const handleAddPhotoSlot = () => {
    soundFx.playClick();
    const newPhotos = [
      ...currentPage.photos,
      {
        id: `photo-${Date.now()}`,
        url: '',
        caption: 'New memory snapshot...',
        date: '',
        location: '',
        frameStyle: 'polaroid' as const,
        filter: 'none' as const,
        rotation: (Math.random() * 6) - 3,
        tapeStyle: 'washi-gold' as const,
      },
    ];
    onUpdatePage({
      ...currentPage,
      photos: newPhotos,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 py-2 z-30">
      {/* Main Bar */}
      <div 
        id="page-customizer-toolbar"
        className="bg-stone-900/90 backdrop-blur-md text-stone-200 border border-stone-700/80 rounded-2xl shadow-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2"
      >
        {/* Left: Quick Page Style Dropdown Triggers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Typography Picker Button */}
          <button
            id="font-style-btn"
            type="button"
            onClick={() => toggleTab('fonts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'fonts'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'bg-stone-800/80 text-stone-200 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span className="truncate max-w-[100px] sm:max-w-none">
              Font: <strong className="font-semibold">{currentPage.style.fontFamily}</strong>
            </span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* Paper Texture Button */}
          <button
            id="paper-texture-btn"
            type="button"
            onClick={() => toggleTab('paper')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'paper'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'bg-stone-800/80 text-stone-200 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="capitalize">{currentPage.style.paperTexture}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* Page Layout Selector */}
          <button
            id="page-layout-btn"
            type="button"
            onClick={() => toggleTab('layout')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'layout'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'bg-stone-800/80 text-stone-200 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Layout</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* Alignment Quick Switchers */}
          <div className="hidden md:flex items-center bg-stone-800/60 rounded-xl p-0.5 border border-stone-700/50">
            <button
              type="button"
              onClick={() => handleAlignmentChange('left')}
              title="Align title left"
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                currentPage.style.titleAlignment === 'left' ? 'bg-stone-700 text-amber-300' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAlignmentChange('center')}
              title="Align title center"
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                currentPage.style.titleAlignment === 'center' ? 'bg-stone-700 text-amber-300' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAlignmentChange('right')}
              title="Align title right"
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                currentPage.style.titleAlignment === 'right' ? 'bg-stone-700 text-amber-300' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Scrapbooking Actions */}
        <div className="flex items-center gap-1.5">
          {/* Add Photo Slot */}
          <button
            id="add-photo-slot-btn"
            type="button"
            onClick={handleAddPhotoSlot}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            title="Add another photo space to this page"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Add Photo Box</span>
          </button>

          {/* Stickers button */}
          <button
            id="open-stickers-btn"
            type="button"
            onClick={onOpenStickerPalette}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            title="Add scrapbook stickers and stamps"
          >
            <Smile className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Stickers</span>
          </button>

          {/* Delete Page */}
          {canDelete && (
            <button
              id="delete-current-page-btn"
              type="button"
              onClick={onDeletePage}
              title="Delete this page"
              className="p-1.5 bg-stone-800 hover:bg-rose-900/40 text-stone-400 hover:text-rose-300 rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Popover / Expandable Dropdown Panes */}
      {activeTab === 'fonts' && (
        <div className="mt-2 p-3 bg-stone-900/95 backdrop-blur-md border border-stone-700/90 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Type className="w-3 h-3" /> Select Page Typography & Font
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.family}
                id={`font-opt-${f.family.toLowerCase().replace(/\s+/g, '-')}`}
                type="button"
                onClick={() => handleFontChange(f.family)}
                className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                  currentPage.style.fontFamily === f.family
                    ? 'border-amber-500 bg-amber-500/15 text-amber-300 shadow-xs'
                    : 'border-stone-800 bg-stone-950/60 text-stone-300 hover:border-stone-700 hover:text-white'
                }`}
              >
                <div className="text-base font-medium truncate" style={{ fontFamily: f.family }}>
                  {f.preview}
                </div>
                <div className="text-[10px] text-stone-400 mt-0.5 truncate">{f.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'paper' && (
        <div className="mt-2 p-3 bg-stone-900/95 backdrop-blur-md border border-stone-700/90 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
            <Palette className="w-3 h-3" /> Page Paper Texture & Color
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {PAPER_OPTIONS.map((p) => (
              <button
                key={p.id}
                id={`paper-opt-${p.id}`}
                type="button"
                onClick={() => handlePaperChange(p.id)}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  currentPage.style.paperTexture === p.id
                    ? 'border-amber-500 ring-1 ring-amber-500 bg-stone-800'
                    : 'border-stone-800 bg-stone-950/60 hover:border-stone-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg border shadow-xs ${p.color}`} />
                <span className="text-[10px] font-medium text-stone-300 text-center leading-tight truncate w-full">
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'layout' && (
        <div className="mt-2 p-3 bg-stone-900/95 backdrop-blur-md border border-stone-700/90 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
            <Layout className="w-3 h-3" /> Choose Page Layout Structure
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {LAYOUT_OPTIONS.map((l) => (
              <button
                key={l.id}
                id={`layout-opt-${l.id}`}
                type="button"
                onClick={() => handleLayoutChange(l.id)}
                className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                  currentPage.layout === l.id
                    ? 'border-amber-500 bg-amber-500/15 text-amber-300 shadow-xs'
                    : 'border-stone-800 bg-stone-950/60 text-stone-300 hover:border-stone-700'
                }`}
              >
                <div className="text-xs font-semibold">{l.icon}</div>
                <div className="text-[10px] text-stone-400 mt-1">{l.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
