"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProbabilisticSpotEntity = void 0;
const spot_status_enum_1 = require("../enums/spot-status.enum");
class ProbabilisticSpotEntity {
    constructor(props) {
        this.id = props.id || this.generateUuid();
        this.leaverId = props.leaverId || null;
        this.latitude = props.latitude;
        this.longitude = props.longitude;
        this.initialP = props.initialP !== undefined ? props.initialP : 0.950;
        this.currentP = props.currentP !== undefined ? props.currentP : this.initialP;
        this.areaTrafficMultiplier = props.areaTrafficMultiplier !== undefined ? props.areaTrafficMultiplier : 1.0;
        this.landmarkNote = props.landmarkNote || null;
        this.status = props.status || spot_status_enum_1.SpotStatus.AVAILABLE;
        this.vacatedAt = props.vacatedAt || new Date();
        this.expiresAt = props.expiresAt || new Date(this.vacatedAt.getTime() + 15 * 60 * 1000);
        this.createdAt = props.createdAt || new Date();
        this.updatedAt = props.updatedAt || new Date();
    }
    isExpired() {
        return this.status === spot_status_enum_1.SpotStatus.EXPIRED || Date.now() > this.expiresAt.getTime() || this.currentP < 0.150;
    }
    applyDecay(newP) {
        if (newP <= 0 || newP < 0.150) {
            this.currentP = 0.0;
            this.status = spot_status_enum_1.SpotStatus.EXPIRED;
        }
        else {
            this.currentP = Math.round(newP * 1000) / 1000;
        }
        this.updatedAt = new Date();
    }
    markOccupied() {
        this.status = spot_status_enum_1.SpotStatus.OCCUPIED;
        this.updatedAt = new Date();
    }
    markReserved() {
        this.status = spot_status_enum_1.SpotStatus.RESERVED;
        this.updatedAt = new Date();
    }
    getProbabilityLabel() {
        if (this.currentP >= 0.70)
            return 'High Chance';
        if (this.currentP >= 0.40)
            return 'Moderate';
        if (this.currentP >= 0.15)
            return 'Low';
        return 'Expired';
    }
    generateUuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
}
exports.ProbabilisticSpotEntity = ProbabilisticSpotEntity;
//# sourceMappingURL=probabilistic-spot.entity.js.map