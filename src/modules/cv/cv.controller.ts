import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { CvService } from './cv.service';
import { GenerateCvDto } from './dto/generate-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';

@ApiTags('cv')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cv')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post('generate')
  @Throttle({ ai: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Generar CV con IA a partir de una oferta de trabajo' })
  generate(@CurrentUser() user: CurrentUserData, @Body() dto: GenerateCvDto) {
    return this.cvService.generate(user.id, dto);
  }

  @Post('import-html')
  @Throttle({ ai: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Importar CV desde HTML y establecer como principal' })
  importHtml(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { htmlContent: string; targetRole: string; targetCompany: string },
  ) {
    return this.cvService.importFromHtml(user.id, body.htmlContent, body.targetRole, body.targetCompany);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los CVs generados' })
  findAll(@CurrentUser() user: CurrentUserData) {
    return this.cvService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un CV por ID' })
  findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.cvService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar manualmente un CV generado' })
  update(@CurrentUser() user: CurrentUserData, @Param('id') id: string, @Body() dto: UpdateCvDto) {
    return this.cvService.update(user.id, id, dto);
  }

  @Post(':id/primary')
  @ApiOperation({ summary: 'Establecer este CV como principal' })
  setPrimary(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.cvService.setPrimary(user.id, id);
  }

  @Post(':id/chat')
  @Throttle({ ai: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Modificar el CV con IA a través de chat' })
  chat(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: { prompt: string; currentJson: any },
  ) {
    return this.cvService.chatWithCv(user.id, id, body.prompt, body.currentJson);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un CV' })
  remove(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.cvService.remove(user.id, id);
  }
}
