import React, { useState } from 'react';
import { 
  Cross, 
  MapPin, 
  Navigation2, 
  Search, 
  PhoneCall, 
  Layers, 
  RefreshCw, 
  Sparkles,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
  LocateFixed
} from 'lucide-react';
import { UserLocation } from '../types';

interface HeaderProps {
  userLocation: UserLocation;
  isLocating: boolean;
  onRefreshLocation: () => void;
  onSearchLocation: (query: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  mapStyle: 'soft' | 'satellite' | 'standard';
  onChangeMapStyle: (style: 'soft' | 'satellite' | 'standard') => void;
  hospitalCount: number;
}

export function Header({
  userLocation,
  isLocating,
  onRefreshLocation,
  onSearchLocation,
  isSidebarOpen,
  onToggleSidebar,
  mapStyle,
  onChangeMapStyle,
  hospitalCount,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchLocation(searchQuery.trim());
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-stone-200/80 px-4 py-2.5 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Sidebar Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            title={isSidebarOpen ? 'Hide list' : 'Show list'}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeftOpen className="w-5 h-5" />
            )}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6v12M6 12h12" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base text-stone-900 tracking-tight">
                  CuraMap
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                  Live Hospitals
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Current Detected Location Pill & Search Trigger */}
        <div className="flex-1 max-w-md hidden md:flex items-center justify-center">
          {isSearchOpen ? (
            <form onSubmit={handleSearchSubmit} className="w-full flex items-center gap-2">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type city or address to find hospitals..."
                  className="w-full pl-9 pr-3 py-1.5 bg-stone-100 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="px-2 py-1.5 text-stone-500 hover:text-stone-800 text-xs cursor-pointer"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-stone-100 hover:bg-stone-200/70 border border-stone-200 text-xs text-stone-700 transition-all cursor-pointer shadow-2xs max-w-full truncate"
              title="Click to search any city"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="font-semibold truncate max-w-[220px]">
                {userLocation.addressName || 'Detecting location...'}
              </span>
              <Search className="w-3 h-3 text-stone-400 shrink-0 ml-1" />
            </button>
          )}
        </div>

        {/* Right Quick Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Location Access button */}
          <button
            id="location-access-btn"
            type="button"
            onClick={onRefreshLocation}
            disabled={isLocating}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isLocating
                ? 'bg-stone-100 text-stone-400 animate-pulse'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 active:scale-95'
            }`}
            title="Access current location (F key)"
          >
            <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : 'text-rose-600'}`} />
            <span className="hidden sm:inline">Locate Me</span>
          </button>

          {/* Map Layer Switcher */}
          <div className="hidden sm:flex items-center bg-stone-100 p-0.5 rounded-xl text-xs font-semibold text-stone-600">
            <button
              type="button"
              onClick={() => onChangeMapStyle('soft')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                mapStyle === 'soft' ? 'bg-white text-stone-900 shadow-2xs' : 'hover:text-stone-900'
              }`}
            >
              Soft
            </button>
            <button
              type="button"
              onClick={() => onChangeMapStyle('standard')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                mapStyle === 'standard' ? 'bg-white text-stone-900 shadow-2xs' : 'hover:text-stone-900'
              }`}
            >
              OSM
            </button>
          </div>

          {/* Emergency 911 / 112 Speed dial button */}
          <a
            href="tel:911"
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-rose-600/20 transition-transform active:scale-95 cursor-pointer"
            title="Emergency Call Services"
          >
            <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
            <span>911</span>
          </a>
        </div>
      </div>
    </header>
  );
}
