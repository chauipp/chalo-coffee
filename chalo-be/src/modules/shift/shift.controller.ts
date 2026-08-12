import { Body, Controller, Get, Post, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CloseShiftDto } from './dto/close-shift.dto';
import { OpenShiftDto } from './dto/open-shift.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { ShiftService } from './shift.service';

@ApiTags('Shift')
@ApiBearerAuth('JWT-auth')
@Controller('shift')
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}
  @Get('current') current() { return this.shiftService.current(); }
  @Post('open') open(@Body() dto: OpenShiftDto, @Request() req: { user: { id: number } }) { return this.shiftService.open(req.user.id, dto.openingCash ?? 0); }
  @Post('current/close') close(@Body() dto: CloseShiftDto, @Request() req: { user: { id: number } }) { return this.shiftService.close(req.user.id, dto.countedCash, dto.note); }
  @Get('history') history(@Query('limit') limit?: string) { return this.shiftService.history(limit ? Number(limit) : 30); }
  @Get('report') report(@Query() query: ReportQueryDto) { return this.shiftService.report(query); }
}
