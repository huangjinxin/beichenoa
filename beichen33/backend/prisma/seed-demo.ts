import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.menuItem.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.dishIngredient.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.growthRecord.deleteMany();
  await prisma.studentParent.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();
  await prisma.position.deleteMany();
  await prisma.campus.deleteMany();

  console.log('Creating campus...');
  const campus = await prisma.campus.create({
    data: {
      name: '北辰幼儿园总部',
      address: '北京市朝阳区某某街道123号',
      phone: '010-12345678',
      principal: '张园长',
    },
  });

  console.log('Creating positions...');
  const principal = await prisma.position.create({
    data: { name: '园长', type: 'PRINCIPAL', level: 1 },
  });

  const vicePrincipal = await prisma.position.create({
    data: {
      name: '副园长',
      type: 'VICE_PRINCIPAL',
      level: 2,
      parentId: principal.id,
    },
  });

  const director = await prisma.position.create({
    data: {
      name: '教学主任',
      type: 'DIRECTOR',
      level: 3,
      parentId: vicePrincipal.id,
    },
  });

  const teacher = await prisma.position.create({
    data: {
      name: '班主任',
      type: 'TEACHER',
      level: 4,
      parentId: director.id,
    },
  });

  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@beichen.com',
      password: hashedPassword,
      name: '管理员',
      role: 'ADMIN',
      campusId: campus.id,
      positionId: principal.id,
      employmentStatus: 'ACTIVE',
    },
  });

  const teacher1 = await prisma.user.create({
    data: {
      email: 'teacher1@beichen.com',
      password: hashedPassword,
      name: '李老师',
      role: 'TEACHER',
      campusId: campus.id,
      positionId: teacher.id,
      employmentStatus: 'ACTIVE',
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      email: 'teacher2@beichen.com',
      password: hashedPassword,
      name: '王老师',
      role: 'TEACHER',
      campusId: campus.id,
      positionId: teacher.id,
      employmentStatus: 'ACTIVE',
    },
  });

  console.log('Creating classes...');
  const class1 = await prisma.class.create({
    data: {
      name: '小班一班',
      grade: 'SMALL',
      capacity: 25,
      teacherId: teacher1.id,
      campusId: campus.id,
    },
  });

  const class2 = await prisma.class.create({
    data: {
      name: '中班一班',
      grade: 'MEDIUM',
      capacity: 30,
      teacherId: teacher2.id,
      campusId: campus.id,
    },
  });

  console.log('Creating students...');
  const students = [];
  const studentNames = ['小明', '小红', '小刚', '小丽', '小华', '小芳', '小东', '小西'];
  for (let i = 0; i < 8; i++) {
    const student = await prisma.student.create({
      data: {
        name: studentNames[i],
        gender: i % 2 === 0 ? '男' : '女',
        birthday: new Date(2020, i, 15),
        enrollDate: new Date(2024, 8, 1),
        classId: i < 4 ? class1.id : class2.id,
        campusId: campus.id,
      },
    });
    students.push(student);
  }

  console.log('Creating ingredients...');
  const rice = await prisma.ingredient.create({
    data: {
      name: '大米',
      unit: '克',
      protein: 7.4,
      fat: 0.8,
      carbs: 77.9,
      calories: 346,
      fiber: 0.7,
    },
  });

  const pork = await prisma.ingredient.create({
    data: {
      name: '猪肉',
      unit: '克',
      protein: 20.3,
      fat: 6.2,
      carbs: 1.5,
      calories: 143,
      iron: 3.0,
    },
  });

  const cabbage = await prisma.ingredient.create({
    data: {
      name: '白菜',
      unit: '克',
      protein: 1.5,
      fat: 0.2,
      carbs: 3.2,
      calories: 17,
      vitaminC: 31,
      fiber: 0.8,
    },
  });

  const tomato = await prisma.ingredient.create({
    data: {
      name: '西红柿',
      unit: '克',
      protein: 0.9,
      fat: 0.2,
      carbs: 3.3,
      calories: 19,
      vitaminC: 19,
      vitaminA: 92,
    },
  });

  const egg = await prisma.ingredient.create({
    data: {
      name: '鸡蛋',
      unit: '个',
      protein: 13.3,
      fat: 8.8,
      carbs: 2.8,
      calories: 144,
      vitaminA: 234,
    },
  });

  console.log('Creating dishes...');
  const dish1 = await prisma.dish.create({
    data: {
      name: '番茄炒蛋',
      category: '热菜',
      price: 12,
    },
  });

  await prisma.dishIngredient.createMany({
    data: [
      { dishId: dish1.id, ingredientId: tomato.id, amount: 150 },
      { dishId: dish1.id, ingredientId: egg.id, amount: 2 },
    ],
  });

  const dish2 = await prisma.dish.create({
    data: {
      name: '白菜炖肉',
      category: '热菜',
      price: 18,
    },
  });

  await prisma.dishIngredient.createMany({
    data: [
      { dishId: dish2.id, ingredientId: cabbage.id, amount: 200 },
      { dishId: dish2.id, ingredientId: pork.id, amount: 100 },
    ],
  });

  const dish3 = await prisma.dish.create({
    data: {
      name: '米饭',
      category: '主食',
      price: 2,
    },
  });

  await prisma.dishIngredient.create({
    data: { dishId: dish3.id, ingredientId: rice.id, amount: 150 },
  });

  console.log('Creating menu...');
  const menu = await prisma.menu.create({
    data: {
      name: '第一周食谱',
      startDate: new Date(2024, 10, 18),
      endDate: new Date(2024, 10, 22),
      grade: 'ALL',
      teacherId: teacher1.id,
    },
  });

  await prisma.menuItem.createMany({
    data: [
      { menuId: menu.id, dishId: dish1.id, day: 'Monday', mealType: 'Breakfast' },
      { menuId: menu.id, dishId: dish3.id, day: 'Monday', mealType: 'Lunch' },
      { menuId: menu.id, dishId: dish2.id, day: 'Monday', mealType: 'Lunch' },
      { menuId: menu.id, dishId: dish1.id, day: 'Tuesday', mealType: 'Breakfast' },
      { menuId: menu.id, dishId: dish3.id, day: 'Tuesday', mealType: 'Lunch' },
      { menuId: menu.id, dishId: dish2.id, day: 'Tuesday', mealType: 'Lunch' },
    ],
  });

  console.log('Demo data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
