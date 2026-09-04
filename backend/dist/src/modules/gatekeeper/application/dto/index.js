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
exports.SearchPlacesQueryDto = exports.StartSearchDto = exports.EvaluateDestinationDto = exports.DestinationTargetDto = exports.LatLngDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class LatLngDto {
}
exports.LatLngDto = LatLngDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], LatLngDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], LatLngDto.prototype, "longitude", void 0);
class DestinationTargetDto extends LatLngDto {
}
exports.DestinationTargetDto = DestinationTargetDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DestinationTargetDto.prototype, "placeId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DestinationTargetDto.prototype, "name", void 0);
class EvaluateDestinationDto {
}
exports.EvaluateDestinationDto = EvaluateDestinationDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LatLngDto),
    __metadata("design:type", LatLngDto)
], EvaluateDestinationDto.prototype, "origin", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DestinationTargetDto),
    __metadata("design:type", DestinationTargetDto)
], EvaluateDestinationDto.prototype, "destination", void 0);
class StartSearchDto {
    constructor() {
        this.radiusMeters = 1000;
    }
}
exports.StartSearchDto = StartSearchDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LatLngDto),
    __metadata("design:type", LatLngDto)
], StartSearchDto.prototype, "destCoords", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StartSearchDto.prototype, "destName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(500),
    (0, class_validator_1.Max)(1500),
    __metadata("design:type", Number)
], StartSearchDto.prototype, "radiusMeters", void 0);
class SearchPlacesQueryDto {
}
exports.SearchPlacesQueryDto = SearchPlacesQueryDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchPlacesQueryDto.prototype, "query", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SearchPlacesQueryDto.prototype, "proximityLat", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SearchPlacesQueryDto.prototype, "proximityLng", void 0);
//# sourceMappingURL=index.js.map