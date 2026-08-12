import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashShift } from './entities/cash-shift.entity';

@Module({ imports: [TypeOrmModule.forFeature([CashShift])], exports: [TypeOrmModule] })
export class ShiftModule {}
