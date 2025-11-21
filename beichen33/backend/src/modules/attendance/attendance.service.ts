import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // 创建考勤记录（教师批量点名）
  async createAttendanceRecord(data: {
    date: Date;
    classId: string;
    createdBy: string;
    attendances: Array<{
      studentId: string;
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
      note?: string;
    }>;
  }) {
    const { date, classId, createdBy, attendances } = data;

    // 创建考勤记录批次
    const record = await this.prisma.attendanceRecord.create({
      data: {
        date,
        classId,
        createdBy,
        attendances: {
          create: attendances.map((att) => ({
            studentId: att.studentId,
            status: att.status,
            note: att.note,
            createdBy,
          })),
        },
      },
      include: {
        attendances: {
          include: {
            creator: { select: { id: true, name: true } },
          },
        },
        creator: { select: { id: true, name: true } },
      },
    });

    return record;
  }

  // 查询班级某日考勤记录
  async getAttendanceByClassAndDate(classId: string, date: Date) {
    const record = await this.prisma.attendanceRecord.findFirst({
      where: {
        classId,
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
      include: {
        attendances: true,
        creator: { select: { id: true, name: true } },
      },
    });

    return record;
  }

  // 查询教师的班级考勤记录列表
  async getAttendanceRecords(params: {
    teacherId?: string;
    classId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { teacherId, classId, startDate, endDate, page = 1, limit = 20 } = params;

    const where: any = {};

    if (classId) {
      where.classId = classId;
    }

    if (teacherId) {
      where.createdBy = teacherId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [records, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where,
        include: {
          attendances: true,
          creator: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    return {
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 查询学生考勤历史
  async getStudentAttendanceHistory(studentId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      studentId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const attendances = await this.prisma.attendance.findMany({
      where,
      include: {
        record: true,
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return attendances;
  }

  // 更新单个学生考勤状态
  async updateAttendance(attendanceId: string, status: string, note?: string) {
    return this.prisma.attendance.update({
      where: { id: attendanceId },
      data: { status: status as any, note },
    });
  }
}
