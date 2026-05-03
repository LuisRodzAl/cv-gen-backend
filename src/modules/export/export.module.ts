import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ExportGeminiService } from './export-gemini.service';

@Module({
  controllers: [ExportController],
  providers: [ExportService, ExportGeminiService],
})
export class ExportModule {}
