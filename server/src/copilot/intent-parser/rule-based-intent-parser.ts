/**
 * InternSage — RuleBasedIntentParser
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-COPILOT-002
 * File   : src/copilot/intent-parser/rule-based-intent-parser.ts
 *
 * No network call, no API key required — this is the parser that
 * always runs, and OpenRouterIntentParser's actual fallback when
 * OPENROUTER_API_KEY isn't set or the call fails. It only ever
 * recognizes skill names that already exist in the Skill table
 * (never invents one from free text) plus a few numeric/location
 * patterns — narrow on purpose.
 */

import { Injectable } from '@nestjs/common';
import { CopilotIntent, IntentParser } from './intent-parser.interface';

@Injectable()
export class RuleBasedIntentParser implements IntentParser {
  readonly name = 'rule-based';

  async parse(question: string, knownSkillNames: string[]): Promise<CopilotIntent> {
    const lower = question.toLowerCase();
    const intent: CopilotIntent = {};

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
}
