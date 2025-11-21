import { PrismaClient, UserSourceType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * 数据同步脚本：为所有学生创建家长登录账号
 *
 * 同步逻辑：
 * 1. 遍历所有学生记录
 * 2. 检查学生是否已有关联的家长账号
 * 3. 如果没有，创建 Parent 记录和 User 账号
 * 4. 建立关联关系
 */

async function syncStudentUsers() {
  console.log('🚀 开始同步学生数据到用户表...\n');

  try {
    // 获取所有学生
    const students = await prisma.student.findMany({
      include: {
        campus: true,
        class: true,
        parents: {
          include: {
            parent: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    console.log(`📊 找到 ${students.length} 个学生记录\n`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const student of students) {
      try {
        // 检查学生是否已有家长账号
        const hasParentUser = student.parents.some(
          (sp) => sp.parent.user !== null
        );

        if (hasParentUser) {
          console.log(`⏭️  跳过: ${student.name} - 已有家长账号`);
          skippedCount++;
          continue;
        }

        // 生成登录账号：学生身份证号或手机号
        let email = '';
        if (student.idCard) {
          // 使用身份证号作为账号
          email = `${student.idCard}@student.beichen.edu`;
        } else if (student.primaryPhone) {
          // 使用手机号作为账号
          email = `${student.primaryPhone}@student.beichen.edu`;
        } else {
          // 使用学生ID作为账号
          email = `student_${student.id.substring(0, 8)}@beichen.edu`;
        }

        // 检查邮箱是否已存在
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          console.log(`⚠️  警告: ${student.name} - 邮箱 ${email} 已存在`);
          skippedCount++;
          continue;
        }

        // 加密默认密码
        const hashedPassword = await bcrypt.hash('123456', 10);

        // 创建用户账号
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name: `${student.name}家长`,
            phone: student.primaryPhone || null,
            role: 'PARENT',
            campusId: student.campusId,
            isActive: true,
            sourceType: UserSourceType.STUDENT,
            sourceId: student.id,
          },
        });

        // 创建 Parent 记录
        const parent = await prisma.parent.create({
          data: {
            name: `${student.name}家长`,
            phone: student.primaryPhone || '',
            email: email,
            relation: '家长',
            userId: user.id,
          },
        });

        // 建立学生-家长关联
        await prisma.studentParent.create({
          data: {
            studentId: student.id,
            parentId: parent.id,
            isPrimary: true,
          },
        });

        console.log(
          `✅ 成功创建: ${student.name} -> 账号: ${email} (校区: ${student.campus.name}, 班级: ${student.class.name})`
        );
        createdCount++;
      } catch (error: any) {
        console.error(`❌ 错误: ${student.name} - ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 同步结果统计：');
    console.log(`   ✅ 成功创建: ${createdCount} 个家长账号`);
    console.log(`   ⏭️  跳过: ${skippedCount} 个（已有账号）`);
    console.log(`   ❌ 失败: ${errorCount} 个`);
    console.log('='.repeat(60) + '\n');

    if (createdCount > 0) {
      console.log('💡 提示：');
      console.log('   - 所有新创建的账号默认密码为: 123456');
      console.log('   - 账号格式: 身份证号/手机号@student.beichen.edu');
      console.log('   - 请提醒家长首次登录后修改密码\n');
    }
  } catch (error) {
    console.error('❌ 同步过程发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 执行同步
syncStudentUsers()
  .then(() => {
    console.log('✅ 同步任务完成！\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 同步任务失败:', error);
    process.exit(1);
  });
