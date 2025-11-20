import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

@Injectable()
export class PositionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.position.findMany({
      where: { deletedAt: null },
      include: {
        parent: true,
        children: {
          where: { deletedAt: null },
          include: {
            _count: {
              select: { users: true },
            },
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });
  }

  async findHierarchy() {
    const positions = await this.prisma.position.findMany({
      where: { deletedAt: null },
      include: {
        children: {
          where: { deletedAt: null },
          include: {
            children: {
              where: { deletedAt: null },
              include: {
                children: {
                  where: { deletedAt: null },
                  include: {
                    children: {
                      where: { deletedAt: null },
                      include: {
                        _count: { select: { users: true } },
                      },
                    },
                    _count: { select: { users: true } },
                  },
                },
                _count: { select: { users: true } },
              },
            },
            _count: { select: { users: true } },
          },
        },
        _count: { select: { users: true } },
      },
      orderBy: { level: 'asc' },
    });

    return positions.filter(p => !p.parentId);
  }

  async findOne(id: string) {
    return this.prisma.position.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          where: { deletedAt: null },
        },
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            employmentStatus: true,
            campus: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  async create(dto: CreatePositionDto) {
    try {
      // 检查是否存在同名+同类型+同级别的职位（防止重复添加）
      const existing = await this.prisma.position.findFirst({
        where: {
          name: dto.name,
          type: dto.type,
          level: Number(dto.level),
          deletedAt: null,
        },
      });

      if (existing) {
        throw new BadRequestException(`职位"${dto.name}"已存在，请勿重复添加`);
      }

      const data = {
        name: dto.name,
        type: dto.type,
        level: Number(dto.level),
        parentId: dto.parentId || null,
        description: dto.description || null,
      };

      return await this.prisma.position.create({
        data,
        include: {
          parent: true,
          _count: { select: { users: true } },
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create position: ${error.message}`);
    }
  }

  async update(id: string, dto: UpdatePositionDto) {
    try {
      const data: any = {};
      if (dto.name !== undefined) data.name = dto.name;
      if (dto.type !== undefined) data.type = dto.type;
      if (dto.level !== undefined) data.level = Number(dto.level);
      if (dto.parentId !== undefined) data.parentId = dto.parentId || null;
      if (dto.description !== undefined) data.description = dto.description || null;

      return await this.prisma.position.update({
        where: { id },
        data,
        include: {
          parent: true,
          _count: { select: { users: true } },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to update position: ${error.message}`);
    }
  }

  async remove(id: string) {
    return this.prisma.position.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
