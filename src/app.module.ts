import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { CvModule } from './modules/cv/cv.module';
import { ExportModule } from './modules/export/export.module';
import { StorageModule } from './common/storage/storage.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { configuration, validationSchema } from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,   // 1 minuto
        limit: 20,    // 20 requests por minuto por defecto
      },
      {
        name: 'ai',
        ttl: 60000,   // 1 minuto
        limit: 5,     // 5 requests por minuto para endpoints de IA
      },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        redact: ['req.headers.authorization'],
      },
    }),
    PrismaModule,
    StorageModule,
    AuthModule,
    ProfileModule,
    CvModule,
    ExportModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
