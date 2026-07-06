import { Entity, PrimaryColumn, Column, UpdateDateColumn, Check } from 'typeorm';

/**
 * Single-row runtime settings. id is pinned to 1 (CHECK constraint) so the
 * table can never hold more than one settings record.
 */
@Entity('app_settings')
@Check(`"id" = 1`)
export class AppSettings {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  /** Bật/tắt hiển thị thời gian chờ cho khách */
  @Column({ type: 'boolean', default: true })
  waitTimeEnabled: boolean;

  /** Số barista phục vụ song song (divisor khi ước lượng wait time) */
  @Column({ type: 'int', default: 3 })
  baristaCount: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
