import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ENTITY_SCHEMAS, getEntityDefaults, getUniqueFields } from './entity-schemas';

@Injectable()
export class EntityBindingService {
  constructor(private prisma: PrismaService) {}

  // ================================
  // 实体搜索接口
  // ================================

  /**
   * 统一实体搜索
   */
  async searchEntities(params: {
    entityType: string;
    keyword?: string;
    filters?: Record<string, any>;
    campusId?: string;
    page?: number;
    limit?: number;
  }) {
    const { entityType, keyword, filters, campusId, page = 1, limit = 20 } = params;

    switch (entityType) {
      case 'student':
        return this.searchStudents(keyword, filters, campusId, page, limit);
      case 'user':
      case 'teacher':
        return this.searchTeachers(keyword, filters, campusId, page, limit);
      case 'class':
        return this.searchClasses(keyword, filters, campusId, page, limit);
      case 'campus':
        return this.searchCampuses(keyword, page, limit);
      case 'position':
        return this.searchPositions(keyword, page, limit);
      default:
        throw new BadRequestException(`不支持的实体类型: ${entityType}`);
    }
  }

  /**
   * 搜索学生
   */
  async searchStudents(
    keyword?: string,
    filters?: Record<string, any>,
    campusId?: string,
    page = 1,
    limit = 20
  ) {
    const where: any = {
      deletedAt: null,
    };

    if (campusId) {
      where.campusId = campusId;
    }

    if (filters?.classId) {
      where.classId = filters.classId;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { idCard: { contains: keyword } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          class: { select: { id: true, name: true, grade: true } },
          campus: { select: { id: true, name: true } },
          parents: {
            include: {
              parent: { select: { id: true, name: true, phone: true, relation: true } },
            },
            where: { isPrimary: true },
            take: 1,
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data: data.map(student => ({
        id: student.id,
        label: `${student.name}${student.class ? ` (${student.class.name})` : ''}`,
        value: student.id,
        extra: {
          name: student.name,
          idCard: student.idCard,
          gender: student.gender,
          birthday: student.birthday,
          enrollDate: student.enrollDate,
          address: student.address,
          allergies: student.allergies,
          ageGroup: student.ageGroup,
          classId: student.classId,
          className: student.class?.name,
          classGrade: student.class?.grade,
          campusId: student.campusId,
          campusName: student.campus?.name,
          primaryParent: student.parents[0]?.parent,
        },
      })),
      total,
    };
  }

  /**
   * 搜索教师
   */
  async searchTeachers(
    keyword?: string,
    filters?: Record<string, any>,
    campusId?: string,
    page = 1,
    limit = 20
  ) {
    const where: any = {
      deletedAt: null,
      role: 'TEACHER',
      isActive: true,
    };

    if (campusId) {
      where.campusId = campusId;
    }

    if (filters?.positionType) {
      where.position = { type: filters.positionType };
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { phone: { contains: keyword } },
        { idCard: { contains: keyword } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          position: { select: { id: true, name: true, type: true } },
          campus: { select: { id: true, name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map(user => ({
        id: user.id,
        label: `${user.name}${user.position ? ` (${user.position.name})` : ''}`,
        value: user.id,
        extra: {
          name: user.name,
          phone: user.phone,
          email: user.email,
          idCard: user.idCard,
          gender: user.gender,
          positionId: user.positionId,
          positionName: user.position?.name,
          positionType: user.position?.type,
          campusId: user.campusId,
          campusName: user.campus?.name,
        },
      })),
      total,
    };
  }

  /**
   * 搜索班级
   */
  async searchClasses(
    keyword?: string,
    filters?: Record<string, any>,
    campusId?: string,
    page = 1,
    limit = 50
  ) {
    const where: any = {
      deletedAt: null,
    };

    if (campusId) {
      where.campusId = campusId;
    }

    if (filters?.grade) {
      where.grade = filters.grade;
    }

    if (keyword) {
      where.name = { contains: keyword, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        include: {
          campus: { select: { id: true, name: true } },
          teachers: { select: { id: true, name: true } },
          _count: { select: { students: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.class.count({ where }),
    ]);

    return {
      data: data.map(cls => ({
        id: cls.id,
        label: `${cls.name} (${cls.grade})`,
        value: cls.id,
        extra: {
          name: cls.name,
          grade: cls.grade,
          capacity: cls.capacity,
          studentCount: cls._count.students,
          availableSlots: cls.capacity - cls._count.students,
          campusId: cls.campusId,
          campusName: cls.campus?.name,
          teacherNames: cls.teachers.map(t => t.name).join('、'),
        },
      })),
      total,
    };
  }

  /**
   * 搜索园区
   */
  async searchCampuses(keyword?: string, page = 1, limit = 20) {
    const where: any = {
      deletedAt: null,
    };

    if (keyword) {
      where.name = { contains: keyword, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.campus.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.campus.count({ where }),
    ]);

    return {
      data: data.map(campus => ({
        id: campus.id,
        label: campus.name,
        value: campus.id,
        extra: {
          name: campus.name,
          address: campus.address,
          phone: campus.phone,
        },
      })),
      total,
    };
  }

  /**
   * 搜索职位
   */
  async searchPositions(keyword?: string, page = 1, limit = 50) {
    const where: any = {
      deletedAt: null,
    };

    if (keyword) {
      where.name = { contains: keyword, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.position.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ level: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.position.count({ where }),
    ]);

    return {
      data: data.map(pos => ({
        id: pos.id,
        label: pos.name,
        value: pos.id,
        extra: {
          name: pos.name,
          type: pos.type,
          level: pos.level,
        },
      })),
      total,
    };
  }

  // ================================
  // 唯一性校验接口
  // ================================

  /**
   * 唯一性校验
   */
  async validateUnique(params: {
    entityType: string;
    field: string;
    value: string;
    excludeId?: string;
    campusId?: string;
  }) {
    const { entityType, field, value, excludeId, campusId } = params;

    if (!value) {
      return { isUnique: true };
    }

    let existingEntity = null;

    switch (entityType) {
      case 'student':
        existingEntity = await this.prisma.student.findFirst({
          where: {
            [field]: value,
            deletedAt: null,
            ...(excludeId && { id: { not: excludeId } }),
            ...(campusId && { campusId }),
          },
          include: {
            class: { select: { name: true } },
          },
        });
        break;

      case 'user':
      case 'teacher':
        existingEntity = await this.prisma.user.findFirst({
          where: {
            [field]: value,
            deletedAt: null,
            ...(excludeId && { id: { not: excludeId } }),
            ...(campusId && { campusId }),
          },
          include: {
            position: { select: { name: true } },
          },
        });
        break;

      case 'parent':
        existingEntity = await this.prisma.parent.findFirst({
          where: {
            [field]: value,
            deletedAt: null,
            ...(excludeId && { id: { not: excludeId } }),
          },
        });
        break;

      default:
        throw new BadRequestException(`不支持的实体类型: ${entityType}`);
    }

    if (existingEntity) {
      return {
        isUnique: false,
        existingEntity: {
          ...existingEntity,
        },
        suggestion: this.getSuggestion(entityType, field, existingEntity),
      };
    }

    return { isUnique: true };
  }

  private getSuggestion(entityType: string, field: string, entity: any): string {
    const fieldLabels: Record<string, string> = {
      idCard: '身份证号',
      phone: '手机号',
      email: '邮箱',
    };

    const entityLabels: Record<string, string> = {
      student: '学生',
      user: '教师',
      teacher: '教师',
      parent: '家长',
    };

    return `该${fieldLabels[field] || field}已被${entityLabels[entityType] || ''}「${entity.name}」使用`;
  }

  /**
   * 批量校验
   */
  async validateBatch(params: {
    templateId: string;
    data: Record<string, any>[];
    campusId?: string;
  }) {
    const { templateId, data, campusId } = params;

    // 获取模板的实体绑定配置
    const template = await this.prisma.formTemplate.findUnique({
      where: { id: templateId },
      include: { entityBindings: true },
    });

    if (!template) {
      throw new NotFoundException('表单模板不存在');
    }

    const results = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const errors: { field: string; message: string }[] = [];
      const warnings: { field: string; message: string }[] = [];
      const linkedEntities: { field: string; entityType: string; entityId: string }[] = [];

      // 检查每个实体绑定的唯一性字段
      for (const binding of template.entityBindings) {
        const uniqueFields = binding.uniqueFields as any[];
        if (!uniqueFields) continue;

        for (const uniqueField of uniqueFields) {
          const value = item[uniqueField.formField];
          if (!value) continue;

          const result = await this.validateUnique({
            entityType: binding.entityType,
            field: uniqueField.entityField,
            value,
            campusId,
          });

          if (!result.isUnique && result.existingEntity) {
            warnings.push({
              field: uniqueField.formField,
              message: uniqueField.errorMessage || result.suggestion,
            });
            linkedEntities.push({
              field: uniqueField.formField,
              entityType: binding.entityType,
              entityId: result.existingEntity.id,
            });
          }
        }
      }

      results.push({
        index: i,
        isValid: errors.length === 0,
        errors,
        warnings,
        linkedEntities,
      });
    }

    return { results };
  }

  // ================================
  // 数据同步执行
  // ================================

  /**
   * 执行数据同步到各模块
   */
  async syncEntitiesToModules(submissionId: string) {
    const submission = await this.prisma.formSubmission.findUnique({
      where: { id: submissionId },
      include: {
        template: {
          include: { entityBindings: { where: { isActive: true } } },
        },
        user: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('表单提交不存在');
    }

    const results = [];

    for (const binding of submission.template.entityBindings) {
      try {
        const result = await this.executeSyncForBinding(submission, binding);
        results.push(result);
      } catch (error) {
        results.push({
          entityType: binding.entityType,
          action: binding.actionType,
          entityId: null,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return { success: results.every(r => r.status === 'success'), results };
  }

  private async executeSyncForBinding(submission: any, binding: any) {
    const { entityType, actionType, fieldMappings, uniqueFields, defaultValues } = binding;
    const formData = submission.data as Record<string, any>;

    // 1. 从表单数据提取实体数据
    const entityData = this.extractEntityData(formData, fieldMappings as any[]);

    // 2. 应用默认值
    if (defaultValues) {
      Object.assign(entityData, defaultValues);
    }

    // 3. 添加园区ID
    if (!entityData.campusId && submission.user?.campusId) {
      entityData.campusId = submission.user.campusId;
    }

    // 4. 查找已存在的实体
    let existingEntity = null;
    if (uniqueFields) {
      existingEntity = await this.findExistingEntity(entityType, uniqueFields as any[], formData);
    }

    // 5. 根据操作类型执行
    let result;
    let previousData = null;

    switch (actionType) {
      case 'create':
        if (existingEntity) {
          // 已存在，关联而不是创建新的
          result = { id: existingEntity.id, action: 'linked' };
          previousData = existingEntity;
        } else {
          const newEntity = await this.createEntity(entityType, entityData);
          result = { id: newEntity.id, action: 'created' };
        }
        break;

      case 'update':
        const entityId = formData[`${entityType}Id`] || formData.studentId || formData.userId;
        if (!entityId) {
          throw new BadRequestException(`缺少${entityType}Id`);
        }
        previousData = await this.getEntity(entityType, entityId);
        const updatedEntity = await this.updateEntity(entityType, entityId, entityData);
        result = { id: updatedEntity.id, action: 'updated' };
        break;

      case 'link':
        const linkEntityId = formData[`${entityType}Id`] || formData.studentId || formData.userId;
        result = { id: linkEntityId, action: 'linked' };
        break;

      default:
        throw new BadRequestException(`不支持的操作类型: ${actionType}`);
    }

    // 6. 记录关联
    await this.prisma.formEntityLink.create({
      data: {
        submissionId: submission.id,
        entityType,
        entityId: result.id,
        actionType: result.action,
        previousData: previousData as any,
        newData: entityData as any,
      },
    });

    return {
      entityType,
      action: result.action,
      entityId: result.id,
      status: 'success',
    };
  }

  private extractEntityData(formData: Record<string, any>, fieldMappings: any[]) {
    const entityData: Record<string, any> = {};

    for (const mapping of fieldMappings) {
      const { formField, entityField, condition } = mapping;

      // 检查条件
      if (condition) {
        try {
          const conditionMet = new Function('data', `return ${condition}`)(formData);
          if (!conditionMet) continue;
        } catch {
          continue;
        }
      }

      const value = formData[formField];
      if (value !== undefined && value !== null && value !== '') {
        entityData[entityField] = value;
      }
    }

    return entityData;
  }

  private async findExistingEntity(entityType: string, uniqueFields: any[], formData: Record<string, any>) {
    for (const field of uniqueFields) {
      const value = formData[field.formField];
      if (!value) continue;

      let entity = null;
      switch (entityType) {
        case 'student':
          entity = await this.prisma.student.findFirst({
            where: { [field.entityField]: value, deletedAt: null },
          });
          break;
        case 'user':
        case 'teacher':
          entity = await this.prisma.user.findFirst({
            where: { [field.entityField]: value, deletedAt: null },
          });
          break;
        case 'parent':
          entity = await this.prisma.parent.findFirst({
            where: { [field.entityField]: value, deletedAt: null },
          });
          break;
      }

      if (entity) return entity;
    }

    return null;
  }

  private async getEntity(entityType: string, id: string) {
    switch (entityType) {
      case 'student':
        return this.prisma.student.findUnique({ where: { id } });
      case 'user':
      case 'teacher':
        return this.prisma.user.findUnique({ where: { id } });
      case 'parent':
        return this.prisma.parent.findUnique({ where: { id } });
      default:
        return null;
    }
  }

  private async createEntity(entityType: string, data: Record<string, any>) {
    switch (entityType) {
      case 'student':
        // 计算年龄段
        if (data.birthday) {
          data.ageGroup = this.calculateAgeGroup(new Date(data.birthday));
        }
        return this.prisma.student.create({ data: data as any });

      case 'user':
      case 'teacher':
        // 默认密码
        const bcrypt = require('bcrypt');
        data.password = await bcrypt.hash('123456', 10);
        data.role = data.role || 'TEACHER';
        return this.prisma.user.create({ data: data as any });

      case 'parent':
        return this.prisma.parent.create({ data: data as any });

      default:
        throw new BadRequestException(`不支持创建实体类型: ${entityType}`);
    }
  }

  private async updateEntity(entityType: string, id: string, data: Record<string, any>) {
    // 移除不应更新的字段
    delete data.id;
    delete data.createdAt;
    delete data.password;

    switch (entityType) {
      case 'student':
        if (data.birthday) {
          data.ageGroup = this.calculateAgeGroup(new Date(data.birthday));
        }
        return this.prisma.student.update({ where: { id }, data: data as any });

      case 'user':
      case 'teacher':
        return this.prisma.user.update({ where: { id }, data: data as any });

      case 'parent':
        return this.prisma.parent.update({ where: { id }, data: data as any });

      default:
        throw new BadRequestException(`不支持更新实体类型: ${entityType}`);
    }
  }

  private calculateAgeGroup(birthday: Date): string {
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }

    if (age < 3) return '2-3';
    if (age < 4) return '3-4';
    if (age < 5) return '4-5';
    if (age < 6) return '5-6';
    return '6-7';
  }

  // ================================
  // 实体绑定配置管理
  // ================================

  /**
   * 获取模板的实体绑定配置
   */
  async getEntityBindings(templateId: string) {
    return this.prisma.formEntityBinding.findMany({
      where: { templateId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * 创建实体绑定配置
   */
  async createEntityBinding(templateId: string, data: any) {
    return this.prisma.formEntityBinding.create({
      data: {
        templateId,
        entityType: data.entityType,
        actionType: data.actionType,
        fieldMappings: data.fieldMappings,
        triggerOn: data.triggerOn || 'approved',
        uniqueFields: data.uniqueFields,
        defaultValues: data.defaultValues,
        condition: data.condition,
        isActive: data.isActive !== false,
      },
    });
  }

  /**
   * 更新实体绑定配置
   */
  async updateEntityBinding(id: string, data: any) {
    return this.prisma.formEntityBinding.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除实体绑定配置
   */
  async deleteEntityBinding(id: string) {
    return this.prisma.formEntityBinding.delete({
      where: { id },
    });
  }

  /**
   * 获取表单提交的实体关联记录
   */
  async getEntityLinks(submissionId: string) {
    return this.prisma.formEntityLink.findMany({
      where: { submissionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ================================
  // 新版字段模式处理
  // ================================

  /**
   * 处理表单提交 - 基于新的字段模式
   * @param submissionId 提交ID
   */
  async processSubmissionByFieldModes(submissionId: string) {
    const submission = await this.prisma.formSubmission.findUnique({
      where: { id: submissionId },
      include: {
        template: true,
        user: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('表单提交不存在');
    }

    const fields = submission.template.fields as any[];
    const formData = submission.data as Record<string, any>;
    const results: any[] = [];

    for (const field of fields) {
      try {
        // 处理填写字段 (input mode) - 创建新实体
        if (field.mode === 'input' && field.entityType) {
          const entityData = formData[field.id];
          if (entityData && typeof entityData === 'object') {
            const result = await this.createEntityFromInputField(
              field.entityType,
              entityData,
              submission.user?.campusId || undefined
            );

            // 记录关联
            await this.prisma.formEntityLink.create({
              data: {
                submissionId,
                entityType: field.entityType,
                entityId: result.id,
                actionType: result.action,
                previousData: result.existingEntity as any,
                newData: entityData as any,
              },
            });

            results.push({
              fieldId: field.id,
              entityType: field.entityType,
              entityId: result.id,
              action: result.action,
              status: 'success',
            });
          }
        }

        // 处理引用字段 (reference mode) - 记录关联
        if (field.mode === 'reference' && field.entityType) {
          const entityId = formData[field.id];
          if (entityId) {
            await this.prisma.formEntityLink.create({
              data: {
                submissionId,
                entityType: field.entityType,
                entityId,
                actionType: 'linked',
              },
            });

            results.push({
              fieldId: field.id,
              entityType: field.entityType,
              entityId,
              action: 'linked',
              status: 'success',
            });
          }
        }
      } catch (error) {
        results.push({
          fieldId: field.id,
          entityType: field.entityType,
          action: 'failed',
          status: 'failed',
          error: error.message,
        });
      }
    }

    return {
      success: results.every(r => r.status === 'success'),
      results,
    };
  }

  /**
   * 从填写字段创建实体
   */
  private async createEntityFromInputField(
    entityType: string,
    data: Record<string, any>,
    campusId?: string
  ): Promise<{ id: string; action: string; existingEntity?: any }> {
    // 添加默认值
    const defaults = getEntityDefaults(entityType);
    const entityData = { ...defaults, ...data };

    // 添加园区ID
    if (!entityData.campusId && campusId) {
      entityData.campusId = campusId;
    }

    // 检查唯一性字段，查找已存在的实体
    const uniqueFields = getUniqueFields(entityType);
    for (const uniqueField of uniqueFields) {
      if (entityData[uniqueField]) {
        const existing = await this.findExistingByUniqueField(
          entityType,
          uniqueField,
          entityData[uniqueField]
        );
        if (existing) {
          // 已存在，返回关联而非创建
          return {
            id: existing.id,
            action: 'linked',
            existingEntity: existing,
          };
        }
      }
    }

    // 创建新实体
    const newEntity = await this.createEntity(entityType, entityData);
    return {
      id: newEntity.id,
      action: 'created',
    };
  }

  /**
   * 根据唯一字段查找已存在实体
   */
  private async findExistingByUniqueField(
    entityType: string,
    field: string,
    value: string
  ): Promise<any> {
    switch (entityType) {
      case 'student':
        return this.prisma.student.findFirst({
          where: { [field]: value, deletedAt: null },
        });
      case 'teacher':
      case 'user':
        return this.prisma.user.findFirst({
          where: { [field]: value, deletedAt: null },
        });
      case 'parent':
        return this.prisma.parent.findFirst({
          where: { [field]: value, deletedAt: null },
        });
      default:
        return null;
    }
  }
}

