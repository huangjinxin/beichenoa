import { Module } from '@nestjs/common';
import { IngredientsController } from './ingredients/ingredients.controller';
import { IngredientsService } from './ingredients/ingredients.service';
import { DishesController } from './dishes/dishes.controller';
import { DishesService } from './dishes/dishes.service';
import { MenusController } from './menus/menus.controller';
import { MenusService } from './menus/menus.service';
import { NutritionController } from './nutrition/nutrition.controller';
import { NutritionService } from './nutrition/nutrition.service';
import { PurchaseController } from './purchase/purchase.controller';
import { PurchaseService } from './purchase/purchase.service';
import { SuppliersController } from './suppliers/suppliers.controller';
import { SuppliersService } from './suppliers/suppliers.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [
    IngredientsController,
    DishesController,
    MenusController,
    NutritionController,
    PurchaseController,
    SuppliersController,
  ],
  providers: [
    IngredientsService,
    DishesService,
    MenusService,
    NutritionService,
    PurchaseService,
    SuppliersService,
    PrismaService,
  ],
})
export class CanteenModule {}
