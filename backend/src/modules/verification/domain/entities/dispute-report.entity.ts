import { DisputeType, DisputeStatus } from '../enums/dispute-type.enum';

export interface DisputeReportProps {
  id?: string;
  matchId?: string | null;
  reporterUserId: string;
  spotId?: string | null;
  disputeType: DisputeType;
  description?: string | null;
  status?: DisputeStatus;
  createdAt?: Date;
  resolvedAt?: Date | null;
}

export class DisputeReportEntity {
  public readonly id: string;
  public readonly matchId: string | null;
  public readonly reporterUserId: string;
  public readonly spotId: string | null;
  public readonly disputeType: DisputeType;
  public readonly description: string | null;
  public status: DisputeStatus;
  public readonly createdAt: Date;
  public resolvedAt: Date | null;

  constructor(props: DisputeReportProps) {
    this.id = props.id || this.generateUuid();
    this.matchId = props.matchId || null;
    this.reporterUserId = props.reporterUserId;
    this.spotId = props.spotId || null;
    this.disputeType = props.disputeType;
    this.description = props.description || null;
    this.status = props.status || DisputeStatus.PENDING;
    this.createdAt = props.createdAt || new Date();
    this.resolvedAt = props.resolvedAt || null;
  }

  public resolve(auto = true): void {
    this.status = auto ? DisputeStatus.AUTO_RESOLVED : DisputeStatus.MANUAL_REVIEW;
    this.resolvedAt = new Date();
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
