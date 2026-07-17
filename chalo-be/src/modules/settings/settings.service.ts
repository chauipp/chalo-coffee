import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSettings } from './entities/app-settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { ESTIMATED_WAIT_BARISTAS } from '../../common/constants';

@Injectable()
export class SettingsService {
  /** Bảng chỉ có đúng 1 dòng, pin cứng id = 1 */
  private static readonly SINGLETON_ID = 1;

  constructor(
    @InjectRepository(AppSettings)
    private readonly settingsRepo: Repository<AppSettings>,
  ) {}

  /**
   * Luôn trả về dòng settings. Nếu chưa có (DB mới / bị TRUNCATE) thì tự tạo
   * dòng mặc định để endpoint không bao giờ 404.
   */
  async get(): Promise<AppSettings> {
    let settings = await this.settingsRepo.findOneBy({ id: SettingsService.SINGLETON_ID });
    if (!settings) {
      settings = this.settingsRepo.create({
        id: SettingsService.SINGLETON_ID,
        waitTimeEnabled: true,
        baristaCount: ESTIMATED_WAIT_BARISTAS,
      });
      settings = await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async update(dto: UpdateSettingsDto): Promise<AppSettings> {
    const settings = await this.get();
    if (dto.waitTimeEnabled !== undefined) settings.waitTimeEnabled = dto.waitTimeEnabled;
    if (dto.baristaCount !== undefined) settings.baristaCount = dto.baristaCount;
    // Chuỗi rỗng = xoá cấu hình (lưu null)
    if (dto.bankBin !== undefined) settings.bankBin = dto.bankBin || null;
    if (dto.bankAccountNo !== undefined) settings.bankAccountNo = dto.bankAccountNo || null;
    if (dto.bankAccountName !== undefined)
      settings.bankAccountName = dto.bankAccountName.trim() || null;
    if (dto.smartBatchingEnabled !== undefined)
      settings.smartBatchingEnabled = dto.smartBatchingEnabled;
    return this.settingsRepo.save(settings);
  }
}
