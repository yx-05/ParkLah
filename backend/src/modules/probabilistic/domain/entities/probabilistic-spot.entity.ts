import { SpotStatus } from '../enums/spot-status.enum';

export interface ProbabilisticSpotProps {
  id?: string;
  leaverId?: string | null;
  latitude: number;
  longitude: number;
  initialP?: number;
  currentP?: number;
  areaTrafficMultiplier?: number;
  landmarkNote?: string | null;
  status?: SpotStatus;
  vacatedAt?: Date;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProbabilisticSpotEntity {
  public readonly id: string;
  public readonly leaverId: string | null;
  public readonly latitude: number;
  public readonly longitude: number;
  public readonly initialP: number;
  public currentP: number;
  public readonly areaTrafficMultiplier: number;
  public readonly landmarkNote: string | null;
  public status: SpotStatus;
  public readonly vacatedAt: Date;
  public readonly expiresAt: Date;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: ProbabilisticSpotProps) {
    this.id = props.id || this.generateUuid();
    this.leaverId = props.leaverId || null;
    this.latitude = props.latitude;
    this.longitude = props.longitude;
    this.initialP = props.initialP !== undefined ? props.initialP : 0.950;
    this.currentP = props.currentP !== undefined ? props.currentP : this.initialP;
    this.areaTrafficMultiplier = props.areaTrafficMultiplier !== undefined ? props.areaTrafficMultiplier : 1.0;
    this.landmarkNote = props.landmarkNote || null;
    this.status = props.status || SpotStatus.AVAILABLE;
    this.vacatedAt = props.vacatedAt || new Date();
    this.expiresAt = props.expiresAt || new Date(this.vacatedAt.getTime() + 15 * 60 * 1000); // 15 mins max lifespan
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  public isExpired(): boolean {
    return this.status === SpotStatus.EXPIRED || Date.now() > this.expiresAt.getTime() || this.currentP < 0.150;
  }

  public applyDecay(newP: number): void {
    if (newP <= 0 || newP < 0.150) {
      this.currentP = 0.0;
      this.status = SpotStatus.EXPIRED;
    } else {
      this.currentP = Math.round(newP * 1000) / 1000;
    }
    this.updatedAt = new Date();
  }

  public markOccupied(): void {
    this.status = SpotStatus.OCCUPIED;
    this.updatedAt = new Date();
  }

  public markReserved(): void {
    this.status = SpotStatus.RESERVED;
    this.updatedAt = new Date();
  }

  public getProbabilityLabel(): 'High Chance' | 'Moderate' | 'Low' | 'Expired' {
    if (this.currentP >= 0.70) return 'High Chance';
    if (this.currentP >= 0.40) return 'Moderate';
    if (this.currentP >= 0.15) return 'Low';
    return 'Expired';
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
