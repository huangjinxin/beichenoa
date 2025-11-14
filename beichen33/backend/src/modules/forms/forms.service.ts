import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class FormsService {
  constructor(private prisma: PrismaService) {}

  async findAllTemplates() {
    return this.prisma.formTemplate.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTemplate(id: string) {
    return this.prisma.formTemplate.findUnique({ where: { id } });
  }

  async createTemplate(data: any) {
    return this.prisma.formTemplate.create({
      data: {
        ...data,
        // 如果没有提供fields，使用空数组作为默认值
        fields: data.fields || [],
      },
    });
  }

  async findAllSubmissions(query: any) {
    const { templateId, submittedBy, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (templateId) where.templateId = templateId;
    if (submittedBy) where.submittedBy = submittedBy;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.formSubmission.findMany({
        where,
        skip,
        take: limit,
        include: {
          template: { select: { title: true } },
          user: { select: { name: true, email: true } },
          approvals: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.formSubmission.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async createSubmission(data: any, userId: string) {
    return this.prisma.formSubmission.create({
      data: {
        ...data,
        template: { connect: { id: data.templateId } },
        user: { connect: { id: userId } },
      },
      include: { template: true },
    });
  }

  async updateSubmission(id: string, data: any) {
    return this.prisma.formSubmission.update({
      where: { id },
      data,
    });
  }
}
