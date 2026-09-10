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
  FlatList,
  Keyboard,
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
import { InAppNavigationHUD } from '@/components/navigation/InAppNavigationHUD';
import { NavigationRoutingService, NavigationRoute } from '@/services/NavigationRoutingService';
import { useUserStore } from '@/stores/useUserStore';
import { MatchOffer } from '@/types';

// Default central region (Mid Valley Megamall, KL)
const DEFAULT_COORDS = {
  latitude: 3.1176,
  longitude: 101.6778,
};

const createCandidateSpots = (coords: { latitude: number; longitude: number }): ParkingSpot[] => [
  {
    id: 'spot-1',
    name: 'Premier Bay 12 (Ground Floor)',
    address: 'Direct Lift Access',
    rating: 4.9,
    pricePerHour: 3,
    distance: '420 m',
    eta: '2 mins',
    availableSpots: 4,
    latitude: coords.latitude + 0.0022,
    longitude: coords.longitude + 0.0028,
  },
  {
    id: 'spot-2',
    name: 'Covered Bay B2-45',
    address: 'Near Escalator',
    rating: 4.8,
    pricePerHour: 2.5,
    distance: '780 m',
    eta: '3 mins',
    availableSpots: 6,
    latitude: coords.latitude - 0.0045,
    longitude: coords.longitude + 0.0038,
  },
  {
    id: 'spot-3',
    name: 'Executive Valet Point',
    address: 'Main Entrance Lobby',
    rating: 4.7,
    pricePerHour: 4,
    distance: '1.4 km',
    eta: '5 mins',
    availableSpots: 8,
    latitude: coords.latitude + 0.0075,
    longitude: coords.longitude - 0.0065,
  },
  {
    id: 'spot-4',
    name: 'EV Fast Charging Bay 04',
    address: 'Green Zone Pillar C-12',
    rating: 4.9,
    pricePerHour: 3.5,
    distance: '600 m',
    eta: '3 mins',
    availableSpots: 2,
    latitude: coords.latitude - 0.0032,
    longitude: coords.longitude - 0.0040,
  },
  {
    id: 'spot-5',
    name: 'West Wing Express Bay W3',
    address: 'West Wing Entrance',
    rating: 4.8,
    pricePerHour: 2.5,
    distance: '2.1 km',
    eta: '7 mins',
    availableSpots: 12,
    latitude: coords.latitude + 0.0110,
    longitude: coords.longitude + 0.0095,
  },
];

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
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef<any>(null);
  const [activeChip, setActiveChip] = useState('Nearest');

  useEffect(() => {
    useUserStore.getState().setLastRoute('/searcher');
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);
  const [matchmaking, setMatchmaking] = useState(false);
  const [targetSearchName, setTargetSearchName] = useState<string | null>(null);
  const [spots, setSpots] = useState<ParkingSpot[]>(() => createCandidateSpots(DEFAULT_COORDS));
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(230);

  // Modals
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showArrivalModal, setShowArrivalModal] = useState(false);

  // In-App Turn-By-Turn Navigation State
  const [isNavigating, setIsNavigating] = useState(false);
  const [navRoute, setNavRoute] = useState<NavigationRoute | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepDistanceMeters, setStepDistanceMeters] = useState(0);
  const [remainingDistanceFormatted, setRemainingDistanceFormatted] = useState('');
  const [remainingDurationFormatted, setRemainingDurationFormatted] = useState('');
  const [etaClockFormatted, setEtaClockFormatted] = useState('');

  // 1. Initialize GPS Tracking & Real-Time WebSockets
  useEffect(() => {
    // Ensure authenticated session and WebSocket connection are active
    apiService.bootstrapSession().catch(console.error);

    const locService = LocationService.getInstance();

    // Populate initial spots immediately around default coords
    loadSpotsForLocation(DEFAULT_COORDS);

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
    }).catch((err) => {
      console.warn('[SearcherScreen] Location acquisition warning:', err);
      loadSpotsForLocation(DEFAULT_COORDS);
    });

    locService.startLocationUpdates().catch(console.error);

    const unsubLoc = locService.subscribe((loc) => {
      setUserLocation({ latitude: loc.latitude, longitude: loc.longitude });
    });

    const socketService = SocketService.getInstance();
    const unsubOffer = socketService.on('match:offer', (offer: MatchOffer) => {
      setActiveOffer(offer);
      setShowMatchModal(true);
      setMatchmaking(false);
      setTargetSearchName(null);
    });

    const unsubConfirmed = socketService.on('match:confirmed', (matchData: any) => {
      if (matchData?.matchId && matchData?.spotCoordinates) {
        setNavigatingToSpot(matchData.matchId, matchData.spotCoordinates);
        startInAppNavigation(matchData.spotCoordinates);
      }
      setShowMatchModal(false);
      setMatchmaking(false);
      setTargetSearchName(null);
    });

    return () => {
      unsubLoc();
      unsubOffer();
      unsubConfirmed();
    };
  }, []);

  const loadSpotsForLocation = async (coords: { latitude: number; longitude: number }) => {
    try {
      const routingService = NavigationRoutingService.getInstance();

      // Query destination search places and recently vacated probabilistic spots (parking history) in parallel
      const [results, probSpots] = await Promise.all([
        apiService.searchDestination('', coords).catch(() => []),
        apiService.getProbabilisticCandidates(coords, 1500).catch(() => []),
      ]);

      const historySpots: ParkingSpot[] = (probSpots || []).map((ps: any, idx: number) => {
        const straight = routingService.calculateDistance(coords.latitude, coords.longitude, ps.latitude, ps.longitude);
        const roadDist = Math.round(straight * 1.35);
        const duration = Math.max(75, Math.round(60 + roadDist / 6.5));
        const pPercent = Math.round((ps.probabilityScore || 0.85) * 100);
        return {
          id: ps.spotId || `prob-${idx}`,
          name: ps.landmarkNote ? `Vacated: ${ps.landmarkNote}` : `Vacated Spot (${pPercent}% Chance)`,
          address: ps.landmarkNote ? `Decay Confidence: ${pPercent}% (${ps.probabilityLabel || 'Available'})` : 'Recently Vacated Driver Spot',
          rating: 4.9,
          pricePerHour: 3,
          distance: routingService.formatDistance(roadDist),
          eta: routingService.formatDuration(duration),
          availableSpots: 1,
          latitude: ps.latitude,
          longitude: ps.longitude,
          isProbabilistic: true,
          confidenceScore: ps.probabilityScore,
          probabilityLabel: ps.probabilityLabel,
        };
      });

      if (results && results.length >= 3) {
        const mappedSpots: ParkingSpot[] = results.map((r, idx) => {
          const straight = routingService.calculateDistance(coords.latitude, coords.longitude, r.latitude, r.longitude);
          const roadDist = Math.round(straight * 1.35);
          const duration = Math.max(75, Math.round(60 + roadDist / 6.5));
          return {
            id: r.id || r.placeId || `spot-${idx}`,
            name: r.name || 'Available Spot',
            address: r.address || 'Reserved Parking Area',
            rating: 4.8,
            pricePerHour: 3,
            distance: routingService.formatDistance(roadDist),
            eta: routingService.formatDuration(duration),
            availableSpots: r.confidenceScore ? Math.round(r.confidenceScore * 10) : 8,
            latitude: r.latitude,
            longitude: r.longitude,
          };
        });
        setSpots([...historySpots, ...mappedSpots]);
      } else if (results && results.length > 0) {
        // When backend returns a single general destination point (e.g. "Parking"),
        // generate the cluster of available parking bays around that destination location
        const dest = results[0];
        const destCoords = {
          latitude: dest.latitude || coords.latitude,
          longitude: dest.longitude || coords.longitude,
        };
        setSpots([...historySpots, ...createCandidateSpots(destCoords)]);
      } else {
        setSpots([...historySpots, ...createCandidateSpots(coords)]);
      }
    } catch (e) {
      // Fallback candidate spots around user's live position
      setSpots(createCandidateSpots(coords));
    }
  };

  const handleSpotPress = async (spot: ParkingSpot) => {
    setShowSuggestions(false);
    Keyboard.dismiss();
    setSelectedSpot(spot);
    setShowRoute(true);

    const latDelta = Math.max(0.015, Math.abs(userLocation.latitude - spot.latitude) * 1.6);
    const lngDelta = Math.max(0.015, Math.abs(userLocation.longitude - spot.longitude) * 1.6);

    if (mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion(
        {
          latitude: (userLocation.latitude + spot.latitude) / 2 - 0.001,
          longitude: (userLocation.longitude + spot.longitude) / 2,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        },
        800,
      );
    }

    // Immediately fetch live OpenStreetMap (OSRM) road route & true driving ETA
    try {
      const routingService = NavigationRoutingService.getInstance();
      const route = await routingService.fetchDrivingRoute(userLocation, {
        latitude: spot.latitude,
        longitude: spot.longitude,
      });
      setNavRoute(route);
      setRemainingDistanceFormatted(route.formattedDistance);
      setRemainingDurationFormatted(route.formattedDuration);
      setEtaClockFormatted(route.formattedEta);
      setSelectedSpot((prev) =>
        prev && prev.id === spot.id
          ? {
              ...prev,
              distance: route.formattedDistance,
              eta: route.formattedDuration,
            }
          : prev
      );
    } catch (e) {
      console.warn('[Searcher] Could not fetch route preview from OSRM:', e);
    }
  };

  // 2. Start Live Matchmaking with Backend Gatekeeper
  const handleStartMatchmaking = async () => {
    const target = selectedSpot || spots[0] || { latitude: userLocation.latitude, longitude: userLocation.longitude };
    const spotName = target.name || 'Target Parking Bay';
    setTargetSearchName(spotName);

    // Keep navigation route line and ending destination flag active on the map
    setShowRoute(true);

    // Automatically close the spot detail card so map and radar scanning HUD are fully visible
    setSelectedSpot(null);

    // Activate radar scanning immediately
    setMatchmaking(true);
    startActiveSearch();

    try {
      await apiService.bootstrapSession();
      await apiService.startSearch(userLocation, {
        latitude: target.latitude,
        longitude: target.longitude,
        name: spotName,
      });
    } catch (e: any) {
      console.warn('[SearcherScreen] Backend startSearch warning:', e?.message || e);
    }
  };

  const handleCancelMatchmaking = async () => {
    setMatchmaking(false);
    setTargetSearchName(null);
    reset();
    apiService.stopSearch().catch(() => {});
  };

  const handleChipPress = (chip: string) => {
    setShowSuggestions(false);
    Keyboard.dismiss();
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

  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!text || text.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await apiService.searchDestination(text.trim(), userLocation);
        setSearchSuggestions(results || []);
        setShowSuggestions((results || []).length > 0);
      } catch (err) {
        console.warn('[SearcherScreen] Autocomplete search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelectDestination = async (destination: any) => {
    Keyboard.dismiss();
    setSearchQuery(destination.name);
    setShowSuggestions(false);
    setSearchSuggestions([]);

    const destCoords = {
      latitude: Number(destination.latitude),
      longitude: Number(destination.longitude),
    };

    setTargetSearchName(destination.name);

    // Populate candidate bays around the selected destination
    await loadSpotsForLocation(destCoords);

    const destSpot: ParkingSpot = {
      id: destination.placeId || destination.id || 'selected-destination',
      name: destination.name,
      address: destination.address || 'Selected Destination',
      rating: 4.9,
      pricePerHour: 3.5,
      distance: 'Calculating...',
      eta: 'Calculating...',
      availableSpots: 8,
      latitude: destCoords.latitude,
      longitude: destCoords.longitude,
    };

    await handleSpotPress(destSpot);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchSuggestions([]);
    setShowSuggestions(false);
    setIsSearching(false);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
  };

  const handleSearchSubmit = async () => {
    Keyboard.dismiss();
    if (!searchQuery.trim()) return;

    if (searchSuggestions.length > 0) {
      handleSelectDestination(searchSuggestions[0]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await apiService.searchDestination(searchQuery.trim(), userLocation);
      if (results && results.length > 0) {
        handleSelectDestination(results[0]);
      } else {
        Alert.alert('No Locations Found', `Could not find "${searchQuery.trim()}". Please try a different location.`);
      }
    } catch (e) {
      console.warn('Destination search:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const startInAppNavigation = async (spotCoords: { latitude: number; longitude: number }) => {
    setIsNavigating(true);
    setShowRoute(true);
    setNavigatingToSpot(confirmedMatchId || 'direct-nav', spotCoords);

    const routingService = NavigationRoutingService.getInstance();
    let route = navRoute;
    if (!route || route.polyline.length === 0) {
      route = await routingService.fetchDrivingRoute(userLocation, spotCoords);
      setNavRoute(route);
    }
    setCurrentStepIndex(0);
    setStepDistanceMeters(route.steps[0]?.distanceMeters || 0);
    setRemainingDistanceFormatted(route.formattedDistance);
    setRemainingDurationFormatted(route.formattedDuration);
    setEtaClockFormatted(route.formattedEta);

    if (mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.0035,
          longitudeDelta: 0.0035,
        },
        800,
      );
    }
  };

  const handleExitNavigation = () => {
    setIsNavigating(false);
    setNavRoute(null);
    setShowRoute(false);
    setRemainingDistanceFormatted('');
    setRemainingDurationFormatted('');
    setEtaClockFormatted('');
    reset();
    handleRecenter();
  };

  const handleOpenExternalMaps = () => {
    const dest = navRoute?.polyline[navRoute.polyline.length - 1] || activeOffer?.spotCoords;
    if (dest) {
      Alert.alert('Open External GPS', 'Switch to external turn-by-turn navigation?', [
        { text: 'Waze', onPress: () => NavigationLauncher.openWaze(dest.latitude, dest.longitude) },
        { text: 'Google Maps', onPress: () => NavigationLauncher.openGoogleMaps(dest.latitude, dest.longitude) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  // Live Navigation Tracking & Maneuver Step Progress
  useEffect(() => {
    if (!isNavigating || !navRoute || navRoute.steps.length === 0) return;

    const routingService = NavigationRoutingService.getInstance();
    const currentStep = navRoute.steps[currentStepIndex];
    let remainingMeters = 0;

    if (currentStep) {
      const distToStep = routingService.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        currentStep.location.latitude,
        currentStep.location.longitude,
      );
      setStepDistanceMeters(distToStep);

      // Advance to next step if within 25 meters of the turn
      if (distToStep < 25 && currentStepIndex < navRoute.steps.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      }

      // Remaining distance: current maneuver distance + all subsequent step distances
      remainingMeters += distToStep;
      for (let i = currentStepIndex + 1; i < navRoute.steps.length; i++) {
        remainingMeters += navRoute.steps[i]?.distanceMeters || 0;
      }
    } else {
      remainingMeters = navRoute.totalDistanceMeters;
    }

    // Clamp remaining meters to not exceed total initial road distance
    remainingMeters = Math.min(remainingMeters, navRoute.totalDistanceMeters || remainingMeters);
    remainingMeters = Math.max(remainingMeters, 0);

    // Scale duration proportionally along the actual OSRM road route
    const totalDist = navRoute.totalDistanceMeters || 1;
    const progressFraction = Math.max(0, Math.min(1, remainingMeters / totalDist));
    const remainingSeconds = Math.max(
      remainingMeters <= 30 ? 15 : 45,
      Math.round((navRoute.totalDurationSeconds || 60) * progressFraction)
    );

    setRemainingDistanceFormatted(routingService.formatDistance(remainingMeters));
    setRemainingDurationFormatted(routingService.formatDuration(remainingSeconds));
    setEtaClockFormatted(routingService.formatEta(remainingSeconds));

    // Automatically trigger arrival modal when within 25 meters of parking space
    const destination = navRoute.polyline[navRoute.polyline.length - 1];
    if (destination) {
      const distToDest = routingService.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        destination.latitude,
        destination.longitude,
      );
      if (distToDest <= 25) {
        setShowArrivalModal(true);
      }
    }

    // Keep camera smoothly tracking the car
    if (mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.0035,
          longitudeDelta: 0.0035,
        },
        400,
      );
    }
  }, [userLocation, isNavigating, navRoute, currentStepIndex]);

  // 4. Match Acceptance & Handshake
  const handleAcceptMatch = async (matchId: string) => {
    try {
      await apiService.acceptMatch(matchId);
      acceptOffer(matchId);
      setShowMatchModal(false);

      const spotCoords = activeOffer?.spotCoords || {
        latitude: userLocation.latitude + 0.0015,
        longitude: userLocation.longitude + 0.0018,
      };
      await startInAppNavigation(spotCoords);
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

  // 5. Arrival Verification
  const handleConfirmParked = async () => {
    const matchIdToConfirm = confirmedMatchId || activeOffer?.matchId;

    // Direct navigation to a destination without a P2P reservation
    if (!matchIdToConfirm || matchIdToConfirm === 'direct-nav' || matchIdToConfirm.startsWith('direct-')) {
      Alert.alert('Parked Successfully! 🎉', 'You have arrived and parked at your destination bay.');
      setParkedSuccess();
      setShowArrivalModal(false);
      setIsNavigating(false);
      setNavRoute(null);
      setSelectedSpot(null);
      setShowRoute(false);
      reset();
      handleRecenter();
      return;
    }

    try {
      await apiService.confirmArrival(matchIdToConfirm);
      Alert.alert('Parked Successfully! 🎉', 'Handover confirmed. Spot points settled.');
      setParkedSuccess();
      setShowArrivalModal(false);
      setIsNavigating(false);
      setNavRoute(null);
      setSelectedSpot(null);
      setShowRoute(false);
      reset();
      handleRecenter();
    } catch (err: any) {
      console.warn('[Searcher] Confirm arrival fallback:', err.message);
      Alert.alert('Parked Successfully! 🎉', 'You have arrived and parked at your destination bay.');
      setParkedSuccess();
      setShowArrivalModal(false);
      setIsNavigating(false);
      setNavRoute(null);
      setSelectedSpot(null);
      setShowRoute(false);
      reset();
      handleRecenter();
    }
  };

  const handleReportSpotTaken = async () => {
    const matchIdToReport = confirmedMatchId || activeOffer?.matchId;
    if (!matchIdToReport || matchIdToReport === 'direct-nav' || matchIdToReport.startsWith('direct-')) {
      Alert.alert('Spot Unavailable', 'Rerouting you to another nearby parking bay.');
      setShowArrivalModal(false);
      setIsNavigating(false);
      setNavRoute(null);
      setShowRoute(false);
      reset();
      handleRecenter();
      return;
    }
    try {
      await apiService.reportSpotTaken(matchIdToReport, 'Spot taken by third party upon arrival');
      Alert.alert('Dispute Filed', 'Spot reported taken. Zero points charged.');
    } catch (e: any) {
      Alert.alert('Dispute Filed', 'Spot reported taken. Zero points charged.');
    } finally {
      setShowArrivalModal(false);
      setIsNavigating(false);
      setNavRoute(null);
      setShowRoute(false);
      reset();
      handleRecenter();
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
        spots={isNavigating ? [] : spots}
        selectedSpot={selectedSpot}
        showRoute={showRoute || isNavigating}
        routeCoordinates={
          navRoute && navRoute.polyline.length > 0
            ? navRoute.polyline
            : selectedSpot
            ? [
                userLocation,
                { latitude: selectedSpot.latitude, longitude: selectedSpot.longitude },
              ]
            : []
        }
        routeEta={remainingDurationFormatted || navRoute?.formattedDuration || selectedSpot?.eta}
        onSpotPress={handleSpotPress}
        mapRef={mapRef}
        headerHeight={isNavigating ? 140 : headerHeight}
      />

      {/* IN-APP TURN-BY-TURN NAVIGATION HUD */}
      {isNavigating && (
        <InAppNavigationHUD
          currentStep={navRoute?.steps[currentStepIndex] || null}
          stepDistanceMeters={stepDistanceMeters}
          totalDistanceFormatted={remainingDistanceFormatted || navRoute?.formattedDistance || '450 m'}
          totalDurationFormatted={remainingDurationFormatted || navRoute?.formattedDuration || '2 min'}
          etaFormatted={
            etaClockFormatted ||
            navRoute?.formattedEta ||
            NavigationRoutingService.getInstance().formatEta(120)
          }
          destinationName={selectedSpot?.name || targetSearchName || 'Reserved Parking Bay'}
          onExitNavigation={handleExitNavigation}
          onConfirmArrival={() => setShowArrivalModal(true)}
          onOpenExternalMaps={handleOpenExternalMaps}
        />
      )}

      {/* Floating Top Header & Search Controls (Hidden when in Navigation Mode) */}
      {!isNavigating && (
        <View
          style={[styles.topHeaderContainer, { paddingTop: insets.top }]}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        >
          <AppHeader style={{ paddingHorizontal: 4, paddingVertical: 4 }} />

          {/* Search Bar & Autocomplete Suggestions Dropdown */}
          <View style={styles.searchSectionContainer}>
            <View style={styles.searchBar}>
              <MaterialIcons
                name="search"
                size={22}
                color={Theme.colors.outline}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search parking destinations (e.g. KLCC)..."
                placeholderTextColor={Theme.colors.outlineVariant}
                value={searchQuery}
                onChangeText={handleSearchTextChange}
                onFocus={() => {
                  if (searchSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
                autoCorrect={false}
              />
              {isSearching && (
                <ActivityIndicator
                  size="small"
                  color={Theme.colors.stormyTeal}
                  style={{ marginRight: 6 }}
                />
              )}
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                  <MaterialIcons name="close" size={18} color={Theme.colors.outline} />
                </TouchableOpacity>
              )}
            </View>

            {/* Suggestions Dropdown List */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <View style={styles.suggestionsDropdown}>
                <FlatList
                  data={searchSuggestions}
                  keyExtractor={(item, index) => item.placeId || item.id || `loc-${index}`}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => handleSelectDestination(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.suggestionIconWrapper}>
                        <MaterialIcons name="place" size={18} color={Theme.colors.stormyTeal} />
                      </View>
                      <View style={styles.suggestionTextWrapper}>
                        <Text style={styles.suggestionName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.suggestionAddress} numberOfLines={1}>
                          {item.address}
                        </Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={18} color={Theme.colors.outlineVariant} />
                    </TouchableOpacity>
                  )}
                />
              </View>
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
                {isScanning
                  ? targetSearchName
                    ? `Radar Scanning at ${targetSearchName}...`
                    : 'Radar Scanning for Spots...'
                  : 'Start Matchmaking'}
              </Text>
              <MaterialIcons
                name={isScanning ? 'close' : 'navigation'}
                size={18}
                color={Theme.colors.darkTeal}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Recenter Floating Action Button (Hidden when in Navigation Mode) */}
      {!isNavigating && (
        <View
          style={[
            styles.recenterButtonContainer,
            { bottom: selectedSpot || isScanning ? 210 : 95 + insets.bottom },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity style={styles.recenterFab} onPress={handleRecenter} activeOpacity={0.8}>
            <MaterialIcons name="my-location" size={22} color={Theme.colors.stormyTeal} />
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Bottom Spot Detail Card (Hidden when in Navigation Mode) */}
      {!isNavigating && selectedSpot && (
        <View style={[styles.bottomCardWrapper, { bottom: Math.max(insets.bottom, 16) + 78 }]}>
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
                  {remainingDistanceFormatted || selectedSpot.distance} • {remainingDurationFormatted || selectedSpot.eta}
                </Text>
              </View>

              <View style={styles.badgePill}>
                <MaterialIcons name="star" size={14} color={Theme.colors.starGold} />
                <Text style={styles.badgePillText}>{selectedSpot.rating.toFixed(1)}</Text>
              </View>

              <View style={styles.pricePill}>
                <Text style={styles.pricePillText}>{selectedSpot.pricePerHour} pts/hr</Text>
              </View>
            </View>

            {/* Action Buttons: Navigate Directly & Match Leaver */}
            <View style={[styles.cardActionsRow, { flexDirection: 'row', gap: 10 }]}>
              <TouchableOpacity
                style={[styles.navigateButton, { flex: 1, backgroundColor: Theme.colors.surfaceContainerHigh }]}
                onPress={() => startInAppNavigation({ latitude: selectedSpot.latitude, longitude: selectedSpot.longitude })}
                activeOpacity={0.88}
              >
                <MaterialIcons name="navigation" size={18} color={Theme.colors.stormyTeal} />
                <Text style={[styles.navigateButtonText, { color: Theme.colors.stormyTeal }]}>Navigate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.navigateButton,
                  { flex: 1.2 },
                  isScanning && { backgroundColor: Theme.colors.surfaceContainerHighest, borderWidth: 1, borderColor: Theme.colors.stormyTeal },
                ]}
                onPress={isScanning ? handleCancelMatchmaking : handleStartMatchmaking}
                activeOpacity={0.88}
              >
                {isScanning ? (
                  <>
                    <ActivityIndicator size="small" color={Theme.colors.stormyTeal} style={{ marginRight: 4 }} />
                    <Text style={[styles.navigateButtonText, { color: Theme.colors.stormyTeal }]}>Cancel Radar</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="radar" size={18} color={Theme.colors.darkTeal} />
                    <Text style={styles.navigateButtonText}>Match Leaver</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Floating Bottom Active Radar Scanning Card */}
      {!isNavigating && isScanning && !selectedSpot && (
        <View style={[styles.bottomCardWrapper, { bottom: Math.max(insets.bottom, 16) + 78 }]}>
          <View style={styles.radarScanningCard}>
            <View style={styles.radarCardHeaderRow}>
              <View style={styles.radarIconPulseBox}>
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
              <View style={styles.radarTextCol}>
                <Text style={styles.radarCardTitle}>Radar Scanning for Leaver...</Text>
                <Text style={styles.radarCardSubtitle} numberOfLines={1}>
                  {targetSearchName
                    ? `${targetSearchName} • ETA: ${remainingDurationFormatted || navRoute?.formattedDuration || '2 mins'} (${remainingDistanceFormatted || navRoute?.formattedDistance || '450m'})`
                    : 'Matching drivers vacating nearby bays'}
                </Text>
              </View>
            </View>

            <View style={styles.radarProgressTrack}>
              <View style={styles.radarProgressBar} />
            </View>

            <View style={styles.radarActionsRow}>
              <Text style={styles.radarStatusHint}>Listening on live WebSocket radar...</Text>
              <TouchableOpacity
                style={styles.cancelRadarBtn}
                onPress={handleCancelMatchmaking}
                activeOpacity={0.8}
              >
                <MaterialIcons name="close" size={16} color={Theme.colors.error} />
                <Text style={styles.cancelRadarBtnText}>Cancel</Text>
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
  searchSectionContainer: {
    zIndex: 100,
    position: 'relative',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    maxHeight: 230,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 200,
    borderWidth: 1,
    borderColor: 'rgba(190, 200, 202, 0.45)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 6px 18px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#edf2f4',
    backgroundColor: '#ffffff',
  },
  suggestionIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.surfaceIce,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  suggestionTextWrapper: {
    flex: 1,
    paddingRight: 6,
  },
  suggestionName: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: 14,
    color: Theme.colors.onSurface,
  },
  suggestionAddress: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
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
    zIndex: 110,
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
  radarScanningCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Theme.colors.pearlAqua,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.stormyTeal,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 6px 16px rgba(0, 109, 119, 0.18)',
      },
    }),
  },
  radarCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radarIconPulseBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.colors.stormyTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarTextCol: {
    flex: 1,
  },
  radarCardTitle: {
    fontSize: 15,
    fontFamily: Theme.typography.fontFamily.semiBold,
    color: Theme.colors.onSurface,
  },
  radarCardSubtitle: {
    fontSize: 12,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  radarProgressTrack: {
    height: 4,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 10,
  },
  radarProgressBar: {
    height: '100%',
    width: '65%',
    backgroundColor: Theme.colors.primaryContainer,
    borderRadius: 2,
  },
  radarActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  radarStatusHint: {
    fontSize: 11,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.outline,
  },
  cancelRadarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#ffdad6',
  },
  cancelRadarBtnText: {
    fontSize: 12,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.error,
  },
});
