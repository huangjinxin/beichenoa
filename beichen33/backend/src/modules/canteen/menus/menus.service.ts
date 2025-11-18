import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

interface NutritionSummary {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  async findByDate(date: string) {
    return this.prisma.menu.findMany({
      where: {
        startDate: { lte: new Date(date) },
        endDate: { gte: new Date(date) },
        deletedAt: null,
      },
      include: {
        menuItems: {
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNutrition(id: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      include: {
        menuItems: {
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

    const nutrition = menu.menuItems.reduce(
      (acc: NutritionSummary, menuItem: any) => {
        menuItem.dish.ingredients.forEach((dishIngredient: any) => {
          const ratio = dishIngredient.amount / 100;
          acc.protein += dishIngredient.ingredient.protein * ratio;
          acc.fat += dishIngredient.ingredient.fat * ratio;
          acc.carbs += dishIngredient.ingredient.carbs * ratio;
          acc.calories += dishIngredient.ingredient.calories * ratio;
        });
        return acc;
      },
      { protein: 0, fat: 0, carbs: 0, calories: 0 }
    );

    return { menu, nutrition };
  }

  async create(data: any) {
    const { menuItems, items, ...menuData } = data;
    const itemsToCreate = items || menuItems;

    return this.prisma.$transaction(async (tx) => {
      const menu = await tx.menu.create({
        data: {
          name: menuData.name,
          startDate: new Date(menuData.startDate),
          endDate: new Date(menuData.endDate),
          grade: menuData.grade || null,
          teacherId: menuData.teacherId || null,
        },
      });

      if (itemsToCreate?.length) {
        const menuItemsData: any[] = [];
        itemsToCreate.forEach((item: any) => {
          const dishIds = item.dishIds || [item.dishId];
          dishIds.forEach((dishId: string) => {
            menuItemsData.push({
              menuId: menu.id,
              dishId: dishId,
              day: item.day,
              mealType: item.mealType,
            });
          });
        });

        await tx.menuItem.createMany({
          data: menuItemsData,
        });
      }

      return menu;
    });
  }

  async update(id: string, data: any) {
    const { menuItems, items, ...menuData } = data;
    const itemsToUpdate = items || menuItems;

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (menuData.name) updateData.name = menuData.name;
      if (menuData.startDate) updateData.startDate = new Date(menuData.startDate);
      if (menuData.endDate) updateData.endDate = new Date(menuData.endDate);
      if (menuData.grade !== undefined) updateData.grade = menuData.grade || null;
      if (menuData.teacherId !== undefined) updateData.teacherId = menuData.teacherId || null;

      const menu = await tx.menu.update({
        where: { id },
        data: updateData,
      });

      if (itemsToUpdate !== undefined) {
        await tx.menuItem.deleteMany({ where: { menuId: id } });

        if (itemsToUpdate?.length) {
          const menuItemsData: any[] = [];
          itemsToUpdate.forEach((item: any) => {
            const dishIds = item.dishIds || [item.dishId];
            dishIds.forEach((dishId: string) => {
              menuItemsData.push({
                menuId: id,
                dishId: dishId,
                day: item.day,
                mealType: item.mealType,
              });
            });
          });

          await tx.menuItem.createMany({
            data: menuItemsData,
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
