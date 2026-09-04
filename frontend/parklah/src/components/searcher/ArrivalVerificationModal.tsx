import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Colors } from '../../constants/theme';

interface ArrivalVerificationModalProps {
  visible: boolean;
  onConfirmParked: () => void;
  onReportSpotTaken: () => void;
}

export const ArrivalVerificationModal: React.FC<ArrivalVerificationModalProps> = ({
  visible,
  onConfirmParked,
  onReportSpotTaken,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.icon}>🎯</Text>
          <Text style={styles.title}>You've Arrived at the Spot!</Text>
          <Text style={styles.description}>
            Please confirm once you have successfully pulled into the parking space.
          </Text>

          <TouchableOpacity style={styles.confirmBtn} onPress={onConfirmParked}>
            <Text style={styles.confirmBtnText}>✓ Parked Successfully</Text>
            <Text style={styles.confirmBtnSubtext}>Complete handoff & settle RM 0.50</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.spotTakenBtn} onPress={onReportSpotTaken}>
            <Text style={styles.spotTakenBtnText}>⚠️ Spot Taken by Someone Else</Text>
            <Text style={styles.spotTakenBtnSubtext}>Zero charge (RM 0.00) & instant reroute</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: Colors.surfaceWhite,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.surfaceWhite,
  },
  confirmBtnSubtext: {
    fontSize: 12,
    color: '#CCFBF1',
    marginTop: 2,
  },
  spotTakenBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  spotTakenBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.errorRed,
  },
  spotTakenBtnSubtext: {
    fontSize: 11,
    color: '#991B1B',
    marginTop: 2,
  },
});
