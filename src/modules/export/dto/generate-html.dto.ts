import { IsOptional, IsString, IsUUID } from 'class-validator';

export class GenerateHtmlDto {
  @IsUUID()
  cvId: string;

  @IsString()
  @IsOptional()
  templateName?: string; // 'harvard', 'ats', 'modern', etc.
}
