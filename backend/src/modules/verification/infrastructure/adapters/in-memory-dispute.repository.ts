import { Injectable } from '@nestjs/common';
import { IDisputeRepositoryPort } from '../../domain/ports/dispute-repository.port';
import { DisputeReportEntity } from '../../domain/entities/dispute-report.entity';

@Injectable()
export class InMemoryDisputeRepository implements IDisputeRepositoryPort {
  private reports = new Map<string, DisputeReportEntity>();

  async createReport(report: DisputeReportEntity): Promise<DisputeReportEntity> {
    this.reports.set(report.id, report);
    return report;
  }

  async findById(id: string): Promise<DisputeReportEntity | null> {
    return this.reports.get(id) || null;
  }

  async findByUserId(userId: string): Promise<DisputeReportEntity[]> {
    return Array.from(this.reports.values()).filter((r) => r.reporterUserId === userId);
  }

  async update(report: DisputeReportEntity): Promise<DisputeReportEntity> {
    this.reports.set(report.id, report);
    return report;
  }

  public clear(): void {
    this.reports.clear();
  }
}
