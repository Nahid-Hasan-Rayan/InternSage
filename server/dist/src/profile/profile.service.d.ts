import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateAcademicProfileDto } from './dto/update-academic-profile.dto';
import { UpdateProfessionalProfileDto } from './dto/update-professional-profile.dto';
export declare class ProfileService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAcademicProfile(userId: string): Promise<{
        university: {
            id: string;
            name: string;
            verified: boolean;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        major: string | null;
        year: number | null;
        bio: string | null;
        universityId: string | null;
    }>;
    updateAcademicProfile(userId: string, dto: UpdateAcademicProfileDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        major: string | null;
        year: number | null;
        bio: string | null;
        universityId: string | null;
    }>;
    getProfessionalProfile(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        headline: string | null;
        visibility: import(".prisma/client").$Enums.ProfileVisibility;
    }>;
    updateProfessionalProfile(userId: string, dto: UpdateProfessionalProfileDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        headline: string | null;
        visibility: import(".prisma/client").$Enums.ProfileVisibility;
    }>;
}
