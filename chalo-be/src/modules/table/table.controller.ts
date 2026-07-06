import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { TableService } from './table.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto, RegenerateQrDto } from './dto/update-table.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { TableStatus } from '../../common/enums/table-status.enum';

@ApiTags('Table')
@ApiBearerAuth('JWT-auth')
@Controller('table')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Get('page')
  @ApiQuery({ name: 'pageNo', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'area', required: false })
  @ApiQuery({ name: 'status', required: false, enum: TableStatus })
  @ApiOkResponse({ description: 'Paginated tables', schema: { example: { code: 200, message: 'success', data: { list: [], total: 0 } } } })
  page(
    @Query('pageNo') pageNo?: number,
    @Query('pageSize') pageSize?: number,
    @Query('area') area?: string,
    @Query('status') status?: TableStatus,
  ) {
    return this.tableService.page({
      pageNo: pageNo ? Number(pageNo) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
      area,
      status,
    });
  }

  @Get('list')
  @ApiOkResponse({ description: 'Table list', schema: { example: { code: 200, message: 'success', data: [] } } })
  list() {
    return this.tableService.list();
  }

  @Get('areas')
  @ApiOkResponse({ description: 'Area options', schema: { example: { code: 200, message: 'success', data: [{ id: 'Tang 1', name: 'Tang 1' }] } } })
  areas() {
    return this.tableService.areas();
  }

  @Get('by-token/:token')
  @Public()
  @ApiOkResponse({ description: 'Public table info by token', schema: { example: { code: 200, message: 'success', data: { id: 'uuid', name: 'Ban 01', area: null, status: 'AVAILABLE' } } } })
  byToken(@Param('token') token: string) {
    return this.tableService.byToken(token);
  }

  @Post('create')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({ description: 'Create table success', schema: { example: { code: 201, message: 'success', data: { id: 'uuid', name: 'Ban 01' } } } })
  create(@Body() dto: CreateTableDto) {
    return this.tableService.create(dto);
  }

  @Put('update')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({ description: 'Update table success', schema: { example: { code: 200, message: 'success', data: { id: 'uuid', name: 'Ban 02' } } } })
  update(@Body() dto: UpdateTableDto) {
    return this.tableService.update(dto);
  }

  @Put('regenerate-qr')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({ description: 'Regenerate QR success', schema: { example: { code: 200, message: 'success', data: { id: 'uuid', qrToken: 'uuid-v4' } } } })
  regenerateQr(@Body() dto: RegenerateQrDto) {
    return this.tableService.regenerateQr(dto);
  }

  @Delete('delete')
  @Roles(UserRole.ADMIN)
  @ApiQuery({ name: 'id', required: true })
  @ApiOkResponse({ description: 'Delete table success', schema: { example: { code: 200, message: 'success', data: null } } })
  delete(@Query('id') id: string) {
    return this.tableService.delete(id);
  }
}
