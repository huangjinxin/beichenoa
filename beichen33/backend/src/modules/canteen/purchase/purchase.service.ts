import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class PurchaseService {
  constructor(private prisma: PrismaService) {}

  /**
   * 生成采购计划
   */
  async generatePurchasePlan(dto: any, userId: string) {
    const { startDate, endDate, menuIds, classIds } = dto;

    // 1. 获取学生统计信息（按年龄段分组）
    const studentStats = await this.getStudentStatsByAgeGroup(classIds);

    // 2. 获取营养标准
    const nutritionStandards = await this.prisma.nutritionStandard.findMany({
      where: { isActive: true },
    });

    // 3. 获取菜单和菜品信息
    const where: any = { deletedAt: null };

    // 如果指定了menuIds，直接使用，不再检查日期范围
    if (menuIds && menuIds.length > 0) {
      where.id = { in: menuIds };
    } else {
      // 如果没有指定menuIds，查询日期范围内的菜单
      // 菜单的日期范围与采购日期范围有交集：菜单结束日期 >= 采购开始日期 AND 菜单开始日期 <= 采购结束日期
      where.endDate = { gte: new Date(startDate) };
      where.startDate = { lte: new Date(endDate) };
    }

    const menus = await this.prisma.menu.findMany({
      where,
      include: {
        menuItems: {
          include: {
            dish: {
              include: {
                ingredients: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // 4. 计算日期范围天数
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // 5. 计算每日采购清单
    const dailyPurchaseItems = this.calculateDailyPurchaseItems(
      menus,
      studentStats,
      nutritionStandards,
      startDate,
      endDate,
    );

    // 6. 计算总采购清单（包含总量和每日用量）
    const purchaseItems = this.calculatePurchaseItems(
      menus,
      studentStats,
      nutritionStandards,
      totalDays,
    );

    // 7. 按供应商分类
    const groupedItems = this.groupBySupplier(purchaseItems);

    // 8. 保存采购计划
    const purchasePlan = await this.prisma.purchasePlan.create({
      data: {
        name: `${startDate}至${endDate}采购计划`,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        studentStats: studentStats as any,
        purchaseItems: groupedItems as any,
        dailyPurchaseItems: dailyPurchaseItems as any, // 每日采购明细
        status: 'DRAFT',
        createdBy: userId,
      },
    });

    return purchasePlan;
  }

  /**
   * 计算采购清单
   */
  private calculatePurchaseItems(
    menus: any[],
    studentStats: Record<string, number>,
    nutritionStandards: any[],
    totalDays: number,
  ) {
    const totalItems: Record<
      string,
      {
        name: string;
        amount: number;
        dailyAmount: number;
        unit: string;
        supplierCategory: string;
      }
    > = {};

    // 遍历每个菜单
    menus.forEach((menu) => {
      menu.menuItems.forEach((menuItem: any) => {
        const dish = menuItem.dish;
        const mealType = menuItem.mealType; // breakfast/lunch/snack/dinner

        // 遍历菜品的每个食材
        dish.ingredients.forEach((dishIngredient: any) => {
          const ingredient = dishIngredient.ingredient;
          const baseAmount = dishIngredient.amount || 100; // 基础用量（如100克）

          // 根据学生数量和年龄段计算总用量
          let totalAmount = 0;

          Object.entries(studentStats).forEach(([ageGroup, count]) => {
            const standard = nutritionStandards.find(
              (s) => s.ageGroup === ageGroup,
            );
            if (standard) {
              // 根据年龄段标准调整用量系数
              const coefficient = this.getAgeCoefficient(ageGroup);
              totalAmount += baseAmount * count * coefficient;
            } else {
              // 没有标准时，使用默认系数1.0
              totalAmount += baseAmount * count;
            }
          });

          // 汇总到总清单
          const key = ingredient.id;
          if (totalItems[key]) {
            totalItems[key].amount += totalAmount;
          } else {
            totalItems[key] = {
              name: ingredient.name,
              amount: totalAmount,
              dailyAmount: 0, // 稍后计算
              unit: ingredient.unit || '克',
              supplierCategory: ingredient.supplierCategory || '其他',
            };
          }
        });
      });
    });

    // 转换单位（克 → 斤）并计算每日用量
    Object.values(totalItems).forEach((item) => {
      if (item.unit === '克' || item.unit === 'g') {
        item.amount = Math.ceil(item.amount / 500); // 转换为斤，向上取整
        item.unit = '斤';
      }

      // 计算每日用量（保留一位小数）
      item.dailyAmount = totalDays > 0
        ? Math.round((item.amount / totalDays) * 10) / 10
        : item.amount;
    });

    return Object.values(totalItems);
  }

  /**
   * 年龄段系数
   */
  private getAgeCoefficient(ageGroup: string): number {
    const coefficients: Record<string, number> = {
      '2-3': 0.8,
      '3-4': 0.9,
      '4-5': 1.0,
      '5-6': 1.1,
      '6-7': 1.2,
    };
    return coefficients[ageGroup] || 1.0;
  }

  /**
   * 按供应商分类
   */
  private groupBySupplier(items: any[]) {
    const grouped: Record<string, any[]> = {
      粮油: [],
      猪肉: [],
      牛肉: [],
      蔬菜: [],
      '调料（干货）': [],
      面条: [],
      鸡蛋: [],
      鸡肉: [],
      水果: [],
      糕点: [],
      牛奶: [],
      海鲜: [],
      其他: [],
    };

    items.forEach((item) => {
      const category = item.supplierCategory || '其他';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    // 移除空分类
    Object.keys(grouped).forEach((key) => {
      if (grouped[key].length === 0) {
        delete grouped[key];
      }
    });

    return grouped;
  }

  /**
   * 计算每日采购清单
   * 粮油类：周一采购一周的量
   * 蔬菜和其他类：每天单独采购
   */
  private calculateDailyPurchaseItems(
    menus: any[],
    studentStats: Record<string, number>,
    nutritionStandards: any[],
    startDate: string,
    endDate: string,
  ) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayNamesZh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dailyItems: Record<string, any> = {};

    // 粮油类品类列表（周一采购一周的量）
    const weeklyCategories = ['粮油'];

    // 第一步：先计算整周的粮油用量
    const weeklyGrainOilItems: Record<string, {
      name: string;
      amount: number;
      unit: string;
      supplierCategory: string;
      meals: string[];
    }> = {};

    // 遍历所有日期，汇总粮油类食材
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = dayNames[d.getDay()];

      menus.forEach((menu) => {
        menu.menuItems.forEach((menuItem: any) => {
          if (menuItem.day === dayOfWeek) {
            const dish = menuItem.dish;
            const mealType = this.getMealTypeLabel(menuItem.mealType);

            dish.ingredients.forEach((dishIngredient: any) => {
              const ingredient = dishIngredient.ingredient;
              const category = ingredient.supplierCategory || '其他';

              // 只处理粮油类
              if (weeklyCategories.includes(category)) {
                const baseAmount = dishIngredient.amount || 100;
                let totalAmount = 0;

                Object.entries(studentStats).forEach(([ageGroup, count]) => {
                  const coefficient = this.getAgeCoefficient(ageGroup);
                  totalAmount += baseAmount * count * coefficient;
                });

                const key = ingredient.id;
                if (weeklyGrainOilItems[key]) {
                  weeklyGrainOilItems[key].amount += totalAmount;
                  if (!weeklyGrainOilItems[key].meals.includes(mealType)) {
                    weeklyGrainOilItems[key].meals.push(mealType);
                  }
                } else {
                  weeklyGrainOilItems[key] = {
                    name: ingredient.name,
                    amount: totalAmount,
                    unit: ingredient.unit || '克',
                    supplierCategory: category,
                    meals: [mealType],
                  };
                }
              }
            });
          }
        });
      });
    }

    // 第二步：遍历日期范围内的每一天，计算每日采购清单
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = dayNames[d.getDay()];
      const dayOfWeekZh = dayNamesZh[d.getDay()];
      const isMonday = d.getDay() === 1;

      const dayItems: Record<string, {
        name: string;
        amount: number;
        unit: string;
        supplierCategory: string;
        meals: string[];
      }> = {};

      // 如果是周一，添加整周的粮油
      if (isMonday) {
        Object.entries(weeklyGrainOilItems).forEach(([key, item]) => {
          dayItems[key] = { ...item, meals: [...item.meals] };
        });
      }

      // 查找该日期对应的菜单项（非粮油类）
      menus.forEach((menu) => {
        menu.menuItems.forEach((menuItem: any) => {
          if (menuItem.day === dayOfWeek) {
            const dish = menuItem.dish;
            const mealType = this.getMealTypeLabel(menuItem.mealType);

            dish.ingredients.forEach((dishIngredient: any) => {
              const ingredient = dishIngredient.ingredient;
              const category = ingredient.supplierCategory || '其他';

              // 跳过粮油类（已在周一处理）
              if (weeklyCategories.includes(category)) {
                return;
              }

              const baseAmount = dishIngredient.amount || 100;
              let totalAmount = 0;

              Object.entries(studentStats).forEach(([ageGroup, count]) => {
                const coefficient = this.getAgeCoefficient(ageGroup);
                totalAmount += baseAmount * count * coefficient;
              });

              const key = ingredient.id;
              if (dayItems[key]) {
                dayItems[key].amount += totalAmount;
                if (!dayItems[key].meals.includes(mealType)) {
                  dayItems[key].meals.push(mealType);
                }
              } else {
                dayItems[key] = {
                  name: ingredient.name,
                  amount: totalAmount,
                  unit: ingredient.unit || '克',
                  supplierCategory: category,
                  meals: [mealType],
                };
              }
            });
          }
        });
      });

      // 转换单位（克 → 斤）
      const convertedItems = Object.values(dayItems).map((item) => {
        let amount = item.amount;
        let unit = item.unit;

        if (unit === '克' || unit === 'g') {
          amount = Math.ceil(amount / 500); // 转换为斤，向上取整
          unit = '斤';
        }

        return {
          name: item.name,
          amount,
          unit,
          supplierCategory: item.supplierCategory,
          meals: item.meals.join('、'),
        };
      });

      // 只添加有食材的日期
      if (convertedItems.length > 0) {
        dailyItems[dateStr] = {
          date: dateStr,
          dayOfWeek: dayOfWeekZh,
          items: this.groupBySupplier(convertedItems),
        };
      }
    }

    return dailyItems;
  }

  private getMealTypeLabel(mealType: string): string {
    const labels: Record<string, string> = {
      Breakfast: '早餐',
      BREAKFAST: '早餐',
      Lunch: '午餐',
      LUNCH: '午餐',
      Snack: '午点',
      SNACK: '午点',
      Dinner: '晚餐',
      DINNER: '晚餐',
    };
    return labels[mealType] || mealType;
  }

  /**
   * 获取学生按年龄段统计
   */
  private async getStudentStatsByAgeGroup(classIds?: string[]) {
    const where = classIds?.length ? { classId: { in: classIds } } : {};

    const students = await this.prisma.student.findMany({
      where: {
        ...where,
        deletedAt: null,
      },
      select: { ageGroup: true, birthday: true },
    });

    const stats: Record<string, number> = {};

    students.forEach((student) => {
      // 如果有 ageGroup，直接使用
      let ageGroup = student.ageGroup;

      // 如果没有 ageGroup 但有 birthday，自动计算
      if (!ageGroup && student.birthday) {
        const age = this.calculateAge(student.birthday);
        ageGroup = this.getAgeGroupFromAge(age);
      }

      // 默认为 4-5 岁
      if (!ageGroup) {
        ageGroup = '4-5';
      }

      stats[ageGroup] = (stats[ageGroup] || 0) + 1;
    });

    return stats;
  }

  /**
   * 计算年龄
   */
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * 根据年龄获取年龄段
   */
  private getAgeGroupFromAge(age: number): string {
    if (age >= 2 && age < 3) return '2-3';
    if (age >= 3 && age < 4) return '3-4';
    if (age >= 4 && age < 5) return '4-5';
    if (age >= 5 && age < 6) return '5-6';
    if (age >= 6 && age < 7) return '6-7';
    return '4-5'; // 默认
  }

  /**
   * 获取所有采购计划
   */
  async findAll(query: any) {
    const { page = 1, pageSize = 10, status } = query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    // 确保 page 和 pageSize 是数字
    const pageNum = Number(page);
    const pageSizeNum = Number(pageSize);

    const [plans, total] = await Promise.all([
      this.prisma.purchasePlan.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
      }),
      this.prisma.purchasePlan.count({ where }),
    ]);

    return {
      data: plans,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
    };
  }

  /**
   * 获取采购计划详情
   */
  async findOne(id: string) {
    return this.prisma.purchasePlan.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * 更新采购计划状态
   */
  async updateStatus(id: string, status: string) {
    return this.prisma.purchasePlan.update({
      where: { id },
      data: { status: status as any },
    });
  }

  /**
   * 删除采购计划
   */
  async deletePlan(id: string) {
    return this.prisma.purchasePlan.delete({
      where: { id },
    });
  }
}
