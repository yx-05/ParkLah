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
exports.ReportSpotTakenDto = exports.ConfirmParkedDto = exports.DriverTelemetryDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const dispute_type_enum_1 = require("../../domain/enums/dispute-type.enum");
const dto_1 = require("../../../gatekeeper/application/dto");
class DriverTelemetryDto {
}
exports.DriverTelemetryDto = DriverTelemetryDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => dto_1.LatLngDto),
    __metadata("design:type", dto_1.LatLngDto)
], DriverTelemetryDto.prototype, "coordinates", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], DriverTelemetryDto.prototype, "speedKmh", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], DriverTelemetryDto.prototype, "stationaryDurationSeconds", void 0);
class ConfirmParkedDto {
}
exports.ConfirmParkedDto = ConfirmParkedDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmParkedDto.prototype, "matchId", void 0);
class ReportSpotTakenDto {
    constructor() {
        this.disputeType = dispute_type_enum_1.DisputeType.SPOT_TAKEN_BY_STRANGER;
    }
}
exports.ReportSpotTakenDto = ReportSpotTakenDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReportSpotTakenDto.prototype, "matchId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReportSpotTakenDto.prototype, "spotId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(dispute_type_enum_1.DisputeType),
    __metadata("design:type", String)
], ReportSpotTakenDto.prototype, "disputeType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReportSpotTakenDto.prototype, "description", void 0);
//# sourceMappingURL=index.js.map