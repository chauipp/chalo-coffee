import { Controller, Get, Post, Body, Query, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { PagerService } from './pager.service';
import { AssignPagerDto } from './dto/assign-pager.dto';
import { PagerIdDto } from './dto/pager-id.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { PagerStatus } from '../../common/enums/pager-status.enum';

@ApiTags('Pager')
@ApiBearerAuth('JWT-auth')
@Controller('pager')
export class PagerController {
  constructor(private readonly pagerService: PagerService) {}

  @Get('list')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiQuery({ name: 'status', required: false, enum: PagerStatus })
  @ApiOkResponse({
    description: 'Pager list',
    schema: {
      example: {
        code: 200,
        message: 'success',
        data: [
          {
            id: 'uuid',
            number: 12,
            status: 'ASSIGNED',
            orderId: 'uuid',
            createdAt: '2026-07-05T12:00:00.000Z',
            updatedAt: '2026-07-05T12:00:00.000Z',
          },
        ],
      },
    },
  })
  list(@Query('status') status?: PagerStatus) {
    return this.pagerService.list(status);
  }

  @Post('assign')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOkResponse({
    description: 'Assign a pager number to an order',
    schema: {
      example: {
        code: 201,
        message: 'success',
        data: {
          id: 'uuid',
          number: 12,
          status: 'ASSIGNED',
          orderId: 'uuid',
          createdAt: '2026-07-05T12:00:00.000Z',
          updatedAt: '2026-07-05T12:00:00.000Z',
        },
      },
    },
  })
  assign(@Body() dto: AssignPagerDto) {
    return this.pagerService.assign(dto);
  }

  @Post('call')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Mark a pager WAITING (drink ready, page the customer)',
    schema: {
      example: {
        code: 200,
        message: 'success',
        data: { id: 'uuid', number: 12, status: 'WAITING', orderId: 'uuid' },
      },
    },
  })
  call(@Body() dto: PagerIdDto) {
    return this.pagerService.call(dto);
  }

  @Post('release')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Release / complete a pager (reclaim it, unlink the order)',
    schema: {
      example: {
        code: 200,
        message: 'success',
        data: { id: 'uuid', number: 12, status: 'COMPLETED', orderId: null },
      },
    },
  })
  release(@Body() dto: PagerIdDto) {
    return this.pagerService.release(dto);
  }
}
