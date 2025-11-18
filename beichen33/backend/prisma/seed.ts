import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const campus = await prisma.campus.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Beichen Kindergarten',
      address: 'Beijing',
      phone: '010-12345678',
    },
  });

  const principal = await prisma.position.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Principal',
      type: 'PRINCIPAL',
      level: 1,
    },
  });

  const teacherPosition = await prisma.position.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Teacher',
      type: 'TEACHER',
      level: 4,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@beichen.com' },
    update: {},
    create: {
      email: 'admin@beichen.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      phone: '1234567890',
      campusId: campus.id,
      positionId: principal.id,
      employmentStatus: 'ACTIVE',
    },
  });

  const teacher1 = await prisma.user.upsert({
    where: { email: 'teacher1@beichen.com' },
    update: {},
    create: {
      email: 'teacher1@beichen.com',
      password: hashedPassword,
      name: 'Teacher Wang',
      role: 'TEACHER',
      phone: '1234567891',
      campusId: campus.id,
      positionId: teacherPosition.id,
      employmentStatus: 'ACTIVE',
    },
  });

  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@beichen.com' },
    update: {},
    create: {
      email: 'teacher2@beichen.com',
      password: hashedPassword,
      name: 'Teacher Li',
      role: 'TEACHER',
      phone: '1234567892',
      campusId: campus.id,
      positionId: teacherPosition.id,
      employmentStatus: 'ACTIVE',
    },
  });

  const class1 = await prisma.class.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'Small Class A',
      grade: 'Small',
      capacity: 25,
      teachers: { connect: [{ id: teacher1.id }] },
      campusId: campus.id,
    },
  });

  const class2 = await prisma.class.upsert({
    where: { id: '00000000-0000-0000-0000-000000000005' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000005',
      name: 'Middle Class A',
      grade: 'Middle',
      capacity: 30,
      teachers: { connect: [{ id: teacher2.id }] },
      campusId: campus.id,
    },
  });

  const student1 = await prisma.student.upsert({
    where: { id: '00000000-0000-0000-0000-000000000006' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000006',
      name: 'Zhang San',
      gender: 'Male',
      birthday: new Date('2020-03-15'),
      enrollDate: new Date('2023-09-01'),
      classId: class1.id,
      campusId: campus.id,
      address: '123 Main St',
    },
  });

  const student2 = await prisma.student.upsert({
    where: { id: '00000000-0000-0000-0000-000000000007' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000007',
      name: 'Li Si',
      gender: 'Female',
      birthday: new Date('2019-05-20'),
      enrollDate: new Date('2022-09-01'),
      classId: class2.id,
      campusId: campus.id,
      address: '456 Oak Ave',
    },
  });

  const parent1 = await prisma.parent.upsert({
    where: { id: '00000000-0000-0000-0000-000000000008' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000008',
      name: 'Zhang Parent',
      phone: '9876543210',
      email: 'parent1@example.com',
      relation: 'Father',
    },
  });

  await prisma.studentParent.upsert({
    where: {
      studentId_parentId: {
        studentId: student1.id,
        parentId: parent1.id,
      },
    },
    update: {},
    create: {
      studentId: student1.id,
      parentId: parent1.id,
      isPrimary: true,
    },
  });

  const rice = await prisma.ingredient.upsert({
    where: { id: '00000000-0000-0000-0000-000000000009' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000009',
      name: 'Rice',
      unit: 'g',
      protein: 7.0,
      fat: 0.9,
      carbs: 77.9,
      calories: 345,
    },
  });

  const chicken = await prisma.ingredient.upsert({
    where: { id: '00000000-0000-0000-0000-00000000000a' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-00000000000a',
      name: 'Chicken Breast',
      unit: 'g',
      protein: 31.0,
      fat: 3.6,
      carbs: 0,
      calories: 165,
    },
  });

  const dish1 = await prisma.dish.upsert({
    where: { id: '00000000-0000-0000-0000-00000000000b' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-00000000000b',
      name: 'Chicken Rice',
      category: 'Main Course',
      price: 15.0,
    },
  });

  await prisma.dishIngredient.deleteMany({
    where: { dishId: dish1.id },
  });

  await prisma.dishIngredient.createMany({
    data: [
      {
        dishId: dish1.id,
        ingredientId: rice.id,
        amount: 200,
      },
      {
        dishId: dish1.id,
        ingredientId: chicken.id,
        amount: 100,
      },
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
