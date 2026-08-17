import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum SepayTxStatus {
  /** Khớp mã + đúng số tiền → đã tự động hoàn tất phiên */
  MATCHED = 'MATCHED',
  /** Không tìm thấy payCode / không có phiên tương ứng — chỉ ghi log đối soát */
  NO_MATCH = 'NO_MATCH',
  /** SePay gọi lại webhook cho giao dịch đã xử lý */
  DUPLICATE = 'DUPLICATE',
  /** Có phiên nhưng lệch (sai tiền / hết hạn / đã thanh toán trước đó) — cần người đối soát */
  NEEDS_REVIEW = 'NEEDS_REVIEW',
}

/** Log mọi giao dịch SePay webhook gửi về — đối soát + chống xử lý trùng */
@Entity('sepay_transactions')
export class SepayTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** id giao dịch phía SePay */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  sepayTxId: string;

  @Column({ type: 'int' })
  transferAmount: number;

  /** Nội dung chuyển khoản nguyên văn từ ngân hàng */
  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  accountNumber: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  transactionDate: string | null;

  @Column({ type: 'uuid', nullable: true })
  matchedSessionId: string | null;

  @Column({ type: 'enum', enum: SepayTxStatus })
  status: SepayTxStatus;

  @Column({ type: 'json' })
  rawPayload: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
