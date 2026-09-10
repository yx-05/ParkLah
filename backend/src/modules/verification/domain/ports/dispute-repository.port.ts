import { DisputeReportEntity } from '../entities/dispute-report.entity';

export const DISPUTE_REPOSITORY_PORT = Symbol('IDisputeRepositoryPort');

export interface IDisputeRepositoryPort {
  createReport(report: DisputeReportEntity): Promise<DisputeReportEntity>;
  findById(id: string): Promise<DisputeReportEntity | null>;
  findByUserId(userId: string): Promise<DisputeReportEntity[]>;
  update(report: DisputeReportEntity): Promise<DisputeReportEntity>;
}
