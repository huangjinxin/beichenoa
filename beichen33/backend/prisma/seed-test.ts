import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test data...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const campus = await prisma.campus.create({
    data: {
      name: 'Main Campus',
      address: 'No.123 Education Road',
      phone: '0755-12345678',
      principal: 'Principal Wang',
    },
  });

  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@test.com',
      password: hashedPassword,
      name: 'Teacher Zhang',
      role: 'TEACHER',
      gender: '女',
      birthday: new Date('1990-05-15'),
      hireDate: new Date('2020-09-01'),
      campusId: campus.id,
    },
  });

  const classData = await prisma.class.create({
    data: {
      name: 'Class A',
      grade: 'Middle',
      capacity: 30,
      teacherId: teacher.id,
      campusId: campus.id,
    },
  });

  await prisma.student.create({
    data: {
      name: 'Student Li Ming',
      idCard: '440301201501011234',
      gender: 'Male',
      birthday: new Date('2015-01-01'),
      enrollDate: new Date('2020-09-01'),
      classId: classData.id,
      campusId: campus.id,
    },
  });

  const rice = await prisma.ingredient.create({
    data: {
      name: 'Rice',
      unit: 'g',
      calories: 116,
      protein: 2.6,
      fat: 0.3,
      carbs: 25.9,
      fiber: 0.3,
      vitaminB1: 0.11,
      vitaminB2: 0.03,
      calcium: 7,
      iron: 1.3,
      zinc: 1.7,
      sodium: 2.5,
    },
  });

  const chicken = await prisma.ingredient.create({
    data: {
      name: 'Chicken Breast',
      unit: 'g',
      calories: 133,
      protein: 19.4,
      fat: 5,
      carbs: 2.5,
      fiber: 0,
      vitaminA: 48,
      vitaminB1: 0.05,
      vitaminB2: 0.09,
      calcium: 9,
      iron: 1.5,
      zinc: 1.09,
      sodium: 63,
    },
  });

  const carrot = await prisma.ingredient.create({
    data: {
      name: 'Carrot',
      unit: 'g',
      calories: 25,
      protein: 1,
      fat: 0.2,
      carbs: 5.9,
      fiber: 2.8,
      vitaminA: 688,
      vitaminC: 7,
      calcium: 32,
      iron: 1,
      zinc: 0.4,
      sodium: 71,
    },
  });

  const egg = await prisma.ingredient.create({
    data: {
      name: 'Egg',
      unit: 'g',
      calories: 144,
      protein: 13.3,
      fat: 8.8,
      carbs: 2.8,
      fiber: 0,
      vitaminA: 234,
      vitaminB1: 0.11,
      vitaminB2: 0.27,
      calcium: 56,
      iron: 2,
      zinc: 1.1,
      sodium: 131,
    },
  });

  const dish1 = await prisma.dish.create({
    data: {
      name: 'Chicken Fried Rice',
      category: 'Main',
      description: 'Nutritious fried rice with chicken and vegetables',
    },
  });

  await prisma.dishIngredient.createMany({
    data: [
      { dishId: dish1.id, ingredientId: rice.id, amount: 150 },
      { dishId: dish1.id, ingredientId: chicken.id, amount: 80 },
      { dishId: dish1.id, ingredientId: carrot.id, amount: 30 },
      { dishId: dish1.id, ingredientId: egg.id, amount: 50 },
    ],
  });

  const dish2 = await prisma.dish.create({
    data: {
      name: 'Steamed Egg',
      category: 'Snack',
      description: 'Soft steamed egg',
    },
  });

  await prisma.dishIngredient.create({
    data: {
      dishId: dish2.id,
      ingredientId: egg.id,
      amount: 100,
    },
  });

  const startDate = new Date('2024-11-18');
  const endDate = new Date('2024-11-22');

  const menu = await prisma.menu.create({
    data: {
      name: 'Week 47 Menu',
      startDate,
      endDate,
      classId: classData.id,
    },
  });

  await prisma.menuItem.createMany({
    data: [
      { menuId: menu.id, dishId: dish1.id, day: 'Monday', mealType: 'Lunch' },
      { menuId: menu.id, dishId: dish2.id, day: 'Monday', mealType: 'Snack' },
      { menuId: menu.id, dishId: dish1.id, day: 'Tuesday', mealType: 'Lunch' },
      { menuId: menu.id, dishId: dish2.id, day: 'Tuesday', mealType: 'Breakfast' },
      { menuId: menu.id, dishId: dish1.id, day: 'Wednesday', mealType: 'Lunch' },
      { menuId: menu.id, dishId: dish2.id, day: 'Wednesday', mealType: 'Snack' },
      { menuId: menu.id, dishId: dish1.id, day: 'Thursday', mealType: 'Lunch' },
      { menuId: menu.id, dishId: dish1.id, day: 'Friday', mealType: 'Lunch' },
      { menuId: menu.id, dishId: dish2.id, day: 'Friday', mealType: 'Snack' },
    ],
  });

  console.log('Test data seeded successfully!');
  console.log('Campus:', campus.name);
  console.log('Teacher:', teacher.name, teacher.email);
  console.log('Class:', classData.name);
  console.log('Menu:', menu.name);
  console.log('Dishes: Chicken Fried Rice, Steamed Egg');
  console.log('Ingredients: Rice, Chicken, Carrot, Egg');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
