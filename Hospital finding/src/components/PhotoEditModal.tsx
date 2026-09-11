import React, { useState } from 'react';
import { X, Sliders, Check, Sparkles, MapPin, Calendar, Type, RotateCw } from 'lucide-react';
import { PhotoItem, FrameStyle, PhotoFilter, TapeStyle } from '../types';
import { soundFx } from '../utils/audio';

interface PhotoEditModalProps {
  photo: PhotoItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: PhotoItem) => void;
}

export const PhotoEditModal: React.FC<PhotoEditModalProps> = ({
  photo,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !photo) return null;

  const [draft, setDraft] = useState<PhotoItem>({ ...photo });

  const frameOptions: { id: FrameStyle; label: string; desc: string }[] = [
    { id: 'polaroid', label: 'Classic Polaroid', desc: 'Authentic instant film white border' },
    { id: 'vintage-tape', label: 'Vintage Tape', desc: 'Craft scrapbook with washi tape' },
    { id: 'golden-border', label: 'Golden Baroque', desc: 'Elegant embossed gilded trim' },
    { id: 'filmstrip', label: '35mm Filmstrip', desc: 'Cinema roll perforations' },
    { id: 'stamp-border', label: 'Scalloped Stamp', desc: 'Postage stamp serrated edges' },
    { id: 'rounded', label: 'Soft Modern', desc: 'Gentle rounded radius with matting' },
    { id: 'minimal', label: 'Clean Borderless', desc: 'Pure photo with subtle drop shadow' },
  ];

  const filterOptions: { id: PhotoFilter; label: string; previewClass: string }[] = [
    { id: 'none', label: 'Original', previewClass: 'filter-none' },
    { id: 'warm', label: 'Golden Hour', previewClass: 'sepia(0.2) saturate(1.25) contrast(1.05)' },
    { id: 'vintage', label: 'Vintage 70s', previewClass: 'sepia(0.35) contrast(0.95) brightness(1.08) hue-rotate(-8deg)' },
    { id: 'sepia', label: 'Sepia Nostalgia', previewClass: 'sepia(0.75) contrast(1.1)' },
    { id: 'bw', label: 'Noir B&W', previewClass: 'grayscale(1) contrast(1.18)' },
    { id: 'vivid', label: 'Vibrant Pop', previewClass: 'saturate(1.45) contrast(1.12)' },
    { id: 'cool', label: 'Nordic Frost', previewClass: 'hue-rotate(18deg) saturate(1.1)' },
  ];

  const tapeOptions: { id: TapeStyle; label: string; color: string }[] = [
    { id: 'washi-gold', label: 'Gold Washi', color: 'bg-amber-300' },
    { id: 'washi-pink', label: 'Rose Washi', color: 'bg-rose-300' },
    { id: 'washi-teal', label: 'Teal Washi', color: 'bg-teal-300' },
    { id: 'kraft-tape', label: 'Brown Kraft', color: 'bg-amber-800' },
    { id: 'clear-tape', label: 'Clear Film', color: 'bg-stone-300' },
    { id: 'none', label: 'No Tape', color: 'bg-transparent border-dashed' },
  ];

  const handleSave = () => {
    soundFx.playClick();
    onSave(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="photo-edit-modal-dialog"
        className="relative w-full max-w-2xl bg-stone-900 text-stone-100 border border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-100">Customize Photograph</h3>
              <p className="text-xs text-stone-400">Personalize photo framing, mood filters, rotation, and memory notes</p>
            </div>
          </div>
          <button
            id="close-photo-edit-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Preview Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-stone-950/40 rounded-xl border border-stone-800/80">
            <div className="w-44 shrink-0 flex items-center justify-center">
              <div 
                className="transition-transform duration-200"
                style={{ transform: `rotate(${draft.rotation}deg)` }}
              >
                <div className={`overflow-hidden shadow-lg ${
                  draft.frameStyle === 'polaroid' ? 'bg-stone-50 p-2 pb-5 rounded-xs' :
                  draft.frameStyle === 'golden-border' ? 'p-1.5 bg-linear-to-b from-amber-200 to-amber-400 rounded-xs' :
                  draft.frameStyle === 'rounded' ? 'rounded-xl overflow-hidden border-2 border-stone-600' :
                  draft.frameStyle === 'filmstrip' ? 'bg-stone-950 p-1 rounded' : 'rounded-sm'
                }`}>
                  <img
                    src={draft.url}
                    alt="Preview"
                    className="w-32 h-32 object-cover"
                    style={{
                      filter: filterOptions.find(f => f.id === draft.filter)?.previewClass || 'none',
                    }}
                  />
                  {draft.frameStyle === 'polaroid' && (
                    <p className="text-[10px] text-center text-stone-800 mt-1 font-serif truncate max-w-[120px]">
                      {draft.caption || 'Caption text...'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Rotation & Tilt Control */}
            <div className="flex-1 w-full space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  Scrapbook Tilt Angle
                </span>
                <span className="font-mono text-amber-400 bg-stone-800 px-2 py-0.5 rounded text-[11px]">
                  {draft.rotation > 0 ? `+${draft.rotation}°` : `${draft.rotation}°`}
                </span>
              </div>
              <input
                id="photo-rotation-slider"
                type="range"
                min="-12"
                max="12"
                step="1"
                value={draft.rotation}
                onChange={(e) => setDraft({ ...draft, rotation: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                <span>-12° Left</span>
                <span>0° Flat</span>
                <span>+12° Right</span>
              </div>
            </div>
          </div>

          {/* 1. Frame Style Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Photo Frame Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {frameOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setDraft({ ...draft, frameStyle: opt.id });
                  }}
                  className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                    draft.frameStyle === opt.id
                      ? 'border-amber-500 bg-amber-500/15 text-white shadow-xs'
                      : 'border-stone-800 bg-stone-900/60 text-stone-300 hover:border-stone-700 hover:bg-stone-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{opt.label}</span>
                    {draft.frameStyle === opt.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1 leading-tight">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Color Mood Filters */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Nostalgic Color Filter
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {filterOptions.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setDraft({ ...draft, filter: f.id });
                  }}
                  className={`p-2 flex flex-col items-center rounded-xl border transition-all cursor-pointer ${
                    draft.filter === f.id
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300 ring-1 ring-amber-500'
                      : 'border-stone-800 bg-stone-900/60 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden mb-1.5 border border-stone-700">
                    <img
                      src={draft.url}
                      alt={f.label}
                      className="w-full h-full object-cover"
                      style={{ filter: f.previewClass }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-center truncate w-full">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Washi Tape Decor */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Scrapbook Washi Tape
            </label>
            <div className="flex flex-wrap gap-2">
              {tapeOptions.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setDraft({ ...draft, tapeStyle: t.id });
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    draft.tapeStyle === t.id
                      ? 'border-amber-500 bg-amber-500/15 text-white'
                      : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full border border-stone-600 ${t.color}`} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Caption, Date, Location Metadata */}
          <div className="space-y-4 pt-2 border-t border-stone-800">
            <div>
              <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5 mb-1.5">
                <Type className="w-3.5 h-3.5 text-amber-400" />
                Photo Caption
              </label>
              <input
                id="modal-photo-caption"
                type="text"
                value={draft.caption}
                placeholder="Write a sweet memory caption..."
                onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Date Captured
                </label>
                <input
                  id="modal-photo-date"
                  type="text"
                  value={draft.date || ''}
                  placeholder="e.g. October 14, 2024"
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Location / City
                </label>
                <input
                  id="modal-photo-location"
                  type="text"
                  value={draft.location || ''}
                  placeholder="e.g. Kyoto, Japan"
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-800 bg-stone-950/60">
          <button
            id="cancel-photo-edit-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="save-photo-edit-btn"
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
