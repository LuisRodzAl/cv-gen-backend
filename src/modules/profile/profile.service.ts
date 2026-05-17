import { Injectable, NotFoundException, UploadedFile } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { ProfileParserService } from './profile-parser.service';
import { CreateProfileDto } from './dto/profile/create-profile.dto';
import { UpdateProfileDto } from './dto/profile/update-profile.dto';
import { CreateExperienceDto } from './dto/experience/create-experience.dto';
import { UpdateExperienceDto } from './dto/experience/update-experience.dto';
import { CreateEducationDto } from './dto/education/create-education.dto';
import { UpdateEducationDto } from './dto/education/update-education.dto';
import { CreateSkillDto } from './dto/skill/create-skill.dto';
import { UpdateSkillDto } from './dto/skill/update-skill.dto';
import { CreateCertificateDto } from './dto/certificate/create-certificate.dto';
import { UpdateCertificateDto } from './dto/certificate/update-certificate.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly profileParserService: ProfileParserService,
  ) {}

  // --- Profile ---

  async getByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { experiences: true, educations: true, skills: true, certificates: true },
    });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    return profile;
  }

  async create(userId: string, dto: CreateProfileDto) {
    return this.prisma.profile.create({
      data: { ...dto, userId },
    });
  }

  async update(userId: string, dto: UpdateProfileDto) {
    await this.getByUserId(userId);
    return this.prisma.profile.update({
      where: { userId },
      data: dto,
    });
  }

  async parseAndImportCv(userId: string, file: Express.Multer.File) {
    const parsedData = await this.profileParserService.parsePdfBuffer(file.buffer, file.mimetype);
    
    let profile = await this.prisma.profile.findUnique({ where: { userId } });
    
    if (profile) {
      profile = await this.prisma.profile.update({
        where: { id: profile.id },
        data: {
          fullName: parsedData.fullName || profile.fullName,
          title: parsedData.title || profile.title,
          summary: parsedData.summary || profile.summary,
          location: parsedData.location || profile.location,
        }
      });
    } else {
      profile = await this.prisma.profile.create({
        data: {
          userId,
          fullName: parsedData.fullName || 'Usuario',
          title: parsedData.title,
          summary: parsedData.summary,
          location: parsedData.location,
        }
      });
    }

    if (parsedData.experiences?.length > 0) {
      for (const exp of parsedData.experiences) {
        await this.prisma.workExperience.create({
          data: {
            profileId: profile.id,
            company: exp.company || 'Empresa',
            position: exp.position || 'Puesto',
            startDate: isNaN(Date.parse(exp.startDate)) ? new Date() : new Date(exp.startDate),
            endDate: exp.endDate && !isNaN(Date.parse(exp.endDate)) ? new Date(exp.endDate) : null,
            description: exp.description || '',
            technologies: exp.technologies || [],
          }
        });
      }
    }

    if (parsedData.educations?.length > 0) {
      for (const edu of parsedData.educations) {
        await this.prisma.education.create({
          data: {
            profileId: profile.id,
            institution: edu.institution || 'Institución',
            degree: edu.degree || 'Grado',
            startDate: isNaN(Date.parse(edu.startDate)) ? new Date() : new Date(edu.startDate),
            endDate: edu.endDate && !isNaN(Date.parse(edu.endDate)) ? new Date(edu.endDate) : null,
          }
        });
      }
    }

    if (parsedData.skills?.length > 0) {
      for (const skill of parsedData.skills) {
        await this.prisma.skill.create({
          data: {
            profileId: profile.id,
            name: skill.name || 'Habilidad',
            category: skill.category,
            level: skill.level || 3,
          }
        });
      }
    }

    return this.getByUserId(userId);
  }

  // --- Experience ---

  async addExperience(userId: string, dto: CreateExperienceDto) {
    const profile = await this.getByUserId(userId);
    return this.prisma.workExperience.create({
      data: { ...dto, profileId: profile.id },
    });
  }

  async updateExperience(userId: string, id: string, dto: UpdateExperienceDto) {
    await this.assertExperienceOwnership(userId, id);
    return this.prisma.workExperience.update({ where: { id }, data: dto });
  }

  async removeExperience(userId: string, id: string) {
    await this.assertExperienceOwnership(userId, id);
    return this.prisma.workExperience.delete({ where: { id } });
  }

  // --- Education ---

  async addEducation(userId: string, dto: CreateEducationDto) {
    const profile = await this.getByUserId(userId);
    return this.prisma.education.create({
      data: { ...dto, profileId: profile.id },
    });
  }

  async updateEducation(userId: string, id: string, dto: UpdateEducationDto) {
    await this.assertEducationOwnership(userId, id);
    return this.prisma.education.update({ where: { id }, data: dto });
  }

  async removeEducation(userId: string, id: string) {
    await this.assertEducationOwnership(userId, id);
    return this.prisma.education.delete({ where: { id } });
  }

  // --- Skills ---

  async addSkill(userId: string, dto: CreateSkillDto) {
    const profile = await this.getByUserId(userId);
    return this.prisma.skill.create({
      data: { ...dto, profileId: profile.id },
    });
  }

  async updateSkill(userId: string, id: string, dto: UpdateSkillDto) {
    await this.assertSkillOwnership(userId, id);
    return this.prisma.skill.update({ where: { id }, data: dto });
  }

  async removeSkill(userId: string, id: string) {
    await this.assertSkillOwnership(userId, id);
    return this.prisma.skill.delete({ where: { id } });
  }

  // --- Certificates ---

  async addCertificate(userId: string, dto: CreateCertificateDto, @UploadedFile() file?: Express.Multer.File) {
    const profile = await this.getByUserId(userId);
    let imageUrl: string | undefined;

    if (file) {
      imageUrl = await this.storageService.uploadFile(
        userId,
        file.buffer,
        file.mimetype,
        file.originalname,
      );
    }

    return this.prisma.certificate.create({
      data: {
        ...dto,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        profileId: profile.id,
        imageUrl,
      },
    });
  }

  async updateCertificate(userId: string, id: string, dto: UpdateCertificateDto, @UploadedFile() file?: Express.Multer.File) {
    await this.assertCertificateOwnership(userId, id);
    let imageUrl: string | undefined;

    if (file) {
      const existing = await this.prisma.certificate.findUnique({ where: { id } });
      if (existing?.imageUrl) {
        await this.storageService.deleteFile(existing.imageUrl);
      }
      imageUrl = await this.storageService.uploadFile(
        userId,
        file.buffer,
        file.mimetype,
        file.originalname,
      );
    }

    return this.prisma.certificate.update({
      where: { id },
      data: {
        ...dto,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        ...(imageUrl && { imageUrl }),
      },
    });
  }

  async removeCertificate(userId: string, id: string) {
    await this.assertCertificateOwnership(userId, id);
    const cert = await this.prisma.certificate.findUnique({ where: { id } });
    if (cert?.imageUrl) {
      await this.storageService.deleteFile(cert.imageUrl);
    }
    return this.prisma.certificate.delete({ where: { id } });
  }

  // --- Ownership guards ---

  private async assertExperienceOwnership(userId: string, id: string) {
    const profile = await this.getByUserId(userId);
    const exp = await this.prisma.workExperience.findFirst({
      where: { id, profileId: profile.id },
    });
    if (!exp) throw new NotFoundException('Experiencia no encontrada');
  }

  private async assertEducationOwnership(userId: string, id: string) {
    const profile = await this.getByUserId(userId);
    const edu = await this.prisma.education.findFirst({
      where: { id, profileId: profile.id },
    });
    if (!edu) throw new NotFoundException('Educación no encontrada');
  }

  private async assertSkillOwnership(userId: string, id: string) {
    const profile = await this.getByUserId(userId);
    const skill = await this.prisma.skill.findFirst({
      where: { id, profileId: profile.id },
    });
    if (!skill) throw new NotFoundException('Habilidad no encontrada');
  }

  private async assertCertificateOwnership(userId: string, id: string) {
    const profile = await this.getByUserId(userId);
    const cert = await this.prisma.certificate.findFirst({
      where: { id, profileId: profile.id },
    });
    if (!cert) throw new NotFoundException('Certificado no encontrado');
  }
}
