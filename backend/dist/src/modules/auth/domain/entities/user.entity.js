"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = void 0;
const exceptions_1 = require("../../../../common/exceptions");
class UserEntity {
    constructor(props) {
        if (props.phoneNumber) {
            this.validatePhoneNumber(props.phoneNumber);
        }
        this.id = props.id || this.generateUuid();
        this.phoneNumber = props.phoneNumber || null;
        this.email = props.email || null;
        this.fullName = props.fullName || 'ParkLah Driver';
        this.authProvider = props.authProvider || (props.phoneNumber ? 'PHONE' : 'GOOGLE');
        this.authProviderId = props.authProviderId || null;
        this.avatarUrl = props.avatarUrl || null;
        this.reliabilityRating = props.reliabilityRating !== undefined ? Math.min(Math.max(props.reliabilityRating, 0), 5) : 5.0;
        this.totalCompletedMatches = props.totalCompletedMatches || 0;
        this.totalDisputesCount = props.totalDisputesCount || 0;
        this.isActive = props.isActive !== undefined ? props.isActive : true;
        this.createdAt = props.createdAt || new Date();
        this.updatedAt = props.updatedAt || new Date();
    }
    validatePhoneNumber(phone) {
        const malaysianPhoneRegex = /^\+601[0-9]{8,9}$/;
        if (!malaysianPhoneRegex.test(phone)) {
            throw new exceptions_1.ValidationException(`Invalid Malaysian mobile number format (${phone}). Expected format: +601XXXXXXXX`);
        }
    }
    incrementCompletedMatches() {
        this.totalCompletedMatches += 1;
        this.updatedAt = new Date();
    }
    recordDispute() {
        this.totalDisputesCount += 1;
        this.reliabilityRating = Math.max(0, Math.round((this.reliabilityRating - 0.25) * 100) / 100);
        this.updatedAt = new Date();
    }
    generateUuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
}
exports.UserEntity = UserEntity;
//# sourceMappingURL=user.entity.js.map