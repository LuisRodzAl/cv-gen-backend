import { IsNotEmpty, IsString } from 'class-validator';

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
}
