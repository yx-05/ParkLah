import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';
import { WalletTransaction } from '../../types';

interface TransactionCardProps {
  transaction: WalletTransaction;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  const isPositive = transaction.amount > 0;
  const formattedAmount = `${isPositive ? '+' : ''}RM ${Math.abs(transaction.amount).toFixed(2)}`;

  let badgeColor = '#F1F5F9';
  let badgeTextColor = Colors.textSecondary;
  let icon = '💳';

  if (transaction.type === 'TOPUP') {
    badgeColor = '#DCFCE7';
    badgeTextColor = '#15803D';
    icon = '💰';
  } else if (transaction.type === 'REWARD') {
    badgeColor = '#CCFBF1';
    badgeTextColor = '#0F766E';
    icon = '🎁';
  } else if (transaction.type === 'CHARGE') {
    badgeColor = '#FEF2F2';
    badgeTextColor = '#B91C1C';
    icon = '🅿️';
  }

  const formattedDate = new Date(transaction.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: badgeColor }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.description}>{transaction.description}</Text>
        <Text style={styles.timestamp}>{formattedDate}</Text>
      </View>

      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.amount,
            { color: isPositive ? Colors.successGreen : Colors.textPrimary },
          ]}
        >
          {formattedAmount}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: badgeColor }]}>
          <Text style={[styles.typeText, { color: badgeTextColor }]}>
            {transaction.type}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceWhite,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  details: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
