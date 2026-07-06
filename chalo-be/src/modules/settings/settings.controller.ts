import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Public()
  @SkipThrottle()
  @ApiOkResponse({
    description: 'Runtime settings (public read)',
    schema: {
      example: {
        code: 200,
        message: 'success',
        data: { id: 1, waitTimeEnabled: true, baristaCount: 3, updatedAt: '2026-01-01T00:00:00.000Z' },
      },
    },
  })
  get() {
    return this.settingsService.get();
  }

  @Put()
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({
    description: 'Update runtime settings (ADMIN only)',
    schema: {
      example: {
        code: 200,
        message: 'success',
        data: { id: 1, waitTimeEnabled: false, baristaCount: 4, updatedAt: '2026-07-05T11:00:00.000Z' },
      },
    },
  })
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
