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
export declare class DisputeReportEntity {
    readonly id: string;
    readonly matchId: string | null;
    readonly reporterUserId: string;
    readonly spotId: string | null;
    readonly disputeType: DisputeType;
    readonly description: string | null;
    status: DisputeStatus;
    readonly createdAt: Date;
    resolvedAt: Date | null;
    constructor(props: DisputeReportProps);
    resolve(auto?: boolean): void;
    private generateUuid;
}
