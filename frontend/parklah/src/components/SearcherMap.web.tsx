import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Path, Rect, Circle } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { SearcherMapProps } from './SearcherMap.types';

function CarSvg({ size = 20, color = '#ffffff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z" />
      <Circle cx="7.5" cy="14.5" r="1.5" />
      <Circle cx="16.5" cy="14.5" r="1.5" />
    </Svg>
  );
}

export function SearcherMap({
  showRoute,
  headerHeight = 230,
}: SearcherMapProps) {
  return (
    <View style={styles.webMapContainer}>
      {/* Aegean Drift Styled Map Graphic (full bleed behind the header) */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
        {/* Land Background */}
        <Rect width="100%" height="100%" fill="#f4f8f9" />

        {/* River / Water Body */}
        <Path
          d="M-50,200 C150,250 250,150 450,280 C650,400 800,320 1200,380 L1200,600 L-50,600 Z"
          fill="#cbebf1"
          opacity="0.8"
        />

        {/* Parks / Greenery */}
        <Rect x="60" y="140" width="120" height="90" rx="16" fill="#e1f4f2" />
        <Rect x="260" y="380" width="140" height="100" rx="20" fill="#e1f4f2" />

        {/* Roads Grid */}
        <Line x1="0" y1="280" x2="1200" y2="280" stroke="#ffffff" strokeWidth="24" />
        <Line x1="0" y1="280" x2="1200" y2="280" stroke="#d8e4e6" strokeWidth="26" opacity="0.4" />

        <Line x1="0" y1="460" x2="1200" y2="460" stroke="#ffffff" strokeWidth="20" />
        <Line x1="200" y1="0" x2="200" y2="900" stroke="#ffffff" strokeWidth="22" />
        <Line x1="380" y1="0" x2="380" y2="900" stroke="#ffffff" strokeWidth="20" />

        {/* Main Highway */}
        <Line x1="0" y1="360" x2="1200" y2="360" stroke="#83c5be" strokeWidth="10" opacity="0.7" />

        {/* Navigation Route Line */}
        {showRoute && (
          <Path
            d="M 190 440 L 200 360 L 360 360 L 370 280"
            stroke={Theme.colors.stormyTeal}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </Svg>

      {/* Marker Layer: constrained to the visible area below the opaque top header,
          so the car marker is never hidden or clipped by the header overlay. */}
      <View style={[styles.markerLayer, { top: headerHeight }]}>
        {/* User Location Car Marker */}
        <View style={[styles.carMarkerPosition, { top: '55%' as any, left: '42%' as any }]}>
          <View style={styles.userCircle}>
            <CarSvg size={20} color="#ffffff" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webMapContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f4f8f9',
    overflow: 'hidden',
  },
  markerLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  carMarkerPosition: {
    position: 'absolute',
    // 38px circle -> shift half (19px) to keep it centered on its anchor
    transform: [{ translateX: -19 }, { translateY: -19 }],
    zIndex: 10,
  },
  userCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.colors.stormyTeal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },
});
