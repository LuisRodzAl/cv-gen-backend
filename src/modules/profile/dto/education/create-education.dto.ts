import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class CreateEducationDto {
    @IsNotEmpty()
    @IsString()
    institution: string;

    @IsNotEmpty()
    @IsString()
    degree: string;

    @IsNotEmpty()
    @IsString()
    startDate: Date;

    @IsOptional()
    @IsString()
    endDate: Date;
    
}