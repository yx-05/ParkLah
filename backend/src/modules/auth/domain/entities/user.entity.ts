import { ValidationException } from '../../../../common/exceptions';

export type AuthProvider = 'PHONE' | 'GOOGLE' | 'FACEBOOK' | 'APPLE' | 'EMAIL';

export interface UserProps {
  id?: string;
  phoneNumber?: string | null;
  email?: string | null;
  fullName?: string;
  authProvider?: AuthProvider;
  authProviderId?: string | null;
  avatarUrl?: string | null;
  passwordHash?: string | null;
  reliabilityRating?: number;
  totalCompletedMatches?: number;
  totalDisputesCount?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserEntity {
  public readonly id: string;
  public phoneNumber: string | null;
  public email: string | null;
  public fullName: string;
  public authProvider: AuthProvider;
  public authProviderId: string | null;
  public avatarUrl: string | null;
  public passwordHash: string | null;
  public reliabilityRating: number;
  public totalCompletedMatches: number;
  public totalDisputesCount: number;
  public isActive: boolean;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(props: UserProps) {
    if (props.phoneNumber) {
      this.validatePhoneNumber(props.phoneNumber);
    }
    this.id = props.id || this.generateUuid();
    this.phoneNumber = props.phoneNumber || null;
    this.email = props.email || null;
    this.fullName = props.fullName || 'ParkLah Driver';
    this.authProvider = props.authProvider || (props.phoneNumber ? 'PHONE' : (props.email ? 'EMAIL' : 'GOOGLE'));
    this.authProviderId = props.authProviderId || null;
    this.avatarUrl = props.avatarUrl || null;
    this.passwordHash = props.passwordHash || null;
    this.reliabilityRating = props.reliabilityRating !== undefined ? Math.min(Math.max(props.reliabilityRating, 0), 5) : 5.0;
    this.totalCompletedMatches = props.totalCompletedMatches || 0;
    this.totalDisputesCount = props.totalDisputesCount || 0;
    this.isActive = props.isActive !== undefined ? props.isActive : true;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  private validatePhoneNumber(phone: string): void {
    const malaysianPhoneRegex = /^\+601[0-9]{8,9}$/;
    if (!malaysianPhoneRegex.test(phone)) {
      throw new ValidationException(`Invalid Malaysian mobile number format (${phone}). Expected format: +601XXXXXXXX`);
    }
  }

  public incrementCompletedMatches(): void {
    this.totalCompletedMatches += 1;
    this.updatedAt = new Date();
  }

  public recordDispute(): void {
    this.totalDisputesCount += 1;
    this.reliabilityRating = Math.max(0, Math.round((this.reliabilityRating - 0.25) * 100) / 100);
    this.updatedAt = new Date();
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
