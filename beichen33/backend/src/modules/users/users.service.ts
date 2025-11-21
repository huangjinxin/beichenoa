import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: string) {
    const where = role ? { role: role as any, deletedAt: null } : { deletedAt: null };
    const data = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        idCard: true,
        role: true,
        avatar: true,
        isActive: true,
        gender: true,
        birthday: true,
        hireDate: true,
        resignationDate: true,
        employmentStatus: true,
        campusId: true,
        approvalStatus: true,
        approvalNote: true,
        approvedAt: true,
        campus: {
          select: { id: true, name: true },
        },
        position: {
          select: { id: true, name: true, type: true, level: true },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data, total: data.length };
  }

  /**
   * 获取待审核用户列表
   */
  async findPendingUsers() {
    const data = await this.prisma.user.findMany({
      where: {
        approvalStatus: 'PENDING',
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        idCard: true,
        gender: true,
        birthday: true,
        approvalStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data, total: data.length };
  }

  /**
   * 获取用户统计数据
   */
  async getStatistics() {
    const [total, pending, approved, rejected, teachers, parents, admins] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { approvalStatus: 'PENDING', deletedAt: null } }),
      this.prisma.user.count({ where: { approvalStatus: 'APPROVED', deletedAt: null } }),
      this.prisma.user.count({ where: { approvalStatus: 'REJECTED', deletedAt: null } }),
      this.prisma.user.count({ where: { role: 'TEACHER', deletedAt: null } }),
      this.prisma.user.count({ where: { role: 'PARENT', deletedAt: null } }),
      this.prisma.user.count({ where: { role: 'ADMIN', deletedAt: null } }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      byRole: {
        teacher: teachers,
        parent: parents,
        admin: admins,
      },
    };
  }

  /**
   * 审核通过用户
   */
  async approveUser(id: string, data: { role: string; campusId: string; adminId: string; note?: string }) {
    return this.prisma.user.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        role: data.role as any,
        campusId: data.campusId,
        approvedBy: data.adminId,
        approvedAt: new Date(),
        approvalNote: data.note,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approvalStatus: true,
        campus: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * 拒绝用户注册
   */
  async rejectUser(id: string, data: { adminId: string; note: string }) {
    return this.prisma.user.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        approvedBy: data.adminId,
        approvedAt: new Date(),
        approvalNote: data.note,
      },
      select: {
        id: true,
        email: true,
        name: true,
        approvalStatus: true,
        approvalNote: true,
      },
    });
  }

  async create(data: any) {
    const password = data.password || '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        idCard: true,
        role: true,
        avatar: true,
        isActive: true,
        gender: true,
        birthday: true,
        hireDate: true,
        resignationDate: true,
        employmentStatus: true,
        campus: {
          select: { id: true, name: true },
        },
        position: {
          select: { id: true, name: true, type: true, level: true },
        },
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        idCard: true,
        role: true,
        avatar: true,
        isActive: true,
        gender: true,
        birthday: true,
        hireDate: true,
        resignationDate: true,
        employmentStatus: true,
        campus: {
          select: { id: true, name: true },
        },
        position: {
          select: { id: true, name: true, type: true, level: true },
        },
        createdAt: true,
      },
    });
  }

  async update(id: string, data: any) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        idCard: true,
        role: true,
        avatar: true,
        isActive: true,
        gender: true,
        birthday: true,
        hireDate: true,
        resignationDate: true,
        employmentStatus: true,
        campus: {
          select: { id: true, name: true },
        },
        position: {
          select: { id: true, name: true, type: true, level: true },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
