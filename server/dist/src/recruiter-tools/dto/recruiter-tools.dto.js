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
exports.SubmitScorecardDto = exports.CreateInterviewKitDto = exports.UpdateRecruiterWeightsDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class UpdateRecruiterWeightsDto {
}
exports.UpdateRecruiterWeightsDto = UpdateRecruiterWeightsDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], UpdateRecruiterWeightsDto.prototype, "skillsWeight", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], UpdateRecruiterWeightsDto.prototype, "projectsWeight", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], UpdateRecruiterWeightsDto.prototype, "authenticityWeight", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], UpdateRecruiterWeightsDto.prototype, "softSkillsWeight", void 0);
class CriterionDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CriterionDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CriterionDto.prototype, "description", void 0);
class CreateInterviewKitDto {
}
exports.CreateInterviewKitDto = CreateInterviewKitDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateInterviewKitDto.prototype, "roleTitle", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CriterionDto),
    __metadata("design:type", Array)
], CreateInterviewKitDto.prototype, "criteria", void 0);
class SubmitScorecardDto {
}
exports.SubmitScorecardDto = SubmitScorecardDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitScorecardDto.prototype, "interviewKitId", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitScorecardDto.prototype, "ratings", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SubmitScorecardDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ScorecardRecommendation),
    __metadata("design:type", String)
], SubmitScorecardDto.prototype, "recommendation", void 0);
//# sourceMappingURL=recruiter-tools.dto.js.map