import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [studentCount, classCount, teacherCount] = await Promise.all([
      this.prisma.student.count({ where: { deletedAt: null } }),
      this.prisma.class.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { role: 'TEACHER', deletedAt: null } }),
    ]);

    return { studentCount, classCount, teacherCount };
  }

  async getStudentStats(classId?: string) {
    const where = classId ? { classId, deletedAt: null } : { deletedAt: null };

    const students = await this.prisma.student.findMany({
      where,
      include: {
        class: true,
        growthRecords: {
          where: { type: 'HEALTH', height: { not: null }, weight: { not: null } },
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });

    return students.map((s) => ({
      id: s.id,
      name: s.name,
      class: s.class.name,
      age: Math.floor((Date.now() - new Date(s.birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
      latestHeight: s.growthRecords[0]?.height,
      latestWeight: s.growthRecords[0]?.weight,
    }));
  }
}
