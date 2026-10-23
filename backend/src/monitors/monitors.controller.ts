import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MonitorsService } from './monitors.service.js';
import { CreateMonitorDto } from './dto/create-monitor.dto.js';
import { UpdateMonitorDto } from './dto/update-monitor.dto.js';

@Controller('monitors')
export class MonitorsController {
  constructor(private readonly monitorsService: MonitorsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createMonitorDto: CreateMonitorDto) {
    return this.monitorsService.create(createMonitorDto);
  }

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  seed() {
    return this.monitorsService.seedDefaults();
  }

  @Get()
  async findAll() {
    let monitors = await this.monitorsService.findAll();
    if (monitors.length === 0) {
      await this.monitorsService.seedDefaults();
      monitors = await this.monitorsService.findAll();
    }
    return monitors;
  }

  @Get('summary')
  async getSummary() {
    let monitors = await this.monitorsService.findAll();
    if (monitors.length === 0) {
      await this.monitorsService.seedDefaults();
      monitors = await this.monitorsService.findAll();
    }
    const total = monitors.length;
    const operational = monitors.filter((m) => m.status === 'OPERATIONAL').length;
    const degraded = monitors.filter((m) => m.status === 'DEGRADED').length;
    const down = monitors.filter((m) => m.status === 'DOWN').length;
    const activeWithLatency = monitors.filter((m) => m.latency !== null);
    const avgLatency =
      activeWithLatency.length > 0
        ? Math.round(
            activeWithLatency.reduce((acc, m) => acc + (m.latency || 0), 0) /
              activeWithLatency.length,
          )
        : 0;

    return {
      total,
      operational,
      degraded,
      down,
      avgLatency,
    };
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.monitorsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMonitorDto: UpdateMonitorDto,
  ) {
    return this.monitorsService.update(id, updateMonitorDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.monitorsService.remove(id);
  }

  @Post(':id/ping')
  ping(@Param('id', ParseUUIDPipe) id: string) {
    return this.monitorsService.pingMonitor(id);
  }
}
