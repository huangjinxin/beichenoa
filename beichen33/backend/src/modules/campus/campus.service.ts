import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CampusService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.campus.findMany({
        where: { deletedAt: null },
        include: {
          principal: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              position: {
                select: { id: true, name: true },
              },
            },
          },
          _count: {
            select: {
              users: true,
              students: true,
              classes: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      throw new BadRequestException('Failed to fetch campus list');
    }
  }

  async findOne(id: string) {
    try {
      const campus = await this.prisma.campus.findUnique({
        where: { id },
        include: {
          principal: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              position: {
                select: { id: true, name: true },
              },
            },
          },
          users: {
            where: { deletedAt: null },
            select: { id: true, name: true, email: true, role: true },
          },
          students: {
            where: { deletedAt: null },
            select: { id: true, name: true },
          },
          classes: {
            where: { deletedAt: null },
            select: { id: true, name: true, grade: true },
          },
        },
      });

      if (!campus) {
        throw new NotFoundException('Campus not found');
      }

      return campus;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch campus');
    }
  }

  async create(data: any) {
    try {
      return await this.prisma.campus.create({
        data,
        include: {
          principal: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: {
              users: true,
              students: true,
              classes: true,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to create campus: ${error.message}`);
    }
  }

  async update(id: string, data: any) {
    try {
      return await this.prisma.campus.update({
        where: { id },
        data,
        include: {
          principal: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: {
              users: true,
              students: true,
              classes: true,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to update campus: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.campus.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to delete campus: ${error.message}`);
    }
  }
}
