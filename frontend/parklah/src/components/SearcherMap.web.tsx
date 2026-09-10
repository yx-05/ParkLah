import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
  spots = [],
  selectedSpot,
  showRoute,
  routeEta,
  onSpotPress,
  headerHeight = 230,
}: SearcherMapProps) {
  const spotPositions = [
    { top: '36%', left: '24%' },
    { top: '65%', left: '68%' },
    { top: '22%', left: '60%' },
    { top: '48%', left: '76%' },
  ];

  return (
    <View style={styles.webMapContainer}>
      {/* Aegean Drift Styled Map Graphic (full bleed behind the header) */}
      <Svg width="100%" height="100%" style={styles.svgFill}>
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

      {/* Marker Layer: constrained to the visible area below the opaque top header */}
      <View style={[styles.markerLayer, { top: headerHeight }]}>
        {/* User Location Car Marker */}
        <View style={[styles.carMarkerPosition, { top: '55%' as any, left: '42%' as any }]}>
          <View style={styles.userCircle}>
            <CarSvg size={20} color="#ffffff" />
          </View>
        </View>

        {/* Parking Spot Pins */}
        {spots.map((spot, idx) => {
          const isSelected = selectedSpot?.id === spot.id;
          const pos = spotPositions[idx % spotPositions.length];
          return (
            <TouchableOpacity
              key={spot.id}
              style={[styles.spotPinPosition, { top: pos.top as any, left: pos.left as any }]}
              onPress={() => onSpotPress?.(spot)}
              activeOpacity={0.85}
            >
              <View style={[styles.spotPin, isSelected && styles.spotPinSelected]}>
                <View style={[styles.pBadge, isSelected && styles.pBadgeSelected]}>
                  <Text style={[styles.pBadgeText, isSelected && styles.pBadgeTextSelected]}>P</Text>
                </View>
                <Text style={styles.spotPinText}>{spot.pricePerHour || 2} pts/h</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Destination Ending Flag on Navigation Route */}
        {showRoute && (
          <View style={[styles.destinationFlagPosition, { left: 370, top: 280 - headerHeight }]}>
            {routeEta ? (
              <View style={styles.destinationEtaBadge}>
                <Text style={styles.destinationEtaBadgeText}>{routeEta}</Text>
              </View>
            ) : null}
            <View style={styles.destinationFlagHead}>
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <Line x1="5" y1="21" x2="5" y2="3" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                <Rect x="6" y="3" width="3" height="3" fill="#ffffff" />
                <Rect x="9" y="3" width="3" height="3" fill="#00353b" />
                <Rect x="12" y="3" width="3" height="3" fill="#ffffff" />
                <Rect x="15" y="3" width="3" height="3" fill="#00353b" />
                <Rect x="6" y="6" width="3" height="3" fill="#00353b" />
                <Rect x="9" y="6" width="3" height="3" fill="#ffffff" />
                <Rect x="12" y="6" width="3" height="3" fill="#00353b" />
                <Rect x="15" y="6" width="3" height="3" fill="#ffffff" />
                <Rect x="6" y="9" width="3" height="3" fill="#ffffff" />
                <Rect x="9" y="9" width="3" height="3" fill="#00353b" />
                <Rect x="12" y="9" width="3" height="3" fill="#ffffff" />
                <Rect x="15" y="9" width="3" height="3" fill="#00353b" />
                <Rect x="5.5" y="2.5" width="13" height="10" fill="none" stroke="#ffffff" strokeWidth="1.2" />
              </Svg>
            </View>
            <View style={styles.destinationFlagPointer} />
            <View style={styles.destinationGroundDot} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  svgFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webMapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  spotPinPosition: {
    position: 'absolute',
    transform: [{ translateX: -45 }, { translateY: -16 }],
    zIndex: 20,
  },
  spotPin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.stormyTeal,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ffffff',
    gap: 5,
    shadowColor: Theme.colors.stormyTeal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  spotPinSelected: {
    backgroundColor: Theme.colors.darkTeal,
    borderColor: Theme.colors.pearlAqua,
    transform: [{ scale: 1.12 }],
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  pBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pBadgeSelected: {
    backgroundColor: Theme.colors.pearlAqua,
  },
  pBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: Theme.colors.stormyTeal,
  },
  pBadgeTextSelected: {
    color: Theme.colors.darkTeal,
  },
  spotPinText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  destinationFlagPosition: {
    position: 'absolute',
    transform: [{ translateX: -35 }, { translateY: -64 }],
    alignItems: 'center',
    width: 70,
    zIndex: 25,
  },
  destinationEtaBadge: {
    backgroundColor: '#00535b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    marginBottom: 4,
    shadowColor: '#00535b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
  },
  destinationEtaBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  destinationFlagHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.darkTeal,
    borderWidth: 2.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.darkTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  destinationFlagPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Theme.colors.darkTeal,
    marginTop: -1,
  },
  destinationGroundDot: {
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 83, 91, 0.4)',
    marginTop: 1,
  },
});
