import { Module } from '@nestjs/common';
import { IngredientsController } from './ingredients/ingredients.controller';
import { IngredientsService } from './ingredients/ingredients.service';
import { DishesController } from './dishes/dishes.controller';
import { DishesService } from './dishes/dishes.service';
import { MenusController } from './menus/menus.controller';
import { MenusService } from './menus/menus.service';
import { NutritionService } from './nutrition/nutrition.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [IngredientsController, DishesController, MenusController],
  providers: [IngredientsService, DishesService, MenusService, NutritionService, PrismaService],
})
export class CanteenModule {}
