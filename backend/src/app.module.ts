import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration, { AppConfig, DatabaseConfig } from './config/configuration.js';
import { Monitor, PingLog } from './database/entities/index.js';
import { HealthModule } from './health/health.module.js';
import { MonitorsModule } from './monitors/monitors.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get<DatabaseConfig>('database');
        const nodeEnv = configService.get<string>('nodeEnv');

        if (dbConfig?.url) {
          return {
            type: 'postgres',
            url: dbConfig.url,
            entities: [Monitor, PingLog],
            synchronize: nodeEnv !== 'production', // Auto-sync schema in dev
            autoLoadEntities: true,
          };
        }

        return {
          type: 'postgres',
          host: dbConfig?.host || 'localhost',
          port: dbConfig?.port || 5432,
          username: dbConfig?.username || 'postgres',
          password: dbConfig?.password || 'postgres',
          database: dbConfig?.database || 'cloudpulse',
          entities: [Monitor, PingLog],
          synchronize: nodeEnv !== 'production',
          autoLoadEntities: true,
        };
      },
    }),
    HealthModule,
    MonitorsModule,
  ],
})
export class AppModule {}
