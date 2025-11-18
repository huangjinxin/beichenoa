import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.class.findMany({
        where: { deletedAt: null },
        include: {
          teachers: { select: { id: true, name: true, email: true } },
          campus: { select: { id: true, name: true } },
          _count: { select: { students: true } },
        },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      throw new BadRequestException('Failed to fetch classes');
    }
  }

  async findOne(id: string) {
    try {
      const classData = await this.prisma.class.findUnique({
        where: { id },
        include: {
          teachers: true,
          campus: { select: { id: true, name: true } },
          students: { where: { deletedAt: null }, orderBy: { name: 'asc' } },
        },
      });

      if (!classData) {
        throw new NotFoundException('Class not found');
      }

      return classData;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch class');
    }
  }

  async create(data: any) {
    try {
      const { teacherIds, campusId, ...classData } = data;
      return await this.prisma.class.create({
        data: {
          ...classData,
          teachers: teacherIds && teacherIds.length > 0
            ? { connect: teacherIds.map((id: string) => ({ id })) }
            : undefined,
          campus: campusId ? { connect: { id: campusId } } : undefined,
        },
        include: {
          teachers: true,
          campus: { select: { id: true, name: true } },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to create class: ${error.message}`);
    }
  }

  async update(id: string, data: any) {
    try {
      const { teacherIds, campusId, ...classData } = data;
      const updateData: any = { ...classData };

      if (teacherIds !== undefined) {
        // 先断开所有现有教师，然后连接新的教师
        updateData.teachers = {
          set: [], // 清空现有关联
          connect: teacherIds && teacherIds.length > 0
            ? teacherIds.map((id: string) => ({ id }))
            : []
        };
      }

      if (campusId) {
        updateData.campus = { connect: { id: campusId } };
      }

      return await this.prisma.class.update({
        where: { id },
        data: updateData,
        include: {
          teachers: true,
          campus: { select: { id: true, name: true } },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to update class: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.class.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to delete class: ${error.message}`);
    }
  }
}
