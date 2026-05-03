import {
  Body,
  Controller,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { ExportService } from './export.service';
import { GenerateHtmlDto } from './dto/generate-html.dto';

@ApiTags('export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('html')
  @Throttle({ ai: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Generar HTML del CV con plantilla conocida o descripción libre' })
  async generateHtml(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: GenerateHtmlDto,
    @Res() res: Response,
  ) {
    const html = await this.exportService.generateHtml(user.id, dto);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Post('html-from-file')
  @Throttle({ ai: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Generar HTML del CV replicando el formato de una imagen o PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cvId: { type: 'string', format: 'uuid' },
        template: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('template', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Solo se permiten imágenes (jpg, png, webp) o PDF'), false);
        }
      },
    }),
  )
  async generateHtmlFromFile(
    @CurrentUser() user: CurrentUserData,
    @Body('cvId') cvId: string,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    if (!file) throw new BadRequestException('Se requiere un archivo de plantilla');
    if (!cvId) throw new BadRequestException('Se requiere el cvId');

    const html = await this.exportService.generateHtmlFromFile(
      user.id,
      cvId,
      file.buffer,
      file.mimetype,
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
