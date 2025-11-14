import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(classId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = classId ? { classId, deletedAt: null } : { deletedAt: null };

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: { class: true, parents: { include: { parent: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.student.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    return this.prisma.student.findUnique({
      where: { id },
      include: {
        class: { include: { teacher: true } },
        parents: { include: { parent: true } },
        growthRecords: { orderBy: { recordedAt: 'desc' }, take: 10 },
      },
    });
  }

  async create(data: any) {
    return this.prisma.student.create({
      data: {
        ...data,
        class: { connect: { id: data.classId } },
      },
      include: { class: true },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.student.update({
      where: { id },
      data,
      include: { class: true },
    });
  }

  async remove(id: string) {
    return this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
