import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  async findByDate(date: string) {
    return this.prisma.menu.findMany({
      where: {
        date: new Date(date),
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
      orderBy: { mealType: 'asc' },
    });
  }

  async getNutrition(id: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
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
    });

    if (!menu) return null;

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

    return { menu, nutrition };
  }

  async create(data: any) {
    const { dishes, ...menuData } = data;

    return this.prisma.$transaction(async (tx) => {
      const menu = await tx.menu.create({
        data: {
          ...menuData,
          date: new Date(menuData.date),
        },
      });

      if (dishes?.length) {
        await tx.menuDish.createMany({
          data: dishes.map((d: any) => ({
            menuId: menu.id,
            dishId: d.dishId,
            servings: d.servings || 1,
          })),
        });
      }

      return menu;
    });
  }

  async update(id: string, data: any) {
    const { dishes, ...menuData } = data;

    return this.prisma.$transaction(async (tx) => {
      const menu = await tx.menu.update({
        where: { id },
        data: menuData.date ? { ...menuData, date: new Date(menuData.date) } : menuData,
      });

      if (dishes !== undefined) {
        await tx.menuDish.deleteMany({ where: { menuId: id } });

        if (dishes?.length) {
          await tx.menuDish.createMany({
            data: dishes.map((d: any) => ({
              menuId: id,
              dishId: d.dishId,
              servings: d.servings || 1,
            })),
          });
        }
      }

      return menu;
    });
  }

  async remove(id: string) {
    return this.prisma.menu.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
