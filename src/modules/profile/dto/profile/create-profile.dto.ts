import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;
  @IsString()
  @IsOptional()
  title?: string;
  @IsString()
  @IsOptional()
  summary?: string;
  @IsString()
  @IsOptional()
  location?: string;
  @IsString()
  @IsOptional()
  linkedinUrl?: string;
  @IsString()
  @IsOptional()
  githubUrl?: string;
  
}
