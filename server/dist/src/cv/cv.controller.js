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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const cv_service_1 = require("./cv.service");
const cv_dto_1 = require("./dto/cv.dto");
let CvController = class CvController {
    constructor(cvService) {
        this.cvService = cvService;
    }
    getFullCv(user) {
        return this.cvService.getFullCv(user.id);
    }
    listSkillCatalog() {
        return this.cvService.listSkillCatalog();
    }
    addSkill(user, dto) {
        return this.cvService.addSkill(user.id, dto);
    }
    removeSkill(user, skillId) {
        return this.cvService.removeSkill(user.id, skillId);
    }
    addExperience(user, dto) {
        return this.cvService.addExperience(user.id, dto);
    }
    addEducation(user, dto) {
        return this.cvService.addEducation(user.id, dto);
    }
    addProject(user, dto) {
        return this.cvService.addProject(user.id, dto);
    }
};
exports.CvController = CvController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CvController.prototype, "getFullCv", null);
__decorate([
    (0, common_1.Get)('skills'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CvController.prototype, "listSkillCatalog", null);
__decorate([
    (0, common_1.Post)('skills'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cv_dto_1.AddSkillDto]),
    __metadata("design:returntype", void 0)
], CvController.prototype, "addSkill", null);
__decorate([
    (0, common_1.Delete)('skills/:skillId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('skillId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CvController.prototype, "removeSkill", null);
__decorate([
    (0, common_1.Post)('experiences'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cv_dto_1.AddExperienceDto]),
    __metadata("design:returntype", void 0)
], CvController.prototype, "addExperience", null);
__decorate([
    (0, common_1.Post)('educations'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cv_dto_1.AddEducationDto]),
    __metadata("design:returntype", void 0)
], CvController.prototype, "addEducation", null);
__decorate([
    (0, common_1.Post)('projects'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cv_dto_1.AddProjectDto]),
    __metadata("design:returntype", void 0)
], CvController.prototype, "addProject", null);
exports.CvController = CvController = __decorate([
    (0, common_1.Controller)('cv'),
    __metadata("design:paramtypes", [cv_service_1.CvService])
], CvController);
//# sourceMappingURL=cv.controller.js.map