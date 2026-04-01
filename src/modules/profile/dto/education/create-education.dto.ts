import { IsNotEmpty, IsString, IsOptional, IsDateString } from "class-validator";

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