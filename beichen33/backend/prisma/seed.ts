import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kindergarten.com' },
    update: {},
    create: {
      email: 'admin@kindergarten.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      phone: '1234567890',
    },
  });

  const teacher1 = await prisma.user.upsert({
    where: { email: 'teacher1@kindergarten.com' },
    update: {},
    create: {
      email: 'teacher1@kindergarten.com',
      password: hashedPassword,
      name: 'Teacher Wang',
      role: 'TEACHER',
      phone: '1234567891',
    },
  });

  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@kindergarten.com' },
    update: {},
    create: {
      email: 'teacher2@kindergarten.com',
      password: hashedPassword,
      name: 'Teacher Li',
      role: 'TEACHER',
      phone: '1234567892',
    },
  });

  const class1 = await prisma.class.create({
    data: {
      name: 'Small Class A',
      grade: 'Small',
      capacity: 25,
      teacherId: teacher1.id,
    },
  });

  const class2 = await prisma.class.create({
    data: {
      name: 'Middle Class A',
      grade: 'Middle',
      capacity: 30,
      teacherId: teacher2.id,
    },
  });

  const student1 = await prisma.student.create({
    data: {
      name: 'Zhang San',
      gender: 'Male',
      birthday: new Date('2020-03-15'),
      enrollDate: new Date('2023-09-01'),
      classId: class1.id,
      address: '123 Main St',
    },
  });

  const student2 = await prisma.student.create({
    data: {
      name: 'Li Si',
      gender: 'Female',
      birthday: new Date('2019-05-20'),
      enrollDate: new Date('2022-09-01'),
      classId: class2.id,
      address: '456 Oak Ave',
    },
  });

  const parent1 = await prisma.parent.create({
    data: {
      name: 'Zhang Parent',
      phone: '9876543210',
      email: 'parent1@example.com',
      relation: 'Father',
    },
  });

  await prisma.studentParent.create({
    data: {
      studentId: student1.id,
      parentId: parent1.id,
      isPrimary: true,
    },
  });

  const rice = await prisma.ingredient.create({
    data: {
      name: 'Rice',
      unit: 'g',
      protein: 7.0,
      fat: 0.9,
      carbs: 77.9,
      calories: 345,
    },
  });

  const chicken = await prisma.ingredient.create({
    data: {
      name: 'Chicken Breast',
      unit: 'g',
      protein: 31.0,
      fat: 3.6,
      carbs: 0,
      calories: 165,
    },
  });

  const dish1 = await prisma.dish.create({
    data: {
      name: 'Chicken Rice',
      category: 'Main Course',
      price: 15.0,
    },
  });

  await prisma.dishIngredient.createMany({
    data: [
      { dishId: dish1.id, ingredientId: rice.id, quantity: 200 },
      { dishId: dish1.id, ingredientId: chicken.id, quantity: 100 },
    ],
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
