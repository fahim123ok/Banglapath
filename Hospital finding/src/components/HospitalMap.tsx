import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Hospital, RouteData, UserLocation } from '../types';
import { createHospitalPinIcon, createUserLocationIcon } from './HospitalPin';

interface HospitalMapProps {
  userLocation: UserLocation;
  hospitals: Hospital[];
  selectedHospital: Hospital | null;
  navigatingHospital: Hospital | null;
  routeData: RouteData | null;
  onSelectHospital: (hospital: Hospital) => void;
  mapStyle?: 'soft' | 'satellite' | 'standard';
}

export function HospitalMap({
  userLocation,
  hospitals,
  selectedHospital,
  navigatingHospital,
  routeData,
  onSelectHospital,
  mapStyle = 'soft',
}: HospitalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeGlowPolylineRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Soft minimalist tile layer (CartoDB Positron - clean, soft, modern)
    const getTileUrl = (style: string) => {
      if (style === 'satellite') {
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      }
      if (style === 'standard') {
        return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      }
      return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    };

    const tileLayer = L.tileLayer(getTileUrl(mapStyle), {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Layer for markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapInstanceRef.current = map;

    // Invalidate size on initial mount and multiple intervals
    const timers = [
      setTimeout(() => map.invalidateSize(), 50),
      setTimeout(() => map.invalidateSize(), 200),
      setTimeout(() => map.invalidateSize(), 500),
      setTimeout(() => map.invalidateSize(), 1000),
    ];

    // Resize observer to ensure no map container layout bugs
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      timers.forEach(clearTimeout);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Force invalidate size when container or screen shifts
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
    }
  });

  // Update Tile Layer if mapStyle changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const tileUrl =
      mapStyle === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : mapStyle === 'standard'
        ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(tileUrl);
    }
  }, [mapStyle]);

  // Update User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: createUserLocationIcon(),
        zIndexOffset: 1000,
      }).addTo(map);
    }
  }, [userLocation.lat, userLocation.lng]);

  // Render Red Hospital Pins
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    hospitals.forEach((hosp) => {
      const isSelected =
        selectedHospital?.id === hosp.id || navigatingHospital?.id === hosp.id;
      const icon = createHospitalPinIcon(hosp, isSelected);

      const marker = L.marker([hosp.lat, hosp.lng], {
        icon,
        zIndexOffset: isSelected ? 500 : 100,
      });

      marker.on('click', () => {
        onSelectHospital(hosp);
      });

      markersLayer.addLayer(marker);
    });
  }, [hospitals, selectedHospital?.id, navigatingHospital?.id, onSelectHospital]);

  // Render Real-Time Road Path Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean up old polylines
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    if (routeGlowPolylineRef.current) {
      map.removeLayer(routeGlowPolylineRef.current);
      routeGlowPolylineRef.current = null;
    }

    if (routeData && routeData.coordinates.length > 0) {
      // Glow underlay polyline
      const glowPolyline = L.polyline(routeData.coordinates, {
        color: '#f43f5e',
        weight: 9,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Primary crisp route polyline
      const primaryPolyline = L.polyline(routeData.coordinates, {
        color: '#e11d48',
        weight: 4.5,
        opacity: 0.95,
        dashArray: routeData.mode === 'walking' ? '8, 8' : undefined,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routeGlowPolylineRef.current = glowPolyline;
      routePolylineRef.current = primaryPolyline;

      // Fit bounds to show entire route with padding
      const bounds = L.latLngBounds(routeData.coordinates);
      bounds.extend([userLocation.lat, userLocation.lng]);
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 16,
        animate: true,
      });
    }
  }, [routeData, userLocation.lat, userLocation.lng]);

  // Re-center on user if no active route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || routeData) return;

    if (hospitals.length > 0) {
      const bounds = L.latLngBounds(
        hospitals.map((h) => [h.lat, h.lng] as [number, number])
      );
      bounds.extend([userLocation.lat, userLocation.lng]);
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
      });
    } else {
      map.setView([userLocation.lat, userLocation.lng], 14, { animate: true });
    }
  }, [userLocation.lat, userLocation.lng, hospitals.length, !!routeData]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-stone-100">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
}
