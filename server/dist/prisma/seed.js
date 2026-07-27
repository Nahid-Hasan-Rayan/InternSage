"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma = new client_1.PrismaClient();
async function main() {
    const utm = await prisma.university.upsert({
        where: { emailDomain: 'graduate.utm.my' },
        update: {},
        create: {
            name: 'Universiti Teknologi Malaysia',
            emailDomain: 'graduate.utm.my',
            verified: true,
        },
    });
    const paduAnalytics = await prisma.company.upsert({
        where: { emailDomain: 'paduanalytics.com' },
        update: {},
        create: {
            name: 'Padu Analytics',
            emailDomain: 'paduanalytics.com',
            verified: true,
        },
    });
    await prisma.recruiterWeights.upsert({
        where: { companyId: paduAnalytics.id },
        update: {},
        create: {
            companyId: paduAnalytics.id,
            skillsWeight: 0.5,
            projectsWeight: 0.2,
            authenticityWeight: 0.25,
            softSkillsWeight: 0.05,
        },
    });
    const jsSkill = await prisma.skill.upsert({
        where: { name: 'JavaScript' },
        update: {},
        create: { name: 'JavaScript', category: 'SOFTWARE' },
    });
    const jsQuestions = [
        {
            prompt: 'What does `typeof []` return in JavaScript?',
            choices: ['"array"', '"object"', '"list"', '"undefined"'],
            correctIndex: 1,
        },
        {
            prompt: 'Which keyword declares a block-scoped variable that can be reassigned?',
            choices: ['const', 'let', 'var', 'static'],
            correctIndex: 1,
        },
        {
            prompt: 'What does `Array.prototype.map` return?',
            choices: [
                'The original array, mutated in place',
                'A new array with the results of calling a function on every element',
                'A single accumulated value',
                'undefined',
            ],
            correctIndex: 1,
        },
        {
            prompt: 'What is the result of `"5" + 3` in JavaScript?',
            choices: ['8', '"53"', 'NaN', 'Error'],
            correctIndex: 1,
        },
        {
            prompt: 'Which of these correctly checks for strict equality?',
            choices: ['==', '===', '=', 'equals()'],
            correctIndex: 1,
        },
        {
            prompt: 'What does `async`/`await` help avoid?',
            choices: ['Type errors', 'Deeply nested Promise callbacks', 'Memory leaks', 'CSS specificity conflicts'],
            correctIndex: 1,
        },
    ];
    for (const q of jsQuestions) {
        const existing = await prisma.verificationQuestion.findFirst({
            where: { skillId: jsSkill.id, prompt: q.prompt },
        });
        if (!existing) {
            await prisma.verificationQuestion.create({
                data: { skillId: jsSkill.id, prompt: q.prompt, choices: q.choices, correctIndex: q.correctIndex },
            });
        }
    }
    const reactSkill = await prisma.skill.upsert({
        where: { name: 'React' },
        update: {},
        create: { name: 'React', category: 'SOFTWARE' },
    });
    const nodeSkill = await prisma.skill.upsert({
        where: { name: 'Node.js' },
        update: {},
        create: { name: 'Node.js', category: 'SOFTWARE' },
    });
    await prisma.skill.upsert({
        where: { name: 'PostgreSQL' },
        update: {},
        create: { name: 'PostgreSQL', category: 'SOFTWARE' },
    });
    const dedupHash = (0, crypto_1.createHash)('sha256')
        .update(`software engineering intern::${paduAnalytics.id}::`)
        .digest('hex');
    const samplePosting = await prisma.jobPosting.upsert({
        where: { dedupHash },
        update: {},
        create: {
            companyId: paduAnalytics.id,
            title: 'Software Engineering Intern',
            description: 'Join our platform team building the matching engine and recruiter tooling for a regional internship marketplace.',
            requirementsText: 'React, Node.js, and PostgreSQL experience preferred. Final-year students welcome.',
            category: 'SOFTWARE',
            dedupHash,
            requiredSkills: {
                create: [{ skillId: reactSkill.id }, { skillId: nodeSkill.id }, { skillId: jsSkill.id }],
            },
        },
    });
    console.log('Seeded:', {
        university: utm.name,
        company: paduAnalytics.name,
        verificationQuestions: jsQuestions.length,
        samplePosting: samplePosting.title,
    });
    console.log('\nTry registering with:');
    console.log('  STUDENT   nahid@graduate.utm.my   -> should come back verified: true');
    console.log('  STUDENT   someone@gmail.com       -> should come back verified: false (not rejected)');
    console.log('  RECRUITER hr@paduanalytics.com    -> should come back verified: true');
    console.log('  RECRUITER hr@some-random-co.com   -> should be REJECTED with a 400');
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map