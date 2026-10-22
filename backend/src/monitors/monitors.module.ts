import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitorsService } from './monitors.service.js';
import { MonitorsController } from './monitors.controller.js';
import { Monitor, PingLog } from '../database/entities/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([Monitor, PingLog])],
  controllers: [MonitorsController],
  providers: [MonitorsService],
  exports: [MonitorsService],
})
export class MonitorsModule {}
