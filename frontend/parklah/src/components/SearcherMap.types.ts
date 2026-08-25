export interface ParkingSpot {
  id: string;
  name: string;
  address: string;
  rating: number;
  pricePerHour: number;
  distance: string;
  eta: string;
  availableSpots: number;
  latitude: number;
  longitude: number;
}

export interface SearcherMapProps {
  userLocation: { latitude: number; longitude: number };
  spots: ParkingSpot[];
  selectedSpot: ParkingSpot | null;
  showRoute: boolean;
  routeCoordinates: { latitude: number; longitude: number }[];
  onSpotPress: (spot: ParkingSpot) => void;
  mapRef: React.RefObject<any>;
  /**
   * Measured height (px) of the floating top header/search overlay.
   * Markers are kept inside the visible map area below this offset so they
   * are never hidden or clipped by the opaque header.
   */
  headerHeight?: number;
}
