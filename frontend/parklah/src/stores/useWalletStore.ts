import { create } from 'zustand';
import { WalletTransaction } from '../types';

interface WalletState {
  balance: number;
  transactions: WalletTransaction[];
  isLoading: boolean;

  // Actions
  setBalance: (balance: number) => void;
  setTransactions: (transactions: WalletTransaction[]) => void;
  topUp: (amount: number) => void;
  applyDebit: (amount: number, description: string) => void;
  applyCredit: (amount: number, description: string) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 20.0,
  transactions: [
    {
      id: 'tx_init_1',
      type: 'TOPUP',
      amount: 20.0,
      description: 'Welcome Bonus Top-Up',
      timestamp: new Date().toISOString(),
    },
  ],
  isLoading: false,

  setBalance: (balance) => set({ balance }),

  setTransactions: (transactions) => set({ transactions }),

  topUp: (amount) =>
    set((state) => ({
      balance: Math.round((state.balance + amount) * 100) / 100,
      transactions: [
        {
          id: `tx_${Date.now()}`,
          type: 'TOPUP',
          amount,
          description: `Wallet Top-Up (+RM ${amount.toFixed(2)})`,
          timestamp: new Date().toISOString(),
        },
        ...state.transactions,
      ],
    })),

  applyDebit: (amount, description) =>
    set((state) => ({
      balance: Math.max(0, Math.round((state.balance - amount) * 100) / 100),
      transactions: [
        {
          id: `tx_${Date.now()}`,
          type: 'CHARGE',
          amount: -amount,
          description,
          timestamp: new Date().toISOString(),
        },
        ...state.transactions,
      ],
    })),

  applyCredit: (amount, description) =>
    set((state) => ({
      balance: Math.round((state.balance + amount) * 100) / 100,
      transactions: [
        {
          id: `tx_${Date.now()}`,
          type: 'REWARD',
          amount,
          description,
          timestamp: new Date().toISOString(),
        },
        ...state.transactions,
      ],
    })),

  reset: () =>
    set({
      balance: 20.0,
      transactions: [],
      isLoading: false,
    }),
}));
