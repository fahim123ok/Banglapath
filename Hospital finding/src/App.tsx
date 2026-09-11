import React, { useState, useEffect, useCallback } from 'react';
import { 
  Navigation, 
  MapPin, 
  Search, 
  ShieldAlert, 
  Layers, 
  LocateFixed, 
  AlertCircle, 
  Info, 
  X,
  Compass
} from 'lucide-react';
import { Hospital, UserLocation, RouteData, HospitalFilter } from './types';
import { fetchRealNearbyHospitals, reverseGeocodeLocation, searchCityCoordinates } from './utils/hospitalApi';
import { fetchRealRoadRoute } from './utils/routingApi';
import { HospitalMap } from './components/HospitalMap';
import { HospitalListSidebar } from './components/HospitalListSidebar';
import { HospitalDetailModal } from './components/HospitalDetailModal';
import { RouteNavigationDrawer } from './components/RouteNavigationDrawer';
import { Header } from './components/Header';

// Default initial location: Central London / Manhattan / User IP approx fallback
const DEFAULT_LOCATION: UserLocation = {
  lat: 40.73061,
  lng: -73.935242,
  addressName: 'New York, NY',
};

export default function App() {
  const [userLocation, setUserLocation] = useState<UserLocation>(DEFAULT_LOCATION);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [navigatingHospital, setNavigatingHospital] = useState<Hospital | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);

  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [mapStyle, setMapStyle] = useState<'soft' | 'satellite' | 'standard'>('soft');
  const [activeTravelMode, setActiveTravelMode] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [filter, setFilter] = useState<HospitalFilter>({
    onlyEmergency: false,
    maxDistanceKm: 25,
    searchQuery: '',
    sortBy: 'distance',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load real hospitals for a location
  const loadHospitalsForLocation = useCallback(async (lat: number, lng: number) => {
    setIsLoadingHospitals(true);
    try {
      const results = await fetchRealNearbyHospitals(lat, lng, filter.maxDistanceKm);
      setHospitals(results);
      if (results.length > 0) {
        showToast(`Found ${results.length} real medical centers & hospitals near you`);
      }
    } catch (err) {
      console.error('Failed to load hospitals:', err);
      showToast('Could not fetch hospitals. Please check connection.');
    } finally {
      setIsLoadingHospitals(false);
    }
  }, [filter.maxDistanceKm]);

  // Handle GPS location access (by button or "F" key)
  const handleRequestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    showToast('Detecting your precise GPS location...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        const addressName = await reverseGeocodeLocation(lat, lng);

        const newLoc: UserLocation = {
          lat,
          lng,
          accuracy,
          addressName,
          isCustom: false,
        };

        setUserLocation(newLoc);
        setIsLocating(false);
        showToast(`Location locked: ${addressName}`);

        loadHospitalsForLocation(lat, lng);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        showToast('Location permission denied or unavailable. Please use the search bar to find hospitals in your city.');
        // Do not automatically load hospitals for the fallback location (New York) to avoid misleading the user.
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, [loadHospitalsForLocation, userLocation.lat, userLocation.lng]);

  // Request location on first mount
  useEffect(() => {
    handleRequestLocation();
  }, []);

  // Keyboard shortcut listener: Press "F" or "L" for Location access
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (e.key === 'f' || e.key === 'F' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        handleRequestLocation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRequestLocation]);

  // Search any city/address
  const handleSearchLocation = async (query: string) => {
    setIsLocating(true);
    showToast(`Searching location "${query}"...`);
    const result = await searchCityCoordinates(query);
    setIsLocating(false);

    if (result) {
      setUserLocation(result);
      showToast(`Moved to ${result.addressName}`);
      
      // UX FIX: Close sidebar on mobile after search to see the map
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
      
      loadHospitalsForLocation(result.lat, result.lng);
      // Clear previous routes
      setNavigatingHospital(null);
      setRouteData(null);
    } else {
      showToast(`Could not find "${query}". Please try another name.`);
    }
  };

  // Hospital Pin Clicked -> Opens detail & confirmation modal
  const handleSelectHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital);
  };

  // User confirms "Yes, Start Route"
  const handleConfirmNavigation = async (hospital: Hospital) => {
    setSelectedHospital(null);
    setNavigatingHospital(hospital);
    setIsLoadingRoute(true);
    
    // UX FIX: Close sidebar on mobile to reveal the live map route
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }

    showToast(`Calculating real-time road route to ${hospital.name}...`);

    try {
      const route = await fetchRealRoadRoute(
        userLocation.lat,
        userLocation.lng,
        hospital.lat,
        hospital.lng,
        activeTravelMode
      );
      setRouteData(route);
      if (route) {
        showToast(`Route active: ${route.durationMinutes} mins (${route.distanceKm} km)`);
      }
    } catch (err) {
      console.error('Failed to compute route:', err);
      showToast('Could not compute road path. Please try again.');
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Switch travel mode (drive, walk, cycle)
  const handleChangeTravelMode = async (mode: 'driving' | 'walking' | 'cycling') => {
    setActiveTravelMode(mode);
    if (navigatingHospital) {
      setIsLoadingRoute(true);
      const route = await fetchRealRoadRoute(
        userLocation.lat,
        userLocation.lng,
        navigatingHospital.lat,
        navigatingHospital.lng,
        mode
      );
      setRouteData(route);
      setIsLoadingRoute(false);
    }
  };

  // Close live navigation
  const handleCloseNavigation = () => {
    setNavigatingHospital(null);
    setRouteData(null);
    showToast('Navigation ended.');
  };

  return (
    <div className="h-screen h-[100dvh] w-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-rose-500/20 selection:text-rose-900 overflow-hidden">
      {/* MINIMALIST SOFT UI TOP BAR */}
      <Header
        userLocation={userLocation}
        isLocating={isLocating}
        onRefreshLocation={handleRequestLocation}
        onSearchLocation={handleSearchLocation}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        mapStyle={mapStyle}
        onChangeMapStyle={setMapStyle}
        hospitalCount={hospitals.length}
      />

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-stone-900/90 backdrop-blur-md text-white text-xs font-semibold rounded-2xl shadow-xl border border-stone-700/60 flex items-center gap-2 animate-slide-up">
          <Info className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{toastMessage}</span>
          <button 
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:text-rose-300 ml-1 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* MAIN CONTENT AREA: SIDEBAR + MAP */}
      <div className="flex-1 flex relative overflow-hidden min-h-0 w-full">
        {/* Left Side: Hospital List & Filters (Responsive collapsible) */}
        {isSidebarOpen && (
          <div className="absolute lg:relative inset-0 lg:inset-auto z-20 w-full lg:w-auto flex h-full min-h-0">
            <HospitalListSidebar
              hospitals={hospitals}
              selectedHospital={selectedHospital}
              navigatingHospital={navigatingHospital}
              onSelectHospital={handleSelectHospital}
              onStartRoute={handleConfirmNavigation}
              isLoading={isLoadingHospitals}
              filter={filter}
              onUpdateFilter={setFilter}
              totalFoundCount={hospitals.length}
            />

            {/* Backdrop on mobile */}
            <div
              className="flex-1 bg-black/40 backdrop-blur-2xs lg:hidden cursor-pointer"
              onClick={() => setIsSidebarOpen(false)}
            />
          </div>
        )}

        {/* Right Side: Map Canvas */}
        <div className="flex-1 relative h-full w-full min-h-0">
          <HospitalMap
            userLocation={userLocation}
            hospitals={hospitals}
            selectedHospital={selectedHospital}
            navigatingHospital={navigatingHospital}
            routeData={routeData}
            onSelectHospital={handleSelectHospital}
            mapStyle={mapStyle}
          />

          {/* Floating Action Controls on Map */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 pointer-events-auto">
            {/* Quick Locate Button */}
            <button
              type="button"
              onClick={handleRequestLocation}
              disabled={isLocating}
              className={`p-3 bg-white hover:bg-stone-50 text-stone-800 rounded-2xl shadow-xl border border-stone-200/80 transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center ${
                isLocating ? 'animate-spin text-rose-600' : ''
              }`}
              title="Access your location (or press F key)"
            >
              <LocateFixed className="w-5 h-5 text-rose-600" />
            </button>

            {/* Re-center / Compass button */}
            <button
              type="button"
              onClick={() => {
                if (hospitals.length > 0) {
                  showToast('Re-centered on nearby hospital cluster');
                }
              }}
              className="p-3 bg-white hover:bg-stone-50 text-stone-800 rounded-2xl shadow-xl border border-stone-200/80 transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center"
              title="Re-center view"
            >
              <Compass className="w-5 h-5 text-stone-600" />
            </button>
          </div>

          {/* Floating Tip Banner on Bottom-Left if no route is active */}
          {!navigatingHospital && (
            <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 px-3.5 py-2 bg-white/90 backdrop-blur-md rounded-2xl border border-stone-200/80 text-xs text-stone-600 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>Click any red pin to view hospital details, visit website, or start road route</span>
              <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px] font-mono text-stone-500">
                Press F for GPS
              </kbd>
            </div>
          )}
        </div>
      </div>

      {/* HOSPITAL DETAIL & NAVIGATION CONFIRMATION MODAL */}
      <HospitalDetailModal
        hospital={selectedHospital}
        isOpen={!!selectedHospital}
        onClose={() => setSelectedHospital(null)}
        onConfirmNavigation={handleConfirmNavigation}
      />

      {/* ACTIVE LIVE ROUTE NAVIGATION DRAWER */}
      {navigatingHospital && (
        <RouteNavigationDrawer
          hospital={navigatingHospital}
          routeData={routeData}
          isLoadingRoute={isLoadingRoute}
          onClose={handleCloseNavigation}
          onChangeMode={handleChangeTravelMode}
          activeMode={activeTravelMode}
        />
      )}
    </div>
  );
}
