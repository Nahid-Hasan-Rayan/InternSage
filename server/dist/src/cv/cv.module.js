"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvModule = void 0;
const common_1 = require("@nestjs/common");
const cv_service_1 = require("./cv.service");
const cv_controller_1 = require("./cv.controller");
let CvModule = class CvModule {
};
exports.CvModule = CvModule;
exports.CvModule = CvModule = __decorate([
    (0, common_1.Module)({
        controllers: [cv_controller_1.CvController],
        providers: [cv_service_1.CvService],
        exports: [cv_service_1.CvService],
    })
], CvModule);
//# sourceMappingURL=cv.module.js.map