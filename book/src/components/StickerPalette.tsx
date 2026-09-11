import React from 'react';
import { 
  Heart, 
  Star, 
  Camera, 
  Plane, 
  Flower2, 
  Coffee, 
  Pin, 
  Stamp, 
  Sparkles, 
  Quote, 
  X, 
  Smile 
} from 'lucide-react';
import { StickerType, StickerItem } from '../types';
import { soundFx } from '../utils/audio';

interface StickerPaletteProps {
  onAddSticker: (type: StickerType) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const STICKER_LIST: { type: StickerType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'heart', label: 'Love Heart', icon: <Heart className="w-5 h-5 fill-rose-500 text-rose-600" />, color: 'bg-rose-50 border-rose-200' },
  { type: 'star', label: 'Golden Star', icon: <Star className="w-5 h-5 fill-amber-400 text-amber-500" />, color: 'bg-amber-50 border-amber-200' },
  { type: 'camera', label: 'Vintage Camera', icon: <Camera className="w-5 h-5 text-stone-800" />, color: 'bg-stone-100 border-stone-300' },
  { type: 'plane', label: 'Travel Plane', icon: <Plane className="w-5 h-5 text-sky-600" />, color: 'bg-sky-50 border-sky-200' },
  { type: 'flower', label: 'Wildflower', icon: <Flower2 className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-200' },
  { type: 'coffee', label: 'Warm Coffee', icon: <Coffee className="w-5 h-5 text-amber-800" />, color: 'bg-amber-50 border-amber-300' },
  { type: 'pin', label: 'Push Pin', icon: <Pin className="w-5 h-5 text-red-600" />, color: 'bg-red-50 border-red-200' },
  { type: 'stamp', label: 'Postage Stamp', icon: <Stamp className="w-5 h-5 text-indigo-600" />, color: 'bg-indigo-50 border-indigo-200' },
  { type: 'sparkle', label: 'Magic Sparkle', icon: <Sparkles className="w-5 h-5 fill-yellow-400 text-yellow-500" />, color: 'bg-yellow-50 border-yellow-200' },
  { type: 'quote', label: 'Memory Quote', icon: <Quote className="w-5 h-5 text-stone-700" />, color: 'bg-stone-100 border-stone-300' },
];

export const StickerPalette: React.FC<StickerPaletteProps> = ({
  onAddSticker,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 w-72 bg-stone-900/95 backdrop-blur-md text-stone-100 border border-stone-700 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-3">
        <div className="flex items-center gap-2">
          <Smile className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-200">
            Scrapbook Stickers
          </span>
        </div>
        <button
          id="close-sticker-palette-btn"
          type="button"
          onClick={onClose}
          className="text-stone-400 hover:text-stone-100 p-1 hover:bg-stone-800 rounded-md transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[11px] text-stone-400 mb-3">
        Click any decorative stamp to affix it onto this memory page:
      </p>

      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
        {STICKER_LIST.map((s) => (
          <button
            key={s.type}
            id={`add-sticker-${s.type}`}
            type="button"
            onClick={() => {
              soundFx.playClick();
              onAddSticker(s.type);
            }}
            className={`flex items-center gap-2.5 p-2 rounded-xl border text-stone-800 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer ${s.color}`}
          >
            {s.icon}
            <span className="text-xs font-medium truncate">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export const RenderStickerItem: React.FC<{
  sticker: StickerItem;
  onRemove?: () => void;
  isEditable?: boolean;
}> = ({ sticker, onRemove, isEditable = true }) => {
  const match = STICKER_LIST.find((s) => s.type === sticker.type) || STICKER_LIST[0];

  return (
    <div
      className="absolute group z-30 select-none cursor-pointer transition-transform"
      style={{
        left: `${sticker.x}%`,
        top: `${sticker.y}%`,
        transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale || 1})`,
      }}
    >
      <div className="relative p-2 bg-white/80 backdrop-blur-xs rounded-full shadow-md border border-stone-200/80 hover:shadow-lg transition-all hover:scale-110">
        {match.icon}
        {isEditable && onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title="Remove sticker"
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-xs text-[10px]"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
