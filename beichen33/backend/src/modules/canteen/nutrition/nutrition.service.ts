import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class NutritionService {
  constructor(private prisma: PrismaService) {}

  async getReport(startDate: string, endDate: string) {
    const menus = await this.prisma.menu.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        deletedAt: null,
      },
      include: {
        dishes: {
          include: {
            dish: {
              include: {
                ingredients: {
                  include: { ingredient: true },
                },
              },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    const dailyNutrition = menus.map((menu) => {
      const nutrition = menu.dishes.reduce(
        (acc, md) => {
          md.dish.ingredients.forEach((di) => {
            const ratio = (di.quantity / 100) * md.servings;
            acc.protein += di.ingredient.protein * ratio;
            acc.fat += di.ingredient.fat * ratio;
            acc.carbs += di.ingredient.carbs * ratio;
            acc.calories += di.ingredient.calories * ratio;
          });
          return acc;
        },
        { protein: 0, fat: 0, carbs: 0, calories: 0 }
      );

      return {
        date: menu.date,
        mealType: menu.mealType,
        ...nutrition,
      };
    });

    return dailyNutrition;
  }
}
