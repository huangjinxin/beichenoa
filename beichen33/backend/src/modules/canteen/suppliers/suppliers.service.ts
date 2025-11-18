import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 供应商类别列表
   */
  private readonly categories = [
    '粮油',
    '猪肉',
    '牛肉',
    '蔬菜',
    '调料（干货）',
    '面条',
    '鸡蛋',
    '鸡肉',
    '水果',
    '糕点',
    '牛奶',
    '海鲜',
    '其他',
  ];

  /**
   * 获取所有供应商类别
   */
  getCategories() {
    return this.categories;
  }

  /**
   * 获取所有供应商
   */
  async findAll(query: any) {
    const { page = 1, pageSize = 10, category, isActive } = query;

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }

    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      data: suppliers,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  }

  /**
   * 获取单个供应商
   */
  async findOne(id: string) {
    return this.prisma.supplier.findUnique({
      where: { id },
    });
  }

  /**
   * 创建供应商
   */
  async create(dto: any) {
    return this.prisma.supplier.create({
      data: dto,
    });
  }

  /**
   * 更新供应商
   */
  async update(id: string, dto: any) {
    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * 删除供应商
   */
  async remove(id: string) {
    return this.prisma.supplier.delete({
      where: { id },
    });
  }
}
