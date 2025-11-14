import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.class.findMany({
      where: { deletedAt: null },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.class.findUnique({
      where: { id },
      include: {
        teacher: true,
        students: { where: { deletedAt: null }, orderBy: { name: 'asc' } },
      },
    });
  }

  async create(data: any) {
    return this.prisma.class.create({
      data: {
        ...data,
        teacher: { connect: { id: data.teacherId } },
      },
      include: { teacher: true },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.class.update({
      where: { id },
      data,
      include: { teacher: true },
    });
  }

  async remove(id: string) {
    return this.prisma.class.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
