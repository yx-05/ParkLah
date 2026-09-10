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
export declare class UserVehicleEntity {
    readonly id: string;
    readonly userId: string;
    makeModel: string;
    color: string;
    plateSuffix: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
    constructor(props: UserVehicleProps);
    private validatePlateSuffix;
    setDefault(isDefault: boolean): void;
    private generateUuid;
}
