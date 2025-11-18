import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(classId?: string, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const where = classId ? { classId, deletedAt: null } : { deletedAt: null };

      const [data, total] = await Promise.all([
        this.prisma.student.findMany({
          where,
          skip,
          take: limit,
          include: {
            class: true,
            campus: { select: { id: true, name: true } },
            parents: { include: { parent: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.student.count({ where }),
      ]);

      return { data, total, page, limit };
    } catch (error) {
      throw new BadRequestException('Failed to fetch students');
    }
  }

  async findOne(id: string) {
    try {
      const student = await this.prisma.student.findUnique({
        where: { id },
        include: {
          class: { include: { teachers: true } },
          campus: { select: { id: true, name: true } },
          parents: { include: { parent: true } },
          growthRecords: { orderBy: { recordedAt: 'desc' }, take: 10 },
        },
      });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      return student;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch student');
    }
  }

  async create(data: any) {
    try {
      const { classId, campusId, ...studentData } = data;
      return await this.prisma.student.create({
        data: {
          ...studentData,
          class: { connect: { id: classId } },
          campus: { connect: { id: campusId } },
        },
        include: {
          class: true,
          campus: { select: { id: true, name: true } },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to create student: ${error.message}`);
    }
  }

  async update(id: string, data: any) {
    try {
      const { classId, campusId, ...studentData } = data;
      const updateData: any = { ...studentData };
      if (classId) {
        updateData.class = { connect: { id: classId } };
      }
      if (campusId) {
        updateData.campus = { connect: { id: campusId } };
      }
      return await this.prisma.student.update({
        where: { id },
        data: updateData,
        include: {
          class: true,
          campus: { select: { id: true, name: true } },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to update student: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.student.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to delete student: ${error.message}`);
    }
  }

  /**
   * 获取学生统计信息（按年龄段分组）
   */
  async getStats(classIds?: string[]) {
    try {
      const where: any = { deletedAt: null };
      if (classIds && classIds.length > 0) {
        where.classId = { in: classIds };
      }

      const students = await this.prisma.student.findMany({
        where,
        select: {
          ageGroup: true,
          birthday: true,
        },
      });

      const byAgeGroup: Record<string, number> = {};
      let total = 0;

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

        byAgeGroup[ageGroup] = (byAgeGroup[ageGroup] || 0) + 1;
        total++;
      });

      return {
        total,
        byAgeGroup,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get student stats: ${error.message}`);
    }
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
}
