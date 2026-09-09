import { SocketService } from '../services/SocketService';

describe('Points & Wallet Logic (Module 8 Integration)', () => {
  it('should correctly convert RM amounts from backend ledger to ParkLah points', () => {
    // RM 0.50 fee = 50 pts
    const searcherDebitRm = -0.50;
    const searcherPts = Math.round(Math.abs(searcherDebitRm) * 100);
    expect(searcherPts).toBe(50);

    // RM 0.25 reward = 25 pts
    const leaverRewardRm = 0.25;
    const leaverPts = Math.round(Math.abs(leaverRewardRm) * 100);
    expect(leaverPts).toBe(25);

    // Initial RM 20.00 = 2000 pts
    const initialBalanceRm = 20.00;
    const initialPts = Math.round(initialBalanceRm * 100);
    expect(initialPts).toBe(2000);
  });

  it('should correctly map backend transaction structure with paginated object', () => {
    const rawBackendResponse = {
      transactions: [
        {
          id: 'tx-debit-1',
          type: 'SEARCHER_HANDOFF_FEE',
          amount: '-0.50',
          balanceAfter: '19.50',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'tx-credit-1',
          type: 'LEAVER_HANDOFF_REWARD',
          amount: '0.25',
          balanceAfter: '20.25',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'tx-topup-1',
          type: 'MOCK_TOPUP',
          amount: '1.00',
          balanceAfter: '21.25',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
        },
      ],
      total: 3,
      page: 1,
      limit: 20,
    };

    const txList = Array.isArray(rawBackendResponse)
      ? rawBackendResponse
      : rawBackendResponse.transactions || [];

    expect(txList.length).toBe(3);

    const mapped = txList.map((tx: any) => {
      const rawAmount = parseFloat(tx.amount);
      const isDebit =
        rawAmount < 0 ||
        tx.type === 'SEARCHER_HANDOFF_FEE' ||
        tx.type === 'MOCK_CASHOUT' ||
        tx.type === 'DEBIT';

      let title = tx.description;
      if (!title) {
        if (tx.type === 'SEARCHER_HANDOFF_FEE') title = 'Parking Bay Handover Fee';
        else if (tx.type === 'LEAVER_HANDOFF_REWARD') title = 'Spot Handover Reward';
        else if (tx.type === 'MOCK_TOPUP') title = 'Points Reload';
        else if (tx.type === 'MOCK_CASHOUT') title = 'Points Cash-Out';
        else title = 'Wallet Transaction';
      }

      const ptsAmount = Math.round(Math.abs(rawAmount) * 100);

      return {
        id: tx.id,
        title,
        amount: ptsAmount,
        type: isDebit ? 'debit' : 'credit',
        icon: isDebit ? 'local-parking' : 'add-circle-outline',
      };
    });

    expect(mapped[0].title).toBe('Parking Bay Handover Fee');
    expect(mapped[0].amount).toBe(50);
    expect(mapped[0].type).toBe('debit');

    expect(mapped[1].title).toBe('Spot Handover Reward');
    expect(mapped[1].amount).toBe(25);
    expect(mapped[1].type).toBe('credit');

    expect(mapped[2].title).toBe('Points Reload');
    expect(mapped[2].amount).toBe(100);
    expect(mapped[2].type).toBe('credit');
  });

  it('should support registering wallet:balance_update socket listeners', () => {
    const socket = SocketService.getInstance();
    let receivedUpdate: any = null;

    const unsub = socket.on('wallet:balance_update', (data) => {
      receivedUpdate = data;
    });

    // Verify handler registered
    expect(typeof unsub).toBe('function');
    unsub();
  });
});
