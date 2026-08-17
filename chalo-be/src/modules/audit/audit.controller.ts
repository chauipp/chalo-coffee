import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuditService } from './audit.service';

@ApiTags('Audit')
@ApiBearerAuth('JWT-auth')
@Controller('audit-logs')
@Roles(UserRole.ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(@Query('entityType') entityType?: string, @Query('entityId') entityId?: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.auditService.list({ entityType, entityId, limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined });
  }
}
