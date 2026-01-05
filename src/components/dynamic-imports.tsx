/**
 * Dynamic imports for heavy components to improve initial bundle size
 * These components are loaded on-demand when needed
 */

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Loading fallback component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Admin components (heavy due to drag-and-drop and maps)
export const DynamicRouteBuilder = dynamic(
  () => import('@/components/admin/route-builder').then((mod) => ({ default: mod.RouteBuilder })),
  {
    loading: LoadingSpinner,
    ssr: false, // Route builder requires client-side only
  }
);

// Note: RouteBuilderMap is not exported as default from route-builder-map
// For now, commenting out this import until the component export is fixed
// export const DynamicRouteBuilderMap = dynamic(
//   () => import('@/components/admin/route-builder-map'),
//   {
//     loading: LoadingSpinner,
//     ssr: false, // Maps require browser APIs
//   }
// );

export const DynamicDeliveryList = dynamic(
  () => import('@/components/admin/delivery-list').then((mod) => ({ default: mod.DeliveryList })),
  {
    loading: LoadingSpinner,
  }
);

export const DynamicWeeklyMenuList = dynamic(
  () =>
    import('@/components/admin/weekly-menu-list').then((mod) => ({ default: mod.WeeklyMenuList })),
  {
    loading: LoadingSpinner,
  }
);

// Driver components (often used on mobile with limited bandwidth)
export const DynamicLocationTracker = dynamic(
  () =>
    import('@/components/driver/location-tracker').then((mod) => ({
      default: mod.LocationTracker,
    })),
  {
    loading: LoadingSpinner,
    ssr: false, // Requires geolocation APIs
  }
);

export const DynamicRouteView = dynamic(
  () => import('@/components/driver/route-view').then((mod) => ({ default: mod.RouteView })),
  {
    loading: LoadingSpinner,
  }
);

// Maps components (heavy Google Maps library)
export const DynamicRouteMapComponent = dynamic(
  () => import('@/components/maps/route-map').then((mod) => ({ default: mod.RouteMap })),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const DynamicTrackingMap = dynamic(
  () => import('@/components/track/tracking-map').then((mod) => ({ default: mod.TrackingMap })),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

// Heavy UI components
export const DynamicWeeklyCheckout = dynamic(
  () =>
    import('@/components/menu/weekly-checkout').then((mod) => ({ default: mod.WeeklyCheckout })),
  {
    loading: LoadingSpinner,
  }
);

// Analytics/Charts (if we add charting libraries later)
export const DynamicAnalyticsDashboard = dynamic(
  () =>
    import('@/components/admin/analytics-dashboard').then((mod) => ({
      default: mod.AnalyticsDashboard,
    })),
  {
    loading: LoadingSpinner,
  }
);
