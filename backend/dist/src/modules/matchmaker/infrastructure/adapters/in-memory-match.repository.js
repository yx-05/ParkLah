"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryMatchRepository = void 0;
const common_1 = require("@nestjs/common");
let InMemoryMatchRepository = class InMemoryMatchRepository {
    constructor() {
        this.matches = new Map();
    }
    async createMatch(match) {
        this.matches.set(match.id, match);
        return match;
    }
    async findById(id) {
        return this.matches.get(id) || null;
    }
    async update(match) {
        this.matches.set(match.id, match);
        return match;
    }
    async updateStatus(id, status) {
        const match = this.matches.get(id);
        if (match) {
            match.status = status;
        }
    }
    async findActiveMatchByUserId(userId) {
        for (const match of this.matches.values()) {
            if ((match.searcherId === userId || match.leaverId === userId) &&
                ['OFFERED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED'].includes(match.status)) {
                return match;
            }
        }
        return null;
    }
    clear() {
        this.matches.clear();
    }
};
exports.InMemoryMatchRepository = InMemoryMatchRepository;
exports.InMemoryMatchRepository = InMemoryMatchRepository = __decorate([
    (0, common_1.Injectable)()
], InMemoryMatchRepository);
//# sourceMappingURL=in-memory-match.repository.js.map