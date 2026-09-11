import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Car, 
  Star, 
  ShieldAlert, 
  Globe, 
  Navigation, 
  Search, 
  Filter, 
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';
import { Hospital, HospitalFilter } from '../types';

interface HospitalListSidebarProps {
  hospitals: Hospital[];
  selectedHospital: Hospital | null;
  navigatingHospital: Hospital | null;
  onSelectHospital: (hospital: Hospital) => void;
  onStartRoute: (hospital: Hospital) => void;
  isLoading: boolean;
  filter: HospitalFilter;
  onUpdateFilter: (filter: HospitalFilter) => void;
  totalFoundCount: number;
}

export function HospitalListSidebar({
  hospitals,
  selectedHospital,
  navigatingHospital,
  onSelectHospital,
  onStartRoute,
  isLoading,
  filter,
  onUpdateFilter,
  totalFoundCount,
}: HospitalListSidebarProps) {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Filtered and sorted hospitals
  const filteredHospitals = hospitals.filter((h) => {
    if (filter.onlyEmergency && !h.emergency) return false;
    if (h.distanceKm > filter.maxDistanceKm) return false;
    if (
      filter.searchQuery &&
      !h.name.toLowerCase().includes(filter.searchQuery.toLowerCase()) &&
      !h.address.toLowerCase().includes(filter.searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (filter.sortBy === 'rating') return b.rating - a.rating;
    return a.distanceKm - b.distanceKm;
  });

  return (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-md border-r border-stone-200/80 text-stone-900 shadow-xl overflow-hidden w-full lg:w-[420px] shrink-0 z-20">
      {/* Top Search & Filter Bar */}
      <div className="p-4 border-b border-stone-100 bg-stone-50/50 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => onUpdateFilter({ ...filter, searchQuery: e.target.value })}
            placeholder="Search hospitals, medical centers..."
            className="w-full pl-10 pr-4 py-2 bg-white rounded-2xl border border-stone-200/90 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 transition-all shadow-2xs"
          />
          {filter.searchQuery && (
            <button
              type="button"
              onClick={() => onUpdateFilter({ ...filter, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {/* Emergency Only toggle */}
          <button
            type="button"
            onClick={() => onUpdateFilter({ ...filter, onlyEmergency: !filter.onlyEmergency })}
            className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
              filter.onlyEmergency
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>24/7 ER Only</span>
          </button>

          {/* Distance Chips */}
          {[5, 10, 20].map((dist) => (
            <button
              key={dist}
              type="button"
              onClick={() => onUpdateFilter({ ...filter, maxDistanceKm: dist })}
              className={`shrink-0 px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                filter.maxDistanceKm === dist
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              &lt; {dist} km
            </button>
          ))}

          {/* Sort selector */}
          <button
            type="button"
            onClick={() =>
              onUpdateFilter({
                ...filter,
                sortBy: filter.sortBy === 'distance' ? 'rating' : 'distance',
              })
            }
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-stone-100 text-stone-700 font-semibold hover:bg-stone-200 transition-all cursor-pointer ml-auto"
          >
            <SlidersHorizontal className="w-3 h-3 text-stone-500" />
            <span>{filter.sortBy === 'distance' ? 'Closest' : 'Top Rated'}</span>
          </button>
        </div>
      </div>

      {/* Header Count */}
      <div className="px-4 py-2.5 bg-stone-100/50 flex items-center justify-between text-xs text-stone-500 border-b border-stone-100">
        <span className="font-semibold text-stone-700">
          {isLoading ? 'Scanning nearby hospitals...' : `${filteredHospitals.length} Real Hospitals Found`}
        </span>
        <span className="text-[11px] text-stone-400">Overpass OSM Live DB</span>
      </div>

      {/* Hospital List Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading ? (
          <div className="space-y-3 p-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse bg-stone-100 rounded-2xl p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-stone-200 rounded-xl shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-stone-200 rounded w-3/4"></div>
                    <div className="h-3 bg-stone-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredHospitals.length === 0 ? (
          <div className="p-8 text-center text-stone-500 space-y-3">
            <Building2 className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-medium">No hospitals match current filter.</p>
            <button
              type="button"
              onClick={() =>
                onUpdateFilter({
                  onlyEmergency: false,
                  maxDistanceKm: 30,
                  searchQuery: '',
                  sortBy: 'distance',
                })
              }
              className="px-4 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredHospitals.map((hosp) => {
            const isSelected = selectedHospital?.id === hosp.id;
            const isNavigating = navigatingHospital?.id === hosp.id;

            return (
              <div
                key={hosp.id}
                onClick={() => onSelectHospital(hosp)}
                className={`group relative rounded-2xl p-3.5 border transition-all duration-200 cursor-pointer ${
                  isNavigating
                    ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-400/20 shadow-md'
                    : isSelected
                    ? 'bg-rose-50/40 border-rose-300 shadow-md'
                    : 'bg-white hover:bg-stone-50/80 border-stone-200/80 shadow-2xs hover:border-stone-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-stone-200 bg-stone-100">
                    <img
                      src={hosp.imageUrl}
                      alt={hosp.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e: any) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                    {hosp.emergency && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-600 text-white shadow-xs">
                        ER
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-sm font-bold text-stone-900 leading-snug truncate group-hover:text-rose-600 transition-colors">
                        {hosp.name}
                      </h4>
                    </div>

                    <p className="text-xs text-stone-500 truncate mt-0.5">{hosp.address}</p>

                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="font-bold text-rose-600 font-mono">
                        {hosp.distanceKm} km
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <Car className="w-3 h-3" /> {hosp.estimatedDriveMinutes} min
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                        <Star className="w-3 h-3 fill-amber-500" /> {hosp.rating}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
                  {/* Website link */}
                  {hosp.website ? (
                    <a
                      href={hosp.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline py-1 px-1"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Website</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span></span>
                  )}

                  {/* Route Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartRoute(hosp);
                    }}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isNavigating
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-stone-900 hover:bg-rose-600 text-white shadow-2xs hover:scale-[1.02]'
                    }`}
                  >
                    <Navigation className="w-3 h-3" />
                    <span>{isNavigating ? 'Navigating' : 'Directions'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
