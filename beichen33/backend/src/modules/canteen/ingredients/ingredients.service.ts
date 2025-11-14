import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = search
      ? { name: { contains: search }, deletedAt: null }
      : { deletedAt: null };

    const [data, total] = await Promise.all([
      this.prisma.ingredient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.ingredient.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    return this.prisma.ingredient.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.ingredient.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.ingredient.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.ingredient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
