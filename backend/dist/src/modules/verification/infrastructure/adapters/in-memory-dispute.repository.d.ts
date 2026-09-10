import { IDisputeRepositoryPort } from '../../domain/ports/dispute-repository.port';
import { DisputeReportEntity } from '../../domain/entities/dispute-report.entity';
export declare class InMemoryDisputeRepository implements IDisputeRepositoryPort {
    private reports;
    createReport(report: DisputeReportEntity): Promise<DisputeReportEntity>;
    findById(id: string): Promise<DisputeReportEntity | null>;
    findByUserId(userId: string): Promise<DisputeReportEntity[]>;
    update(report: DisputeReportEntity): Promise<DisputeReportEntity>;
    clear(): void;
}
