import React, { useState } from 'react';
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

const RECENT_VEHICLES = [
  { id: '1', plate: 'SLA 1234 A', model: 'Honda Civic' },
  { id: '2', plate: 'WXY 5678 B', model: 'Tesla Model 3' },
  { id: '3', plate: 'SGP 9988 X', model: 'Toyota Corolla' },
];

export default function LeaverScreen() {
  const router = useRouter();
  const [plate, setPlate] = useState('');
  const [carModel, setCarModel] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmitLeaving = () => {
    if (!plate.trim()) {
      Alert.alert('Please enter your number plate');
      return;
    }
    setShowSuccessModal(true);
  };

  const handleSelectRecent = (vehicle: { plate: string; model: string }) => {
    setPlate(vehicle.plate);
    setCarModel(vehicle.model);
  };

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
                Enter your number plate to release your spot and earn points.
              </Text>
            </View>

            {/* Input Card */}
            <View style={styles.formCard}>
              {/* Number Plate */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Number Plate</Text>
                <TextInput
                  style={[styles.textInput, styles.plateInputExtra]}
                  placeholder="e.g. ABC 123"
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
                onPress={handleSubmitLeaving}
                activeOpacity={0.88}
              >
                <Text style={styles.submitButtonText}>I'm Leaving</Text>
                <MaterialIcons name="arrow-forward" size={20} color={Theme.colors.darkTeal} />
              </TouchableOpacity>
            </View>

            {/* Recent Vehicles */}
            <View style={styles.recentSection}>
              <Text style={styles.recentTitle}>Recent Vehicles</Text>
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
            <Text style={styles.modalTitle}>Spot Released!</Text>
            <Text style={styles.modalSubtitle}>
              Thank you for updating your departure for vehicle{' '}
              <Text style={{ fontFamily: Theme.typography.fontFamily.bold }}>
                {plate} {carModel ? `(${carModel})` : ''}
              </Text>
              .
            </Text>

            <View style={styles.rewardBadge}>
              <MaterialIcons name="monetization-on" size={24} color={Theme.colors.starGold} />
              <Text style={styles.rewardText}>+50 Points Earned!</Text>
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
                  setPlate('');
                  setCarModel('');
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
    marginBottom: 28,
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
    fontSize: 15,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  formCard: {
    width: '100%',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.borderRadius.default,
    padding: 20,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.stormyTeal,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 6px 18px rgba(0, 109, 119, 0.08)',
      },
    }),
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
    borderRadius: Theme.borderRadius.md,
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
