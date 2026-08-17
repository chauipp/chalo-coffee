import { BadRequestException } from '@nestjs/common';

export function calculateRefundableAmount(totalAmount: number, existingRefunds: number[]) {
  return Math.max(0, totalAmount - existingRefunds.reduce((sum, amount) => sum + amount, 0));
}

export function validateRefundAmount(amount: number, refundableAmount: number) {
  if (!Number.isInteger(amount)) throw new BadRequestException('Số tiền hoàn phải là số nguyên VND');
  if (amount <= 0) throw new BadRequestException('Số tiền hoàn phải lớn hơn 0');
  if (amount > refundableAmount) throw new BadRequestException('Số tiền hoàn vượt số tiền còn có thể hoàn');
  return amount;
}
