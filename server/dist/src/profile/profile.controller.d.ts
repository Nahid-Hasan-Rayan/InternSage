import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ProfileService } from './profile.service';
import { UpdateAcademicProfileDto } from './dto/update-academic-profile.dto';
import { UpdateProfessionalProfileDto } from './dto/update-professional-profile.dto';
export declare class ProfileController {
    private readonly profileService;
    constructor(profileService: ProfileService);
    getAcademic(user: AuthenticatedUser): Promise<{
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
    updateAcademic(user: AuthenticatedUser, dto: UpdateAcademicProfileDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        major: string | null;
        year: number | null;
        bio: string | null;
        universityId: string | null;
    }>;
    getProfessional(user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        headline: string | null;
        visibility: import(".prisma/client").$Enums.ProfileVisibility;
    }>;
    updateProfessional(user: AuthenticatedUser, dto: UpdateProfessionalProfileDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        headline: string | null;
        visibility: import(".prisma/client").$Enums.ProfileVisibility;
    }>;
}
