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

  /** VietQR: mã BIN ngân hàng nhận tiền (VD MB = 970422). Null = chưa cấu hình. */
  @Column({ type: 'varchar', length: 6, nullable: true })
  bankBin: string | null;

  /** VietQR: số tài khoản nhận tiền */
  @Column({ type: 'varchar', length: 30, nullable: true })
  bankAccountNo: string | null;

  /** VietQR: tên chủ tài khoản (hiển thị cho khách đối chiếu) */
  @Column({ type: 'varchar', length: 100, nullable: true })
  bankAccountName: string | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
