import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class DailyObservationService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建每日观察记录
   */
  async create(dto: any, userId: string) {
    return this.prisma.dailyObservation.create({
      data: {
        ...dto,
        date: new Date(dto.date),
        teacherId: userId, // 使用当前登录用户作为教师
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
          },
        },
        campus: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * 查询每日观察记录列表
   */
  async findAll(query: any) {
    const { page = 1, pageSize = 10, startDate, endDate, classId, teacherId, campusId } = query;

    const where: any = {};

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.date = { gte: new Date(startDate) };
    } else if (endDate) {
      where.date = { lte: new Date(endDate) };
    }

    if (classId) {
      where.classId = classId;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (campusId) {
      where.campusId = campusId;
    }

    const [records, total] = await Promise.all([
      this.prisma.dailyObservation.findMany({
        where,
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
              grade: true,
            },
          },
          campus: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      }),
      this.prisma.dailyObservation.count({ where }),
    ]);

    return {
      data: records,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  }

  /**
   * 获取单条记录详情
   */
  async findOne(id: string) {
    return this.prisma.dailyObservation.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
          },
        },
        campus: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * 更新记录
   */
  async update(id: string, dto: any) {
    return this.prisma.dailyObservation.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
          },
        },
        campus: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * 删除记录
   */
  async remove(id: string) {
    return this.prisma.dailyObservation.delete({
      where: { id },
    });
  }
}
