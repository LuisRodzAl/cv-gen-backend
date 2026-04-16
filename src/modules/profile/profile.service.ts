import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfileDto } from './dto/profile/create-profile.dto';
import { UpdateProfileDto } from './dto/profile/update-profile.dto';
import { CreateExperienceDto } from './dto/experience/create-experience.dto';
import { UpdateExperienceDto } from './dto/experience/update-experience.dto';
import { CreateEducationDto } from './dto/education/create-education.dto';
import { UpdateEducationDto } from './dto/education/update-education.dto';
import { CreateSkillDto } from './dto/skill/create-skill.dto';
import { UpdateSkillDto } from './dto/skill/update-skill.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Profile ---

  async getByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { experiences: true, educations: true, skills: true },
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
}
