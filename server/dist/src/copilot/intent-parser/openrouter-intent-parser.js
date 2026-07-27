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
var OpenRouterIntentParser_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenRouterIntentParser = void 0;
const common_1 = require("@nestjs/common");
const rule_based_intent_parser_1 = require("./rule-based-intent-parser");
const DEFAULT_FREE_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';
let OpenRouterIntentParser = OpenRouterIntentParser_1 = class OpenRouterIntentParser {
    constructor(ruleBasedParser) {
        this.ruleBasedParser = ruleBasedParser;
        this.name = 'openrouter';
        this.logger = new common_1.Logger(OpenRouterIntentParser_1.name);
    }
    async parse(question, knownSkillNames) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return this.ruleBasedParser.parse(question, knownSkillNames);
        }
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.PUBLIC_APP_URL ?? 'https://internsage.app',
                    'X-Title': 'InternSage Sage Copilot',
                },
                body: JSON.stringify({
                    model: process.env.OPENROUTER_MODEL ?? DEFAULT_FREE_MODEL,
                    temperature: 0,
                    messages: [
                        {
                            role: 'system',
                            content: 'Extract search filters from a recruiter\'s question about candidates. ' +
                                'Reply with ONLY a JSON object with optional keys: skillNames (array of ' +
                                `strings, only from this exact list: ${knownSkillNames.join(', ')}), ` +
                                'minAuthenticity (0-100 number), major (string), universityName (string), ' +
                                'location (string), year (1-6 number). Never include any other keys. ' +
                                'If the question asks about gender, ethnicity, race, religion, age, ' +
                                'nationality, or disability, reply with exactly {} and nothing else.',
                        },
                        { role: 'user', content: question },
                    ],
                }),
            });
            if (!response.ok) {
                this.logger.warn(`OpenRouter responded ${response.status}; falling back to rule-based parsing.`);
                return this.ruleBasedParser.parse(question, knownSkillNames);
            }
            const payload = await response.json();
            const content = payload?.choices?.[0]?.message?.content;
            if (typeof content !== 'string') {
                return this.ruleBasedParser.parse(question, knownSkillNames);
            }
            const parsed = JSON.parse(content);
            return this.sanitize(parsed, knownSkillNames);
        }
        catch (error) {
            this.logger.warn(`OpenRouter call failed (${error.message}); falling back to rule-based parsing.`);
            return this.ruleBasedParser.parse(question, knownSkillNames);
        }
    }
    sanitize(raw, knownSkillNames) {
        if (typeof raw !== 'object' || raw === null) {
            return {};
        }
        const source = raw;
        const intent = {};
        if (Array.isArray(source.skillNames)) {
            const allowed = new Set(knownSkillNames.map((s) => s.toLowerCase()));
            intent.skillNames = source.skillNames
                .filter((s) => typeof s === 'string' && allowed.has(s.toLowerCase()));
        }
        if (typeof source.minAuthenticity === 'number') {
            intent.minAuthenticity = Math.max(0, Math.min(100, source.minAuthenticity));
        }
        if (typeof source.major === 'string') {
            intent.major = source.major.slice(0, 100);
        }
        if (typeof source.universityName === 'string') {
            intent.universityName = source.universityName.slice(0, 100);
        }
        if (typeof source.location === 'string') {
            intent.location = source.location.slice(0, 100);
        }
        if (typeof source.year === 'number') {
            intent.year = Math.max(1, Math.min(6, Math.round(source.year)));
        }
        return intent;
    }
};
exports.OpenRouterIntentParser = OpenRouterIntentParser;
exports.OpenRouterIntentParser = OpenRouterIntentParser = OpenRouterIntentParser_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rule_based_intent_parser_1.RuleBasedIntentParser])
], OpenRouterIntentParser);
//# sourceMappingURL=openrouter-intent-parser.js.map