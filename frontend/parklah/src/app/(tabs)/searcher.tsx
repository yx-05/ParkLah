import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { AppHeader } from '@/components/AppHeader';
import { SearcherMap } from '@/components/SearcherMap';
import { ParkingSpot } from '@/components/SearcherMap.types';

// Map region centered in the visible open viewport below top search card
const INITIAL_REGION = {
  latitude: 1.2948,
  longitude: 103.852,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

const USER_LOCATION = {
  latitude: 1.296,
  longitude: 103.852,
};

// Parking spots positioned clearly in the open viewport area
const PARKING_SPOTS: ParkingSpot[] = [
  {
    id: '1',
    name: 'Central Square Garage',
    address: '150 Victoria Street',
    rating: 4.8,
    pricePerHour: 5,
    distance: '0.4 km',
    eta: '3 mins',
    availableSpots: 12,
    latitude: 1.2952,
    longitude: 103.8565,
  },
  {
    id: '2',
    name: 'Marina Plaza Parking',
    address: '88 Raffles Blvd',
    rating: 5.0,
    pricePerHour: 6,
    distance: '0.8 km',
    eta: '5 mins',
    availableSpots: 5,
    latitude: 1.293,
    longitude: 103.854,
  },
  {
    id: '3',
    name: 'City Hub Parking',
    address: '22 Orchard Way',
    rating: 4.5,
    pricePerHour: 4,
    distance: '1.1 km',
    eta: '7 mins',
    availableSpots: 20,
    latitude: 1.294,
    longitude: 103.8475,
  },
];

const ROUTE_COORDINATES = [
  { latitude: 1.296, longitude: 103.852 },
  { latitude: 1.2958, longitude: 103.8535 },
  { latitude: 1.2952, longitude: 103.8565 },
];

const CHIPS = ['Nearest', 'Most Popular', 'Most Wanted'];

export default function SearcherScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('Nearest');
  const [matchmaking, setMatchmaking] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  // Real height of the opaque top header so map markers never hide beneath it.
  const [headerHeight, setHeaderHeight] = useState(230);

  const handleSpotPress = (spot: ParkingSpot) => {
    setSelectedSpot(spot);
    setShowRoute(true);

    if (mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion(
        {
          latitude: (USER_LOCATION.latitude + spot.latitude) / 2 - 0.001,
          longitude: (USER_LOCATION.longitude + spot.longitude) / 2,
          latitudeDelta: 0.009,
          longitudeDelta: 0.009,
        },
        800
      );
    }
  };

  const handleStartMatchmaking = () => {
    setMatchmaking(true);

    setTimeout(() => {
      setMatchmaking(false);
      const nearest = PARKING_SPOTS[0];
      setSelectedSpot(nearest);
      setShowRoute(true);

      if (mapRef.current?.animateToRegion) {
        mapRef.current.animateToRegion(
          {
            latitude: (USER_LOCATION.latitude + nearest.latitude) / 2 - 0.001,
            longitude: (USER_LOCATION.longitude + nearest.longitude) / 2,
            latitudeDelta: 0.009,
            longitudeDelta: 0.009,
          },
          1000
        );
      }
    }, 1200);
  };

  const handleRecenter = () => {
    if (mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion(INITIAL_REGION, 600);
    }
  };

  const handleClearSelection = () => {
    setSelectedSpot(null);
    setShowRoute(false);
    handleRecenter();
  };

  return (
    <View style={styles.container}>
      {/* Full-Screen Interactive Map with Viewport Padding */}
      <SearcherMap
        userLocation={USER_LOCATION}
        spots={PARKING_SPOTS}
        selectedSpot={selectedSpot}
        showRoute={showRoute}
        routeCoordinates={ROUTE_COORDINATES}
        onSpotPress={handleSpotPress}
        mapRef={mapRef}
        headerHeight={headerHeight}
      />

      {/* Floating Top Header & Search Controls (Extending all the way up to top of screen) */}
      <View
        style={[styles.topHeaderContainer, { paddingTop: insets.top }]}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <AppHeader style={{ paddingHorizontal: 4, paddingVertical: 4 }} />

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <MaterialIcons
            name="search"
            size={22}
            color={Theme.colors.outline}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search parking destinations..."
            placeholderTextColor={Theme.colors.outlineVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <MaterialIcons name="close" size={18} color={Theme.colors.outline} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {CHIPS.map((chip) => {
            const isActive = activeChip === chip;
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.chip, isActive && styles.activeChip]}
                onPress={() => setActiveChip(chip)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Matchmaking Action Button (When no spot is selected) */}
        {!selectedSpot && (
          <TouchableOpacity
            style={[styles.matchButton, matchmaking && styles.matchButtonActive]}
            onPress={handleStartMatchmaking}
            activeOpacity={0.88}
          >
            <Text style={styles.matchButtonText}>
              {matchmaking ? 'Finding Best Spot...' : 'Start Matchmaking'}
            </Text>
            <MaterialIcons name="navigation" size={18} color={Theme.colors.darkTeal} />
          </TouchableOpacity>
        )}
      </View>

      {/* Recenter Floating Action Button */}
      <View
        style={[
          styles.recenterButtonContainer,
          { bottom: selectedSpot ? 230 : 95 + insets.bottom },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity style={styles.recenterFab} onPress={handleRecenter} activeOpacity={0.8}>
          <MaterialIcons name="my-location" size={22} color={Theme.colors.stormyTeal} />
        </TouchableOpacity>
      </View>

      {/* Floating Bottom Spot Detail Card */}
      {selectedSpot && (
        <View style={[styles.bottomCardWrapper, { bottom: 85 + insets.bottom }]}>
          <View style={styles.spotDetailCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleCol}>
                <Text style={styles.cardSpotName} numberOfLines={1}>
                  {selectedSpot.name}
                </Text>
                <Text style={styles.cardSpotAddress} numberOfLines={1}>
                  {selectedSpot.address}
                </Text>
              </View>

              <TouchableOpacity onPress={handleClearSelection} style={styles.closeCardButton}>
                <MaterialIcons name="close" size={18} color={Theme.colors.outline} />
              </TouchableOpacity>
            </View>

            {/* Badges Row */}
            <View style={styles.badgesRow}>
              <View style={styles.badgePill}>
                <MaterialIcons name="near-me" size={14} color={Theme.colors.stormyTeal} />
                <Text style={styles.badgePillText}>
                  {selectedSpot.distance} • {selectedSpot.eta}
                </Text>
              </View>

              <View style={styles.badgePill}>
                <MaterialIcons name="star" size={14} color={Theme.colors.starGold} />
                <Text style={styles.badgePillText}>{selectedSpot.rating.toFixed(1)}</Text>
              </View>

              <View style={styles.pricePill}>
                <Text style={styles.pricePillText}>${selectedSpot.pricePerHour}/hr</Text>
              </View>
            </View>

            {/* Action Button */}
            <View style={styles.cardActionsRow}>
              <TouchableOpacity
                style={styles.navigateButton}
                onPress={() => {
                  Alert.alert(
                    'Spot Reserved!',
                    `Proceeding to ${selectedSpot.name}. Points will be calculated upon exit.`,
                    [
                      {
                        text: 'View Wallet',
                        onPress: () => router.push('/points'),
                      },
                      { text: 'OK', style: 'cancel' },
                    ]
                  );
                }}
                activeOpacity={0.88}
              >
                <MaterialIcons name="directions" size={20} color={Theme.colors.darkTeal} />
                <Text style={styles.navigateButtonText}>Navigate to Spot</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  topHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Theme.colors.background,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
    zIndex: 50,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 16,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(190, 200, 202, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 14,
    color: Theme.colors.onSurface,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  chipsContainer: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(190, 200, 202, 0.3)',
  },
  activeChip: {
    backgroundColor: Theme.colors.pearlAqua,
    borderColor: Theme.colors.stormyTeal,
  },
  chipText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
  },
  activeChipText: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    color: Theme.colors.darkTeal,
  },
  matchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.pearlAqua,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 12,
    gap: 8,
    marginTop: 2,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.stormyTeal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0, 109, 119, 0.16)',
      },
    }),
  },
  matchButtonActive: {
    opacity: 0.85,
  },
  matchButtonText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 14,
    color: Theme.colors.darkTeal,
  },
  recenterButtonContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 60,
  },
  recenterFab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0,0,0,0.14)',
      },
    }),
  },
  bottomCardWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 60,
  },
  spotDetailCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: Theme.borderRadius.default,
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 6px 20px rgba(0,0,0,0.12)',
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleCol: {
    flex: 1,
    paddingRight: 8,
  },
  cardSpotName: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  cardSpotAddress: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  closeCardButton: {
    padding: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceIce,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    gap: 4,
  },
  badgePillText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: 12,
    color: Theme.colors.onSurface,
  },
  pricePill: {
    backgroundColor: Theme.colors.pearlAqua,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
  },
  pricePillText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 12,
    color: Theme.colors.darkTeal,
  },
  cardActionsRow: {
    marginTop: 2,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.pearlAqua,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.stormyTeal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 4px 10px rgba(0, 109, 119, 0.14)',
      },
    }),
  },
  navigateButtonText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 14,
    color: Theme.colors.darkTeal,
  },
});
