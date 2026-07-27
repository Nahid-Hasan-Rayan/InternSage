"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsProtectedCharacteristic = containsProtectedCharacteristic;
const PROTECTED_KEYWORDS = [
    'gender', 'male', 'female', 'man', 'woman', 'transgender', 'non-binary',
    'race', 'ethnicity', 'ethnic', 'nationality', 'national origin',
    'religion', 'religious', 'muslim', 'christian', 'hindu', 'buddhist', 'jewish', 'sikh',
    'age', 'years old', 'birth year', 'date of birth',
    'disability', 'disabled', 'handicap',
    'pregnant', 'pregnancy', 'maternity',
    'sexual orientation', 'lgbt',
];
function containsProtectedCharacteristic(question) {
    const lower = question.toLowerCase();
    return PROTECTED_KEYWORDS.some((keyword) => lower.includes(keyword));
}
//# sourceMappingURL=protected-characteristic.guard.js.map