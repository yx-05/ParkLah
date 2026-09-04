import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { MatchOffer } from '../../types';

interface MatchOfferModalProps {
  visible: boolean;
  offer: MatchOffer | null;
  onAccept: (matchId: string) => void;
  onDecline: () => void;
}

export const MatchOfferModal: React.FC<MatchOfferModalProps> = ({
  visible,
  offer,
  onAccept,
  onDecline,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(15);

  useEffect(() => {
    if (!visible || !offer) {
      setSecondsLeft(15);
      return;
    }

    setSecondsLeft(offer.handshakeTimeoutSeconds || 15);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, offer]);

  if (!offer) return null;

  const progressPercent = (secondsLeft / 15) * 100;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header & 15s Timer */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Spot Match Found! 🎉</Text>
              <Text style={styles.subtitle}>Leaver is vacating within {Math.round(offer.countdownSeconds / 60)} mins</Text>
            </View>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>{secondsLeft}s</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          {/* Vehicle Info Card */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Vehicle</Text>
              <Text style={styles.value}>
                {offer.vehicleSummary
                  ? `${offer.vehicleSummary.color} ${offer.vehicleSummary.makeModel}`
                  : 'Honda Civic (White)'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Plate Suffix</Text>
              <Text style={styles.valuePlate}>
                ••• {offer.vehicleSummary?.plateSuffix || '8822'}
              </Text>
            </View>
            {offer.landmarkNote ? (
              <View style={styles.row}>
                <Text style={styles.label}>Landmark</Text>
                <Text style={styles.valueLandmark}>"{offer.landmarkNote}"</Text>
              </View>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.label}>Handoff Fee</Text>
              <Text style={styles.valueFee}>RM 0.50 (on completion)</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
              <Text style={styles.declineBtnText}>Pass / Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => onAccept(offer.matchId)}
            >
              <Text style={styles.acceptBtnText}>Accept Spot</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  timerBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.amberAccent,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B45309',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.amberAccent,
  },
  card: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  valuePlate: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  valueLandmark: {
    fontSize: 13,
    fontStyle: 'italic',
    color: Colors.slateDark,
    maxWidth: '65%',
    textAlign: 'right',
  },
  valueFee: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  declineBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  acceptBtn: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  acceptBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.surfaceWhite,
  },
});
