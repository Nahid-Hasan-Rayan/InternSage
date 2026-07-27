import { CopilotIntent, IntentParser } from './intent-parser.interface';
import { RuleBasedIntentParser } from './rule-based-intent-parser';
export declare class OpenRouterIntentParser implements IntentParser {
    private readonly ruleBasedParser;
    readonly name = "openrouter";
    private readonly logger;
    constructor(ruleBasedParser: RuleBasedIntentParser);
    parse(question: string, knownSkillNames: string[]): Promise<CopilotIntent>;
    private sanitize;
}
