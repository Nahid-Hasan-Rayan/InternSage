"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopilotModule = void 0;
const common_1 = require("@nestjs/common");
const copilot_controller_1 = require("./copilot.controller");
const copilot_service_1 = require("./copilot.service");
const copilot_constants_1 = require("./copilot.constants");
const openrouter_intent_parser_1 = require("./intent-parser/openrouter-intent-parser");
const rule_based_intent_parser_1 = require("./intent-parser/rule-based-intent-parser");
let CopilotModule = class CopilotModule {
};
exports.CopilotModule = CopilotModule;
exports.CopilotModule = CopilotModule = __decorate([
    (0, common_1.Module)({
        controllers: [copilot_controller_1.CopilotController],
        providers: [
            rule_based_intent_parser_1.RuleBasedIntentParser,
            openrouter_intent_parser_1.OpenRouterIntentParser,
            { provide: copilot_constants_1.COPILOT_INTENT_PARSER, useExisting: openrouter_intent_parser_1.OpenRouterIntentParser },
            copilot_service_1.CopilotService,
        ],
    })
], CopilotModule);
//# sourceMappingURL=copilot.module.js.map