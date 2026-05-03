import { Module } from '@nestjs/common';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';
import { GeminiService } from './gemini.service';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [ProfileModule],
  controllers: [CvController],
  providers: [CvService, GeminiService],
})
export class CvModule {}
