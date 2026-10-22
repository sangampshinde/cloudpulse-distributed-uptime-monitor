import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Monitor } from './monitor.entity.js';

export enum PingStatus {
  UP = 'UP',
  DOWN = 'DOWN',
}

@Entity({ name: 'ping_logs' })
export class PingLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  monitorId: string;

  @Column({ type: 'int', nullable: true })
  statusCode: number | null;

  @Column({ type: 'int' })
  responseTimeMs: number;

  @Column({
    type: 'enum',
    enum: PingStatus,
  })
  status: PingStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  errorMessage: string | null;

  @Index()
  @CreateDateColumn()
  checkedAt: Date;

  @ManyToOne(() => Monitor, (monitor) => monitor.logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'monitorId' })
  monitor: Monitor;
}
