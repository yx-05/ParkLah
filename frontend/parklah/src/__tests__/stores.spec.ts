import { useSearcherStore } from '../stores/useSearcherStore';
import { useLeaverStore } from '../stores/useLeaverStore';
import { useWalletStore } from '../stores/useWalletStore';

describe('Frontend Zustand Stores (Module 1 Unit Tests)', () => {
  beforeEach(() => {
    useSearcherStore.getState().reset();
    useLeaverStore.getState().reset();
    useWalletStore.getState().reset();
  });

  describe('useSearcherStore', () => {
    it('should transition correctly through searcher state machine', () => {
      const store = useSearcherStore.getState();
      expect(store.state).toBe('IDLE');

      // 1. Set destination
      useSearcherStore.getState().setDestination({
        name: 'Mid Valley Megamall',
        latitude: 3.1176,
        longitude: 101.6778,
      });
      expect(useSearcherStore.getState().state).toBe('DESTINATION_SET');

      // 2. Set Gatekeeper locked
      useSearcherStore.getState().setGatekeeperStatus({
        isUnlocked: false,
        distanceMeters: 4500,
        durationSeconds: 800,
      });
      expect(useSearcherStore.getState().state).toBe('GATEKEEPER_LOCKED');

      // 3. Set Gatekeeper unlocked
      useSearcherStore.getState().setGatekeeperStatus({
        isUnlocked: true,
        distanceMeters: 1800,
        durationSeconds: 360,
      });
      expect(useSearcherStore.getState().state).toBe('ACTIVE_RADAR_SEARCH');

      // 4. Offer received
      useSearcherStore.getState().setActiveOffer({
        matchId: 'match-xyz',
        leaverId: 'leaver-1',
        spotCoords: { latitude: 3.1176, longitude: 101.6778 },
        countdownSeconds: 240,
        handshakeTimeoutSeconds: 15,
      });
      expect(useSearcherStore.getState().state).toBe('MATCH_OFFERED');

      // 5. Accept offer
      useSearcherStore.getState().acceptOffer('match-xyz');
      expect(useSearcherStore.getState().state).toBe('NAVIGATING_TO_SPOT');
      expect(useSearcherStore.getState().confirmedMatchId).toBe('match-xyz');

      // 6. Arrived prompt
      useSearcherStore.getState().setArrivedPrompt();
      expect(useSearcherStore.getState().state).toBe('ARRIVED_PROMPT');

      // 7. Spot Taken Fallback
      useSearcherStore.getState().setSpotTakenFallback({
        id: 'spot-fallback-1',
        coordinates: { latitude: 3.118, longitude: 101.678 },
      });
      expect(useSearcherStore.getState().state).toBe('SPOT_TAKEN_FALLBACK');

      // 8. Parked Success
      useSearcherStore.getState().setParkedSuccess();
      expect(useSearcherStore.getState().state).toBe('PARKED_SUCCESS');
    });
  });

  describe('useLeaverStore', () => {
    it('should manage departure countdown and cancellation grace period rules', () => {
      const store = useLeaverStore.getState();
      expect(store.state).toBe('IDLE');

      // 1. Start broadcast (4 mins = 240s)
      useLeaverStore.getState().startBroadcast(
        { latitude: 3.1176, longitude: 101.6778 },
        240,
        'Near Main Lobby',
      );
      expect(useLeaverStore.getState().state).toBe('BROADCASTING_COUNTDOWN');
      expect(useLeaverStore.getState().countdownSeconds).toBe(240);

      // 2. Early cancellation without match -> no penalty
      const earlyCancelResult = useLeaverStore.getState().cancelBroadcast();
      expect(earlyCancelResult.penaltyApplied).toBe(false);
      expect(useLeaverStore.getState().state).toBe('CANCELLED');

      // 3. Restart broadcast and match to searcher
      useLeaverStore.getState().startBroadcast(
        { latitude: 3.1176, longitude: 101.6778 },
        240,
      );
      useLeaverStore.getState().setMatchedSearcher({
        searcherId: 'searcher-1',
        matchId: 'match-1',
      });
      expect(useLeaverStore.getState().state).toBe('SEARCHER_MATCHED');

      // 4. Countdown reaches < 60s
      useLeaverStore.getState().syncCountdown(45);
      useLeaverStore.getState().decrementCountdown();
      expect(useLeaverStore.getState().penaltyWarning).toBe(true);

      // 5. Late cancellation when matched -> penalty applied
      const lateCancelResult = useLeaverStore.getState().cancelBroadcast();
      expect(lateCancelResult.penaltyApplied).toBe(true);
      expect(useLeaverStore.getState().state).toBe('CANCELLED');
    });
  });

  describe('useWalletStore', () => {
    it('should manage wallet balance and double-entry transaction records', () => {
      // 1. Initial balance RM 20.00
      expect(useWalletStore.getState().balance).toBe(20.0);

      // 2. Top-up +RM 10.00
      useWalletStore.getState().topUp(10.0);
      expect(useWalletStore.getState().balance).toBe(30.0);

      // 3. Searcher debit -RM 0.50
      useWalletStore.getState().applyDebit(0.50, 'ParkLah Handoff Fee');
      expect(useWalletStore.getState().balance).toBe(29.50);

      // 4. Leaver credit +RM 0.25
      useWalletStore.getState().applyCredit(0.25, 'Leaver Departure Reward');
      expect(useWalletStore.getState().balance).toBe(29.75);

      // 5. Transactions array has all records
      const txs = useWalletStore.getState().transactions;
      expect(txs.length).toBeGreaterThanOrEqual(3);
    });
  });
});
