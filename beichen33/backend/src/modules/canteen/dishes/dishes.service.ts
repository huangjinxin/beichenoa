import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class DishesService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = category ? { category, deletedAt: null } : { deletedAt: null };

    const [data, total] = await Promise.all([
      this.prisma.dish.findMany({
        where,
        skip,
        take: limit,
        include: {
          ingredients: {
            include: { ingredient: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.dish.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const dish = await this.prisma.dish.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: { ingredient: true },
        },
      },
    });

    if (dish) {
      const nutrition = await this.calculateNutrition(id);
      return { ...dish, nutrition };
    }

    return dish;
  }

  async calculateNutrition(dishId: string) {
    const dishIngredients = await this.prisma.dishIngredient.findMany({
      where: { dishId },
      include: { ingredient: true },
    });

    const nutrition = dishIngredients.reduce(
      (acc, di) => {
        const ratio = di.quantity / 100;
        acc.protein += di.ingredient.protein * ratio;
        acc.fat += di.ingredient.fat * ratio;
        acc.carbs += di.ingredient.carbs * ratio;
        acc.calories += di.ingredient.calories * ratio;
        return acc;
      },
      { protein: 0, fat: 0, carbs: 0, calories: 0 }
    );

    return nutrition;
  }

  async create(data: any) {
    const { ingredients, ...dishData } = data;

    return this.prisma.$transaction(async (tx) => {
      const dish = await tx.dish.create({ data: dishData });

      if (ingredients?.length) {
        await tx.dishIngredient.createMany({
          data: ingredients.map((ing: any) => ({
            dishId: dish.id,
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
          })),
        });
      }

      return dish;
    });
  }

  async update(id: string, data: any) {
    const { ingredients, ...dishData } = data;

    return this.prisma.$transaction(async (tx) => {
      const dish = await tx.dish.update({ where: { id }, data: dishData });

      if (ingredients !== undefined) {
        await tx.dishIngredient.deleteMany({ where: { dishId: id } });

        if (ingredients?.length) {
          await tx.dishIngredient.createMany({
            data: ingredients.map((ing: any) => ({
              dishId: id,
              ingredientId: ing.ingredientId,
              quantity: ing.quantity,
            })),
          });
        }
      }

      return dish;
    });
  }

  async remove(id: string) {
    return this.prisma.dish.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
