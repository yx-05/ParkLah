import { MatchStatus, MatchType } from '../enums/match-status.enum';
import { ValidationException } from '../../../../common/exceptions';

export interface MatchProps {
  id?: string;
  searcherId: string;
  leaverId?: string | null;
  probabilisticSpotId?: string | null;
  matchType?: MatchType;
  spotLatitude: number;
  spotLongitude: number;
  status?: MatchStatus;
  searcherChargeAmount?: number;
  leaverRewardAmount?: number;
  platformFeeAmount?: number;
  handshakeTimeoutSeconds?: number;
  offeredAt?: Date;
  acceptedAt?: Date | null;
  arrivedAt?: Date | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
}

export class MatchEntity {
  public readonly id: string;
  public readonly searcherId: string;
  public readonly leaverId: string | null;
  public readonly probabilisticSpotId: string | null;
  public readonly matchType: MatchType;
  public readonly spotLatitude: number;
  public readonly spotLongitude: number;
  public status: MatchStatus;
  public readonly searcherChargeAmount: number;
  public readonly leaverRewardAmount: number;
  public readonly platformFeeAmount: number;
  public readonly handshakeTimeoutSeconds: number;
  public readonly offeredAt: Date;
  public acceptedAt: Date | null;
  public arrivedAt: Date | null;
  public completedAt: Date | null;
  public cancelledAt: Date | null;
  public cancellationReason: string | null;

  constructor(props: MatchProps) {
    this.id = props.id || this.generateUuid();
    this.searcherId = props.searcherId;
    this.leaverId = props.leaverId || null;
    this.probabilisticSpotId = props.probabilisticSpotId || null;
    this.matchType = props.matchType || (props.leaverId ? 'REAL_TIME_P2P' : 'PROBABILISTIC_DB');
    this.spotLatitude = props.spotLatitude;
    this.spotLongitude = props.spotLongitude;
    this.status = props.status || MatchStatus.OFFERED;
    this.searcherChargeAmount = props.searcherChargeAmount !== undefined ? props.searcherChargeAmount : 0.50;
    this.leaverRewardAmount = props.leaverRewardAmount !== undefined ? props.leaverRewardAmount : 0.25;
    this.platformFeeAmount = props.platformFeeAmount !== undefined ? props.platformFeeAmount : 0.25;
    this.handshakeTimeoutSeconds = props.handshakeTimeoutSeconds || 15;
    this.offeredAt = props.offeredAt || new Date();
    this.acceptedAt = props.acceptedAt || null;
    this.arrivedAt = props.arrivedAt || null;
    this.completedAt = props.completedAt || null;
    this.cancelledAt = props.cancelledAt || null;
    this.cancellationReason = props.cancellationReason || null;
  }

  public accept(): void {
    if (this.status !== MatchStatus.OFFERED) {
      throw new ValidationException(`Cannot accept match with status ${this.status}`);
    }
    this.status = MatchStatus.ACCEPTED;
    this.acceptedAt = new Date();
  }

  public markEnRoute(): void {
    this.status = MatchStatus.EN_ROUTE;
  }

  public markArrived(): void {
    this.status = MatchStatus.ARRIVED;
    this.arrivedAt = new Date();
  }

  public markCompleted(): void {
    this.status = MatchStatus.COMPLETED;
    this.completedAt = new Date();
  }

  public markFailedSpotTaken(): void {
    this.status = MatchStatus.FAILED_SPOT_TAKEN;
    this.completedAt = new Date();
  }

  public markTimeout(): void {
    if (this.status === MatchStatus.OFFERED) {
      this.status = MatchStatus.TIMEOUT;
      this.cancelledAt = new Date();
      this.cancellationReason = 'HANDSHAKE_TIMEOUT_15S';
    }
  }

  public markDeclined(): void {
    if (this.status === MatchStatus.OFFERED) {
      this.status = MatchStatus.DECLINED;
      this.cancelledAt = new Date();
      this.cancellationReason = 'DECLINED_BY_SEARCHER';
    }
  }

  public cancel(reason: string, by: 'SEARCHER' | 'LEAVER'): void {
    this.status = by === 'SEARCHER' ? MatchStatus.CANCELLED_SEARCHER : MatchStatus.CANCELLED_LEAVER;
    this.cancelledAt = new Date();
    this.cancellationReason = reason;
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
