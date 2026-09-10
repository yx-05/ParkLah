"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryDisputeRepository = void 0;
const common_1 = require("@nestjs/common");
let InMemoryDisputeRepository = class InMemoryDisputeRepository {
    constructor() {
        this.reports = new Map();
    }
    async createReport(report) {
        this.reports.set(report.id, report);
        return report;
    }
    async findById(id) {
        return this.reports.get(id) || null;
    }
    async findByUserId(userId) {
        return Array.from(this.reports.values()).filter((r) => r.reporterUserId === userId);
    }
    async update(report) {
        this.reports.set(report.id, report);
        return report;
    }
    clear() {
        this.reports.clear();
    }
};
exports.InMemoryDisputeRepository = InMemoryDisputeRepository;
exports.InMemoryDisputeRepository = InMemoryDisputeRepository = __decorate([
    (0, common_1.Injectable)()
], InMemoryDisputeRepository);
//# sourceMappingURL=in-memory-dispute.repository.js.map