"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleBasedIntentParser = void 0;
const common_1 = require("@nestjs/common");
let RuleBasedIntentParser = class RuleBasedIntentParser {
    constructor() {
        this.name = 'rule-based';
    }
    async parse(question, knownSkillNames) {
        const lower = question.toLowerCase();
        const intent = {};
        const matchedSkills = knownSkillNames.filter((skill) => lower.includes(skill.toLowerCase()));
        if (matchedSkills.length > 0) {
            intent.skillNames = matchedSkills;
        }
        const authenticityMatch = lower.match(/authenticity(?: score)? (?:of |above |over |at least )?(\d{1,3})/);
        if (authenticityMatch) {
            intent.minAuthenticity = Math.min(100, parseInt(authenticityMatch[1], 10));
        }
        const yearMatch = lower.match(/\byear (\d)\b|\bfinal[- ]year\b|\b(\d)(?:st|nd|rd|th) year\b/);
        if (yearMatch) {
            intent.year = yearMatch[0].includes('final') ? 4 : parseInt(yearMatch[1] ?? yearMatch[2], 10);
        }
        const locationMatch = lower.match(/\bin ([a-z\s]+?)(?:$|,|\.|who|with)/);
        if (locationMatch) {
            intent.location = locationMatch[1].trim();
        }
        const majorMatch = lower.match(/\bmajoring in ([a-z\s]+?)(?:$|,|\.|who|with)/);
        if (majorMatch) {
            intent.major = majorMatch[1].trim();
        }
        return intent;
    }
};
exports.RuleBasedIntentParser = RuleBasedIntentParser;
exports.RuleBasedIntentParser = RuleBasedIntentParser = __decorate([
    (0, common_1.Injectable)()
], RuleBasedIntentParser);
//# sourceMappingURL=rule-based-intent-parser.js.map