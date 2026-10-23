import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Monitor, MonitorStatus } from '../database/entities/monitor.entity.js';
import { PingLog, PingStatus } from '../database/entities/ping-log.entity.js';
import { CreateMonitorDto } from './dto/create-monitor.dto.js';
import { UpdateMonitorDto } from './dto/update-monitor.dto.js';

@Injectable()
export class MonitorsService implements OnModuleInit {
  private readonly logger = new Logger(MonitorsService.name);

  constructor(
    @InjectRepository(Monitor)
    private readonly monitorRepo: Repository<Monitor>,
    @InjectRepository(PingLog)
    private readonly pingLogRepo: Repository<PingLog>,
  ) {}

  async onModuleInit() {
    this.seedWithRetry();
  }

  async seedWithRetry(retries = 6, delayMs = 3000): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const count = await this.monitorRepo.count();
        if (count === 0) {
          this.logger.log('🌱 Database is empty. Auto-seeding initial monitors...');
          await this.seedDefaults();
          this.logger.log('✅ Initial monitors auto-seeded successfully.');
        } else {
          this.logger.log(`ℹ️ Database already has ${count} monitors. Auto-seed skipped.`);
        }
        return;
      } catch (err: any) {
        this.logger.warn(`Auto-seed attempt ${attempt}/${retries} deferred: ${err.message}`);
        if (attempt < retries) {
          await new Promise((res) => setTimeout(res, delayMs));
        }
      }
    }
  }

  async seedDefaults(): Promise<Monitor[]> {
    const seedMonitors = [
      { name: 'Sangam Portfolio (Live)', url: 'https://sangam-shinde-portfolio.netlify.app', method: 'GET', checkInterval: 30 },
      { name: 'GitHub Developer Profile', url: 'https://github.com/sangampshinde', method: 'GET', checkInterval: 30 },
      { name: 'AI SaaS Billing Platform', url: 'https://github.com/sangampshinde', method: 'GET', checkInterval: 60 },
      { name: 'ChefAI Meal Planner App', url: 'https://github.com/sangampshinde', method: 'GET', checkInterval: 60 },
      { name: 'AI Sales CRM Platform', url: 'https://github.com/sangampshinde', method: 'GET', checkInterval: 60 },
    ];
    const created: Monitor[] = [];
    for (const m of seedMonitors) {
      const existing = await this.monitorRepo.findOne({ where: { name: m.name } });
      if (!existing) {
        const saved = await this.create(m);
        created.push(saved);
      }
    }
    return created;
  }

  async create(createDto: CreateMonitorDto): Promise<Monitor> {
    const monitor = this.monitorRepo.create({
      name: createDto.name,
      url: createDto.url,
      method: createDto.method || 'GET',
      checkInterval: createDto.checkInterval || 60,
      status: MonitorStatus.UNKNOWN,
    });

    const saved = await this.monitorRepo.save(monitor);
    // Trigger initial probe in the background
    this.pingMonitor(saved.id).catch((err) =>
      this.logger.error(`Initial ping failed for ${saved.id}: ${err.message}`),
    );
    return saved;
  }

  async findAll(): Promise<Monitor[]> {
    return this.monitorRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Monitor & { recentLogs: PingLog[] }> {
    const monitor = await this.monitorRepo.findOne({ where: { id } });
    if (!monitor) {
      throw new NotFoundException(`Monitor with ID ${id} not found`);
    }

    const recentLogs = await this.pingLogRepo.find({
      where: { monitorId: id },
      order: { checkedAt: 'DESC' },
      take: 30,
    });

    return {
      ...monitor,
      recentLogs: recentLogs.reverse(), // ascending order for chart display
    };
  }

  async update(id: string, updateDto: UpdateMonitorDto): Promise<Monitor> {
    const monitor = await this.monitorRepo.findOne({ where: { id } });
    if (!monitor) {
      throw new NotFoundException(`Monitor with ID ${id} not found`);
    }

    Object.assign(monitor, updateDto);
    return this.monitorRepo.save(monitor);
  }

  async remove(id: string): Promise<void> {
    const result = await this.monitorRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Monitor with ID ${id} not found`);
    }
  }

  async pingMonitor(id: string): Promise<PingLog> {
    const monitor = await this.monitorRepo.findOne({ where: { id } });
    if (!monitor) {
      throw new NotFoundException(`Monitor with ID ${id} not found`);
    }

    const startTime = performance.now();
    let statusCode: number | null = null;
    let isUp = false;
    let errorMessage: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(monitor.url, {
        method: monitor.method,
        signal: controller.signal,
        headers: {
          'User-Agent': 'CloudPulse-Prober/1.0',
        },
      });

      clearTimeout(timeoutId);
      statusCode = response.status;
      isUp = response.ok || (statusCode >= 200 && statusCode < 400);
    } catch (error: any) {
      isUp = false;
      errorMessage = error.name === 'AbortError' ? 'Probe timeout (8s)' : error.message;
    }

    const responseTimeMs = Math.round(performance.now() - startTime);

    // Record ping log
    const log = this.pingLogRepo.create({
      monitorId: monitor.id,
      statusCode,
      responseTimeMs,
      status: isUp ? PingStatus.UP : PingStatus.DOWN,
      errorMessage,
    });
    const savedLog = await this.pingLogRepo.save(log);

    // Compute uptime percentage over last 50 checks
    const recentLogs = await this.pingLogRepo.find({
      where: { monitorId: monitor.id },
      order: { checkedAt: 'DESC' },
      take: 50,
      select: { status: true },
    });

    const upCount = recentLogs.filter((l) => l.status === PingStatus.UP).length;
    const uptimePercentage =
      recentLogs.length > 0
        ? Math.round((upCount / recentLogs.length) * 1000) / 10
        : 100.0;

    // Determine monitor status
    let newStatus = MonitorStatus.OPERATIONAL;
    if (!isUp) {
      newStatus = MonitorStatus.DOWN;
    } else if (responseTimeMs > 1200) {
      newStatus = MonitorStatus.DEGRADED;
    }

    monitor.status = newStatus;
    monitor.latency = responseTimeMs;
    monitor.lastCheckedAt = new Date();
    monitor.uptimePercentage = uptimePercentage;

    await this.monitorRepo.save(monitor);
    return savedLog;
  }
}
