import { Body, Controller, Get, Param, Post, Put, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AdjustIngredientDto, CreateIngredientDto, ReceiveIngredientDto, UpdateIngredientDto, UpdateProductRecipeDto } from './dto/ingredient.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory')
@ApiBearerAuth('JWT-auth')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('ingredients')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  list() { return this.inventoryService.listIngredients(); }

  @Get('low-stock')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  lowStock() { return this.inventoryService.lowStock(); }

  @Get('ingredients/:id/movements')
  @Roles(UserRole.ADMIN)
  history(@Param('id') id: string) { return this.inventoryService.movementHistory(id); }

  @Get('products/:productId/recipe')
  @Roles(UserRole.ADMIN)
  recipe(@Param('productId') productId: string) { return this.inventoryService.recipeForProduct(productId); }

  @Post('ingredients')
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateIngredientDto, @Request() req: { user: { id: number } }) {
    return this.inventoryService.createIngredient(dto, req.user.id);
  }

  @Put('ingredients/:id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateIngredientDto) {
    return this.inventoryService.updateIngredient(id, dto);
  }

  @Post('ingredients/:id/adjust')
  @Roles(UserRole.ADMIN)
  adjust(@Param('id') id: string, @Body() dto: AdjustIngredientDto, @Request() req: { user: { id: number } }) {
    return this.inventoryService.adjustIngredient(id, dto, req.user.id);
  }

  @Post('ingredients/:id/receive')
  @Roles(UserRole.ADMIN)
  receive(@Param('id') id: string, @Body() dto: ReceiveIngredientDto, @Request() req: { user: { id: number } }) {
    return this.inventoryService.receiveIngredient(id, dto, req.user.id);
  }

  @Put('products/:productId/recipe')
  @Roles(UserRole.ADMIN)
  updateRecipe(@Param('productId') productId: string, @Body() dto: UpdateProductRecipeDto, @Request() req: { user: { id: number } }) {
    return this.inventoryService.updateProductRecipe(productId, dto.lines, req.user.id);
  }
}
