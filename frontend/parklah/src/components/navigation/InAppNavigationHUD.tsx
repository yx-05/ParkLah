import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { NavigationStep } from '@/services/NavigationRoutingService';

interface InAppNavigationHUDProps {
  currentStep: NavigationStep | null;
  stepDistanceMeters: number;
  totalDistanceFormatted: string;
  totalDurationFormatted: string;
  etaFormatted: string;
  destinationName?: string;
  onExitNavigation: () => void;
  onConfirmArrival: () => void;
  onOpenExternalMaps?: () => void;
}

export const InAppNavigationHUD: React.FC<InAppNavigationHUDProps> = ({
  currentStep,
  stepDistanceMeters,
  totalDistanceFormatted,
  totalDurationFormatted,
  etaFormatted,
  destinationName = 'Reserved Parking Bay',
  onExitNavigation,
  onConfirmArrival,
  onOpenExternalMaps,
}) => {
  const insets = useSafeAreaInsets();

  // Helper to map maneuver type to icon
  const getManeuverIcon = (type?: string, modifier?: string) => {
    if (type === 'arrive') return 'place';
    if (type === 'roundabout') return 'rotate-right';

    if (modifier?.includes('left')) {
      if (modifier.includes('slight')) return 'north-west';
      if (modifier.includes('sharp')) return 'turn-sharp-left';
      return 'turn-left';
    }
    if (modifier?.includes('right')) {
      if (modifier.includes('slight')) return 'north-east';
      if (modifier.includes('sharp')) return 'turn-sharp-right';
      return 'turn-right';
    }
    if (modifier?.includes('uturn')) return 'u-turn-left';

    return 'navigation';
  };

  const formattedStepDistance =
    stepDistanceMeters < 50
      ? 'Now'
      : stepDistanceMeters < 1000
      ? `${Math.round(stepDistanceMeters)} m`
      : `${(stepDistanceMeters / 1000).toFixed(1)} km`;

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {/* --- TOP TURN-BY-TURN MANEUVER BANNER --- */}
      <View style={[styles.topBannerWrapper, { top: insets.top + 10 }]}>
        <View style={styles.maneuverCard}>
          <View style={styles.maneuverIconBox}>
            <MaterialIcons
              name={getManeuverIcon(currentStep?.maneuverType, currentStep?.modifier) as any}
              size={36}
              color="#ffffff"
            />
            <Text style={styles.stepDistanceText}>{formattedStepDistance}</Text>
          </View>

          <View style={styles.instructionTextBox}>
            <Text style={styles.instructionMainText} numberOfLines={2}>
              {currentStep?.instruction || 'Follow highlighted route to parking space'}
            </Text>
            <Text style={styles.instructionSubText} numberOfLines={1}>
              {currentStep?.streetName || destinationName}
            </Text>
          </View>
        </View>
      </View>

      {/* --- BOTTOM ETA & CONTROLS CARD (Floats above bottom FloatingNavBar) --- */}
      <View style={[styles.bottomCardWrapper, { bottom: Math.max(insets.bottom, 16) + 78 }]}>
        <View style={styles.etaCard}>
          {/* Main ETA Row */}
          <View style={styles.etaMainRow}>
            <View style={styles.etaDurationBox}>
              <Text style={styles.etaDurationText}>{totalDurationFormatted}</Text>
              <View style={styles.etaMetaRow}>
                <Text style={styles.etaMetaDistance}>{totalDistanceFormatted}</Text>
                <Text style={styles.etaMetaDot}>•</Text>
                <Text style={styles.etaMetaClock}>{etaFormatted}</Text>
              </View>
            </View>

            {onOpenExternalMaps && (
              <TouchableOpacity
                style={styles.externalMapsBtn}
                onPress={onOpenExternalMaps}
                activeOpacity={0.8}
              >
                <MaterialIcons name="open-in-new" size={18} color={Theme.colors.darkTeal} />
                <Text style={styles.externalMapsText}>Maps</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.exitBtn}
              onPress={onExitNavigation}
              activeOpacity={0.85}
            >
              <MaterialIcons name="close" size={20} color="#e63946" />
              <Text style={styles.exitBtnText}>End Trip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.arrivedBtn}
              onPress={onConfirmArrival}
              activeOpacity={0.85}
            >
              <MaterialIcons name="check-circle" size={20} color="#ffffff" />
              <Text style={styles.arrivedBtnText}>✓ Parked</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  // Top Maneuver Banner
  topBannerWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  maneuverCard: {
    backgroundColor: '#00535b', // Deep Aegean Dark Teal
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  maneuverIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
    paddingRight: 12,
    marginRight: 14,
  },
  stepDistanceText: {
    color: '#9ff0fb', // Vivid Aqua accent
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  instructionTextBox: {
    flex: 1,
  },
  instructionMainText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  instructionSubText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },

  // Bottom ETA Card
  bottomCardWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 10,
  },
  etaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#006D77',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e0e3e3',
  },
  etaMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  etaDurationBox: {
    flex: 1,
  },
  etaDurationText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#00535b',
    letterSpacing: -0.5,
  },
  etaMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  etaMetaDistance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3e494a',
  },
  etaMetaDot: {
    marginHorizontal: 6,
    color: '#6f797a',
    fontSize: 14,
  },
  etaMetaClock: {
    fontSize: 14,
    fontWeight: '600',
    color: '#006d77',
  },
  externalMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e1f4f2',
    borderRadius: 12,
    gap: 4,
  },
  externalMapsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00535b',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  exitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  exitBtnText: {
    color: '#b91c1c',
    fontSize: 15,
    fontWeight: '700',
  },
  arrivedBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#006d77',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    shadowColor: '#006d77',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  arrivedBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
