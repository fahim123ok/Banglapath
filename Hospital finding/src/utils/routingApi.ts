import { RouteData, RouteStep } from '../types';

export async function fetchRealRoadRoute(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number,
  mode: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<RouteData | null> {
  const osrmProfile = mode === 'walking' ? 'foot' : mode === 'cycling' ? 'bike' : 'driving';
  const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const primaryRoute = data.routes[0];
        const rawCoords: [number, number][] = primaryRoute.geometry.coordinates;
        
        // Leaflet expects [lat, lng] while GeoJSON is [lng, lat]
        const leafletCoords: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

        const distanceMeters = primaryRoute.distance;
        const durationSec = primaryRoute.duration;
        const distKm = Math.round((distanceMeters / 1000) * 10) / 10;
        const distMiles = Math.round((distKm * 0.621371) * 10) / 10;
        const durationMin = Math.max(1, Math.round(durationSec / 60));

        // Parse navigation steps
        const steps: RouteStep[] = [];
        if (primaryRoute.legs && primaryRoute.legs[0] && primaryRoute.legs[0].steps) {
          primaryRoute.legs[0].steps.forEach((st: any) => {
            const maneuver = st.maneuver || {};
            const instruction = formatManeuverInstruction(maneuver, st.name);
            steps.push({
              instruction,
              distanceMeters: st.distance,
              durationSeconds: st.duration,
              streetName: st.name || 'Unnamed Road',
              modifier: maneuver.modifier,
              type: maneuver.type,
            });
          });
        }

        return {
          coordinates: leafletCoords,
          distanceKm: distKm,
          distanceMiles: distMiles,
          durationMinutes: durationMin,
          summary: primaryRoute.legs?.[0]?.summary || 'Fastest Route via Road Network',
          steps,
          mode,
        };
      }
    }
  } catch (error) {
    console.warn('OSRM routing request timed out or failed, generating interpolated road line...', error);
  }

  // If OSRM routing request fails, throw an error to notify the UI instead of generating a fake route
  throw new Error("Live routing data unavailable. Please try again later.");
}

function formatManeuverInstruction(maneuver: any, streetName?: string): string {
  const type = maneuver.type || 'continue';
  const mod = maneuver.modifier || '';
  const street = streetName ? `onto ${streetName}` : '';

  switch (type) {
    case 'depart':
      return `Head ${mod || 'forward'} ${street}`.trim();
    case 'turn':
      return `Turn ${mod || 'ahead'} ${street}`.trim();
    case 'end of road':
      return `At the end of the road, turn ${mod || 'ahead'} ${street}`.trim();
    case 'fork':
      return `Keep ${mod || 'right'} at the fork ${street}`.trim();
    case 'roundabout':
      return `Enter roundabout and take exit ${street}`.trim();
    case 'arrive':
      return `Arrive at hospital destination on the ${mod || 'side'}`.trim();
    default:
      return `Continue ${mod ? mod + ' ' : ''}${street}`.trim();
  }
}

