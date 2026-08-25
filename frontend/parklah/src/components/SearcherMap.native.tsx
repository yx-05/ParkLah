import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, PixelRatio } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { SearcherMapProps } from './SearcherMap.types';

const INITIAL_REGION = {
  latitude: 1.296568,
  longitude: 103.852119,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

const AEGEAN_MAP_STYLE = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#f4f8f9' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3e494a' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#00535b' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#23676f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#e1f4f2' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#006d77' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d8e4e6' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#83c5be' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#5fa8a1' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#cbebf1' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#006d77' }],
  },
  // Hide default POI/transit markers on Google Maps (Android).
  // showsPointsOfInterest={false} is iOS-only, so a style is required to keep
  // the map clean and let the custom car/parking pins stand out.
  {
    featureType: 'poi',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.text',
    stylers: [{ visibility: 'off' }],
  },
];

// --- Car marker vector content ---
// NOTE: Parking pins were removed at the user's request. On Android,
// react-native-maps (v1.20.1 in Expo Go SDK 54) has a known bug where custom
// marker VIEWS are snapshotted to a bitmap using dp sizes while the view is
// drawn at pixel size, so on high-density screens markers get clipped. To avoid
// that for the car marker we rasterize it off-screen to a PNG at device-pixel
// density and pass it via <Marker image>, with a visible fallback until ready.

// Car icon marker content: teal circle + white car silhouette (38 x 38 viewBox units).
function CarGlyph() {
  return (
    <>
      <Circle
        cx="19"
        cy="19"
        r="17.5"
        fill={Theme.colors.stormyTeal}
        stroke="#ffffff"
        strokeWidth="2.5"
      />
      {/* 24x24 car path scaled to 20 units and centered in the 38px circle */}
      <G transform="translate(9 9) scale(0.833333)">
        <Path
          d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z"
          fill="#ffffff"
        />
        <Circle cx="7.5" cy="14.5" r="1.5" fill="#ffffff" />
        <Circle cx="16.5" cy="14.5" r="1.5" fill="#ffffff" />
      </G>
    </>
  );
}

// Visible fallback marker content shown until the rasterized PNG is ready, so a
// marker is always on the map even if rasterization is delayed or fails.
function CarFallbackView() {
  return (
    <Svg width="38" height="38" viewBox="0 0 38 38">
      <CarGlyph />
    </Svg>
  );
}

// Renders an off-screen SVG and rasterizes it to a data-URI PNG at device-pixel
// density so the marker image is sharp and never clipped by the maps bug.
function OffscreenSvg({
  width,
  height,
  children,
  onReady,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
  onReady: (uri: string) => void;
}) {
  const ref = useRef<any>(null);
  const scale = PixelRatio.get();
  const pixelWidth = Math.round(width * scale);
  const pixelHeight = Math.round(height * scale);
  const doneRef = useRef(false);
  // Keep the latest callback without re-running rasterization.
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const rasterize = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    try {
      if (ref.current && typeof ref.current.toDataURL === 'function') {
        ref.current.toDataURL(
          (base64: string) => {
            // Skip suspiciously small (blank/transparent) PNGs so we keep the
            // visible fallback marker instead of an invisible one.
            if (base64 && base64.length > 500) {
              onReadyRef.current(`data:image/png;base64,${base64}`);
            }
          },
          { width: pixelWidth, height: pixelHeight }
        );
      }
    } catch (e) {
      // rasterization failed; the visible fallback marker remains
    }
  }, [pixelWidth, pixelHeight]);

  return (
    <Svg
      ref={ref}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={styles.offscreenSvg}
      onLayout={rasterize}
    >
      {children}
    </Svg>
  );
}

export function SearcherMap({
  userLocation,
  showRoute,
  routeCoordinates,
  mapRef,
  headerHeight = 230,
}: SearcherMapProps) {
  const [carImage, setCarImage] = useState<string | null>(null);

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFillObject}
        initialRegion={INITIAL_REGION}
        customMapStyle={AEGEAN_MAP_STYLE}
        showsCompass={false}
        showsPointsOfInterest={false}
        mapPadding={{
          top: headerHeight,
          bottom: 90,
          left: 10,
          right: 10,
        }}
      >
        {/* User Location Vehicle Marker */}
        <Marker
          coordinate={userLocation}
          title="Your Location"
          description="Current Location"
          anchor={{ x: 0.5, y: 0.5 }}
          style={styles.carMarkerFrame}
          image={carImage ? { uri: carImage } : undefined}
        >
          {!carImage && <CarFallbackView />}
        </Marker>

        {/* Route Navigation Polyline */}
        {showRoute && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={Theme.colors.stormyTeal}
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}
      </MapView>

      {/* Hidden off-screen SVG source used to rasterize the car marker PNG.
          Kept outside <MapView> because it only accepts map-feature children. */}
      <View style={styles.offscreenHost} pointerEvents="none">
        <OffscreenSvg key="car" width={38} height={38} onReady={setCarImage}>
          <CarGlyph />
        </OffscreenSvg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
  // Hidden container for the SVG sources that get rasterized to marker images.
  offscreenHost: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
  },
  offscreenSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
  },
  // Explicit marker frame so the custom-view fallback is sized correctly.
  carMarkerFrame: {
    width: 38,
    height: 38,
  },
});
