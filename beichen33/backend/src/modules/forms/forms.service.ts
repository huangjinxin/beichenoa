import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ENTITY_BINDING_TEMPLATES } from './preset-templates';
import { EntityBindingService } from './entity-binding.service';
import { randomBytes } from 'crypto';

@Injectable()
export class FormsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => EntityBindingService))
    private entityBindingService: EntityBindingService,
  ) {}

  // ==================== 模板管理 ====================

  async findAllTemplates(query?: any) {
    const { isPreset } = query || {};
    const where: any = { deletedAt: null, isActive: true };

    if (isPreset !== undefined) {
      where.isPreset = isPreset === 'true' || isPreset === true;
    }

    return this.prisma.formTemplate.findMany({
      where,
      include: {
        approvalFlows: {
          where: { deletedAt: null, isActive: true },
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTemplate(id: string) {
    return this.prisma.formTemplate.findUnique({
      where: { id },
      include: {
        approvalFlows: {
          where: { deletedAt: null, isActive: true },
          include: {
            nodes: {
              orderBy: { sequence: 'asc' },
            },
          },
        },
      },
    });
  }

  async createTemplate(data: any) {
    return this.prisma.formTemplate.create({
      data: {
        title: data.title,
        description: data.description,
        fields: data.fields || [],
        detailTableConfig: data.detailTableConfig || null,
        calculations: data.calculations || null,
        serialNumberConfig: data.serialNumberConfig || null,
        isPreset: data.isPreset || false,
        presetType: data.presetType || null,
      },
    });
  }

  async updateTemplate(id: string, data: any) {
    return this.prisma.formTemplate.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        fields: data.fields,
        detailTableConfig: data.detailTableConfig,
        calculations: data.calculations,
        serialNumberConfig: data.serialNumberConfig,
      },
    });
  }

  async deleteTemplate(id: string) {
    return this.prisma.formTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ==================== 预置模板 ====================

  async getPresetTemplates() {
    return this.prisma.formTemplate.findMany({
      where: { isPreset: true, deletedAt: null },
      include: {
        approvalFlows: {
          where: { deletedAt: null, isActive: true },
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFromPreset(presetId: string, newTitle?: string) {
    const preset = await this.prisma.formTemplate.findUnique({
      where: { id: presetId },
    });

    if (!preset) {
      throw new Error('预置模板不存在');
    }

    return this.prisma.formTemplate.create({
      data: {
        title: newTitle || `${preset.title} (副本)`,
        description: preset.description,
        fields: preset.fields as any,
        detailTableConfig: preset.detailTableConfig as any,
        calculations: preset.calculations as any,
        serialNumberConfig: preset.serialNumberConfig as any,
        isPreset: false,
      },
    });
  }

  // 初始化预置模板（包含数据联动功能的表单）
  async initPresetTemplates() {
    const results = [];

    // 1. 创建原有的维修审批表
    const existingRepair = await this.prisma.formTemplate.findFirst({
      where: { presetType: 'repair_approval', isPreset: true },
    });

    if (!existingRepair) {
      const repairTemplate = await this.prisma.formTemplate.create({
        data: {
          title: '幼儿园事前审批表（维修/小额采购）',
          description: '用于维修和小额采购的事前审批流程',
          isPreset: true,
          presetType: 'repair_approval',
          fields: [
            { id: 'handler', type: 'teacher_select', label: '经办人', required: true },
            { id: 'fillDate', type: 'date', label: '填写时间', required: true },
            { id: 'logisticsManager', type: 'teacher_select', label: '总务处', required: true },
            { id: 'name', type: 'text', label: '名称', required: true, placeholder: '请输入项目名称' },
            { id: 'reason', type: 'textarea', label: '原因', required: true, placeholder: '请输入申请原因' },
            { id: 'witness', type: 'teacher_select', label: '证明人', required: true },
            { id: 'managerOpinion', type: 'approval', label: '分管领导意见', required: false },
            { id: 'directorOpinion', type: 'approval', label: '主要领导意见', required: false },
          ],
          detailTableConfig: {
            enabled: true,
            title: '维修明细',
            columns: [
              { id: 'seq', type: 'sequence', label: '序号', width: 60 },
              { id: 'repairDate', type: 'date', label: '维修日期', width: 120, required: true },
              { id: 'location', type: 'text', label: '维修地点', width: 120, required: true },
              { id: 'projectName', type: 'text', label: '项目名称', width: 150, required: true },
              { id: 'unitPrice', type: 'number', label: '单价', width: 100, required: true },
              { id: 'quantity', type: 'number', label: '数量', width: 80, required: true },
              { id: 'total', type: 'calculated', label: '合计', width: 100, formula: 'unitPrice * quantity' },
              { id: 'purpose', type: 'text', label: '用途', width: 120 },
              { id: 'repairPerson', type: 'text', label: '维修人', width: 100 },
              { id: 'detailWitness', type: 'text', label: '证明人', width: 100 },
              { id: 'remark', type: 'text', label: '备注', width: 120 },
            ],
          },
          calculations: [
            { field: 'grandTotal', formula: 'SUM(details.total)', label: '总金额' },
            { field: 'itemCount', formula: 'COUNT(details)', label: '项目数量' },
          ],
          serialNumberConfig: {
            prefix: 'REPAIR',
            dateFormat: 'YYYY',
            digits: 3,
          },
        },
      });
      results.push({ type: 'repair_approval', template: repairTemplate });
    }

    // 2. 创建数据联动相关的预置模板
    for (const templateDef of ENTITY_BINDING_TEMPLATES) {
      const existing = await this.prisma.formTemplate.findFirst({
        where: { presetType: templateDef.presetType, isPreset: true },
      });

      if (!existing) {
        // 创建模板
        const template = await this.prisma.formTemplate.create({
          data: {
            title: templateDef.title,
            description: templateDef.description,
            isPreset: true,
            presetType: templateDef.presetType,
            fields: templateDef.fields,
            serialNumberConfig: templateDef.serialNumberConfig || null,
          },
        });

        // 创建实体绑定配置
        if (templateDef.entityBindingConfig) {
          const bindingConfig = templateDef.entityBindingConfig as any;
          await this.prisma.formEntityBinding.create({
            data: {
              templateId: template.id,
              entityType: bindingConfig.entityType,
              actionType: bindingConfig.actionType,
              triggerOn: bindingConfig.triggerOn,
              fieldMappings: bindingConfig.fieldMappings,
              uniqueFields: bindingConfig.uniqueFields || null,
              defaultValues: bindingConfig.defaultValues || null,
              isActive: true,
            },
          });
        }

        results.push({ type: templateDef.presetType, template });
      }
    }

    return {
      message: `初始化完成，创建了 ${results.length} 个预置模板`,
      templates: results,
    };
  }

  // ==================== 表单提交 ====================

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
        take: Number(limit),
        include: {
          template: { select: { title: true, detailTableConfig: true } },
          user: { select: { name: true, email: true } },
          approvalTasks: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.formSubmission.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  async findSubmission(id: string) {
    return this.prisma.formSubmission.findUnique({
      where: { id },
      include: {
        template: true,
        user: { select: { id: true, name: true, email: true } },
        approvalTasks: true,
      },
    });
  }

  async createSubmission(data: any, userId: string) {
    const { templateId, formData, detailData } = data;

    // 获取模板配置和关联的审批流程
    const template = await this.prisma.formTemplate.findUnique({
      where: { id: templateId },
      include: {
        approvalFlows: {
          where: { deletedAt: null, isActive: true },
          include: {
            nodes: {
              orderBy: { sequence: 'asc' },
            },
          },
          take: 1, // 取第一个激活的审批流程
        },
      },
    });

    if (!template) {
      throw new Error('表单模板不存在');
    }

    // 生成流水号
    const serialNumber = await this.generateSerialNumber(template);

    // 计算明细表合计
    const processedDetailData = this.calculateDetailTotals(
      detailData || [],
      template.detailTableConfig as any,
    );

    // 计算汇总值
    const calculatedValues = this.calculateSummary(
      processedDetailData,
      template.calculations as any,
    );

    // 检查是否有审批流程
    const approvalFlow = template.approvalFlows?.[0];
    const hasApprovalFlow = approvalFlow && approvalFlow.nodes.length > 0;

    const submission = await this.prisma.formSubmission.create({
      data: {
        serialNumber,
        data: formData,
        detailData: processedDetailData,
        calculatedValues,
        template: { connect: { id: templateId } },
        user: { connect: { id: userId } },
        // 如果有审批流程，设置初始状态
        ...(hasApprovalFlow
          ? {
              approvalFlow: { connect: { id: approvalFlow.id } },
              approvalStatus: 'PENDING',
              currentNodeSequence: 1,
            }
          : {}),
      },
      include: {
        template: { select: { title: true } },
        user: { select: { name: true } },
      },
    });

    // 自动启动审批流程
    if (hasApprovalFlow) {
      const firstNode = approvalFlow.nodes[0];

      // 动态解析审批人
      const resolvedApprovers = await this.resolveNodeApprovers(firstNode, userId);

      if (resolvedApprovers && resolvedApprovers.length > 0) {
        // 为第一个节点的审批人创建审批任务
        await this.prisma.approvalTask.createMany({
          data: resolvedApprovers.map(approver => ({
            submissionId: submission.id,
            flowId: approvalFlow.id,
            nodeId: firstNode.id,
            nodeName: firstNode.name,
            nodeSequence: firstNode.sequence,
            approverId: approver.userId,
            status: 'PENDING',
          })),
        });
      }
    }

    return submission;
  }

  /**
   * 动态解析节点审批人
   */
  private async resolveNodeApprovers(
    node: any,
    submitterId: string,
  ): Promise<{ userId: string; userName: string }[]> {
    const approverType = node.approverType || 'user';
    const approversConfig = (node.approvers || []) as { userId: string; userName: string }[];

    switch (approverType) {
      case 'user':
        // 指定用户：直接返回配置的用户列表
        return approversConfig;

      case 'role':
        // 角色：根据角色查询所有用户
        const roleUsers: { userId: string; userName: string }[] = [];
        for (const roleItem of approversConfig) {
          const users = await this.prisma.user.findMany({
            where: {
              role: roleItem.userId as any, // userId存储的是角色值
              isActive: true,
              deletedAt: null,
            },
            select: { id: true, name: true },
          });
          roleUsers.push(...users.map(u => ({ userId: u.id, userName: u.name })));
        }
        return roleUsers;

      case 'position':
        // 职位：根据职位ID查询所有用户
        const positionUsers: { userId: string; userName: string }[] = [];
        for (const posItem of approversConfig) {
          const users = await this.prisma.user.findMany({
            where: {
              positionId: posItem.userId, // userId存储的是职位ID
              isActive: true,
              deletedAt: null,
            },
            select: { id: true, name: true },
          });
          positionUsers.push(...users.map(u => ({ userId: u.id, userName: u.name })));
        }
        return positionUsers;

      case 'superior':
        // 上级：根据提交人查找其上级
        const user = await this.prisma.user.findUnique({
          where: { id: submitterId },
          include: { position: true },
        });

        if (!user || !user.position) {
          return [];
        }

        // 通过职位父级或层级查找上级
        let superiors: any[] = [];

        if (user.position.parentId) {
          superiors = await this.prisma.user.findMany({
            where: {
              positionId: user.position.parentId,
              campusId: user.campusId,
              isActive: true,
              deletedAt: null,
            },
            select: { id: true, name: true },
          });
        }

        if (superiors.length === 0) {
          // 按层级查找
          superiors = await this.prisma.user.findMany({
            where: {
              campusId: user.campusId,
              isActive: true,
              deletedAt: null,
              position: {
                level: { lt: user.position.level },
              },
            },
            orderBy: {
              position: { level: 'desc' },
            },
            take: 1,
            select: { id: true, name: true },
          });
        }

        return superiors.map(s => ({ userId: s.id, userName: s.name }));

      default:
        return approversConfig;
    }
  }

  async updateSubmission(id: string, data: any) {
    const updateData: any = {};

    if (data.status) {
      updateData.status = data.status;
    }

    if (data.formData) {
      updateData.data = data.formData;
    }

    if (data.detailData) {
      // 获取模板配置重新计算
      const submission = await this.prisma.formSubmission.findUnique({
        where: { id },
        include: { template: true },
      });

      if (submission) {
        const processedDetailData = this.calculateDetailTotals(
          data.detailData,
          submission.template.detailTableConfig as any,
        );
        const calculatedValues = this.calculateSummary(
          processedDetailData,
          submission.template.calculations as any,
        );

        updateData.detailData = processedDetailData;
        updateData.calculatedValues = calculatedValues;
      }
    }

    return this.prisma.formSubmission.update({
      where: { id },
      data: updateData,
    });
  }

  // ==================== 计算功能 ====================

  // 生成流水号
  private async generateSerialNumber(template: any): Promise<string | null> {
    const config = template.serialNumberConfig as any;
    if (!config) return null;

    const { prefix, dateFormat, digits } = config;
    const year = new Date().getFullYear();

    // 获取当年的最大序号
    const lastSubmission = await this.prisma.formSubmission.findFirst({
      where: {
        templateId: template.id,
        serialNumber: { startsWith: `${prefix}-${year}` },
      },
      orderBy: { serialNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastSubmission?.serialNumber) {
      const parts = lastSubmission.serialNumber.split('-');
      const lastNumber = parseInt(parts[parts.length - 1], 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}-${year}-${String(nextNumber).padStart(digits, '0')}`;
  }

  // 计算明细表每行合计
  private calculateDetailTotals(detailData: any[], config: any): any[] {
    if (!config?.enabled || !detailData?.length) return detailData || [];

    const columns = config.columns || [];
    const calculatedColumns = columns.filter((col: any) => col.type === 'calculated');

    return detailData.map((row, index) => {
      const newRow = { ...row, seq: index + 1 };

      calculatedColumns.forEach((col: any) => {
        if (col.formula) {
          newRow[col.id] = this.evaluateFormula(col.formula, newRow);
        }
      });

      return newRow;
    });
  }

  // 计算汇总值
  private calculateSummary(detailData: any[], calculations: any[]): any {
    if (!calculations?.length) return {};

    const result: any = {};

    calculations.forEach((calc: any) => {
      const { field, formula } = calc;

      if (formula.startsWith('SUM(details.')) {
        const fieldName = formula.match(/SUM\(details\.(\w+)\)/)?.[1];
        if (fieldName) {
          result[field] = detailData.reduce((sum, row) => {
            return sum + (Number(row[fieldName]) || 0);
          }, 0);
        }
      } else if (formula.startsWith('COUNT(details)')) {
        result[field] = detailData.length;
      }
    });

    return result;
  }

  // 简单公式计算
  private evaluateFormula(formula: string, row: any): number {
    try {
      // 简单的乘法公式: "unitPrice * quantity"
      const match = formula.match(/(\w+)\s*\*\s*(\w+)/);
      if (match) {
        const a = Number(row[match[1]]) || 0;
        const b = Number(row[match[2]]) || 0;
        return Math.round(a * b * 100) / 100; // 保留2位小数
      }

      // 简单的加法公式
      const addMatch = formula.match(/(\w+)\s*\+\s*(\w+)/);
      if (addMatch) {
        const a = Number(row[addMatch[1]]) || 0;
        const b = Number(row[addMatch[2]]) || 0;
        return Math.round((a + b) * 100) / 100;
      }

      return 0;
    } catch {
      return 0;
    }
  }

  // ==================== 审批功能（旧系统，已废弃） ====================
  // TODO: 使用新的审批流程系统 (ApprovalFlow, ApprovalNode, ApprovalTask)
  // 以下代码使用旧的审批模型，已被新系统替代

  /*
   * 提交表单后自动启动审批流程
   *
  async startApprovalFlow(submissionId: string) {
    const submission = await this.prisma.formSubmission.findUnique({
      where: { id: submissionId },
      include: { template: true, user: true },
    });

    if (!submission || !submission.template.approvalConfig) {
      return; // 没有审批流程，直接返回
    }

    const approvalConfig = submission.template.approvalConfig as any;
    if (!approvalConfig.levels || approvalConfig.levels.length === 0) {
      return; // 没有配置审批层级
    }

    // 进入第一级审批
    const firstLevel = approvalConfig.levels[0];
    const approvers = await this.getApproversForLevel(firstLevel, submission);

    // 创建第一级审批记录
    await Promise.all(
      approvers.map((approverId) =>
        this.prisma.approval.create({
          data: {
            submissionId,
            step: 1,
            stepName: firstLevel.name,
            approverId,
            approverName: '', // 稍后更新
            status: 'PENDING',
          },
        }),
      ),
    );

    // 更新表单状态
    await this.prisma.formSubmission.update({
      where: { id: submissionId },
      data: {
        currentApprovalStep: 1,
        currentApprovers: approvers,
        status: 'PENDING',
      },
    });
  }

  // 根据审批层级配置获取审批人列表
  private async getApproversForLevel(level: any, submission: any): Promise<string[]> {
    // 如果配置了具体的用户ID列表
    if (level.approvers && Array.isArray(level.approvers)) {
      return level.approvers;
    }

    // 如果配置了角色
    if (level.role) {
      // 查找该角色的所有用户
      const users = await this.prisma.user.findMany({
        where: {
          role: level.role,
          campusId: submission.user?.campusId,
          isActive: true,
        },
        select: { id: true },
      });
      return users.map((u) => u.id);
    }

    // 如果配置了职位类型
    if (level.positionType) {
      const users = await this.prisma.user.findMany({
        where: {
          position: {
            type: level.positionType,
          },
          campusId: submission.user?.campusId,
          isActive: true,
        },
        select: { id: true },
      });
      return users.map((u) => u.id);
    }

    return [];
  }

  // 审批操作（通过/驳回）
  async approveSubmission(
    submissionId: string,
    approverId: string,
    action: 'APPROVE' | 'REJECT' | 'RETURN',
    comment?: string,
  ) {
    // 1. 获取提交信息
    const submission = await this.prisma.formSubmission.findUnique({
      where: { id: submissionId },
      include: { template: true, approvals: true },
    });

    if (!submission) {
      throw new Error('表单提交不存在');
    }

    // 2. 检查审批权限
    const currentApprovers = submission.currentApprovers as string[];
    if (!currentApprovers || !currentApprovers.includes(approverId)) {
      throw new Error('您没有权限审批此表单');
    }

    // 3. 检查是否已经审批过
    const existingApproval = await this.prisma.approval.findFirst({
      where: {
        submissionId,
        approverId,
        step: submission.currentApprovalStep,
      },
    });

    if (!existingApproval) {
      throw new Error('未找到审批记录');
    }

    if (existingApproval.status !== 'PENDING') {
      throw new Error('您已经审批过此表单');
    }

    // 4. 获取审批人信息
    const approver = await this.prisma.user.findUnique({
      where: { id: approverId },
      select: { name: true },
    });

    // 5. 更新审批记录
    await this.prisma.approval.update({
      where: { id: existingApproval.id },
      data: {
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        action,
        comment,
        approverName: approver?.name || '',
        approvedAt: new Date(),
      },
    });

    // 6. 处理审批结果
    if (action === 'REJECT') {
      // 驳回：整个流程结束
      await this.prisma.formSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'REJECTED',
          currentApprovers: [],
        },
      });
      return { success: true, message: '已驳回' };
    }

    if (action === 'RETURN') {
      // 退回：回到上一级或提交人
      if (submission.currentApprovalStep > 1) {
        // 回到上一级
        const prevStep = submission.currentApprovalStep - 1;
        const approvalConfig = submission.template.approvalConfig as any;
        const prevLevel = approvalConfig.levels[prevStep - 1];
        const prevApprovers = await this.getApproversForLevel(prevLevel, submission);

        await this.prisma.formSubmission.update({
          where: { id: submissionId },
          data: {
            currentApprovalStep: prevStep,
            currentApprovers: prevApprovers,
            status: 'PENDING',
          },
        });

        return { success: true, message: '已退回上一级' };
      } else {
        // 回到提交人
        await this.prisma.formSubmission.update({
          where: { id: submissionId },
          data: {
            currentApprovalStep: 0,
            currentApprovers: [submission.submittedBy],
            status: 'PENDING',
          },
        });

        return { success: true, message: '已退回提交人修改' };
      }
    }

    // 7. 通过：检查是否所有审批人都已通过
    const currentStepApprovals = await this.prisma.approval.findMany({
      where: {
        submissionId,
        step: submission.currentApprovalStep,
      },
    });

    const allApproved = currentStepApprovals.every((a) => a.status === 'APPROVED');

    if (!allApproved) {
      return { success: true, message: '审批成功，等待其他审批人' };
    }

    // 8. 当前级别全部通过，进入下一级或完成
    const approvalConfig = submission.template.approvalConfig as any;
    const totalLevels = approvalConfig.levels?.length || 0;

    if (submission.currentApprovalStep < totalLevels) {
      // 进入下一级审批
      const nextStep = submission.currentApprovalStep + 1;
      const nextLevel = approvalConfig.levels[nextStep - 1];
      const nextApprovers = await this.getApproversForLevel(nextLevel, submission);

      // 创建下一级审批记录
      await Promise.all(
        nextApprovers.map((nextApproverId) =>
          this.prisma.approval.create({
            data: {
              submissionId,
              step: nextStep,
              stepName: nextLevel.name,
              approverId: nextApproverId,
              approverName: '',
              status: 'PENDING',
            },
          }),
        ),
      );

      await this.prisma.formSubmission.update({
        where: { id: submissionId },
        data: {
          currentApprovalStep: nextStep,
          currentApprovers: nextApprovers,
          status: 'PENDING',
        },
      });

      return { success: true, message: '已进入下一级审批' };
    } else {
      // 所有审批完成
      await this.prisma.formSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'APPROVED',
          currentApprovers: [],
        },
      });

      // 自动处理字段模式 - 创建实体
      try {
        await this.entityBindingService.processSubmissionByFieldModes(submissionId);
      } catch (error) {
        console.error('处理字段模式失败:', error);
        // 不阻塞审批流程，记录错误即可
      }

      return { success: true, message: '审批流程完成' };
    }
  }

  // 获取我的待审批列表
  async getMyPendingApprovals(userId: string, query: any) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.approval.findMany({
        where: {
          approverId: userId,
          status: 'PENDING',
        },
        include: {
          submission: {
            include: {
              template: { select: { title: true } },
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.approval.count({
        where: {
          approverId: userId,
          status: 'PENDING',
        },
      }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  // 获取我已审批的列表
  async getMyApprovedList(userId: string, query: any) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.approval.findMany({
        where: {
          approverId: userId,
          status: { in: ['APPROVED', 'REJECTED'] },
        },
        include: {
          submission: {
            include: {
              template: { select: { title: true } },
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { approvedAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.approval.count({
        where: {
          approverId: userId,
          status: { in: ['APPROVED', 'REJECTED'] },
        },
      }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit) };
  }
  */
  // ==================== 实时计算API ====================

  // 计算单行明细
  calculateRowTotal(row: any, columns: any[]): any {
    const calculatedColumns = columns.filter((col: any) => col.type === 'calculated');
    const newRow = { ...row };

    calculatedColumns.forEach((col: any) => {
      if (col.formula) {
        newRow[col.id] = this.evaluateFormula(col.formula, newRow);
      }
    });

    return newRow;
  }

  // ==================== 表单分享功能 ====================

  /**
   * 生成分享链接
   */
  async generateShareLink(templateId: string) {
    const template = await this.prisma.formTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('模板不存在');
    }

    // 如果已有分享token，直接返回
    if (template.shareToken) {
      return { token: template.shareToken };
    }

    // 生成新的分享token（32位随机字符串）
    const token = randomBytes(16).toString('hex');

    await this.prisma.formTemplate.update({
      where: { id: templateId },
      data: { shareToken: token },
    });

    return { token };
  }

  /**
   * 通过分享token获取模板
   */
  async getTemplateByShareToken(token: string) {
    return this.prisma.formTemplate.findFirst({
      where: {
        shareToken: token,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  /**
   * 通过分享token提交表单（匿名提交）
   */
  async submitByShareToken(token: string, data: any) {
    const { formData, detailData } = data;

    // 获取模板
    const template = await this.getTemplateByShareToken(token);
    if (!template) {
      throw new Error('分享链接无效或已过期');
    }

    // 生成流水号
    const serialNumber = await this.generateSerialNumber(template);

    // 计算明细表合计
    const processedDetailData = this.calculateDetailTotals(
      detailData || [],
      template.detailTableConfig as any,
    );

    // 计算汇总值
    const calculatedValues = this.calculateSummary(
      processedDetailData,
      template.calculations as any,
    );

    // 创建匿名提交（不关联用户）
    const submission = await this.prisma.formSubmission.create({
      data: {
        serialNumber,
        data: formData,
        detailData: processedDetailData,
        calculatedValues,
        templateId: template.id,
        submittedBy: 'anonymous', // 匿名提交标记
        approvalStatus: 'DRAFT',
      },
    });

    return submission;
  }
}
