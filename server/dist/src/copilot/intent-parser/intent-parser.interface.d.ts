export interface CopilotIntent {
    skillNames?: string[];
    minAuthenticity?: number;
    major?: string;
    universityName?: string;
    location?: string;
    year?: number;
}
export interface IntentParser {
    readonly name: string;
    parse(question: string, knownSkillNames: string[]): Promise<CopilotIntent>;
}
