"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncCountdownDto = exports.CancelDepartureDto = exports.DepartureBroadcastDto = exports.SpotCoordinatesDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class SpotCoordinatesDto {
}
exports.SpotCoordinatesDto = SpotCoordinatesDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], SpotCoordinatesDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], SpotCoordinatesDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Max)(30, { message: 'GPS accuracy must be within 30 meters' }),
    __metadata("design:type", Number)
], SpotCoordinatesDto.prototype, "accuracy", void 0);
class DepartureBroadcastDto {
}
exports.DepartureBroadcastDto = DepartureBroadcastDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SpotCoordinatesDto),
    __metadata("design:type", SpotCoordinatesDto)
], DepartureBroadcastDto.prototype, "coordinates", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(180, { message: 'Countdown must be at least 180 seconds (3 minutes)' }),
    (0, class_validator_1.Max)(300, { message: 'Countdown must be at most 300 seconds (5 minutes)' }),
    __metadata("design:type", Number)
], DepartureBroadcastDto.prototype, "countdownSeconds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DepartureBroadcastDto.prototype, "vehicleId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 100, { message: 'Landmark note cannot exceed 100 characters' }),
    __metadata("design:type", String)
], DepartureBroadcastDto.prototype, "landmarkNote", void 0);
class CancelDepartureDto {
    constructor() {
        this.reason = 'CHANGE_OF_PLANS';
    }
}
exports.CancelDepartureDto = CancelDepartureDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CancelDepartureDto.prototype, "reason", void 0);
class SyncCountdownDto {
}
exports.SyncCountdownDto = SyncCountdownDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(300),
    __metadata("design:type", Number)
], SyncCountdownDto.prototype, "remainingSeconds", void 0);
//# sourceMappingURL=index.js.map