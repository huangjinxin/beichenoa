import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class DutyReportService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建值班播报记录
   */
  async create(dto: any, userId: string) {
    // 如果提供了 dutyLeaderId，获取教师姓名
    let dutyLeaderName = dto.dutyLeader || '值班领导';
    if (dto.dutyLeaderId) {
      const leader = await this.prisma.user.findUnique({
        where: { id: dto.dutyLeaderId },
        select: { name: true },
      });
      if (leader) {
        dutyLeaderName = leader.name;
      }
    }

    return this.prisma.dutyReport.create({
      data: {
        date: new Date(dto.date),
        weather: dto.weather,
        dutyLeader: dutyLeaderName,
        campus: dto.campusId ? { connect: { id: dto.campusId } } : undefined,
        dutyLeaderUser: dto.dutyLeaderId ? { connect: { id: dto.dutyLeaderId } } : undefined,
        attendance: dto.attendance || null,
        entryExit: dto.entryExit || null,
        learningActivity: dto.learningActivity || null,
        areaActivity: dto.areaActivity || null,
        outdoorActivity: dto.outdoorActivity || null,
        lifeActivity: dto.lifeActivity || null,
        notice: dto.notice || null,
        safety: dto.safety || null,
        other: dto.other || null,
      },
      include: {
        campus: {
          select: {
            id: true,
            name: true,
          },
        },
        dutyLeaderUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * 查询值班播报记录列表
   */
  async findAll(query: any) {
    const { page = 1, pageSize = 10, startDate, endDate, campusId } = query;

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

    if (campusId) {
      where.campusId = campusId;
    }

    const [records, total] = await Promise.all([
      this.prisma.dutyReport.findMany({
        where,
        include: {
          campus: {
            select: {
              id: true,
              name: true,
            },
          },
          dutyLeaderUser: {
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
      this.prisma.dutyReport.count({ where }),
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
    return this.prisma.dutyReport.findUnique({
      where: { id },
      include: {
        campus: {
          select: {
            id: true,
            name: true,
          },
        },
        dutyLeaderUser: {
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
    // 如果提供了 dutyLeaderId，获取教师姓名
    let dutyLeaderName = dto.dutyLeader;
    if (dto.dutyLeaderId) {
      const leader = await this.prisma.user.findUnique({
        where: { id: dto.dutyLeaderId },
        select: { name: true },
      });
      if (leader) {
        dutyLeaderName = leader.name;
      }
    }

    const updateData: any = {
      date: dto.date ? new Date(dto.date) : undefined,
      weather: dto.weather,
      dutyLeader: dutyLeaderName,
      attendance: dto.attendance,
      entryExit: dto.entryExit,
      learningActivity: dto.learningActivity,
      areaActivity: dto.areaActivity,
      outdoorActivity: dto.outdoorActivity,
      lifeActivity: dto.lifeActivity,
      notice: dto.notice,
      safety: dto.safety,
      other: dto.other,
    };

    // 处理关系字段
    if (dto.campusId) {
      updateData.campus = { connect: { id: dto.campusId } };
    }
    if (dto.dutyLeaderId) {
      updateData.dutyLeaderUser = { connect: { id: dto.dutyLeaderId } };
    }

    return this.prisma.dutyReport.update({
      where: { id },
      data: updateData,
      include: {
        campus: {
          select: {
            id: true,
            name: true,
          },
        },
        dutyLeaderUser: {
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
    return this.prisma.dutyReport.delete({
      where: { id },
    });
  }
}
