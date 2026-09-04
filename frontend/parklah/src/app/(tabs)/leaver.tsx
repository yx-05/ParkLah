import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { AppHeader } from '@/components/AppHeader';
import { LeaverBroadcastModal } from '@/components/leaver/LeaverBroadcastModal';
import { LocationService } from '@/services/LocationService';
import { SocketService } from '@/services/SocketService';
import { apiService } from '@/services/ApiService';
import { useLeaverStore } from '@/stores/useLeaverStore';
import { useUserStore } from '@/stores/useUserStore';

const RECENT_VEHICLES = [
  { id: '1', plate: 'WXY 5678 B', model: 'Honda Civic' },
  { id: '2', plate: 'VAA 8822 K', model: 'Perodua Myvi' },
  { id: '3', plate: 'SGP 9988 X', model: 'Toyota Corolla' },
];

export default function LeaverScreen() {
  const router = useRouter();

  const {
    state: leaverState,
    countdownSeconds,
    landmarkNote,
    matchedSearcher,
    startBroadcast,
    decrementCountdown,
    setMatchedSearcher,
    cancelBroadcast,
    reset,
  } = useLeaverStore();

  const activeVehicle = useUserStore((s) => s.activeVehicle);
  const setActiveVehicle = useUserStore((s) => s.setActiveVehicle);

  const [plate, setPlate] = useState('VAA 8822 K');
  const [carModel, setCarModel] = useState('Perodua Myvi');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userLocation, setUserLocation] = useState({ latitude: 3.1176, longitude: 101.6778 });

  // 1. Fetch live GPS location
  useEffect(() => {
    LocationService.getInstance()
      .getCurrentPosition()
      .then((loc) => {
        setUserLocation({ latitude: loc.latitude, longitude: loc.longitude });
      })
      .catch(console.error);

    const socketService = SocketService.getInstance();
    const unsubMatch = socketService.on('match:found', (data: any) => {
      setMatchedSearcher(data);
      Alert.alert('Searcher Matched! 🚗', 'A searching driver has accepted your spot and is en route!');
    });

    return () => {
      unsubMatch();
    };
  }, []);

  // 2. Active Countdown Interval
  const isBroadcasting = leaverState === 'BROADCASTING_COUNTDOWN' || leaverState === 'SEARCHER_MATCHED';

  useEffect(() => {
    if (!isBroadcasting) return;

    const timer = setInterval(() => {
      decrementCountdown();
    }, 1000);

    return () => clearInterval(timer);
  }, [isBroadcasting]);

  // 3. Start Departure Broadcast via Backend API
  const handleStartBroadcast = async (data: { countdownSeconds: number; landmarkNote: string }) => {
    try {
      await apiService.broadcastDeparture(userLocation, data.countdownSeconds, data.landmarkNote);
      startBroadcast(userLocation, data.countdownSeconds, data.landmarkNote);
      setShowBroadcastModal(false);
      Alert.alert(
        'Departure Active! 📢',
        `Your spot is broadcast to nearby searchers for ${Math.round(data.countdownSeconds / 60)} minutes.`,
      );
    } catch (err: any) {
      Alert.alert('Broadcast Error', err.message || 'Unable to broadcast departure.');
    }
  };

  // 4. Cancel Departure
  const handleCancelDeparture = async () => {
    try {
      await apiService.cancelDeparture('CHANGE_OF_PLANS');
      cancelBroadcast();
      Alert.alert('Broadcast Cancelled', 'Your spot departure has been retracted.');
    } catch (e) {
      cancelBroadcast();
    }
  };

  const handleSelectRecent = (vehicle: { plate: string; model: string }) => {
    setPlate(vehicle.plate);
    setCarModel(vehicle.model);
    setActiveVehicle({
      id: `veh_${vehicle.plate.replace(/\s+/g, '')}`,
      makeModel: vehicle.model,
      color: '',
      plateSuffix: vehicle.plate.slice(-4),
      isDefault: true,
    });
  };

  const handleOpenBroadcastModal = () => {
    if (!plate.trim()) {
      Alert.alert('Please enter your number plate');
      return;
    }
    setActiveVehicle({
      id: activeVehicle?.id || 'veh_current',
      makeModel: carModel.trim() || 'Perodua Myvi',
      color: '',
      plateSuffix: plate.trim().slice(-4),
      isDefault: true,
    });
    setShowBroadcastModal(true);
  };

  const minutes = Math.floor(countdownSeconds / 60);
  const seconds = countdownSeconds % 60;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentWrapper}>
            {/* Graphic Icon */}
            <View style={styles.iconCircle}>
              <MaterialIcons name="exit-to-app" size={44} color={Theme.colors.primary} />
            </View>

            {/* Header Text */}
            <View style={styles.headingSection}>
              <Text style={styles.title}>Leaving soon?</Text>
              <Text style={styles.subtitle}>
                Broadcast your spot to earn RM 0.25 rewards upon vehicle handover.
              </Text>
            </View>

            {/* Active Broadcast Countdown Card */}
            {isBroadcasting ? (
              <View style={styles.activeCard}>
                <Text style={styles.activeCardLabel}>DEPARTURE COUNTDOWN</Text>

                <View style={styles.timerCircle}>
                  <Text style={styles.timerLargeText}>
                    {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                  </Text>
                  <Text style={styles.timerUnit}>Minutes Remaining</Text>
                </View>

                <View style={styles.detailsBox}>
                  <Text style={styles.detailsLabel}>Vehicle</Text>
                  <Text style={styles.detailsValue}>{plate} • {carModel}</Text>

                  {landmarkNote ? (
                    <>
                      <Text style={[styles.detailsLabel, { marginTop: 8 }]}>Landmark Note</Text>
                      <Text style={styles.detailsValue}>{landmarkNote}</Text>
                    </>
                  ) : null}
                </View>

                {matchedSearcher ? (
                  <View style={styles.matchedBox}>
                    <MaterialIcons name="directions-car" size={20} color="#047857" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.matchedTitle}>Searcher en route!</Text>
                      <Text style={styles.matchedSubtitle}>
                        ETA: ~{Math.round((matchedSearcher.searcherEtaSeconds || 180) / 60)} mins away
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.broadcastingBox}>
                    <Text style={styles.broadcastingText}>📡 Actively searching for nearby drivers...</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelDeparture}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelButtonText}>Cancel Departure Broadcast</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Idle Input Card */
              <View style={styles.formCard}>
                {/* Number Plate */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Number Plate</Text>
                  <TextInput
                    style={[styles.textInput, styles.plateInputExtra]}
                    placeholder="e.g. ABC 1234"
                    placeholderTextColor={Theme.colors.outlineVariant}
                    value={plate}
                    onChangeText={(text) => setPlate(text.toUpperCase())}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>

                {/* Car Model */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Car Model</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Perodua Myvi"
                    placeholderTextColor={Theme.colors.outlineVariant}
                    value={carModel}
                    onChangeText={setCarModel}
                    autoCapitalize="words"
                  />
                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleOpenBroadcastModal}
                  activeOpacity={0.88}
                >
                  <Text style={styles.submitButtonText}>Broadcast Departure</Text>
                  <MaterialIcons name="arrow-forward" size={20} color={Theme.colors.darkTeal} />
                </TouchableOpacity>
              </View>
            )}

            {/* Recent Vehicles */}
            {!isBroadcasting && (
              <View style={styles.recentSection}>
                <Text style={styles.recentTitle}>Saved Vehicles</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentList}
                >
                  {RECENT_VEHICLES.map((vehicle) => (
                    <TouchableOpacity
                      key={vehicle.id}
                      style={[
                        styles.vehicleChip,
                        plate === vehicle.plate && styles.activeVehicleChip,
                      ]}
                      onPress={() => handleSelectRecent(vehicle)}
                      activeOpacity={0.75}
                    >
                      <MaterialIcons
                        name="directions-car"
                        size={20}
                        color={
                          plate === vehicle.plate ? Theme.colors.stormyTeal : Theme.colors.outline
                        }
                      />
                      <View>
                        <Text
                          style={[
                            styles.vehiclePlate,
                            plate === vehicle.plate && styles.activeVehicleText,
                          ]}
                        >
                          {vehicle.plate}
                        </Text>
                        <Text style={styles.vehicleModel}>{vehicle.model}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Leaver Broadcast Modal */}
      <LeaverBroadcastModal
        visible={showBroadcastModal}
        activeVehicle={{
          id: activeVehicle?.id || 'veh_active',
          makeModel: carModel.trim() || 'Perodua Myvi',
          color: '',
          plateSuffix: plate.trim().slice(-4),
          isDefault: true,
        }}
        onBroadcast={handleStartBroadcast}
        onClose={() => setShowBroadcastModal(false)}
      />

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <MaterialIcons name="check-circle" size={48} color={Theme.colors.pearlAqua} />
            </View>
            <Text style={styles.modalTitle}>Spot Handover Complete!</Text>
            <Text style={styles.modalSubtitle}>
              Thank you for releasing your spot for vehicle{' '}
              <Text style={{ fontFamily: Theme.typography.fontFamily.bold }}>
                {plate} {carModel ? `(${carModel})` : ''}
              </Text>
              .
            </Text>

            <View style={styles.rewardBadge}>
              <MaterialIcons name="monetization-on" size={24} color={Theme.colors.starGold} />
              <Text style={styles.rewardText}>+RM 0.25 Earned!</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.push('/points');
                }}
              >
                <Text style={styles.modalPrimaryButtonText}>View Wallet</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  reset();
                }}
              >
                <Text style={styles.modalSecondaryButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Theme.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.stormyTeal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 4px 16px rgba(0, 109, 119, 0.06)',
      },
    }),
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 28,
    color: Theme.colors.stormyTeal,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  formCard: {
    width: '100%',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(190, 200, 202, 0.35)',
    ...Platform.select({
      ios: {
        shadowColor: '#006D77',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0px 4px 20px rgba(0, 109, 119, 0.05)',
      },
    }),
  },
  activeCard: {
    width: '100%',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.pearlAqua,
    ...Platform.select({
      ios: {
        shadowColor: '#006D77',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 1.5,
      },
      web: {
        boxShadow: '0px 4px 20px rgba(0, 109, 119, 0.06)',
      },
    }),
  },
  activeCardLabel: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  timerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Theme.colors.surfaceIce,
    borderWidth: 4,
    borderColor: Theme.colors.stormyTeal,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerLargeText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 34,
    color: Theme.colors.stormyTeal,
  },
  timerUnit: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: Theme.colors.surfaceContainerLow,
    padding: 14,
    borderRadius: Theme.borderRadius.default,
    marginBottom: 14,
  },
  detailsLabel: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
  },
  detailsValue: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 14,
    color: Theme.colors.onSurface,
    marginTop: 2,
  },
  matchedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: Theme.borderRadius.default,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
  },
  matchedTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 13,
    color: '#065F46',
  },
  matchedSubtitle: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  broadcastingBox: {
    paddingVertical: 10,
    marginBottom: 14,
  },
  broadcastingText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: 12,
    color: Theme.colors.stormyTeal,
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 13,
    color: '#DC2626',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: 13,
    color: Theme.colors.stormyTeal,
  },
  textInput: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: Theme.colors.stormyTeal,
    height: 52,
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 18,
    color: Theme.colors.onSurface,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  plateInputExtra: {
    letterSpacing: 2,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.pearlAqua,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.stormyTeal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0, 109, 119, 0.16)',
      },
    }),
  },
  submitButtonText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 16,
    color: Theme.colors.darkTeal,
  },
  recentSection: {
    width: '100%',
    marginTop: 28,
  },
  recentTitle: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  recentList: {
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.borderRadius.default,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  activeVehicleChip: {
    borderColor: Theme.colors.stormyTeal,
    backgroundColor: Theme.colors.surfaceIce,
  },
  vehiclePlate: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  activeVehicleText: {
    color: Theme.colors.stormyTeal,
  },
  vehicleModel: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 11,
    color: Theme.colors.outline,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.borderRadius.default,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  modalIconCircle: {
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 22,
    color: Theme.colors.stormyTeal,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 18,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e6',
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ffe699',
  },
  rewardText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 14,
    color: '#996300',
  },
  modalActions: {
    width: '100%',
    gap: 10,
  },
  modalPrimaryButton: {
    backgroundColor: Theme.colors.stormyTeal,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 14,
    color: '#ffffff',
  },
  modalSecondaryButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: 14,
    color: Theme.colors.outline,
  },
});
