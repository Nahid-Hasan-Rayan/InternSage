import { CopilotIntent, IntentParser } from './intent-parser.interface';
export declare class RuleBasedIntentParser implements IntentParser {
    readonly name = "rule-based";
    parse(question: string, knownSkillNames: string[]): Promise<CopilotIntent>;
}
