import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfileService } from '../profile/profile.service';
import { GeminiService } from './gemini.service';
import { GenerateCvDto } from './dto/generate-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';

@Injectable()
export class CvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService,
    private readonly geminiService: GeminiService,
  ) {}

  async generate(userId: string, dto: GenerateCvDto) {
    const profile = await this.profileService.getByUserId(userId);

    const cvContentJson = await this.geminiService.generateCv(
      profile,
      dto.jobDescription,
      dto.targetRole,
      dto.targetCompany,
    );

    return this.prisma.generatedCv.create({
      data: {
        userId,
        targetCompany: dto.targetCompany,
        targetRole: dto.targetRole,
        jobDescription: dto.jobDescription,
        templateName: dto.templateName,
        cvContentJson: cvContentJson as unknown as object,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.generatedCv.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const cv = await this.prisma.generatedCv.findFirst({ where: { id, userId } });
    if (!cv) throw new NotFoundException('CV no encontrado');
    return cv;
  }

  async update(userId: string, id: string, dto: UpdateCvDto) {
    await this.findOne(userId, id);
    return this.prisma.generatedCv.update({
      where: { id },
      data: {
        ...(dto.templateName && { templateName: dto.templateName }),
        ...(dto.cvContentJson && { cvContentJson: dto.cvContentJson as unknown as object }),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.generatedCv.delete({ where: { id } });
  }
}
