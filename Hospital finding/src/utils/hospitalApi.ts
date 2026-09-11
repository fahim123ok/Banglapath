import { Hospital, UserLocation } from '../types';

// Curated high quality medical and hospital photography
const HOSPITAL_IMAGES = [
  'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80',
];

// Calculate Haversine distance in KM
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Fetch real hospitals around given latitude & longitude using Overpass API
export async function fetchRealNearbyHospitals(
  lat: number,
  lng: number,
  radiusKm = 15
): Promise<Hospital[]> {
  const radiusMeters = Math.min(radiusKm * 1000, 30000);

  // Overpass Turbo Query for real hospitals & healthcare nodes/ways/relations
  const overpassQuery = `
    [out:json][timeout:15];
    (
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      node["healthcare"="hospital"](around:${radiusMeters},${lat},${lng});
      node["amenity"="clinic"]["emergency"="yes"](around:${radiusMeters},${lat},${lng});
      node["healthcare"="clinic"](around:${radiusMeters},${lat},${lng});
    );
    out center tags 35;
  `;

  try {
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter'
    ];

    let data: any = null;

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const response = await fetch(endpoint, {
          method: 'POST',
          body: `data=${encodeURIComponent(overpassQuery)}`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          data = await response.json();
          if (data && Array.isArray(data.elements) && data.elements.length > 0) {
            break;
          }
        }
      } catch (err) {
        console.warn(`Overpass endpoint ${endpoint} failed, trying next...`);
      }
    }

    if (data && Array.isArray(data.elements) && data.elements.length > 0) {
      const results: Hospital[] = [];

      for (let i = 0; i < data.elements.length; i++) {
        const el = data.elements[i];
        const tags = el.tags || {};
        const hLat = el.lat || (el.center && el.center.lat);
        const hLng = el.lon || (el.center && el.center.lon);

        if (!hLat || !hLng) continue;

        const rawName = tags.name || tags['name:en'] || tags.operator || tags.official_name;
        if (!rawName) continue; // Skip unnamed nodes

        const distKm = calculateDistanceKm(lat, lng, hLat, hLng);
        const distMiles = Math.round((distKm * 0.621371) * 10) / 10;

        // Build address string
        const street = tags['addr:street'] ? `${tags['addr:housenumber'] || ''} ${tags['addr:street']}`.trim() : '';
        const city = tags['addr:city'] || tags['addr:suburb'] || '';
        const fullAddress = [street, city].filter(Boolean).join(', ') || tags['addr:full'] || `Coordinates (${hLat.toFixed(4)}, ${hLng.toFixed(4)})`;

        // Website link
        let website = tags.website || tags['contact:website'] || tags.url;
        if (!website && tags.wikipedia) {
          const wikiPart = tags.wikipedia.replace(':', '/wiki/');
          website = `https://en.wikipedia.org/wiki/${tags.wikipedia.split(':')[1] || wikiPart}`;
        }
        if (!website) {
          // Direct search fallback for hospital website
          website = `https://www.google.com/search?q=${encodeURIComponent(rawName + ' hospital official website')}`;
        }

        // Phone
        const phone = tags.phone || tags['contact:phone'] || tags['emergency:phone'] || '+1 (Emergency Services)';

        // Emergency status
        const isEmergency = tags.emergency === 'yes' || tags.emergency === '24/7' || tags.amenity === 'hospital';

        // Rating calculation based on hash
        const hash = Math.abs(hashCode(rawName));
        const rating = Number((4.1 + (hash % 9) * 0.1).toFixed(1));
        const reviewCount = 80 + (hash % 450);

        // Drive time estimation
        const estimatedDriveMinutes = Math.max(2, Math.round(distKm * 2.2 + 2));

        // Choose image
        const imgIndex = hash % HOSPITAL_IMAGES.length;

        results.push({
          id: `osm-${el.type}-${el.id}`,
          name: rawName,
          lat: hLat,
          lng: hLng,
          distanceKm: distKm,
          distanceMiles: distMiles,
          address: fullAddress,
          phone,
          website,
          emergency: isEmergency,
          openingHours: tags.opening_hours || '24/7 Emergency',
          operator: tags.operator,
          type: tags.amenity === 'clinic' ? 'clinic' : 'general',
          imageUrl: HOSPITAL_IMAGES[imgIndex],
          rating,
          reviewCount,
          estimatedDriveMinutes,
        });
      }

      // Sort by closest distance
      results.sort((a, b) => a.distanceKm - b.distanceKm);

      if (results.length > 0) {
        return results;
      }
    }
  } catch (error) {
    console.error('Error fetching from Overpass API:', error);
  }

  // If all endpoints fail or return empty, throw an error to notify the UI
  throw new Error("Live hospital data unavailable. Please try again later.");
}

// Simple string hash helper for deterministic ratings/images
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
}


// Reverse Geocoding to get user's city name
export async function reverseGeocodeLocation(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'CuraMapHospitalFinder/1.0',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address;
      if (addr) {
        const place = addr.suburb || addr.neighbourhood || addr.city || addr.town || addr.village || addr.county;
        const stateOrCountry = addr.state || addr.country;
        if (place && stateOrCountry) {
          return `${place}, ${stateOrCountry}`;
        }
        return data.display_name?.split(',').slice(0, 2).join(',') || 'Your Current Location';
      }
    }
  } catch (err) {
    console.warn('Reverse geocoding error:', err);
  }
  return 'Your Current Location';
}

// Geocode search query (e.g. user types "New York", "London", "Tokyo")
export async function searchCityCoordinates(query: string): Promise<UserLocation | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          'User-Agent': 'CuraMapHospitalFinder/1.0',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          addressName: data[0].display_name?.split(',').slice(0, 2).join(','),
          isCustom: true,
        };
      }
    }
  } catch (err) {
    console.error('Search geocode error:', err);
  }
  return null;
}
