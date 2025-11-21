import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  // 创建公告
  async create(data: {
    title: string;
    content: string;
    type?: string;
    priority?: number;
    campusId?: string;
    classIds?: string[];
    publishedAt?: Date;
    expiredAt?: Date;
  }) {
    return this.prisma.announcement.create({
      data: {
        ...data,
        isActive: true,
      },
    });
  }

  // 查询公告列表（支持角色过滤）
  async findAll(params: {
    campusId?: string;
    classId?: string;
    type?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { campusId, classId, type, isActive = true, page = 1, limit = 20 } = params;

    const where: any = {
      isActive,
      publishedAt: { lte: new Date() },
      OR: [{ expiredAt: null }, { expiredAt: { gte: new Date() } }],
    };

    if (type) {
      where.type = type;
    }

    // 校区过滤
    if (campusId) {
      where.OR = [{ campusId: campusId }, { campusId: null }];
    }

    // 班级过滤：如果指定了班级ID，只返回全校公告或包含该班级的公告
    if (classId) {
      where.OR = [
        { classIds: { isEmpty: true } }, // 全校公告
        { classIds: { has: classId } }, // 包含该班级
      ];
    }

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      announcements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 根据用户角色获取公告（教师/家长端专用）
  async findByUser(userId: string, role: string) {
    // 获取用户信息
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        campus: true,
        classes: true,
      },
    });

    if (!user) {
      return { announcements: [], total: 0 };
    }

    const where: any = {
      isActive: true,
      publishedAt: { lte: new Date() },
      OR: [{ expiredAt: null }, { expiredAt: { gte: new Date() } }],
    };

    // 校区过滤
    if (user.campusId) {
      where.AND = [
        {
          OR: [{ campusId: user.campusId }, { campusId: null }],
        },
      ];
    }

    // 教师：返回所带班级的公告
    if (role === 'TEACHER' && user.classes && user.classes.length > 0) {
      const classIds = user.classes.map((c) => c.id);
      where.AND.push({
        OR: [
          { classIds: { isEmpty: true } }, // 全校公告
          { classIds: { hasSome: classIds } }, // 包含任一班级
        ],
      });
    }

    const announcements = await this.prisma.announcement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
      take: 50,
    });

    return { announcements, total: announcements.length };
  }

  // 获取单个公告详情
  async findOne(id: string) {
    return this.prisma.announcement.findUnique({
      where: { id },
    });
  }

  // 更新公告
  async update(id: string, data: any) {
    return this.prisma.announcement.update({
      where: { id },
      data,
    });
  }

  // 删除公告（软删除）
  async remove(id: string) {
    return this.prisma.announcement.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
