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
        classes: {
          select: {
            id: true,
            name: true,
            grade: true,
          },
        },
        parentProfile: {
          select: {
            id: true,
            students: {
              select: {
                student: {
                  select: {
                    id: true,
                    name: true,
                    class: {
                      select: { id: true, name: true },
                    },
                  },
                },
              },
            },
          },
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

    const { classIds, studentIds, ...userData } = data;

    const user = await this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        classes: classIds ? { connect: classIds.map((id: string) => ({ id })) } : undefined,
      },
      include: {
        campus: { select: { id: true, name: true } },
        position: { select: { id: true, name: true, type: true, level: true } },
        classes: { select: { id: true, name: true, grade: true } },
      },
    });

    if (data.role === 'PARENT' && studentIds && studentIds.length > 0) {
      const parent = await this.prisma.parent.create({
        data: {
          name: data.name,
          phone: data.phone || '',
          email: data.email,
          relation: '家长',
          userId: user.id,
          students: {
            create: studentIds.map((studentId: string, index: number) => ({
              studentId,
              isPrimary: index === 0,
            })),
          },
        },
      });
    }

    return user;
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
        campusId: true,
        campus: {
          select: { id: true, name: true },
        },
        position: {
          select: { id: true, name: true, type: true, level: true },
        },
        classes: {
          select: {
            id: true,
            name: true,
            grade: true,
          },
        },
        parentProfile: {
          select: {
            id: true,
            students: {
              select: {
                student: {
                  select: {
                    id: true,
                    name: true,
                    gender: true,
                    birthday: true,
                    class: {
                      select: { id: true, name: true },
                    },
                  },
                },
                isPrimary: true,
              },
            },
          },
        },
        createdAt: true,
      },
    });
  }

  async update(id: string, data: any) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const { classIds, studentIds, ...userData } = data;

    const updateData: any = { ...userData };

    if (classIds !== undefined) {
      updateData.classes = {
        set: classIds.map((classId: string) => ({ id: classId })),
      };
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        campus: { select: { id: true, name: true } },
        position: { select: { id: true, name: true, type: true, level: true } },
        classes: { select: { id: true, name: true, grade: true } },
        parentProfile: true,
      },
    });

    if (data.role === 'PARENT' && studentIds !== undefined) {
      if (user.parentProfile) {
        await this.prisma.studentParent.deleteMany({
          where: { parentId: user.parentProfile.id },
        });

        if (studentIds.length > 0) {
          await this.prisma.studentParent.createMany({
            data: studentIds.map((studentId: string, index: number) => ({
              parentId: user.parentProfile.id,
              studentId,
              isPrimary: index === 0,
            })),
          });
        }
      } else if (studentIds.length > 0) {
        await this.prisma.parent.create({
          data: {
            name: user.name,
            phone: user.phone || '',
            email: user.email,
            relation: '家长',
            userId: user.id,
            students: {
              create: studentIds.map((studentId: string, index: number) => ({
                studentId,
                isPrimary: index === 0,
              })),
            },
          },
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
