import { Injectable, NotFoundException, UploadedFile } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
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
