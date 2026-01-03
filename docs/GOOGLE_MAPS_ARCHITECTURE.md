# Google Maps & Real-Time Tracking Architecture

**Created:** 2026-01-03
**Status:** 🎯 Implementation Ready
**Priority:** P0 - Critical for customer experience
**Dependencies:** Phase 4 of UI/UX Revamp Plan

---

## 🎯 Overview

Implement enterprise-grade real-time delivery tracking using Google Maps Platform APIs, matching the quality of DoorDash and Uber Eats while optimizing for cost and performance.

**Key Goals:**
1. **Customer Experience:** Live ETA updates, animated map tracking
2. **Admin Efficiency:** Visual route planning, real-time monitoring
3. **Driver Support:** Turn-by-turn navigation, status updates
4. **Cost Optimization:** Efficient API usage, caching strategies

---

## 📊 Google Maps Platform APIs

### API Selection Matrix

| API | Purpose | Usage | Monthly Est. | Cost per 1K |
|-----|---------|-------|--------------|-------------|
| **Maps JavaScript** | Interactive maps | Customer track, Admin routes | 2,000 loads | $7.00 |
| **Directions** | Route calculation | Route planning | 500 requests | $5.00 |
| **Geocoding** | Address → Lat/Long | ✅ Already used | 300 requests | $5.00 |
| **Places Autocomplete** | Address input | Onboarding | 200 sessions | $17.00 |
| **Distance Matrix** | Stop distances | Route optimization | 300 requests | $5.00 |
| **Static Maps** | Email previews | Notifications | 100 images | $2.00 |

**Total Monthly Estimate:** ~$50-100 (for 50 deliveries/week)

### API Security

**Current Setup (Good!):**
- Server-side keys for Geocoding/Directions
- Restricted browser key for Maps JS
- HTTP referrer restrictions

**Additional Security:**
```env
# Server-side (already exists)
GOOGLE_MAPS_API_KEY=AIza... # Restricted to server IPs

# Client-side (enhance)
NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=AIza... # Restricted to domain
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=abc123 # Custom map styling
```

**API Restrictions:**
- Server key: IP allowlist (Vercel IPs)
- Browser key: HTTP referrer (*.yourdomain.com/*)
- Enable only needed APIs per key
- Set daily quotas

---

## 🗺️ Real-Time Tracking System Architecture

### System Components

```
┌─────────────────────────────────────────────────┐
│  CUSTOMER TRACKING PAGE                         │
│  ┌───────────────────────────────────────────┐ │
│  │ Next.js Page (SSR)                        │ │
│  │ - Fetch initial delivery data             │ │
│  │ - Get current driver location             │ │
│  │ - Render initial map state                │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │ TrackingMap Component (Client)            │ │
│  │ - Google Maps JS API                      │ │
│  │ - Animated truck marker                   │ │
│  │ - Route polyline                          │ │
│  │ - Supabase Realtime subscription          │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                     ↓ Subscribe
┌─────────────────────────────────────────────────┐
│  SUPABASE REALTIME                              │
│  ┌───────────────────────────────────────────┐ │
│  │ driver_locations table                    │ │
│  │ - driver_id, route_id, lat, lng           │ │
│  │ - timestamp, current_stop_id              │ │
│  │ - Updated every 10 seconds                │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                     ↑ Update
┌─────────────────────────────────────────────────┐
│  DRIVER APP / MOBILE BROWSER                    │
│  ┌───────────────────────────────────────────┐ │
│  │ Location Tracker (Background)             │ │
│  │ - navigator.geolocation.watchPosition()   │ │
│  │ - POST to /api/driver/location every 10s │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Data Flow

**1. Driver starts route:**
```typescript
// Driver app initializes location tracking
const watchId = navigator.geolocation.watchPosition(
  (position) => {
    updateDriverLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
    });
  },
  (error) => console.error(error),
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  }
);
```

**2. Location updates sent to server:**
```typescript
// POST /api/driver/location
async function updateDriverLocation(location: DriverLocation) {
  await fetch('/api/driver/location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      route_id: currentRoute.id,
      driver_id: currentDriver.id,
      lat: location.lat,
      lng: location.lng,
      timestamp: new Date().toISOString(),
      current_stop_id: currentStop?.id,
    }),
  });
}
```

**3. Server updates database:**
```typescript
// src/app/api/driver/location/route.ts
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();

  // Verify driver auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // Upsert driver location
  const { error } = await supabase
    .from('driver_locations')
    .upsert({
      driver_id: body.driver_id,
      route_id: body.route_id,
      lat: body.lat,
      lng: body.lng,
      timestamp: body.timestamp,
      current_stop_id: body.current_stop_id,
    }, { onConflict: 'driver_id,route_id' });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Calculate and update ETA
  await updateCustomerETAs(body.route_id, body.current_stop_id);

  return Response.json({ success: true });
}
```

**4. Customers receive real-time updates:**
```typescript
// Customer tracking page component
useEffect(() => {
  const channel = supabase
    .channel(`delivery-${appointmentId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'driver_locations',
        filter: `route_id=eq.${routeId}`,
      },
      (payload) => {
        const newLocation = payload.new as DriverLocation;

        // Animate truck marker to new position
        animateMarker(truckMarker, {
          lat: newLocation.lat,
          lng: newLocation.lng,
        });

        // Update ETA
        calculateAndDisplayETA(newLocation);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, [appointmentId, routeId]);
```

---

## 🚗 Map Animation System

### Smooth Marker Movement

**Problem:** Jumping markers look janky, we need smooth animation

**Solution:** Linear interpolation (LERP) between positions

```typescript
// src/components/track/animated-marker.ts

interface LatLng {
  lat: number;
  lng: number;
}

class AnimatedMarker {
  private marker: google.maps.Marker;
  private animationFrameId: number | null = null;

  constructor(map: google.maps.Map, position: LatLng, icon: string) {
    this.marker = new google.maps.Marker({
      map,
      position,
      icon: {
        url: icon,
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20),
      },
    });
  }

  /**
   * Animate marker to new position over duration
   */
  animateTo(newPosition: LatLng, duration: number = 1000) {
    const startPosition = this.marker.getPosition()!;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);

      // Interpolate lat/lng
      const lat = startPosition.lat() + (newPosition.lat - startPosition.lat()) * eased;
      const lng = startPosition.lng() + (newPosition.lng - startPosition.lng()) * eased;

      this.marker.setPosition({ lat, lng });

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };

    // Cancel any ongoing animation
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    animate();
  }

  /**
   * Update heading/rotation based on direction of travel
   */
  updateHeading(previousPosition: LatLng, currentPosition: LatLng) {
    const heading = google.maps.geometry.spherical.computeHeading(
      new google.maps.LatLng(previousPosition),
      new google.maps.LatLng(currentPosition)
    );

    // Rotate marker icon
    (this.marker.getIcon() as google.maps.Symbol).rotation = heading;
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.marker.setMap(null);
  }
}

export { AnimatedMarker };
```

### Route Polyline Rendering

```typescript
// src/components/track/route-polyline.ts

function renderRoutePolyline(
  map: google.maps.Map,
  routePath: LatLng[],
  completedStops: number
) {
  // Completed portion (green)
  const completedPath = routePath.slice(0, completedStops + 1);
  new google.maps.Polyline({
    path: completedPath,
    geodesic: true,
    strokeColor: '#10B981', // emerald-500
    strokeOpacity: 1.0,
    strokeWeight: 4,
    map,
  });

  // Remaining portion (gray)
  const remainingPath = routePath.slice(completedStops);
  new google.maps.Polyline({
    path: remainingPath,
    geodesic: true,
    strokeColor: '#9CA3AF', // gray-400
    strokeOpacity: 0.7,
    strokeWeight: 4,
    strokeStyle: 'dashed', // Visual distinction
    map,
  });
}
```

---

## ⏱️ ETA Calculation Engine

### Multi-Factor ETA Algorithm

```typescript
// src/lib/maps/eta-calculator.ts

interface ETAFactors {
  distanceToCustomer: number;      // meters
  currentTraffic: number;           // traffic multiplier (1.0 - 2.0)
  averageStopTime: number;          // seconds per stop
  stopsRemaining: number;           // number of stops before customer
  timeOfDay: Date;                  // for traffic patterns
  weatherConditions?: string;       // future: weather delays
}

async function calculateCustomerETA(
  driverLocation: LatLng,
  customerLocation: LatLng,
  factors: ETAFactors
): Promise<Date> {
  // 1. Get distance/duration from Google Distance Matrix API
  const distanceMatrix = await getDistanceMatrix(
    driverLocation,
    customerLocation,
    factors.timeOfDay
  );

  // 2. Base travel time (with live traffic)
  const baseTravelSeconds = distanceMatrix.duration.value; // in seconds

  // 3. Add time for remaining stops
  const stopDelaySeconds = factors.stopsRemaining * factors.averageStopTime;

  // 4. Apply buffer (10% of total time)
  const totalSeconds = baseTravelSeconds + stopDelaySeconds;
  const bufferedSeconds = totalSeconds * 1.1;

  // 5. Calculate ETA
  const now = new Date();
  const eta = new Date(now.getTime() + bufferedSeconds * 1000);

  return eta;
}

/**
 * Call Google Distance Matrix API
 */
async function getDistanceMatrix(
  origin: LatLng,
  destination: LatLng,
  departureTime: Date
): Promise<google.maps.DistanceMatrixResponse> {
  const response = await fetch('/api/maps/distance-matrix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origins: [origin],
      destinations: [destination],
      departureTime: departureTime.toISOString(),
      trafficModel: 'best_guess', // Use live traffic
    }),
  });

  return response.json();
}

/**
 * Update all customer ETAs when driver location changes
 */
async function updateCustomerETAs(routeId: string, currentStopId: string | null) {
  const supabase = createClient();

  // Get route and remaining stops
  const { data: route } = await supabase
    .from('routes')
    .select(`
      *,
      stops:delivery_stops(*)
    `)
    .eq('id', routeId)
    .single();

  if (!route) return;

  // Get current driver location
  const { data: driverLoc } = await supabase
    .from('driver_locations')
    .select('*')
    .eq('route_id', routeId)
    .single();

  if (!driverLoc) return;

  // Find current stop index
  const currentStopIndex = currentStopId
    ? route.stops.findIndex(s => s.id === currentStopId)
    : 0;

  // Calculate ETAs for all upcoming stops
  for (let i = currentStopIndex; i < route.stops.length; i++) {
    const stop = route.stops[i];
    const stopsRemaining = i - currentStopIndex;

    const eta = await calculateCustomerETA(
      { lat: driverLoc.lat, lng: driverLoc.lng },
      { lat: stop.lat, lng: stop.lng },
      {
        distanceToCustomer: 0, // Calculated by API
        currentTraffic: 1.2, // Peak hour multiplier
        averageStopTime: 5 * 60, // 5 minutes per stop
        stopsRemaining,
        timeOfDay: new Date(),
      }
    );

    // Update stop ETA in database
    await supabase
      .from('delivery_stops')
      .update({ estimated_arrival: eta.toISOString() })
      .eq('id', stop.id);
  }
}

export { calculateCustomerETA, updateCustomerETAs };
```

---

## 🛣️ Route Optimization

### Algorithm: Google Directions API + TSP Solver

```typescript
// src/lib/maps/route-optimizer.ts

interface Stop {
  id: string;
  address: string;
  lat: number;
  lng: number;
  timeWindow?: { start: string; end: string };
}

interface OptimizedRoute {
  orderedStops: Stop[];
  totalDistance: number; // meters
  totalDuration: number; // seconds
  polyline: string;      // encoded polyline
}

/**
 * Optimize stop order using Google Directions API
 * with waypoint optimization
 */
async function optimizeRoute(
  startLocation: LatLng,
  stops: Stop[]
): Promise<OptimizedRoute> {
  // Convert stops to waypoints
  const waypoints = stops.map(stop => ({
    location: { lat: stop.lat, lng: stop.lng },
    stopover: true,
  }));

  // Call Directions API with optimization
  const response = await fetch('/api/maps/directions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: startLocation,
      destination: startLocation, // Return to start
      waypoints,
      optimizeWaypoints: true, // Google's TSP solver
      travelMode: 'DRIVING',
    }),
  });

  const data = await response.json();
  const route = data.routes[0];

  // Extract optimized order
  const optimizedOrder = route.waypoint_order;
  const orderedStops = optimizedOrder.map(index => stops[index]);

  return {
    orderedStops,
    totalDistance: route.legs.reduce((sum, leg) => sum + leg.distance.value, 0),
    totalDuration: route.legs.reduce((sum, leg) => sum + leg.duration.value, 0),
    polyline: route.overview_polyline.points,
  };
}

/**
 * Server-side API route for Directions
 */
// src/app/api/maps/directions/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
  url.searchParams.set('origin', `${body.origin.lat},${body.origin.lng}`);
  url.searchParams.set('destination', `${body.destination.lat},${body.destination.lng}`);
  url.searchParams.set('waypoints', 'optimize:true|' + body.waypoints.map(
    w => `${w.location.lat},${w.location.lng}`
  ).join('|'));
  url.searchParams.set('key', process.env.GOOGLE_MAPS_API_KEY!);

  const response = await fetch(url.toString());
  const data = await response.json();

  return NextResponse.json(data);
}

export { optimizeRoute };
```

---

## 📍 Address Autocomplete (Onboarding)

### Google Places Autocomplete

```typescript
// src/components/onboarding/address-autocomplete.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { InputField } from '@/components/ui/input-field';

interface AddressAutocompleteProps {
  onAddressSelect: (place: google.maps.places.PlaceResult) => void;
  defaultValue?: string;
}

export function AddressAutocomplete({
  onAddressSelect,
  defaultValue,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [value, setValue] = useState(defaultValue || '');

  useEffect(() => {
    if (!inputRef.current || !window.google) return;

    // Initialize autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'formatted_address', 'geometry', 'name'],
        types: ['address'],
      }
    );

    // Listen for place selection
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current!.getPlace();

      if (!place.geometry || !place.address_components) {
        console.error('No address details available');
        return;
      }

      onAddressSelect(place);
      setValue(place.formatted_address || '');
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onAddressSelect]);

  return (
    <InputField
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Start typing your address..."
      label="Delivery Address"
      helperText="We'll search as you type"
    />
  );
}

/**
 * Parse address components from Google Places result
 */
function parseAddressComponents(place: google.maps.places.PlaceResult) {
  const components = place.address_components || [];

  const getComponent = (type: string) =>
    components.find(c => c.types.includes(type))?.long_name || '';

  return {
    street_number: getComponent('street_number'),
    route: getComponent('route'),
    city: getComponent('locality'),
    state: getComponent('administrative_area_level_1'),
    zip: getComponent('postal_code'),
    formatted: place.formatted_address || '',
    lat: place.geometry?.location?.lat() || 0,
    lng: place.geometry?.location?.lng() || 0,
  };
}

export { parseAddressComponents };
```

---

## 🎨 Map Styling

### Custom Map Style (Brand Colors)

```typescript
// src/lib/maps/map-styles.ts

export const customMapStyle: google.maps.MapTypeStyle[] = [
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4B5563' }], // gray-600
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#F3F4F6' }], // gray-100
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#E5E7EB' }], // gray-200
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#DBEAFE' }], // blue-100
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#D1FAE5' }], // emerald-100
  },
  // Add more customizations...
];

/**
 * Initialize map with custom styling
 */
export function createStyledMap(
  element: HTMLElement,
  options: google.maps.MapOptions
): google.maps.Map {
  return new google.maps.Map(element, {
    ...options,
    styles: customMapStyle,
    mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  });
}
```

---

## 💾 Database Schema Updates

### New Tables Required

```sql
-- Driver locations (real-time tracking)
CREATE TABLE driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(6, 2), -- GPS accuracy in meters
  heading DECIMAL(5, 2),  -- Direction of travel (0-360)
  speed DECIMAL(5, 2),    -- km/h
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_stop_id UUID REFERENCES delivery_stops(id),

  UNIQUE(driver_id, route_id)
);

-- Index for real-time queries
CREATE INDEX idx_driver_locations_route ON driver_locations(route_id);
CREATE INDEX idx_driver_locations_timestamp ON driver_locations(timestamp DESC);

-- Enable RLS
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Drivers can update their own location
CREATE POLICY driver_update_location ON driver_locations
  FOR UPDATE USING (
    auth.uid() = driver_id
  );

-- Policy: Anyone can read driver locations for active routes
-- (customers tracking deliveries)
CREATE POLICY public_read_active_routes ON driver_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = driver_locations.route_id
      AND routes.status IN ('in_progress', 'started')
    )
  );

-- Update delivery_stops table
ALTER TABLE delivery_stops
ADD COLUMN estimated_arrival TIMESTAMPTZ,
ADD COLUMN actual_arrival TIMESTAMPTZ,
ADD COLUMN delivery_photo_url TEXT,
ADD COLUMN delivery_notes TEXT,
ADD COLUMN recipient_name TEXT;

-- Routes table enhancements
ALTER TABLE routes
ADD COLUMN driver_id UUID REFERENCES profiles(id),
ADD COLUMN start_time TIMESTAMPTZ,
ADD COLUMN end_time TIMESTAMPTZ,
ADD COLUMN actual_distance_meters INTEGER,
ADD COLUMN actual_duration_seconds INTEGER;
```

---

## 🔐 Security & Privacy

### Location Data Privacy

**Customer Protection:**
- Only share driver location with customers on that route
- Mask exact driver location (round to ~100m)
- Stop sharing after delivery complete
- Delete historical locations after 30 days

**Driver Protection:**
- Only admins see full location history
- Driver can pause location sharing (emergency only)
- No location sharing when off-duty

```typescript
// Mask location for customer view
function maskLocation(location: LatLng, precision: number = 0.001): LatLng {
  return {
    lat: Math.round(location.lat / precision) * precision,
    lng: Math.round(location.lng / precision) * precision,
  };
}
```

### Rate Limiting

**Protect APIs from abuse:**

```typescript
// src/middleware.ts
import { rateLimiter } from '@/lib/rate-limiter';

export async function middleware(request: NextRequest) {
  const ip = request.ip || 'unknown';

  // Rate limit map-related endpoints
  if (request.nextUrl.pathname.startsWith('/api/maps')) {
    const { success } = await rateLimiter.limit(ip, {
      requests: 60,
      window: '1m',
    });

    if (!success) {
      return new Response('Too many requests', { status: 429 });
    }
  }

  return NextResponse.next();
}
```

---

## 📊 Cost Optimization Strategies

### 1. Caching

```typescript
// Cache geocoding results (addresses don't change)
const geocodeCache = new Map<string, LatLng>();

async function geocodeAddress(address: string): Promise<LatLng> {
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address)!;
  }

  const result = await callGeocodingAPI(address);
  geocodeCache.set(address, result);

  return result;
}
```

### 2. Batch Requests

```typescript
// Use Distance Matrix for multiple stops at once
// Instead of multiple Directions API calls
async function getBatchDistances(
  origins: LatLng[],
  destinations: LatLng[]
): Promise<DistanceMatrix> {
  // Single API call, lower cost per pair
  return await distanceMatrixAPI(origins, destinations);
}
```

### 3. Static Maps for Emails

```typescript
// Use Static Maps API for email previews
// Cheaper than dynamic maps
function getStaticMapUrl(center: LatLng, markers: LatLng[]): string {
  const params = new URLSearchParams({
    center: `${center.lat},${center.lng}`,
    zoom: '13',
    size: '600x400',
    maptype: 'roadmap',
    markers: markers.map(m => `${m.lat},${m.lng}`).join('|'),
    key: process.env.GOOGLE_MAPS_API_KEY!,
  });

  return `https://maps.googleapis.com/maps/api/staticmap?${params}`;
}
```

### 4. Smart Update Intervals

```typescript
// Adjust location update frequency based on context
function getUpdateInterval(context: TrackingContext): number {
  if (context.isNearCustomer) {
    return 5000;  // 5 seconds when close
  } else if (context.isOnRoute) {
    return 10000; // 10 seconds normally
  } else {
    return 30000; // 30 seconds when idle
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Test ETA calculation
describe('calculateCustomerETA', () => {
  it('calculates correct ETA with traffic', async () => {
    const eta = await calculateCustomerETA(
      { lat: 34.0522, lng: -118.2437 },
      { lat: 34.0700, lng: -118.2500 },
      {
        distanceToCustomer: 5000,
        currentTraffic: 1.5, // Heavy traffic
        averageStopTime: 300,
        stopsRemaining: 2,
        timeOfDay: new Date('2026-01-11T17:00:00'),
      }
    );

    expect(eta).toBeInstanceOf(Date);
    expect(eta.getTime()).toBeGreaterThan(Date.now());
  });
});

// Test route optimization
describe('optimizeRoute', () => {
  it('returns optimized stop order', async () => {
    const stops = [/* mock stops */];
    const optimized = await optimizeRoute(startLocation, stops);

    expect(optimized.orderedStops).toHaveLength(stops.length);
    expect(optimized.totalDistance).toBeGreaterThan(0);
  });
});
```

### Integration Tests (Playwright)

```typescript
// Test real-time tracking
test('customer sees live truck movement', async ({ page }) => {
  await page.goto('/track');

  // Wait for map to load
  await page.waitForSelector('[data-testid="tracking-map"]');

  // Mock driver location update via Supabase
  await mockDriverLocationUpdate({
    lat: 34.0522,
    lng: -118.2437,
  });

  // Verify truck marker moved
  const markerPosition = await page.evaluate(() => {
    const marker = (window as any).truckMarker;
    return marker.getPosition().toJSON();
  });

  expect(markerPosition.lat).toBeCloseTo(34.0522, 4);
});
```

---

## 📱 Mobile Considerations

### Performance Optimizations

1. **Lazy load Maps API:**
```typescript
// Only load when needed
const loadGoogleMaps = () => {
  if (typeof window.google !== 'undefined') return Promise.resolve();

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
};
```

2. **Reduce map complexity on mobile:**
```typescript
const isMobile = window.innerWidth < 768;

const mapOptions = {
  zoom: isMobile ? 12 : 14,
  gestureHandling: isMobile ? 'greedy' : 'cooperative',
  styles: isMobile ? simplifiedStyles : customMapStyle,
};
```

3. **Optimize marker icons:**
```typescript
// Use SVG for retina displays
const truckIcon = {
  url: '/images/truck-marker.svg', // Vector, not raster
  scaledSize: new google.maps.Size(40, 40),
  optimized: true, // Let Google optimize rendering
};
```

---

## 🚀 Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Set up Google Maps API keys with restrictions
- [ ] Create `driver_locations` table and RLS policies
- [ ] Implement server-side `/api/driver/location` endpoint
- [ ] Set up Supabase Realtime for location updates
- [ ] Create `AnimatedMarker` component
- [ ] Create `TrackingMap` base component

### Phase 2: Customer Tracking (Week 2)
- [ ] Build customer tracking page with live map
- [ ] Implement ETA calculation engine
- [ ] Add route polyline visualization
- [ ] Create delivery status timeline
- [ ] Test real-time updates end-to-end

### Phase 3: Admin Route Planning (Week 3)
- [ ] Build route builder with drag-drop
- [ ] Integrate Directions API for route optimization
- [ ] Add stop sequence editor
- [ ] Create route metrics display
- [ ] Implement driver assignment

### Phase 4: Driver App (Week 4)
- [ ] Create driver view (mobile-optimized)
- [ ] Implement background location tracking
- [ ] Add stop status updates
- [ ] Test GPS accuracy and battery impact
- [ ] Deploy and monitor

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Technical Performance:**
   - API response times
   - Map load times
   - Location update frequency
   - GPS accuracy
   - Battery usage (driver app)

2. **Business Metrics:**
   - ETA accuracy (predicted vs. actual)
   - On-time delivery rate
   - Customer tracking engagement
   - Driver route adherence

3. **Cost Tracking:**
   - Google Maps API usage per month
   - Cost per delivery
   - API quota alerts

---

**Next Steps:** Begin Phase 1 implementation

**Last Updated:** 2026-01-03
**Owner:** Claude Code
**Status:** Ready for implementation
