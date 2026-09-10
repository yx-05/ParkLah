"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var InMemoryEventPublisherAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryEventPublisherAdapter = void 0;
const common_1 = require("@nestjs/common");
let InMemoryEventPublisherAdapter = InMemoryEventPublisherAdapter_1 = class InMemoryEventPublisherAdapter {
    constructor() {
        this.logger = new common_1.Logger(InMemoryEventPublisherAdapter_1.name);
        this.publishedEvents = [];
        this.handlers = new Map();
    }
    async publish(channel, event) {
        this.logger.log(`[EVENT BUS] Published to channel [${channel}]: ${JSON.stringify(event)}`);
        this.publishedEvents.push({ channel, event, timestamp: new Date() });
        const callbacks = this.handlers.get(channel);
        if (callbacks) {
            for (const cb of callbacks) {
                await cb(event);
            }
        }
    }
    subscribe(channel, callback) {
        if (!this.handlers.has(channel)) {
            this.handlers.set(channel, []);
        }
        this.handlers.get(channel).push(callback);
    }
    clear() {
        this.publishedEvents.length = 0;
        this.handlers.clear();
    }
};
exports.InMemoryEventPublisherAdapter = InMemoryEventPublisherAdapter;
exports.InMemoryEventPublisherAdapter = InMemoryEventPublisherAdapter = InMemoryEventPublisherAdapter_1 = __decorate([
    (0, common_1.Injectable)()
], InMemoryEventPublisherAdapter);
//# sourceMappingURL=in-memory-event-publisher.adapter.js.map