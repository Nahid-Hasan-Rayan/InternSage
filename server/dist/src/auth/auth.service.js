"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../common/prisma/prisma.service");
const analytics_service_1 = require("../analytics/analytics.service");
const BCRYPT_SALT_ROUNDS = 12;
let AuthService = class AuthService {
    constructor(prisma, jwtService, analytics) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.analytics = analytics;
    }
    extractDomain(email) {
        const domain = email.split('@')[1]?.toLowerCase().trim();
        if (!domain) {
            throw new common_1.BadRequestException('Email address is malformed.');
        }
        return domain;
    }
    toSafeUser(user) {
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            verified: user.verified,
        };
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw new common_1.ConflictException('Registration could not be completed with the provided details.');
        }
        const domain = this.extractDomain(dto.email);
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
        if (dto.role === client_1.Role.RECRUITER) {
            const company = await this.prisma.company.findUnique({ where: { emailDomain: domain } });
            if (!company) {
                throw new common_1.BadRequestException('Your organisation is not yet a partner on InternSage. Contact us to onboard your company before registering.');
            }
            const user = await this.prisma.$transaction(async (tx) => {
                const created = await tx.user.create({
                    data: {
                        email: dto.email,
                        fullName: dto.fullName,
                        passwordHash,
                        role: client_1.Role.RECRUITER,
                        verified: true,
                    },
                });
                await tx.recruiterProfile.create({
                    data: { userId: created.id, companyId: company.id },
                });
                return created;
            });
            void this.analytics.record({ type: 'AUTH_REGISTER', userId: user.id, userRole: client_1.Role.RECRUITER });
            return this.issueSession(user);
        }
        const university = await this.prisma.university.findUnique({ where: { emailDomain: domain } });
        const user = await this.prisma.$transaction(async (tx) => {
            const created = await tx.user.create({
                data: {
                    email: dto.email,
                    fullName: dto.fullName,
                    passwordHash,
                    role: client_1.Role.STUDENT,
                    verified: Boolean(university),
                },
            });
            await tx.studentProfile.create({
                data: { userId: created.id, universityId: university?.id },
            });
            await tx.professionalProfile.create({
                data: { userId: created.id },
            });
            return created;
        });
        void this.analytics.record({ type: 'AUTH_REGISTER', userId: user.id, userRole: client_1.Role.STUDENT });
        return this.issueSession(user);
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        const invalidCredentials = () => new common_1.UnauthorizedException('Invalid email or password.');
        if (!user) {
            void this.analytics.record({ type: 'AUTH_LOGIN_FAILED', metadata: { reason: 'no_such_user' } });
            throw invalidCredentials();
        }
        const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordMatches) {
            void this.analytics.record({
                type: 'AUTH_LOGIN_FAILED',
                userId: user.id,
                userRole: user.role,
                metadata: { reason: 'wrong_password' },
            });
            throw invalidCredentials();
        }
        void this.analytics.record({ type: 'AUTH_LOGIN', userId: user.id, userRole: user.role });
        return this.issueSession(user);
    }
    issueSession(user) {
        const accessToken = this.jwtService.sign({ sub: user.id, role: user.role });
        return { accessToken, user: this.toSafeUser(user) };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        analytics_service_1.AnalyticsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map