import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class GrowthRecordsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const { studentId, type, startDate, endDate, tags, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (studentId) where.studentId = studentId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) where.recordedAt.gte = new Date(startDate);
      if (endDate) where.recordedAt.lte = new Date(endDate);
    }
    if (tags?.length) where.tags = { hasSome: tags };

    const [data, total] = await Promise.all([
      this.prisma.growthRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: { select: { id: true, name: true, avatar: true } },
          teacher: { select: { id: true, name: true } },
        },
        orderBy: { recordedAt: 'desc' },
      }),
      this.prisma.growthRecord.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findTimeline(studentId: string) {
    const records = await this.prisma.growthRecord.findMany({
      where: { studentId, deletedAt: null },
      include: { teacher: { select: { name: true } } },
      orderBy: { recordedAt: 'desc' },
    });

    const healthRecords = records
      .filter(r => r.type === 'HEALTH' && r.height && r.weight)
      .map(r => ({ date: r.recordedAt, height: r.height, weight: r.weight }));

    const tagCounts = records.reduce((acc, r) => {
      r.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      records,
      healthTrend: healthRecords,
      tags: Object.entries(tagCounts).map(([tag, count]) => ({ tag, count })),
    };
  }

  async create(data: any, userId: string) {
    return this.prisma.growthRecord.create({
      data: {
        ...data,
        student: { connect: { id: data.studentId } },
        teacher: { connect: { id: userId } },
      },
      include: { student: true, teacher: true },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.growthRecord.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.growthRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
