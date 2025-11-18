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
