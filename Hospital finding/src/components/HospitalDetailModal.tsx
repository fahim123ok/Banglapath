import React from 'react';
import { 
  Globe, 
  Phone, 
  Navigation, 
  Clock, 
  ShieldAlert, 
  Star, 
  MapPin, 
  X, 
  ExternalLink, 
  ArrowRight,
  Car,
  HeartPulse
} from 'lucide-react';
import { Hospital } from '../types';

interface HospitalDetailModalProps {
  hospital: Hospital | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmNavigation: (hospital: Hospital) => void;
}

export function HospitalDetailModal({
  hospital,
  isOpen,
  onClose,
  onConfirmNavigation,
}: HospitalDetailModalProps) {
  if (!isOpen || !hospital) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white text-stone-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-stone-200/80 flex flex-col max-h-[92vh] transition-all transform animate-slide-up"
      >
        {/* Banner with Hospital Photo */}
        <div className="relative h-48 sm:h-52 w-full bg-stone-100 overflow-hidden shrink-0">
          <img
            src={hospital.imageUrl}
            alt={hospital.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onerror="this.src='https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80'"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent"></div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges on Banner */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            {hospital.emergency && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-md">
                <ShieldAlert className="w-3.5 h-3.5" /> 24/7 Emergency
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-stone-800 backdrop-blur-md shadow-xs">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              {hospital.rating} <span className="text-stone-500 font-normal">({hospital.reviewCount})</span>
            </span>
          </div>

          {/* Hospital Name & Distance on Banner Bottom */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="text-xl sm:text-2xl font-extrabold leading-tight drop-shadow-md">
              {hospital.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-stone-200 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> {hospital.distanceKm} km ({hospital.distanceMiles} mi)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-300 font-medium">
                <Car className="w-3.5 h-3.5" /> ~{hospital.estimatedDriveMinutes} mins drive
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body & Info */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Address & Hours */}
          <div className="space-y-2.5 text-xs sm:text-sm text-stone-700 bg-stone-50 rounded-2xl p-4 border border-stone-200/70">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <span className="font-medium text-stone-800">{hospital.address}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-stone-400 shrink-0" />
              <span className="text-stone-600">{hospital.openingHours || 'Open 24 Hours'}</span>
            </div>
            {hospital.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                <a 
                  href={`tel:${hospital.phone}`} 
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1"
                >
                  {hospital.phone}
                </a>
              </div>
            )}
          </div>

          {/* Clickable Hospital Website Action Button */}
          {hospital.website && (
            <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-900 truncate">Official Hospital Website</p>
                  <p className="text-[11px] text-stone-500 truncate">Visit portal for appointments & doctor directory</p>
                </div>
              </div>
              <a
                href={hospital.website}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer ml-2"
              >
                <span>Visit Site</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* User Confirmation Card: "Do you want to go to this hospital?" */}
          <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-br from-rose-50 to-amber-50/60 border-2 border-rose-200/80 shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shrink-0">
                <HeartPulse className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900">
                  Navigate to this hospital?
                </h3>
                <p className="text-xs text-stone-600">
                  We will calculate the fastest live road path from your current location.
                </p>
              </div>
            </div>

            {/* Confirmation Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-3 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                No, Browse Others
              </button>

              <button
                type="button"
                onClick={() => onConfirmNavigation(hospital)}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Yes, Start Route</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
