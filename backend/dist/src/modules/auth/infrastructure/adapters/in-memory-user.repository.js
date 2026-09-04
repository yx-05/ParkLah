"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryUserRepository = void 0;
const common_1 = require("@nestjs/common");
let InMemoryUserRepository = class InMemoryUserRepository {
    constructor() {
        this.users = new Map();
    }
    async findById(id) {
        return this.users.get(id) || null;
    }
    async findByPhoneNumber(phone) {
        for (const user of this.users.values()) {
            if (user.phoneNumber === phone) {
                return user;
            }
        }
        return null;
    }
    async findByEmail(email) {
        for (const user of this.users.values()) {
            if (user.email?.toLowerCase() === email.toLowerCase()) {
                return user;
            }
        }
        return null;
    }
    async findByProvider(provider, providerId) {
        for (const user of this.users.values()) {
            if (user.authProvider === provider && user.authProviderId === providerId) {
                return user;
            }
        }
        return null;
    }
    async create(user) {
        this.users.set(user.id, user);
        return user;
    }
    async update(user) {
        this.users.set(user.id, user);
        return user;
    }
    clear() {
        this.users.clear();
    }
};
exports.InMemoryUserRepository = InMemoryUserRepository;
exports.InMemoryUserRepository = InMemoryUserRepository = __decorate([
    (0, common_1.Injectable)()
], InMemoryUserRepository);
//# sourceMappingURL=in-memory-user.repository.js.map