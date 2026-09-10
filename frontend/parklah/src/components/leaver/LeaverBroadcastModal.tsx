import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { Vehicle } from '../../types';

interface LeaverBroadcastModalProps {
  visible: boolean;
  activeVehicle: Vehicle | null;
  onBroadcast: (data: { countdownSeconds: number; landmarkNote: string }) => void;
  onClose: () => void;
}

export const LeaverBroadcastModal: React.FC<LeaverBroadcastModalProps> = ({
  visible,
  activeVehicle,
  onBroadcast,
  onClose,
}) => {
  const [selectedMins, setSelectedMins] = useState(4); // default 4 mins = 240s
  const [landmarkNote, setLandmarkNote] = useState('');

  const quickLandmarkChips = [
    'Near Main Entrance',
    'Basement 1, Pillar C',
    'Facing Main Road',
    'Ground Floor',
    'Near Escalator',
  ];

  const handleStartBroadcast = () => {
    onBroadcast({
      countdownSeconds: selectedMins * 60,
      landmarkNote,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Leaving Your Parking Spot?</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Broadcast to nearby drivers and earn 25 pts when a driver parks!
          </Text>

          {/* Vehicle info */}
          <View style={styles.vehicleCard}>
            <Text style={styles.vehicleLabel}>Your Vehicle</Text>
            <Text style={styles.vehicleValue}>
              {activeVehicle
                ? `${activeVehicle.color ? `${activeVehicle.color} ` : ''}${activeVehicle.makeModel} (••• ${activeVehicle.plateSuffix})`
                : 'Vehicle (••• 8822)'}
            </Text>
          </View>

          {/* Countdown Selector */}
          <Text style={styles.sectionLabel}>When will you drive out?</Text>
          <View style={styles.minsRow}>
            {[
              { label: '⚡ Instant', mins: 0 },
              { label: '3 Mins', mins: 3 },
              { label: '4 Mins', mins: 4 },
              { label: '5 Mins', mins: 5 },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.mins}
                style={[
                  styles.minsBtn,
                  selectedMins === opt.mins && styles.minsBtnActive,
                ]}
                onPress={() => setSelectedMins(opt.mins)}
              >
                <Text
                  style={[
                    styles.minsBtnText,
                    selectedMins === opt.mins && styles.minsBtnTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Landmark Chips */}
          <Text style={styles.sectionLabel}>Help searcher locate you (optional):</Text>
          <View style={styles.chipsContainer}>
            {quickLandmarkChips.map((chip) => (
              <TouchableOpacity
                key={chip}
                style={[
                  styles.chip,
                  landmarkNote === chip && styles.chipActive,
                ]}
                onPress={() => setLandmarkNote(chip)}
              >
                <Text
                  style={[
                    styles.chipText,
                    landmarkNote === chip && styles.chipTextActive,
                  ]}
                >
                  {chip}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.customInput}
            placeholder="Or type custom landmark note..."
            placeholderTextColor={Colors.textMuted}
            value={landmarkNote}
            onChangeText={setLandmarkNote}
            maxLength={100}
          />

          {/* Broadcast Action Button */}
          <TouchableOpacity
            style={styles.broadcastBtn}
            onPress={handleStartBroadcast}
          >
            <Text style={styles.broadcastBtnText}>
              {selectedMins === 0
                ? '⚡ Instant Broadcast (Leaving Now)'
                : `Broadcast Departure (${selectedMins}m countdown)`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surfaceWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  vehicleCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  vehicleLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  vehicleValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  minsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  minsBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceWhite,
    paddingHorizontal: 2,
  },
  minsBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDFA',
  },
  minsBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  minsBtnTextActive: {
    color: Colors.primaryDark,
    fontWeight: 'bold',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipActive: {
    backgroundColor: '#CCFBF1',
  },
  chipText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.primaryDark,
    fontWeight: 'bold',
  },
  customInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  broadcastBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  broadcastBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.surfaceWhite,
  },
});
