"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserVehicleEntity = void 0;
const exceptions_1 = require("../../../../common/exceptions");
class UserVehicleEntity {
    constructor(props) {
        this.validatePlateSuffix(props.plateSuffix);
        this.id = props.id || this.generateUuid();
        this.userId = props.userId;
        this.makeModel = props.makeModel;
        this.color = props.color;
        this.plateSuffix = props.plateSuffix;
        this.isDefault = props.isDefault !== undefined ? props.isDefault : false;
        this.createdAt = props.createdAt || new Date();
        this.updatedAt = props.updatedAt || new Date();
    }
    validatePlateSuffix(plate) {
        const plateSuffixRegex = /^[0-9]{4}$/;
        if (!plate || !plateSuffixRegex.test(plate)) {
            throw new exceptions_1.ValidationException(`Invalid plate suffix (${plate}). Must be exactly 4 digits for privacy protection.`);
        }
    }
    setDefault(isDefault) {
        this.isDefault = isDefault;
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
exports.UserVehicleEntity = UserVehicleEntity;
//# sourceMappingURL=user-vehicle.entity.js.map