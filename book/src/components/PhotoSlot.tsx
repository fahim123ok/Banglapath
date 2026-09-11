import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Edit3, Trash2, Sparkles, MapPin, Calendar, RefreshCw } from 'lucide-react';
import { PhotoItem, FrameStyle, PhotoFilter, TapeStyle } from '../types';
import { processUploadedFile } from '../utils/storage';
import { soundFx } from '../utils/audio';

interface PhotoSlotProps {
  photo?: PhotoItem;
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'wide' | 'auto';
  onUpdatePhoto: (updated: PhotoItem) => void;
  onRemovePhoto?: () => void;
  onOpenEditor: (photo: PhotoItem) => void;
  fontFamily?: string;
  isCompact?: boolean;
}

export const PhotoSlot: React.FC<PhotoSlotProps> = ({
  photo,
  aspectRatio = 'portrait',
  onUpdatePhoto,
  onRemovePhoto,
  onOpenEditor,
  fontFamily = 'Caveat',
  isCompact = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processUploadedFile(file);
      soundFx.playCameraShutter();
      if (photo) {
        onUpdatePhoto({
          ...photo,
          url: dataUrl,
        });
      } else {
        const newPhoto: PhotoItem = {
          id: 'photo-' + Date.now(),
          url: dataUrl,
          caption: 'My cherished moment...',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          location: '',
          frameStyle: 'polaroid',
          filter: 'warm',
          rotation: (Math.random() * 4) - 2,
          tapeStyle: 'washi-gold',
        };
        onUpdatePhoto(newPhoto);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const dataUrl = await processUploadedFile(file);
      soundFx.playCameraShutter();
      if (photo) {
        onUpdatePhoto({ ...photo, url: dataUrl });
      } else {
        const newPhoto: PhotoItem = {
          id: 'photo-' + Date.now(),
          url: dataUrl,
          caption: 'Special moment...',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          location: '',
          frameStyle: 'polaroid',
          filter: 'none',
          rotation: 0,
          tapeStyle: 'washi-gold',
        };
        onUpdatePhoto(newPhoto);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getFilterStyle = (filter: PhotoFilter) => {
    switch (filter) {
      case 'warm': return 'sepia(0.2) saturate(1.25) contrast(1.05) brightness(1.02)';
      case 'sepia': return 'sepia(0.75) contrast(1.1) brightness(0.96)';
      case 'bw': return 'grayscale(1) contrast(1.18) brightness(0.98)';
      case 'vintage': return 'sepia(0.35) contrast(0.95) brightness(1.08) hue-rotate(-8deg)';
      case 'vivid': return 'saturate(1.45) contrast(1.12)';
      case 'cool': return 'hue-rotate(18deg) saturate(1.1) brightness(1.02)';
      default: return 'none';
    }
  };

  // Tape rendering helper
  const renderTape = (tape: TapeStyle) => {
    if (tape === 'none') return null;
    let tapeClass = 'bg-amber-100/80 border-amber-300/40 text-amber-900';
    if (tape === 'washi-pink') tapeClass = 'bg-rose-200/85 border-rose-300/50 text-rose-800';
    if (tape === 'washi-teal') tapeClass = 'bg-teal-200/85 border-teal-300/50 text-teal-800';
    if (tape === 'kraft-tape') tapeClass = 'bg-amber-800/70 border-amber-900/40 text-amber-100';
    if (tape === 'clear-tape') tapeClass = 'bg-white/40 border-white/60 backdrop-blur-xs text-stone-600';

    return (
      <div 
        className={`absolute -top-3 left-1/2 -translate-x-1/2 z-20 h-5 w-16 md:w-20 shadow-xs transform -rotate-1 border border-dashed rounded-xs pointer-events-none ${tapeClass}`}
        style={{
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}
      />
    );
  };

  const getAspectClass = () => {
    if (aspectRatio === 'square') return 'aspect-square';
    if (aspectRatio === 'landscape') return 'aspect-4/3';
    if (aspectRatio === 'wide') return 'aspect-16/9';
    if (aspectRatio === 'portrait') return 'aspect-3/4';
    return 'aspect-auto min-h-[140px]';
  };

  // If no photo or URL is empty, render upload placeholder
  if (!photo || !photo.url) {
    return (
      <div
        id="photo-upload-placeholder"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          soundFx.playClick();
          fileInputRef.current?.click();
        }}
        className={`group relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 select-none ${getAspectClass()} ${
          isDragging
            ? 'border-amber-500 bg-amber-500/15 scale-[1.02]'
            : 'border-stone-400/50 hover:border-amber-600/70 bg-stone-100/50 hover:bg-amber-50/60 shadow-inner'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center text-center space-y-2 p-2">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-amber-100/90 text-amber-800 flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:bg-amber-200 transition-transform">
            <Camera className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-xs md:text-sm font-semibold text-stone-700 font-serif">
              Click to Upload Photo
            </p>
            <p className="text-[10px] md:text-xs text-stone-500 mt-0.5">
              or drag & drop image here
            </p>
          </div>
          <span className="inline-flex items-center text-[10px] text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full font-medium">
            <Sparkles className="w-2.5 h-2.5 mr-1" /> Add memory
          </span>
        </div>
      </div>
    );
  }

  // Render configured photo with selected frame style
  const { frameStyle, filter, rotation, tapeStyle, caption, date, location } = photo;

  return (
    <div
      id={`photo-frame-${photo.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative group transition-transform duration-200 my-1"
      style={{
        transform: `rotate(${rotation || 0}deg)`,
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Tape decoration */}
      {renderTape(tapeStyle)}

      {/* Frame Container */}
      <div
        className={`relative transition-all duration-300 ${
          frameStyle === 'polaroid'
            ? 'bg-stone-50 p-2.5 pb-4 md:p-3 md:pb-6 rounded-xs shadow-md border border-stone-200/80'
            : frameStyle === 'golden-border'
            ? 'p-2 bg-linear-to-b from-amber-200 via-amber-100 to-amber-300 rounded-sm shadow-lg border-2 border-amber-400'
            : frameStyle === 'vintage-tape'
            ? 'p-1.5 bg-stone-100 rounded shadow-md border border-stone-300'
            : frameStyle === 'filmstrip'
            ? 'bg-stone-950 p-2 pt-3 pb-3 text-stone-100 rounded-sm shadow-xl border-x-4 border-dashed border-stone-800'
            : frameStyle === 'stamp-border'
            ? 'p-2 bg-white shadow-md border-2 border-dashed border-stone-400 rounded-sm'
            : frameStyle === 'rounded'
            ? 'p-1.5 bg-white rounded-2xl shadow-md border border-stone-200'
            : 'rounded-sm shadow-sm'
        }`}
        style={{
          boxShadow:
            frameStyle === 'polaroid'
              ? '0 6px 14px -2px rgba(0, 0, 0, 0.16), 0 2px 5px -1px rgba(0, 0, 0, 0.08)'
              : '0 4px 10px rgba(0,0,0,0.12)',
        }}
      >
        {/* Filmstrip top holes */}
        {frameStyle === 'filmstrip' && (
          <div className="flex justify-between items-center px-1 mb-1 opacity-70">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-2.5 h-1.5 bg-stone-800 rounded-xs" />
            ))}
          </div>
        )}

        {/* Image Container with Filter */}
        <div className={`relative overflow-hidden ${frameStyle === 'rounded' ? 'rounded-xl' : 'rounded-xs'} ${getAspectClass()} bg-stone-200`}>
          <img
            src={photo.url}
            alt={caption || 'Memory photograph'}
            className="w-full h-full object-cover select-none transition-transform duration-500 group-hover:scale-102"
            style={{
              filter: getFilterStyle(filter),
            }}
            referrerPolicy="no-referrer"
            loading="lazy"
          />

          {/* Quick Floating Action Bar on Hover */}
          <div
            className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 flex items-center justify-center gap-2 ${
              isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <button
              id={`edit-photo-btn-${photo.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundFx.playClick();
                onOpenEditor(photo);
              }}
              title="Customize photo style & caption"
              className="p-2 bg-white/90 hover:bg-white text-stone-800 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              id={`replace-photo-btn-${photo.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundFx.playClick();
                fileInputRef.current?.click();
              }}
              title="Replace photo"
              className="p-2 bg-white/90 hover:bg-white text-stone-800 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {onRemovePhoto && (
              <button
                id={`delete-photo-btn-${photo.id}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundFx.playClick();
                  onRemovePhoto();
                }}
                title="Remove photo"
                className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filmstrip bottom holes */}
        {frameStyle === 'filmstrip' && (
          <div className="flex justify-between items-center px-1 mt-1 opacity-70">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-2.5 h-1.5 bg-stone-800 rounded-xs" />
            ))}
          </div>
        )}

        {/* Caption and Meta Section */}
        {(frameStyle === 'polaroid' || caption || date || location) && (
          <div className={`pt-2 px-1 text-center ${isCompact ? 'pt-1' : 'pt-2'}`}>
            <input
              type="text"
              value={caption || ''}
              placeholder="Add photo caption..."
              onChange={(e) => onUpdatePhoto({ ...photo, caption: e.target.value })}
              className={`w-full text-center bg-transparent border-b border-transparent hover:border-stone-300 focus:border-amber-500 focus:outline-hidden transition-colors ${
                frameStyle === 'filmstrip' ? 'text-stone-200' : 'text-stone-800'
              } ${isCompact ? 'text-xs' : 'text-sm md:text-base font-normal'}`}
              style={{
                fontFamily: fontFamily,
              }}
            />

            {/* Optional Location / Date Pill */}
            {(date || location) && (
              <div className="flex items-center justify-center gap-2 mt-1 text-[10px] md:text-xs text-stone-500">
                {location && (
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 text-amber-600" />
                    {location}
                  </span>
                )}
                {date && (
                  <span className="inline-flex items-center gap-0.5">
                    <Calendar className="w-2.5 h-2.5 text-stone-400" />
                    {date}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
