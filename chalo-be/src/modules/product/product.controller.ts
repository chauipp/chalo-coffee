import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto, UpdateProductStatusDto } from './dto/update-product.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ProductStatus } from '../../common/enums/product-status.enum';

@ApiTags('Menu - Product')
@ApiBearerAuth('JWT-auth')
@Controller('menu/product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('list')
  @Public()
  @SkipThrottle()
  @ApiOkResponse({ description: 'Public product list', schema: { example: { code: 200, message: 'success', data: [] } } })
  list() {
    return this.productService.list();
  }

  @Get('page')
  @ApiQuery({ name: 'pageNo', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ProductStatus })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiOkResponse({ description: 'Paginated products', schema: { example: { code: 200, message: 'success', data: { list: [], total: 0 } } } })
  page(
    @Query('pageNo') pageNo?: number,
    @Query('pageSize') pageSize?: number,
    @Query('name') name?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.productService.page({
      pageNo: pageNo ? Number(pageNo) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
      name,
      categoryId,
      status,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('detail')
  @ApiQuery({ name: 'id', required: true })
  @ApiOkResponse({ description: 'Product detail', schema: { example: { code: 200, message: 'success', data: { id: 'uuid', name: 'Cold Drip' } } } })
  detail(@Query('id') id: string) {
    return this.productService.detail(id);
  }

  @Get('simple-list')
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiOkResponse({ description: 'Simple product list', schema: { example: { code: 200, message: 'success', data: [{ id: 'uuid', name: 'Cold Drip', price: 39000 }] } } })
  simpleList(@Query('categoryId') categoryId?: string) {
    return this.productService.simpleList(categoryId);
  }

  @Post('create')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({ description: 'Create product success', schema: { example: { code: 201, message: 'success', data: { id: 'uuid', name: 'Cold Drip' } } } })
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Put('update')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({ description: 'Update product success', schema: { example: { code: 200, message: 'success', data: { id: 'uuid', name: 'Updated' } } } })
  update(@Body() dto: UpdateProductDto) {
    return this.productService.update(dto);
  }

  @Put('status')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOkResponse({ description: 'Update product status success', schema: { example: { code: 200, message: 'success', data: { id: 'uuid', status: 'OUT_OF_STOCK' } } } })
  updateStatus(@Body() dto: UpdateProductStatusDto) {
    return this.productService.updateStatus(dto);
  }

  @Delete('delete')
  @Roles(UserRole.ADMIN)
  @ApiQuery({ name: 'id', required: true })
  @ApiOkResponse({ description: 'Delete product success', schema: { example: { code: 200, message: 'success', data: null } } })
  delete(@Query('id') id: string) {
    return this.productService.delete(id);
  }
}
