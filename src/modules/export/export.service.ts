import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportGeminiService } from './export-gemini.service';
import { GenerateHtmlDto } from './dto/generate-html.dto';
import { KNOWN_TEMPLATES } from './templates/known-templates';

@Injectable()
export class ExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exportGeminiService: ExportGeminiService,
  ) {}

  async generateHtml(userId: string, dto: GenerateHtmlDto): Promise<string> {
    const cv = await this.prisma.generatedCv.findFirst({
      where: { id: dto.cvId, userId },
    });
    if (!cv) throw new NotFoundException('CV no encontrado');

    const templateDescription =
      dto.templateName && KNOWN_TEMPLATES[dto.templateName.toLowerCase()]
        ? KNOWN_TEMPLATES[dto.templateName.toLowerCase()]
        : dto.templateName ?? 'harvard';

    return this.exportGeminiService.generateHtmlFromTemplate(
      cv.cvContentJson as Record<string, unknown>,
      cv.targetRole,
      cv.targetCompany,
      templateDescription,
    );
  }

  async generateHtmlFromFile(
    userId: string,
    cvId: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const cv = await this.prisma.generatedCv.findFirst({
      where: { id: cvId, userId },
    });
    if (!cv) throw new NotFoundException('CV no encontrado');

    return this.exportGeminiService.generateHtmlFromFileTemplate(
      cv.cvContentJson as Record<string, unknown>,
      cv.targetRole,
      cv.targetCompany,
      fileBuffer,
      mimeType,
    );
  }
}
