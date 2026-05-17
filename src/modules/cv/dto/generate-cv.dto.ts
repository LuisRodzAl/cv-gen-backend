import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateCvDto {
  @IsString()
  @IsNotEmpty()
  jobDescription: string;

  @IsString()
  @IsNotEmpty()
  targetCompany: string;

  @IsString()
  @IsNotEmpty()
  targetRole: string;

  @IsString()
  @IsNotEmpty()
  templateName: string;

  @IsString()
  @IsIn(['profile', 'primary_cv', 'prompt'])
  @IsOptional()
  dataSource?: 'profile' | 'primary_cv' | 'prompt';

  @IsString()
  @IsOptional()
  customPrompt?: string;
}
