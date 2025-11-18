import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class NutritionService {
  constructor(private prisma: PrismaService) {}

  async analyze(startDate: string, endDate: string, grade?: string) {
    const menus = await this.prisma.menu.findMany({
      where: {
        startDate: { lte: new Date(endDate) },
        endDate: { gte: new Date(startDate) },
        grade: grade || undefined,
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
      orderBy: { startDate: 'asc' },
    });

    // 初始化汇总数据
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;

    // 每日数据和详细数据
    const dailyDataMap = new Map<string, any>();
    const details: any[] = [];

    // 遍历菜单计算营养成分
    menus.forEach((menu) => {
      menu.menuItems.forEach((item) => {
        const dish = item.dish;
        if (!dish) return;

        // 计算该菜品的营养成分
        let itemCalories = 0;
        let itemProtein = 0;
        let itemFat = 0;
        let itemCarbs = 0;

        dish.ingredients?.forEach((dishIngredient: any) => {
          const ingredient = dishIngredient.ingredient;
          if (!ingredient) return;

          // 假设amount是克数，营养成分是按每100g计算
          const ratio = (dishIngredient.amount || 100) / 100;

          itemCalories += (ingredient.calories || 0) * ratio;
          itemProtein += (ingredient.protein || 0) * ratio;
          itemFat += (ingredient.fat || 0) * ratio;
          itemCarbs += (ingredient.carbs || 0) * ratio;
        });

        // 累加总和
        totalCalories += itemCalories;
        totalProtein += itemProtein;
        totalFat += itemFat;
        totalCarbs += itemCarbs;

        // 构建日期key（使用菜单日期和day组合）
        const dateKey = `${menu.startDate.toISOString().split('T')[0]}-${item.day}`;

        // 累加每日数据
        if (!dailyDataMap.has(dateKey)) {
          dailyDataMap.set(dateKey, {
            date: dateKey,
            calories: 0,
            protein: 0,
            fat: 0,
            carbs: 0,
          });
        }

        const dailyData = dailyDataMap.get(dateKey);
        dailyData.calories += itemCalories;
        dailyData.protein += itemProtein;
        dailyData.fat += itemFat;
        dailyData.carbs += itemCarbs;

        // 添加详细数据
        details.push({
          date: dateKey,
          mealType: this.getMealTypeLabel(item.mealType),
          calories: Math.round(itemCalories * 10) / 10,
          protein: Math.round(itemProtein * 10) / 10,
          fat: Math.round(itemFat * 10) / 10,
          carbs: Math.round(itemCarbs * 10) / 10,
        });
      });
    });

    // 转换每日数据为数组
    const dailyData = Array.from(dailyDataMap.values()).map((item) => ({
      date: item.date,
      calories: Math.round(item.calories * 10) / 10,
      protein: Math.round(item.protein * 10) / 10,
      fat: Math.round(item.fat * 10) / 10,
      carbs: Math.round(item.carbs * 10) / 10,
    }));

    return {
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein * 10) / 10,
      totalFat: Math.round(totalFat * 10) / 10,
      totalCarbs: Math.round(totalCarbs * 10) / 10,
      dailyData,
      details,
    };
  }

  private getMealTypeLabel(mealType: string): string {
    const labels: Record<string, string> = {
      Breakfast: '早餐',
      Lunch: '中餐',
      Snack: '午点',
      Dinner: '晚餐',
    };
    return labels[mealType] || mealType;
  }

  async getWeeklyReport(startDate: string, endDate: string, grade?: string) {
    const menus = await this.prisma.menu.findMany({
      where: {
        startDate: { lte: new Date(endDate) },
        endDate: { gte: new Date(startDate) },
        grade: grade || undefined,
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
          orderBy: { mealType: 'asc' } as any,
        },
      },
      orderBy: { startDate: 'asc' },
    });

    const weekData: any = {
      startDate,
      endDate,
      menuName: menus[0]?.name || 'Menu',
      grade: grade || 'All Grades',
      days: [],
      weeklyNutrition: {
        totalCalories: 0,
        totalProtein: 0,
        totalFat: 0,
        totalCarbs: 0,
        totalFiber: 0,
        totalVitaminA: 0,
        totalVitaminB1: 0,
        totalVitaminB2: 0,
        totalVitaminC: 0,
        totalCalcium: 0,
        totalIron: 0,
        totalZinc: 0,
        totalSodium: 0,
      },
    };

    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mealTypeOrder: Record<string, number> = { BREAKFAST: 0, LUNCH: 1, SNACK: 2, DINNER: 3 };

    menus.forEach((menu: any) => {
      const groupedByDay = menu.menuItems.reduce((acc: any, item: any) => {
        if (!acc[item.day]) {
          acc[item.day] = [];
        }
        acc[item.day].push(item);
        return acc;
      }, {} as any);

      dayOrder.forEach((day) => {
        if (!groupedByDay[day]) return;

        const meals = groupedByDay[day].sort((a: any, b: any) => {
          const aOrder = mealTypeOrder[a.mealType.toUpperCase()] || 0;
          const bOrder = mealTypeOrder[b.mealType.toUpperCase()] || 0;
          return aOrder - bOrder;
        });

        const mealsByType: Record<string, any[]> = {};

        meals.forEach((item: any) => {
          if (!mealsByType[item.mealType]) {
            mealsByType[item.mealType] = [];
          }
          mealsByType[item.mealType].push(item);
        });

        const dayMeals = Object.entries(mealsByType).map(([mealType, items]) => {
          const mealNutrition = {
            calories: 0,
            protein: 0,
            fat: 0,
            carbs: 0,
            fiber: 0,
            vitaminA: 0,
            vitaminB1: 0,
            vitaminB2: 0,
            vitaminC: 0,
            calcium: 0,
            iron: 0,
            zinc: 0,
            sodium: 0,
          };

          const dishes = items.map((item: any) => {
            item.dish.ingredients.forEach((di: any) => {
              const ratio = (di.amount || 100) / 100;
              mealNutrition.calories += (di.ingredient.calories || 0) * ratio;
              mealNutrition.protein += (di.ingredient.protein || 0) * ratio;
              mealNutrition.fat += (di.ingredient.fat || 0) * ratio;
              mealNutrition.carbs += (di.ingredient.carbs || 0) * ratio;
              mealNutrition.fiber += (di.ingredient.fiber || 0) * ratio;
              mealNutrition.vitaminA += (di.ingredient.vitaminA || 0) * ratio;
              mealNutrition.vitaminB1 += (di.ingredient.vitaminB1 || 0) * ratio;
              mealNutrition.vitaminB2 += (di.ingredient.vitaminB2 || 0) * ratio;
              mealNutrition.vitaminC += (di.ingredient.vitaminC || 0) * ratio;
              mealNutrition.calcium += (di.ingredient.calcium || 0) * ratio;
              mealNutrition.iron += (di.ingredient.iron || 0) * ratio;
              mealNutrition.zinc += (di.ingredient.zinc || 0) * ratio;
              mealNutrition.sodium += (di.ingredient.sodium || 0) * ratio;
            });

            return {
              name: item.dish.name,
              category: item.dish.category,
            };
          });

          return {
            mealType,
            dishes,
            nutrition: mealNutrition,
          };
        });

        const dayTotalNutrition = dayMeals.reduce((total: any, meal: any) => {
          Object.keys(meal.nutrition).forEach((key) => {
            total[key] = (total[key] || 0) + meal.nutrition[key];
          });
          return total;
        }, {});

        Object.keys(dayTotalNutrition).forEach((key) => {
          weekData.weeklyNutrition[`total${key.charAt(0).toUpperCase() + key.slice(1)}`] += dayTotalNutrition[key];
        });

        weekData.days.push({
          day,
          meals: dayMeals,
          totalNutrition: dayTotalNutrition,
        });
      });
    });

    const daysWithData = weekData.days.length || 1;

    weekData.weeklyAverage = {
      calories: Math.round((weekData.weeklyNutrition.totalCalories / daysWithData) * 10) / 10,
      protein: Math.round((weekData.weeklyNutrition.totalProtein / daysWithData) * 10) / 10,
      fat: Math.round((weekData.weeklyNutrition.totalFat / daysWithData) * 10) / 10,
      carbs: Math.round((weekData.weeklyNutrition.totalCarbs / daysWithData) * 10) / 10,
      fiber: Math.round((weekData.weeklyNutrition.totalFiber / daysWithData) * 10) / 10,
      vitaminA: Math.round((weekData.weeklyNutrition.totalVitaminA / daysWithData) * 10) / 10,
      vitaminB1: Math.round((weekData.weeklyNutrition.totalVitaminB1 / daysWithData) * 100) / 100,
      vitaminB2: Math.round((weekData.weeklyNutrition.totalVitaminB2 / daysWithData) * 100) / 100,
      vitaminC: Math.round((weekData.weeklyNutrition.totalVitaminC / daysWithData) * 10) / 10,
      calcium: Math.round((weekData.weeklyNutrition.totalCalcium / daysWithData) * 10) / 10,
      iron: Math.round((weekData.weeklyNutrition.totalIron / daysWithData) * 10) / 10,
      zinc: Math.round((weekData.weeklyNutrition.totalZinc / daysWithData) * 10) / 10,
      sodium: Math.round((weekData.weeklyNutrition.totalSodium / daysWithData) * 10) / 10,
    };

    return weekData;
  }

  // ==================== 营养标准管理 ====================

  /**
   * 获取所有营养标准
   */
  async findAllNutritionStandards() {
    return this.prisma.nutritionStandard.findMany({
      where: { isActive: true },
      orderBy: { ageGroup: 'asc' },
    });
  }

  /**
   * 获取推荐的营养标准（基于中国幼儿园标准）
   */
  getRecommendedStandards() {
    return [
      {
        ageGroup: '2-3',
        ageLabel: '2-3岁',
        caloriesMin: 1200,
        caloriesMax: 1400,
        proteinMin: 35,
        proteinMax: 45,
        fatMin: 40,
        fatMax: 50,
        carbsMin: 150,
        carbsMax: 180,
        breakfastRatio: 0.25,
        lunchRatio: 0.40,
        snackRatio: 0.15,
        dinnerRatio: 0.20,
        grainPerMeal: 40,
        vegetablePerMeal: 80,
        meatPerMeal: 40,
        eggPerMeal: 25,
        milkPerDay: 250,
        description: '2-3岁幼儿每日营养推荐摄入量（参考《中国居民膳食营养素参考摄入量》）',
      },
      {
        ageGroup: '3-4',
        ageLabel: '3-4岁',
        caloriesMin: 1400,
        caloriesMax: 1600,
        proteinMin: 40,
        proteinMax: 50,
        fatMin: 45,
        fatMax: 55,
        carbsMin: 170,
        carbsMax: 200,
        breakfastRatio: 0.25,
        lunchRatio: 0.40,
        snackRatio: 0.15,
        dinnerRatio: 0.20,
        grainPerMeal: 50,
        vegetablePerMeal: 100,
        meatPerMeal: 50,
        eggPerMeal: 30,
        milkPerDay: 300,
        description: '3-4岁幼儿每日营养推荐摄入量',
      },
      {
        ageGroup: '4-5',
        ageLabel: '4-5岁',
        caloriesMin: 1500,
        caloriesMax: 1700,
        proteinMin: 45,
        proteinMax: 55,
        fatMin: 50,
        fatMax: 60,
        carbsMin: 180,
        carbsMax: 210,
        breakfastRatio: 0.25,
        lunchRatio: 0.40,
        snackRatio: 0.15,
        dinnerRatio: 0.20,
        grainPerMeal: 60,
        vegetablePerMeal: 120,
        meatPerMeal: 60,
        eggPerMeal: 35,
        milkPerDay: 300,
        description: '4-5岁幼儿每日营养推荐摄入量',
      },
      {
        ageGroup: '5-6',
        ageLabel: '5-6岁',
        caloriesMin: 1600,
        caloriesMax: 1800,
        proteinMin: 50,
        proteinMax: 60,
        fatMin: 55,
        fatMax: 65,
        carbsMin: 200,
        carbsMax: 230,
        breakfastRatio: 0.25,
        lunchRatio: 0.40,
        snackRatio: 0.15,
        dinnerRatio: 0.20,
        grainPerMeal: 70,
        vegetablePerMeal: 130,
        meatPerMeal: 70,
        eggPerMeal: 40,
        milkPerDay: 350,
        description: '5-6岁幼儿每日营养推荐摄入量',
      },
      {
        ageGroup: '6-7',
        ageLabel: '6-7岁',
        caloriesMin: 1700,
        caloriesMax: 1900,
        proteinMin: 55,
        proteinMax: 65,
        fatMin: 60,
        fatMax: 70,
        carbsMin: 220,
        carbsMax: 250,
        breakfastRatio: 0.25,
        lunchRatio: 0.40,
        snackRatio: 0.15,
        dinnerRatio: 0.20,
        grainPerMeal: 80,
        vegetablePerMeal: 150,
        meatPerMeal: 80,
        eggPerMeal: 45,
        milkPerDay: 400,
        description: '6-7岁幼儿每日营养推荐摄入量',
      },
    ];
  }

  /**
   * 创建或更新营养标准
   */
  async upsertNutritionStandard(data: any) {
    const { ageGroup, ...rest } = data;

    return this.prisma.nutritionStandard.upsert({
      where: { ageGroup },
      update: rest,
      create: data,
    });
  }

  /**
   * 批量应用推荐标准
   */
  async applyRecommendedStandards() {
    const recommended = this.getRecommendedStandards();

    const results = await Promise.all(
      recommended.map((standard) =>
        this.upsertNutritionStandard(standard)
      )
    );

    return {
      message: '推荐标准已成功应用',
      count: results.length,
      standards: results,
    };
  }
}
