import { ValidationException } from '../../../../common/exceptions';

export interface UserVehicleProps {
  id?: string;
  userId: string;
  makeModel: string;
  color: string;
  plateSuffix: string;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserVehicleEntity {
  public readonly id: string;
  public readonly userId: string;
  public makeModel: string;
  public color: string;
  public plateSuffix: string;
  public isDefault: boolean;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(props: UserVehicleProps) {
    this.validatePlateSuffix(props.plateSuffix);
    this.id = props.id || this.generateUuid();
    this.userId = props.userId;
    this.makeModel = props.makeModel;
    this.color = props.color;
    this.plateSuffix = props.plateSuffix;
    this.isDefault = props.isDefault !== undefined ? props.isDefault : false;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  private validatePlateSuffix(plate: string): void {
    const plateSuffixRegex = /^[0-9]{4}$/;
    if (!plate || !plateSuffixRegex.test(plate)) {
      throw new ValidationException(`Invalid plate suffix (${plate}). Must be exactly 4 digits for privacy protection.`);
    }
  }

  public setDefault(isDefault: boolean): void {
    this.isDefault = isDefault;
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
