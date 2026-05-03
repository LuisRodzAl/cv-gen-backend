import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateCvDto {
  @IsObject()
  @IsOptional()
  cvContentJson?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  templateName?: string;
}
