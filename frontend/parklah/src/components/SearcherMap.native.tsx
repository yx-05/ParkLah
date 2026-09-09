import React, { useRef, useEffect, useImperativeHandle, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { SearcherMapProps, ParkingSpot } from './SearcherMap.types';

export function calculateZoomFromLatitudeDelta(latitudeDelta?: number): number {
  if (!latitudeDelta || latitudeDelta <= 0) return 16;
  return Math.max(12, Math.min(18, Math.round(Math.log(360 / latitudeDelta) / Math.LN2)));
}

export function parseLeafletBridgeMessage(
  dataString?: string,
  spots: ParkingSpot[] = [],
  onSpotPress?: (spot: ParkingSpot) => void
): { type: string; handled: boolean; spot?: ParkingSpot } {
  if (!dataString) return { type: 'EMPTY', handled: false };
  try {
    const data = JSON.parse(dataString);
    if (data.type === 'MAP_READY') {
      return { type: 'MAP_READY', handled: true };
    }
    if (data.type === 'SPOT_PRESS' && data.spotId) {
      const found = spots.find((s) => s.id === data.spotId);
      if (found && onSpotPress) {
        onSpotPress(found);
      }
      return { type: 'SPOT_PRESS', handled: !!found, spot: found };
    }
    return { type: data.type || 'UNKNOWN', handled: false };
  } catch {
    return { type: 'PARSE_ERROR', handled: false };
  }
}

export function getLeafletHtml(
  initialLat: number,
  initialLng: number,
  cartoApiKey?: string,
  initialSpots: ParkingSpot[] = []
): string {
  const keyParam = cartoApiKey ? `?key=${encodeURIComponent(cartoApiKey)}` : '';
  const tileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${keyParam}`;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #f7fafa;
      touch-action: none;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }
    /* Aegean Drift Theme Tuning for Map Tiles: harmonizes Voyager pastel tones with Aegean palette */
    .leaflet-tile-pane {
      filter: brightness(0.99) contrast(1.02) saturate(0.92) hue-rotate(-3deg);
    }
    .car-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.25s ease-out;
    }
    .car-icon-inner {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background-color: #006d77;
      border: 2.5px solid #ffffff;
      box-shadow: 0 4px 12px rgba(0, 109, 119, 0.35), 0 0 0 3px rgba(130, 211, 222, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .leaflet-div-icon.spot-pin-wrapper {
      background: transparent !important;
      border: none !important;
    }
    .spot-pin {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      background: #006d77;
      color: #ffffff;
      border-radius: 18px;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 12px rgba(0, 109, 119, 0.4);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-weight: 700;
      font-size: 11px;
      cursor: pointer;
      white-space: nowrap;
      pointer-events: auto;
      transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
    }
    .spot-pin.selected {
      background: #00535b;
      border-color: #82d3de;
      transform: scale(1.15);
      box-shadow: 0 6px 16px rgba(0, 83, 91, 0.45);
    }
    .spot-pin .p-badge {
      background: #ffffff;
      color: #006d77;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 900;
    }
    .spot-pin.selected .p-badge {
      background: #82d3de;
      color: #00353b;
    }
    .destination-marker {
      background: transparent !important;
      border: none !important;
    }
    .destination-flag-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    .destination-flag-head {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #00535b;
      border: 2.5px solid #ffffff;
      box-shadow: 0 4px 12px rgba(0, 83, 91, 0.4), 0 0 0 3px rgba(130, 211, 222, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }
    .destination-flag-pointer {
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 6px solid #00535b;
      margin-top: -1px;
      z-index: 2;
    }
    .destination-eta-badge {
      background: #00535b;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 12px;
      border: 1.5px solid #ffffff;
      box-shadow: 0 2px 6px rgba(0, 83, 91, 0.45);
      white-space: nowrap;
      margin-bottom: 4px;
      letter-spacing: 0.2px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var initialLat = ${initialLat};
    var initialLng = ${initialLng};

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0,                // Fluid continuous pinch-to-zoom (eliminates snap/bounce back)
      zoomDelta: 0.5,             // Smooth zoom steps
      bounceAtZoomLimits: false,  // Prevents rubber-band bounce when hitting min/max zoom
      wheelPxPerZoomLevel: 120,
      inertia: true,
      inertiaDeceleration: 3000,
      inertiaMaxSpeed: 2000,
      easeLinearity: 0.2,
      fadeAnimation: true,
      zoomAnimation: true,
      markerZoomAnimation: true,
      maxZoom: 19,
      minZoom: 12
    }).setView([initialLat, initialLng], 16);

    // CartoDB Voyager tiles (OpenStreetMap-based): sleek, modern pastel cartography perfectly attuned to Aegean Drift palette
    L.tileLayer('${tileUrl}', {
      subdomains: 'abcd',
      maxZoom: 19,
      keepBuffer: 4,
      updateWhenZooming: false,    // Hardware GPU CSS scale during pinch prevents tile thrashing & bounce
      crossOrigin: true
    }).addTo(map);

    var carMarker = null;
    var spotsLayer = L.layerGroup().addTo(map);
    var routeHaloLayer = null;
    var routeLayer = null;
    var destinationMarker = null;
    var currentSpots = ${JSON.stringify(initialSpots)};
    var selectedSpotId = null;

    function createCarIcon() {
      return L.divIcon({
        className: 'car-marker',
        html: '<div class="car-icon-inner"><svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z"/><circle cx="7.5" cy="14.5" r="1.5"/><circle cx="16.5" cy="14.5" r="1.5"/></svg></div>',
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });
    }

    window.updateCar = function(lat, lng) {
      if (!carMarker) {
        carMarker = L.marker([lat, lng], { icon: createCarIcon(), zIndexOffset: 1000 }).addTo(map);
      } else {
        carMarker.setLatLng([lat, lng]);
      }
    };

    window.panToLocation = function(lat, lng, zoom) {
      map.flyTo([lat, lng], zoom || map.getZoom(), { animate: true, duration: 0.8 });
    };

    window.fitBounds = function(coords) {
      if (!coords || coords.length === 0) return;
      map.fitBounds(coords, { padding: [40, 40] });
    };

    window.setSpots = function(spots) {
      currentSpots = spots || [];
      renderSpots();
    };

    window.setSelectedSpot = function(id) {
      selectedSpotId = id;
      renderSpots();
    };

    function renderSpots() {
      spotsLayer.clearLayers();
      currentSpots.forEach(function(spot) {
        var isSelected = spot.id === selectedSpotId;
        var icon = L.divIcon({
          className: 'spot-pin-wrapper',
          html: '<div class="spot-pin ' + (isSelected ? 'selected' : '') + '">' +
                '<span class="p-badge">P</span>' +
                '<span>' + (spot.pricePerHour || 2) + ' pts/h</span>' +
                '</div>',
          iconSize: [110, 36],
          iconAnchor: [55, 18]
        });
        var marker = L.marker([spot.latitude, spot.longitude], {
          icon: icon,
          zIndexOffset: isSelected ? 800 : 500
        });
        marker.on('click', function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SPOT_PRESS', spotId: spot.id }));
          }
        });
        spotsLayer.addLayer(marker);
      });
    }

    function createDestinationFlagIcon(etaText) {
      var etaHtml = etaText ? '<div class="destination-eta-badge">' + etaText + '</div>' : '';
      return L.divIcon({
        className: 'destination-marker',
        html: '<div class="destination-flag-wrap">' +
              etaHtml +
              '  <div class="destination-flag-head">' +
              '    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">' +
              '      <line x1="5" y1="21" x2="5" y2="3" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>' +
              '      <rect x="6" y="3" width="3" height="3" fill="#ffffff"/>' +
              '      <rect x="9" y="3" width="3" height="3" fill="#00353b"/>' +
              '      <rect x="12" y="3" width="3" height="3" fill="#ffffff"/>' +
              '      <rect x="15" y="3" width="3" height="3" fill="#00353b"/>' +
              '      <rect x="6" y="6" width="3" height="3" fill="#00353b"/>' +
              '      <rect x="9" y="6" width="3" height="3" fill="#ffffff"/>' +
              '      <rect x="12" y="6" width="3" height="3" fill="#00353b"/>' +
              '      <rect x="15" y="6" width="3" height="3" fill="#ffffff"/>' +
              '      <rect x="6" y="9" width="3" height="3" fill="#ffffff"/>' +
              '      <rect x="9" y="9" width="3" height="3" fill="#00353b"/>' +
              '      <rect x="12" y="9" width="3" height="3" fill="#ffffff"/>' +
              '      <rect x="15" y="9" width="3" height="3" fill="#00353b"/>' +
              '      <rect x="5.5" y="2.5" width="13" height="10" fill="none" stroke="#ffffff" stroke-width="1.2"/>' +
              '    </svg>' +
              '  </div>' +
              '  <div class="destination-flag-pointer"></div>' +
              '  <div class="destination-ground-dot"></div>' +
              '</div>',
        iconSize: etaText ? [70, 68] : [36, 46],
        iconAnchor: etaText ? [35, 68] : [18, 46]
      });
    }

    window.setRoute = function(coords, etaText) {
      if (routeHaloLayer) {
        map.removeLayer(routeHaloLayer);
        routeHaloLayer = null;
      }
      if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
      }
      if (destinationMarker) {
        map.removeLayer(destinationMarker);
        destinationMarker = null;
      }
      if (coords && coords.length > 1) {
        // Pearl Aqua halo
        routeHaloLayer = L.polyline(coords, {
          color: '#82d3de',
          weight: 9,
          opacity: 0.65,
          lineJoin: 'round',
          lineCap: 'round'
        }).addTo(map);

        // Stormy Teal core line
        routeLayer = L.polyline(coords, {
          color: '#006d77',
          weight: 5,
          opacity: 1.0,
          lineJoin: 'round',
          lineCap: 'round'
        }).addTo(map);

        // Destination Ending Flag at the end of the navigation route with ETA badge
        var destCoord = coords[coords.length - 1];
        destinationMarker = L.marker([destCoord[0], destCoord[1]], {
          icon: createDestinationFlagIcon(etaText),
          zIndexOffset: 1200
        }).addTo(map);
      }
    };

    // Place initial car and spots
    window.updateCar(initialLat, initialLng);
    if (currentSpots && currentSpots.length > 0) {
      renderSpots();
    }

    // Notify React Native that Leaflet map is fully initialized
    setTimeout(function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
      }
    }, 100);
  </script>
</body>
</html>
  `;
}

export function SearcherMap({
  userLocation,
  spots = [],
  selectedSpot,
  showRoute,
  routeCoordinates = [],
  routeEta,
  onSpotPress,
  mapRef,
}: SearcherMapProps) {
  const webViewRef = useRef<WebView>(null);
  const isMapReadyRef = useRef(false);

  const initialLat = userLocation?.latitude || 3.1176;
  const initialLng = userLocation?.longitude || 101.6778;

  const injectScript = useCallback((script: string) => {
    webViewRef.current?.injectJavaScript(`${script}; true;`);
  }, []);

  // Expose imperative methods to mapRef for backward compatibility with searcher.tsx
  useImperativeHandle(mapRef, () => ({
    animateToRegion: (
      region: { latitude: number; longitude: number; latitudeDelta?: number },
      _duration?: number
    ) => {
      const zoom = calculateZoomFromLatitudeDelta(region.latitudeDelta);
      injectScript(`window.panToLocation && window.panToLocation(${region.latitude}, ${region.longitude}, ${zoom});`);
    },
    fitToCoordinates: (
      coordinates: { latitude: number; longitude: number }[],
      _options?: any
    ) => {
      if (!coordinates || coordinates.length === 0) return;
      const bounds = coordinates.map((c) => [c.latitude, c.longitude]);
      injectScript(`window.fitBounds && window.fitBounds(${JSON.stringify(bounds)});`);
    },
  }));

  // Sync user location update
  useEffect(() => {
    if (userLocation?.latitude != null && userLocation?.longitude != null) {
      injectScript(`window.updateCar && window.updateCar(${userLocation.latitude}, ${userLocation.longitude});`);
    }
  }, [userLocation?.latitude, userLocation?.longitude, injectScript]);

  // Sync parking spots
  useEffect(() => {
    if (spots) {
      injectScript(`window.setSpots && window.setSpots(${JSON.stringify(spots)});`);
    }
  }, [spots, injectScript]);

  // Sync selected spot
  useEffect(() => {
    injectScript(`window.setSelectedSpot && window.setSelectedSpot(${JSON.stringify(selectedSpot?.id || null)});`);
  }, [selectedSpot?.id, injectScript]);

  // Sync route & ETA
  useEffect(() => {
    if (showRoute && routeCoordinates && routeCoordinates.length > 0) {
      const coordsArray = routeCoordinates.map((c) => [c.latitude, c.longitude]);
      injectScript(`window.setRoute && window.setRoute(${JSON.stringify(coordsArray)}, ${JSON.stringify(routeEta || '')});`);
    } else {
      injectScript(`window.setRoute && window.setRoute([]);`);
    }
  }, [showRoute, routeCoordinates, routeEta, injectScript]);

  const spotsRef = useRef(spots);
  spotsRef.current = spots;
  const selectedSpotRef = useRef(selectedSpot);
  selectedSpotRef.current = selectedSpot;

  const handleMessage = (event: any) => {
    try {
      const currentSpotsList = spotsRef.current || [];
      const result = parseLeafletBridgeMessage(event?.nativeEvent?.data, currentSpotsList, onSpotPress);
      if (result.type === 'MAP_READY') {
        isMapReadyRef.current = true;
        console.log('🗺️ [SearcherMap:Leaflet] Map ready event received from WebView');
        if (userLocation?.latitude != null && userLocation?.longitude != null) {
          injectScript(`window.updateCar && window.updateCar(${userLocation.latitude}, ${userLocation.longitude});`);
        }
        if (currentSpotsList.length > 0) {
          injectScript(`window.setSpots && window.setSpots(${JSON.stringify(currentSpotsList)});`);
        }
        if (selectedSpotRef.current) {
          injectScript(`window.setSelectedSpot && window.setSelectedSpot(${JSON.stringify(selectedSpotRef.current.id)});`);
        }
        if (showRoute && routeCoordinates && routeCoordinates.length > 0) {
          const coordsArray = routeCoordinates.map((c) => [c.latitude, c.longitude]);
          injectScript(`window.setRoute && window.setRoute(${JSON.stringify(coordsArray)}, ${JSON.stringify(routeEta || '')});`);
        }
      }
    } catch (e) {
      console.warn('[SearcherMap] Failed to parse message from WebView:', e);
    }
  };

  const cartoApiKey = process.env.EXPO_PUBLIC_CARTO_API_KEY || '';

  // Bakes initial spots into the HTML template on first render
  const htmlContent = useMemo(() => {
    return getLeafletHtml(initialLat, initialLng, cartoApiKey, spots);
  }, [initialLat, initialLng, cartoApiKey]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        onMessage={handleMessage}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        androidLayerType="hardware"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#f7fafa',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
