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
    let profile: any = null;
    let primaryCvJson: any = null;

    const source = dto.dataSource || 'profile';

    if (source === 'profile' || source === 'primary_cv') {
      profile = await this.profileService.getByUserId(userId);
    }

    if (source === 'primary_cv') {
      const primaryCv = await this.prisma.generatedCv.findFirst({
        where: { userId, isPrimary: true },
      });
      if (primaryCv) {
        primaryCvJson = primaryCv.cvContentJson;
      }
    }

    let finalJobDescription = dto.jobDescription;
    if (source === 'prompt' && dto.customPrompt) {
      finalJobDescription = `Contexto del usuario: ${dto.customPrompt}\n\nDescripción de la oferta:\n${dto.jobDescription}`;
      // Provide an empty profile so it doesn't crash
      profile = {
        fullName: 'Usuario',
        experiences: [],
        educations: [],
        skills: [],
        certificates: []
      };
    }

    const cvContentJson = await this.geminiService.generateCv(
      profile,
      finalJobDescription,
      dto.targetRole,
      dto.targetCompany,
      primaryCvJson,
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

  async setPrimary(userId: string, id: string) {
    await this.findOne(userId, id);
    
    await this.prisma.generatedCv.updateMany({
      where: { userId, id: { not: id } },
      data: { isPrimary: false },
    });

    return this.prisma.generatedCv.update({
      where: { id },
      data: { isPrimary: true },
    });
  }

  async chatWithCv(userId: string, id: string, prompt: string, currentJson: any) {
    await this.findOne(userId, id); // Verify ownership
    const newCvJson = await this.geminiService.modifyCv(currentJson, prompt);
    return newCvJson;
  }

  async importFromHtml(userId: string, htmlContent: string, targetRole: string, targetCompany: string) {
    const cvContentJson = await this.geminiService.parseHtmlCv(htmlContent);
    
    // Unset other primary CVs
    await this.prisma.generatedCv.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });

    return this.prisma.generatedCv.create({
      data: {
        userId,
        targetCompany,
        targetRole,
        jobDescription: 'Importado desde HTML',
        templateName: 'modern',
        cvContentJson: cvContentJson as unknown as object,
        isPrimary: true,
      },
    });
  }
}
