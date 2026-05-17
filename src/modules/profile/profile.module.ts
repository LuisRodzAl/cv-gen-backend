import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ProfileParserService } from './profile-parser.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, ProfileParserService],
  exports: [ProfileService],
})
export class ProfileModule {}
