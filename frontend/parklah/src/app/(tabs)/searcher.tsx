import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { AppHeader } from '@/components/AppHeader';
import { SearcherMap } from '@/components/SearcherMap';
import { ParkingSpot } from '@/components/SearcherMap.types';
import { MatchOfferModal } from '@/components/searcher/MatchOfferModal';
import { ArrivalVerificationModal } from '@/components/searcher/ArrivalVerificationModal';
import { LocationService } from '@/services/LocationService';
import { SocketService } from '@/services/SocketService';
import { apiService } from '@/services/ApiService';
import { useSearcherStore } from '@/stores/useSearcherStore';
import { NavigationLauncher } from '@/utils/navigationLauncher';
import { MatchOffer } from '@/types';

// Default central region (Mid Valley Megamall, KL)
const DEFAULT_COORDS = {
  latitude: 3.1176,
  longitude: 101.6778,
};

const CHIPS = ['Nearest', 'Most Popular', 'Most Wanted'];

export default function SearcherScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<any>(null);

  // Searcher Store State
  const {
    state: searcherState,
    activeOffer,
    confirmedMatchId,
    startActiveSearch,
    setActiveOffer,
    acceptOffer,
    declineOffer,
    setNavigatingToSpot,
    setParkedSuccess,
    reset,
  } = useSearcherStore();

  const [userLocation, setUserLocation] = useState(DEFAULT_COORDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('Nearest');
  const [matchmaking, setMatchmaking] = useState(false);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(230);

  // Modals
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showArrivalModal, setShowArrivalModal] = useState(false);

  // 1. Initialize GPS Tracking & Real-Time WebSockets
  useEffect(() => {
    // Ensure authenticated session and WebSocket connection are active
    apiService.bootstrapSession().catch(console.error);

    const locService = LocationService.getInstance();

    // Immediately acquire high-accuracy real device GPS
    locService.getCurrentPosition().then((pos) => {
      const realCoords = { latitude: pos.latitude, longitude: pos.longitude };
      setUserLocation(realCoords);
      loadSpotsForLocation(realCoords);

      if (mapRef.current?.animateToRegion) {
        mapRef.current.animateToRegion({
          latitude: realCoords.latitude,
          longitude: realCoords.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }, 800);
      }
    }).catch(console.error);

    locService.startLocationUpdates().catch(console.error);

    const unsubLoc = locService.subscribe((loc) => {
      setUserLocation({ latitude: loc.latitude, longitude: loc.longitude });
    });

    const socketService = SocketService.getInstance();
    const unsubOffer = socketService.on('match:offer', (offer: MatchOffer) => {
      setActiveOffer(offer);
      setShowMatchModal(true);
      setMatchmaking(false);
    });

    const unsubConfirmed = socketService.on('match:confirmed', (matchData: any) => {
      if (matchData?.matchId && matchData?.spotCoordinates) {
        setNavigatingToSpot(matchData.matchId, matchData.spotCoordinates);
      }
      setShowMatchModal(false);
      setShowArrivalModal(true);
    });

    return () => {
      unsubLoc();
      unsubOffer();
      unsubConfirmed();
    };
  }, []);

  const loadSpotsForLocation = async (coords: { latitude: number; longitude: number }) => {
    try {
      const results = await apiService.searchDestination('', coords);
      if (results && results.length > 0) {
        const mappedSpots: ParkingSpot[] = results.map((r, idx) => ({
          id: r.id || `spot-${idx}`,
          name: r.name || 'Available Spot',
          address: r.address || 'Reserved Parking Area',
          rating: 4.8,
          pricePerHour: 5,
          distance: `${((r.distanceMeters || 450) / 1000).toFixed(1)} km`,
          eta: `${Math.round((r.distanceMeters || 450) / 100)} mins`,
          availableSpots: r.confidenceScore ? Math.round(r.confidenceScore * 10) : 8,
          latitude: r.latitude,
          longitude: r.longitude,
        }));
        setSpots(mappedSpots);
      }
    } catch (e) {
      // Fallback candidate spots around user's live position
      setSpots([
        {
          id: '1',
          name: 'Nearby Street Parking Bay',
          address: 'Immediate Vacant Bay',
          rating: 4.8,
          pricePerHour: 5,
          distance: '0.3 km',
          eta: '2 mins',
          availableSpots: 14,
          latitude: coords.latitude + 0.002,
          longitude: coords.longitude + 0.003,
        },
        {
          id: '2',
          name: 'Commercial Complex Bay',
          address: 'Designated Visitor Parking',
          rating: 4.9,
          pricePerHour: 6,
          distance: '0.6 km',
          eta: '4 mins',
          availableSpots: 6,
          latitude: coords.latitude - 0.003,
          longitude: coords.longitude + 0.002,
        },
        {
          id: '3',
          name: 'Public Exchange Bay',
          address: 'Short Walk Away',
          rating: 4.6,
          pricePerHour: 4,
          distance: '0.9 km',
          eta: '6 mins',
          availableSpots: 20,
          latitude: coords.latitude + 0.004,
          longitude: coords.longitude - 0.004,
        },
      ]);
    }
  };

  const handleSpotPress = (spot: ParkingSpot) => {
    setSelectedSpot(spot);
    setShowRoute(true);

    if (mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion(
        {
          latitude: (userLocation.latitude + spot.latitude) / 2 - 0.001,
          longitude: (userLocation.longitude + spot.longitude) / 2,
          latitudeDelta: 0.009,
          longitudeDelta: 0.009,
        },
        800,
      );
    }
  };

  // 2. Start Live Matchmaking with Backend Gatekeeper
  const handleStartMatchmaking = async () => {
    const target = selectedSpot || spots[0] || { latitude: userLocation.latitude, longitude: userLocation.longitude };
    setMatchmaking(true);

    try {
      await apiService.bootstrapSession();
      await apiService.startSearch(userLocation, {
        latitude: target.latitude,
        longitude: target.longitude,
        name: (target as any).name || 'Target Parking Bay',
      });
      startActiveSearch();
    } catch (e: any) {
      startActiveSearch();
    }
  };

  const handleCancelMatchmaking = async () => {
    setMatchmaking(false);
    reset();
    apiService.stopSearch().catch(() => {});
  };

  const handleChipPress = (chip: string) => {
    setActiveChip(chip);
    if (chip === 'Nearest') {
      loadSpotsForLocation(userLocation);
    } else if (chip === 'Most Popular') {
      // Pavilion KL
      const pavCoords = { latitude: 3.1488, longitude: 101.7133 };
      loadSpotsForLocation(pavCoords);
    } else {
      // KLCC
      const klccCoords = { latitude: 3.1579, longitude: 101.7116 };
      loadSpotsForLocation(klccCoords);
    }
  };

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;
    try {
      const results = await apiService.searchDestination(searchQuery, userLocation);
      if (results && results.length > 0) {
        const topResult = results[0];
        const newSpot: ParkingSpot = {
          id: topResult.id || 'search-res',
          name: topResult.name,
          address: topResult.address || 'Selected Destination',
          rating: 4.8,
          pricePerHour: 5,
          distance: `${((topResult.distanceMeters || 500) / 1000).toFixed(1)} km`,
          eta: `${Math.round((topResult.distanceMeters || 500) / 100)} mins`,
          availableSpots: 10,
          latitude: topResult.latitude,
          longitude: topResult.longitude,
        };
        setSelectedSpot(newSpot);
        setShowRoute(true);
        if (mapRef.current?.animateToRegion) {
          mapRef.current.animateToRegion({
            latitude: topResult.latitude,
            longitude: topResult.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 800);
        }
      }
    } catch (e) {
      console.warn('Destination search:', e);
    }
  };

  // 3. Match Acceptance & Turn-by-Turn Navigation
  const handleAcceptMatch = async (matchId: string) => {
    try {
      await apiService.acceptMatch(matchId);
      acceptOffer(matchId);
      setShowMatchModal(false);
      setShowArrivalModal(true);

      if (activeOffer?.spotCoords) {
        const { latitude, longitude } = activeOffer.spotCoords;
        Alert.alert(
          'Match Confirmed! 🚗',
          'Open turn-by-turn directions to reserved spot?',
          [
            { text: 'Waze', onPress: () => NavigationLauncher.openWaze(latitude, longitude) },
            { text: 'Google Maps', onPress: () => NavigationLauncher.openGoogleMaps(latitude, longitude) },
            { text: 'In-App Map Only', style: 'cancel' },
          ],
        );
      }
    } catch (err: any) {
      Alert.alert('Match Expired', err.message || 'The spot expired or was claimed.');
      declineOffer();
      setShowMatchModal(false);
    }
  };

  const handleDeclineMatch = async () => {
    if (activeOffer) {
      try {
        await apiService.declineMatch(activeOffer.matchId);
      } catch (e) {}
    }
    declineOffer();
    setShowMatchModal(false);
  };

  // 4. Arrival Verification
  const handleConfirmParked = async () => {
    const matchIdToConfirm = confirmedMatchId || activeOffer?.matchId;
    if (!matchIdToConfirm) {
      setShowArrivalModal(false);
      return;
    }
    try {
      await apiService.confirmArrival(matchIdToConfirm);
      Alert.alert('Parked Successfully! 🎉', 'Handover confirmed. Spot payment settled.');
      setParkedSuccess();
      setShowArrivalModal(false);
      setSelectedSpot(null);
      setShowRoute(false);
    } catch (err: any) {
      Alert.alert('Verification Issue', err.message || 'Unable to verify arrival at this location.');
      setShowArrivalModal(false);
    }
  };

  const handleReportSpotTaken = async () => {
    const matchIdToReport = confirmedMatchId || activeOffer?.matchId;
    if (!matchIdToReport) {
      setShowArrivalModal(false);
      reset();
      return;
    }
    try {
      await apiService.reportSpotTaken(matchIdToReport, 'Spot taken by third party upon arrival');
      Alert.alert('Dispute Filed', 'Spot reported taken. Zero fee charged.');
      setShowArrivalModal(false);
      reset();
    } catch (e: any) {
      setShowArrivalModal(false);
      reset();
    }
  };

  const handleRecenter = () => {
    if (mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      }, 600);
    }
  };

  const handleClearSelection = () => {
    setSelectedSpot(null);
    setShowRoute(false);
    handleRecenter();
  };

  const isScanning = matchmaking || searcherState === 'ACTIVE_RADAR_SEARCH';

  return (
    <View style={styles.container}>
      {/* Full-Screen Interactive Map with Viewport Padding */}
      <SearcherMap
        userLocation={userLocation}
        spots={spots}
        selectedSpot={selectedSpot}
        showRoute={showRoute}
        routeCoordinates={[
          userLocation,
          selectedSpot ? { latitude: selectedSpot.latitude, longitude: selectedSpot.longitude } : { latitude: userLocation.latitude + 0.002, longitude: userLocation.longitude + 0.003 },
        ]}
        onSpotPress={handleSpotPress}
        mapRef={mapRef}
        headerHeight={headerHeight}
      />

      {/* Floating Top Header & Search Controls */}
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
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
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
                onPress={() => handleChipPress(chip)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Matchmaking Action Button */}
        {!selectedSpot && (
          <TouchableOpacity
            style={[styles.matchButton, isScanning && styles.matchButtonActive]}
            onPress={isScanning ? handleCancelMatchmaking : handleStartMatchmaking}
            activeOpacity={0.88}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color={Theme.colors.darkTeal} style={{ marginRight: 6 }} />
            ) : null}
            <Text style={styles.matchButtonText}>
              {isScanning ? 'Radar Scanning for Spots...' : 'Start Matchmaking'}
            </Text>
            <MaterialIcons
              name={isScanning ? 'close' : 'navigation'}
              size={18}
              color={Theme.colors.darkTeal}
            />
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
                    'Reserve & Navigate',
                    `Start active radar matching at ${selectedSpot.name}?`,
                    [
                      {
                        text: 'Start Matching',
                        onPress: handleStartMatchmaking,
                      },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
                activeOpacity={0.88}
              >
                <MaterialIcons name="directions" size={20} color={Theme.colors.darkTeal} />
                <Text style={styles.navigateButtonText}>Match Leaver at this Spot</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 15-Second Match Offer Modal */}
      <MatchOfferModal
        visible={showMatchModal}
        offer={activeOffer}
        onAccept={handleAcceptMatch}
        onDecline={handleDeclineMatch}
      />

      {/* Arrival Verification Modal */}
      <ArrivalVerificationModal
        visible={showArrivalModal}
        onConfirmParked={handleConfirmParked}
        onReportSpotTaken={handleReportSpotTaken}
      />
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
    opacity: 0.9,
    backgroundColor: '#99F6E4',
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
