import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { ProfileService } from './profile.service';
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

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // --- Profile ---

  @Get()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  getProfile(@CurrentUser() user: CurrentUserData) {
    return this.profileService.getByUserId(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear perfil' })
  createProfile(@CurrentUser() user: CurrentUserData, @Body() dto: CreateProfileDto) {
    return this.profileService.create(user.id, dto);
  }

  @Patch()
  @ApiOperation({ summary: 'Actualizar perfil' })
  updateProfile(@CurrentUser() user: CurrentUserData, @Body() dto: UpdateProfileDto) {
    return this.profileService.update(user.id, dto);
  }

  // --- Experience ---

  @Post('experience')
  @ApiOperation({ summary: 'Agregar experiencia laboral' })
  addExperience(@CurrentUser() user: CurrentUserData, @Body() dto: CreateExperienceDto) {
    return this.profileService.addExperience(user.id, dto);
  }

  @Patch('experience/:id')
  @ApiOperation({ summary: 'Actualizar experiencia laboral' })
  updateExperience(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateExperienceDto,
  ) {
    return this.profileService.updateExperience(user.id, id, dto);
  }

  @Delete('experience/:id')
  @ApiOperation({ summary: 'Eliminar experiencia laboral' })
  removeExperience(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.profileService.removeExperience(user.id, id);
  }

  // --- Education ---

  @Post('education')
  @ApiOperation({ summary: 'Agregar educación' })
  addEducation(@CurrentUser() user: CurrentUserData, @Body() dto: CreateEducationDto) {
    return this.profileService.addEducation(user.id, dto);
  }

  @Patch('education/:id')
  @ApiOperation({ summary: 'Actualizar educación' })
  updateEducation(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateEducationDto,
  ) {
    return this.profileService.updateEducation(user.id, id, dto);
  }

  @Delete('education/:id')
  @ApiOperation({ summary: 'Eliminar educación' })
  removeEducation(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.profileService.removeEducation(user.id, id);
  }

  // --- Skills ---

  @Post('skill')
  @ApiOperation({ summary: 'Agregar habilidad' })
  addSkill(@CurrentUser() user: CurrentUserData, @Body() dto: CreateSkillDto) {
    return this.profileService.addSkill(user.id, dto);
  }

  @Patch('skill/:id')
  @ApiOperation({ summary: 'Actualizar habilidad' })
  updateSkill(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateSkillDto,
  ) {
    return this.profileService.updateSkill(user.id, id, dto);
  }

  @Delete('skill/:id')
  @ApiOperation({ summary: 'Eliminar habilidad' })
  removeSkill(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.profileService.removeSkill(user.id, id);
  }

  // --- Certificates ---

  @Post('certificate')
  @ApiOperation({ summary: 'Agregar certificado (con imagen opcional)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        issuer: { type: 'string' },
        issueDate: { type: 'string' },
        expiryDate: { type: 'string' },
        description: { type: 'string' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image', {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      allowed.includes(file.mimetype) ? cb(null, true) : cb(new BadRequestException('Formato no permitido'), false);
    },
  }))
  addCertificate(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateCertificateDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profileService.addCertificate(user.id, dto, file);
  }

  @Patch('certificate/:id')
  @ApiOperation({ summary: 'Actualizar certificado' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        issuer: { type: 'string' },
        issueDate: { type: 'string' },
        expiryDate: { type: 'string' },
        description: { type: 'string' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  updateCertificate(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateCertificateDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profileService.updateCertificate(user.id, id, dto, file);
  }

  @Delete('certificate/:id')
  @ApiOperation({ summary: 'Eliminar certificado' })
  removeCertificate(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.profileService.removeCertificate(user.id, id);
  }
}
