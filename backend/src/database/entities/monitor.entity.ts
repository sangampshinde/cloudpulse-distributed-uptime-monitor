import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PingLog } from './ping-log.entity.js';

export enum MonitorStatus {
  OPERATIONAL = 'OPERATIONAL',
  DEGRADED = 'DEGRADED',
  DOWN = 'DOWN',
  UNKNOWN = 'UNKNOWN',
}

@Entity({ name: 'monitors' })
export class Monitor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'varchar', length: 10, default: 'GET' })
  method: string;

  @Column({ type: 'int', default: 60 })
  checkInterval: number; // in seconds

  @Column({
    type: 'enum',
    enum: MonitorStatus,
    default: MonitorStatus.UNKNOWN,
  })
  status: MonitorStatus;

  @Column({ type: 'int', nullable: true })
  latency: number | null; // in milliseconds

  @Column({ type: 'float', default: 100.0 })
  uptimePercentage: number;

  @Column({ type: 'timestamp', nullable: true })
  lastCheckedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PingLog, (log) => log.monitor, { cascade: true })
  logs: PingLog[];
}
