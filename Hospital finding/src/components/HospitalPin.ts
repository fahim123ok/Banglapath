import L from 'leaflet';
import { Hospital } from '../types';

export function createHospitalPinIcon(hospital: Hospital, isSelected: boolean = false): L.DivIcon {
  const isEmergency = hospital.emergency;
  const shortName = hospital.name.length > 24 ? hospital.name.substring(0, 22) + '…' : hospital.name;

  const html = `
    <div class="custom-hospital-marker group relative cursor-pointer select-none ${isSelected ? 'is-selected z-50' : 'z-20'}" style="transform: translate(-50%, -100%);">
      
      <!-- PIN HEAD: Capsule with Hospital Photo & Name -->
      <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md text-stone-900 border ${
        isSelected
          ? 'border-rose-500 ring-4 ring-rose-500/20 shadow-2xl scale-110'
          : 'border-stone-200/90 shadow-xl group-hover:scale-105 group-hover:border-rose-400'
      } transition-all duration-300 pointer-events-auto" style="min-width: 140px; max-width: 220px;">
        
        <!-- Hospital Image Thumbnail in Pin Head -->
        <div class="relative w-8 h-8 rounded-xl overflow-hidden shrink-0 border border-stone-200 bg-stone-100 shadow-inner">
          <img 
            src="${hospital.imageUrl}" 
            alt="${hospital.name}" 
            class="w-full h-full object-cover" 
            onerror="this.src='https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=200&q=80'"
          />
          ${
            isEmergency
              ? `<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white"></span>`
              : ''
          }
        </div>

        <!-- Hospital Info in Pin Head -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1">
            <span class="text-[11px] font-bold text-stone-900 truncate leading-tight font-sans block">
              ${shortName}
            </span>
          </div>
          <div class="flex items-center gap-1.5 text-[9.5px] text-stone-500 font-medium">
            <span class="text-rose-600 font-bold font-mono">${hospital.distanceKm} km</span>
            <span>•</span>
            <span class="text-emerald-700 font-semibold truncate">${hospital.estimatedDriveMinutes} min</span>
          </div>
        </div>
      </div>

      <!-- RED PIN BODY & POINTER -->
      <div class="flex flex-col items-center -mt-1 pointer-events-none">
        <div class="w-6 h-6 rounded-full ${
          isSelected ? 'bg-rose-600 ring-4 ring-rose-300' : 'bg-rose-500 group-hover:bg-rose-600'
        } text-white flex items-center justify-center shadow-lg transform transition-transform duration-200">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
        <!-- Pin Tip Needle -->
        <div class="w-0.5 h-3.5 bg-rose-600 shadow-sm"></div>
        <div class="w-2.5 h-1 bg-stone-950/20 rounded-full blur-[1px] -mt-0.5"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'leaflet-hospital-pin-container',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export function createUserLocationIcon(): L.DivIcon {
  const html = `
    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 select-none">
      <!-- Pulsing Aura -->
      <div class="absolute w-12 h-12 rounded-full bg-blue-500/25 animate-ping"></div>
      <div class="absolute w-8 h-8 rounded-full bg-blue-500/30"></div>
      <!-- Center User Dot -->
      <div class="relative w-4 h-4 rounded-full bg-blue-600 ring-3 ring-white shadow-xl flex items-center justify-center">
        <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'leaflet-user-location-container',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}
