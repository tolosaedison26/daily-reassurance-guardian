const UBER_CLIENT_ID = "Y-2ez4hYcw441xk59D1pGduN72tB0coI";

interface UberRideParams {
  pickupLat?: number;
  pickupLng?: number;
  pickupAddress?: string;
  pickupName?: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  dropoffName?: string;
}

export function buildUberDeepLink(params: UberRideParams): string {
  const base = "https://m.uber.com/looking";
  const query = new URLSearchParams({ client_id: UBER_CLIENT_ID });

  if (params.pickupLat && params.pickupLng) {
    query.set(
      "pickup",
      JSON.stringify({
        latitude: params.pickupLat,
        longitude: params.pickupLng,
        addressLine1: params.pickupName || "Pickup",
        addressLine2: params.pickupAddress || "",
      })
    );
  } else {
    query.set("pickup", "my_location");
  }

  query.set(
    "drop[0]",
    JSON.stringify({
      latitude: params.dropoffLat,
      longitude: params.dropoffLng,
      addressLine1: params.dropoffName || "Destination",
      addressLine2: params.dropoffAddress,
    })
  );

  return `${base}?${query.toString()}`;
}

export function buildSimpleUberLink(): string {
  return `https://m.uber.com/looking?client_id=${UBER_CLIENT_ID}&pickup=my_location`;
}

/** Get the user's current position via browser Geolocation API */
export function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  });
}

/** Geocode a text query near a location using Nominatim (OpenStreetMap, free, no key) */
export async function geocodeNearby(
  query: string,
  nearLat: number,
  nearLng: number
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
    viewbox: `${nearLng - 0.3},${nearLat + 0.3},${nearLng + 0.3},${nearLat - 0.3}`,
    bounded: "1",
  });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    { headers: { "User-Agent": "DailyGuardian/1.0 (https://daily-guardian.com)" } }
  );

  const data = await res.json();
  if (data.length > 0) {
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
  }

  // Retry without bounding box if no nearby results
  const fallbackParams = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
  });
  const fallbackRes = await fetch(
    `https://nominatim.openstreetmap.org/search?${fallbackParams.toString()}`,
    { headers: { "User-Agent": "DailyGuardian/1.0 (https://daily-guardian.com)" } }
  );
  const fallbackData = await fallbackRes.json();
  if (fallbackData.length > 0) {
    return {
      lat: parseFloat(fallbackData[0].lat),
      lng: parseFloat(fallbackData[0].lon),
      displayName: fallbackData[0].display_name,
    };
  }

  return null;
}
