import React, { useState } from 'react';
import { 
  Navigation, 
  Car, 
  Footprints, 
  Bike, 
  Clock, 
  MapPin, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Phone,
  ShieldAlert,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp
} from 'lucide-react';
import { Hospital, RouteData, RouteStep } from '../types';

interface RouteNavigationDrawerProps {
  hospital: Hospital;
  routeData: RouteData | null;
  isLoadingRoute: boolean;
  onClose: () => void;
  onChangeMode: (mode: 'driving' | 'walking' | 'cycling') => void;
  activeMode: 'driving' | 'walking' | 'cycling';
}

export function RouteNavigationDrawer({
  hospital,
  routeData,
  isLoadingRoute,
  onClose,
  onChangeMode,
  activeMode,
}: RouteNavigationDrawerProps) {
  const [isStepsExpanded, setIsStepsExpanded] = useState(false);

  const getManeuverIcon = (modifier?: string) => {
    if (!modifier) return <ArrowUp className="w-4 h-4 text-blue-500" />;
    if (modifier.includes('right')) return <CornerUpRight className="w-4 h-4 text-blue-500" />;
    if (modifier.includes('left')) return <CornerUpLeft className="w-4 h-4 text-blue-500" />;
    return <ArrowUp className="w-4 h-4 text-blue-500" />;
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}&travelmode=${activeMode}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-6 flex justify-center pointer-events-none">
      <div className="bg-white/95 text-stone-900 w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200/90 backdrop-blur-md overflow-hidden pointer-events-auto transition-all animate-slide-up">
        {/* Main Header / ETA card */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            {/* Hospital Info & ETA */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-stone-200 shadow-sm">
                <img
                  src={hospital.imageUrl}
                  alt={hospital.name}
                  className="w-full h-full object-cover"
                />
                {hospital.emergency && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-600 rounded-full ring-2 ring-white"></span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                    <Navigation className="w-3 h-3 animate-pulse" /> Live Route
                  </span>
                  <span className="text-xs text-stone-500 truncate">{hospital.address}</span>
                </div>
                <h3 className="text-base font-bold text-stone-900 truncate leading-tight mt-0.5">
                  {hospital.name}
                </h3>
              </div>
            </div>

            {/* Close route button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer shrink-0"
              title="Close Route"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Route Stats & Mode Selection */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
            {/* ETA and Distance */}
            {isLoadingRoute ? (
              <div className="flex items-center gap-2 text-xs text-stone-500 animate-pulse">
                <div className="w-4 h-4 rounded-full border-2 border-rose-500 border-t-transparent animate-spin"></div>
                <span>Computing fastest road path...</span>
              </div>
            ) : routeData ? (
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-2xl font-extrabold text-emerald-600 font-mono leading-none">
                    {routeData.durationMinutes}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 ml-1">min</span>
                </div>
                <div className="text-xs text-stone-500 font-medium pl-3 border-l border-stone-200">
                  <p className="text-stone-800 font-bold">{routeData.distanceKm} km ({routeData.distanceMiles} mi)</p>
                  <p className="text-[11px] text-stone-500">{routeData.summary}</p>
                </div>
              </div>
            ) : null}

            {/* Travel Mode Pills */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => onChangeMode('driving')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeMode === 'driving'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Drive</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeMode('walking')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeMode === 'walking'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Walk</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeMode('cycling')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeMode === 'cycling'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Bike</span>
              </button>
            </div>
          </div>

          {/* Turn-by-turn Accordion Toggle & Native Map Launch */}
          <div className="mt-3 flex items-center justify-between gap-2 pt-2">
            {routeData && routeData.steps.length > 0 && (
              <button
                type="button"
                onClick={() => setIsStepsExpanded(!isStepsExpanded)}
                className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-950 transition-colors cursor-pointer py-1"
              >
                <span>{routeData.steps.length} Road Steps</span>
                {isStepsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {hospital.phone && (
                <a
                  href={`tel:${hospital.phone}`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  <Phone className="w-3 h-3" />
                  <span className="hidden sm:inline">Call ER</span>
                </a>
              )}

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <span>Open in GPS</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Turn by Turn Step list */}
          {isStepsExpanded && routeData && (
            <div className="mt-3 max-h-48 overflow-y-auto space-y-2 pt-2 border-t border-stone-100 pr-1 text-xs">
              {routeData.steps.map((st, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getManeuverIcon(st.modifier)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800">{st.instruction}</p>
                    <p className="text-[10px] text-stone-400">
                      {st.distanceMeters > 1000
                        ? `${(st.distanceMeters / 1000).toFixed(1)} km`
                        : `${Math.round(st.distanceMeters)} m`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
