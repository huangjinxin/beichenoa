import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ApprovalsService {
  constructor(private prisma: PrismaService) {}

  // ==================== 审批流程管理 ====================

  /**
   * 获取审批流程列表
   */
  async findAllFlows(query?: any) {
    const { formTemplateId, isActive } = query || {};
    const where: any = { deletedAt: null };

    if (formTemplateId) {
      where.formTemplateId = formTemplateId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }

    return this.prisma.approvalFlow.findMany({
      where,
      include: {
        nodes: {
          orderBy: { sequence: 'asc' },
        },
        formTemplate: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取单个审批流程详情
   */
  async findFlow(id: string) {
    return this.prisma.approvalFlow.findUnique({
      where: { id },
      include: {
        nodes: {
          orderBy: { sequence: 'asc' },
        },
        formTemplate: {
          select: { id: true, title: true },
        },
      },
    });
  }

  /**
   * 获取表单模板关联的审批流程
   */
  async findFlowsByTemplate(templateId: string) {
    return this.prisma.approvalFlow.findMany({
      where: {
        formTemplateId: templateId,
        deletedAt: null,
      },
      include: {
        nodes: {
          orderBy: { sequence: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 创建审批流程
   */
  async createFlow(data: CreateFlowDto) {
    const { name, description, formTemplateId, nodes } = data;

    return this.prisma.approvalFlow.create({
      data: {
        name,
        description,
        formTemplateId,
        nodes: nodes?.length
          ? {
              create: nodes.map((node, index) => ({
                name: node.name,
                sequence: node.sequence || index + 1,
                type: node.type || 'SERIAL',
                parallelMode: node.parallelMode,
                approvers: node.approvers || [],
                approverType: node.approverType || 'user',
                canReject: node.canReject ?? true,
                canReturn: node.canReturn ?? true,
                canTransfer: node.canTransfer ?? false,
                rejectBehavior: node.rejectBehavior || 'END',
                timeoutHours: node.timeoutHours,
              })),
            }
          : undefined,
      },
      include: {
        nodes: {
          orderBy: { sequence: 'asc' },
        },
      },
    });
  }

  /**
   * 更新审批流程
   */
  async updateFlow(id: string, data: UpdateFlowDto) {
    const { name, description, isActive, nodes } = data;

    // 如果需要更新节点，先删除旧节点再创建新节点
    if (nodes !== undefined) {
      // 删除旧节点
      await this.prisma.approvalNode.deleteMany({
        where: { flowId: id },
      });

      // 创建新节点
      if (nodes.length > 0) {
        await this.prisma.approvalNode.createMany({
          data: nodes.map((node, index) => ({
            flowId: id,
            name: node.name,
            sequence: node.sequence || index + 1,
            type: node.type || 'SERIAL',
            parallelMode: node.parallelMode,
            approvers: node.approvers || [],
            approverType: node.approverType || 'user',
            canReject: node.canReject ?? true,
            canReturn: node.canReturn ?? true,
            canTransfer: node.canTransfer ?? false,
            rejectBehavior: node.rejectBehavior || 'END',
            timeoutHours: node.timeoutHours,
          })),
        });
      }
    }

    // 更新流程基本信息
    return this.prisma.approvalFlow.update({
      where: { id },
      data: {
        name,
        description,
        isActive,
      },
      include: {
        nodes: {
          orderBy: { sequence: 'asc' },
        },
      },
    });
  }

  /**
   * 删除审批流程
   */
  async deleteFlow(id: string) {
    // 检查是否有使用中的提交
    const activeSubmissions = await this.prisma.formSubmission.count({
      where: {
        approvalFlowId: id,
        approvalStatus: 'PENDING',
      },
    });

    if (activeSubmissions > 0) {
      throw new Error(`该审批流程有 ${activeSubmissions} 个进行中的审批，无法删除`);
    }

    return this.prisma.approvalFlow.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // ==================== 审批节点管理 ====================

  /**
   * 添加审批节点
   */
  async addNode(flowId: string, data: CreateNodeDto) {
    // 获取当前最大序号
    const maxSequence = await this.prisma.approvalNode.aggregate({
      where: { flowId },
      _max: { sequence: true },
    });

    const sequence = data.sequence || (maxSequence._max.sequence || 0) + 1;

    return this.prisma.approvalNode.create({
      data: {
        flowId,
        name: data.name,
        sequence,
        type: data.type || 'SERIAL',
        parallelMode: data.parallelMode,
        approvers: data.approvers || [],
        approverType: data.approverType || 'user',
        canReject: data.canReject ?? true,
        canReturn: data.canReturn ?? true,
        canTransfer: data.canTransfer ?? false,
        rejectBehavior: data.rejectBehavior || 'END',
        timeoutHours: data.timeoutHours,
      },
    });
  }

  /**
   * 更新审批节点
   */
  async updateNode(nodeId: string, data: UpdateNodeDto) {
    return this.prisma.approvalNode.update({
      where: { id: nodeId },
      data: {
        name: data.name,
        sequence: data.sequence,
        type: data.type,
        parallelMode: data.parallelMode,
        approvers: data.approvers,
        approverType: data.approverType,
        canReject: data.canReject,
        canReturn: data.canReturn,
        canTransfer: data.canTransfer,
        rejectBehavior: data.rejectBehavior,
        timeoutHours: data.timeoutHours,
      },
    });
  }

  /**
   * 删除审批节点
   */
  async deleteNode(nodeId: string) {
    const node = await this.prisma.approvalNode.findUnique({
      where: { id: nodeId },
    });

    if (!node) {
      throw new Error('审批节点不存在');
    }

    // 删除节点
    await this.prisma.approvalNode.delete({
      where: { id: nodeId },
    });

    // 重新排序剩余节点
    const remainingNodes = await this.prisma.approvalNode.findMany({
      where: { flowId: node.flowId },
      orderBy: { sequence: 'asc' },
    });

    // 更新序号
    for (let i = 0; i < remainingNodes.length; i++) {
      await this.prisma.approvalNode.update({
        where: { id: remainingNodes[i].id },
        data: { sequence: i + 1 },
      });
    }

    return { success: true };
  }

  /**
   * 重新排序节点
   */
  async reorderNodes(flowId: string, nodeIds: string[]) {
    const updates = nodeIds.map((nodeId, index) =>
      this.prisma.approvalNode.update({
        where: { id: nodeId },
        data: { sequence: index + 1 },
      })
    );

    await Promise.all(updates);

    return this.prisma.approvalNode.findMany({
      where: { flowId },
      orderBy: { sequence: 'asc' },
    });
  }

  // ==================== 流程绑定 ====================

  /**
   * 绑定审批流程到表单模板
   */
  async bindFlowToTemplate(flowId: string, templateId: string) {
    return this.prisma.approvalFlow.update({
      where: { id: flowId },
      data: { formTemplateId: templateId },
    });
  }

  /**
   * 解除绑定
   */
  async unbindFlowFromTemplate(flowId: string) {
    return this.prisma.approvalFlow.update({
      where: { id: flowId },
      data: { formTemplateId: null },
    });
  }

  // ==================== 用户列表（用于审批人选择） ====================

  /**
   * 获取可选审批人列表
   */
  async getApproverOptions(query?: any) {
    const { role, campusId, keyword } = query || {};
    const where: any = {
      isActive: true,
      deletedAt: null,
    };

    if (role) {
      where.role = role;
    }

    if (campusId) {
      where.campusId = campusId;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        position: {
          select: { name: true, type: true },
        },
      },
      orderBy: { name: 'asc' },
      take: 50,
    });

    return users.map(user => ({
      userId: user.id,
      userName: user.name,
      email: user.email,
      role: user.role,
      position: user.position?.name,
      positionType: user.position?.type,
    }));
  }

  /**
   * 获取角色列表
   */
  async getRoleOptions() {
    return [
      { value: 'ADMIN', label: '管理员' },
      { value: 'TEACHER', label: '教师' },
      { value: 'PARENT', label: '家长' },
    ];
  }

  /**
   * 获取职位列表
   */
  async getPositionOptions() {
    const positions = await this.prisma.position.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        type: true,
        level: true,
      },
      orderBy: { level: 'asc' },
    });

    return positions.map(pos => ({
      value: pos.id,
      label: pos.name,
      type: pos.type,
      level: pos.level,
    }));
  }

  /**
   * 根据角色获取用户列表
   */
  async getUsersByRole(roleValue: string) {
    const users = await this.prisma.user.findMany({
      where: {
        role: roleValue as any,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        position: {
          select: { name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return users.map(user => ({
      userId: user.id,
      userName: user.name,
      email: user.email,
      position: user.position?.name,
    }));
  }

  /**
   * 根据职位获取用户列表
   */
  async getUsersByPosition(positionId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        positionId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        position: {
          select: { name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return users.map(user => ({
      userId: user.id,
      userName: user.name,
      email: user.email,
      position: user.position?.name,
    }));
  }

  /**
   * 获取用户的上级
   * 根据职位层级关系查找上级
   */
  async getSuperior(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        position: true,
        campus: true,
      },
    });

    if (!user || !user.position) {
      return [];
    }

    // 方式1: 通过职位的父级关系查找
    if (user.position.parentId) {
      const superiorPosition = await this.prisma.position.findUnique({
        where: { id: user.position.parentId },
      });

      if (superiorPosition) {
        const superiors = await this.prisma.user.findMany({
          where: {
            positionId: superiorPosition.id,
            campusId: user.campusId, // 同一园区
            isActive: true,
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            email: true,
            position: {
              select: { name: true },
            },
          },
        });

        return superiors.map(s => ({
          userId: s.id,
          userName: s.name,
          email: s.email,
          position: s.position?.name,
        }));
      }
    }

    // 方式2: 通过职位层级查找（level更低的）
    const superiors = await this.prisma.user.findMany({
      where: {
        campusId: user.campusId,
        isActive: true,
        deletedAt: null,
        position: {
          level: { lt: user.position.level },
        },
      },
      include: {
        position: {
          select: { name: true, level: true },
        },
      },
      orderBy: {
        position: { level: 'desc' }, // 取最近的上级
      },
      take: 1,
    });

    return superiors.map(s => ({
      userId: s.id,
      userName: s.name,
      email: s.email,
      position: s.position?.name,
    }));
  }

  /**
   * 根据节点配置动态解析审批人
   */
  async resolveApprovers(
    node: any,
    submitterId: string,
  ): Promise<{ userId: string; userName: string }[]> {
    const approverType = node.approverType || 'user';
    const approversConfig = node.approvers || [];

    switch (approverType) {
      case 'user':
        // 指定用户：直接使用配置的用户列表
        return approversConfig;

      case 'role':
        // 角色：根据角色查询所有用户
        const roleUsers: { userId: string; userName: string }[] = [];
        for (const roleItem of approversConfig) {
          const users = await this.getUsersByRole(roleItem.userId || roleItem.value);
          roleUsers.push(...users.map(u => ({ userId: u.userId, userName: u.userName })));
        }
        return roleUsers;

      case 'position':
        // 职位：根据职位查询所有用户
        const positionUsers: { userId: string; userName: string }[] = [];
        for (const posItem of approversConfig) {
          const users = await this.getUsersByPosition(posItem.userId || posItem.value);
          positionUsers.push(...users.map(u => ({ userId: u.userId, userName: u.userName })));
        }
        return positionUsers;

      case 'superior':
        // 上级：根据提交人查找其上级
        const superiors = await this.getSuperior(submitterId);
        return superiors.map(s => ({ userId: s.userId, userName: s.userName }));

      default:
        return approversConfig;
    }
  }

  // ==================== 审批任务管理 ====================

  /**
   * 获取用户的待审批任务
   */
  async getMyPendingTasks(userId: string) {
    const tasks = await this.prisma.approvalTask.findMany({
      where: {
        approverId: userId,
        status: 'PENDING',
      },
      include: {
        submission: {
          include: {
            template: {
              select: {
                id: true,
                title: true,
                fields: true,
                detailTableConfig: true,
                calculations: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                position: {
                  select: { name: true },
                },
              },
            },
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return {
      data: tasks.map(task => ({
        id: task.id,
        nodeName: task.nodeName,
        nodeSequence: task.nodeSequence,
        assignedAt: task.assignedAt,
        submission: {
          id: task.submission.id,
          serialNumber: task.submission.serialNumber,
          data: task.submission.data,
          detailData: task.submission.detailData,
          calculatedValues: task.submission.calculatedValues,
          createdAt: task.submission.createdAt,
          template: task.submission.template,
          user: task.submission.user,
        },
      })),
      total: tasks.length,
    };
  }

  /**
   * 获取用户已完成的审批任务
   */
  async getMyCompletedTasks(userId: string) {
    const tasks = await this.prisma.approvalTask.findMany({
      where: {
        approverId: userId,
        status: { in: ['APPROVED', 'REJECTED', 'RETURNED'] },
      },
      include: {
        submission: {
          include: {
            template: {
              select: {
                id: true,
                title: true,
                fields: true,
                detailTableConfig: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    return {
      data: tasks.map(task => ({
        id: task.id,
        nodeName: task.nodeName,
        nodeSequence: task.nodeSequence,
        action: task.action,
        comment: task.comment,
        completedAt: task.completedAt,
        submission: {
          id: task.submission.id,
          serialNumber: task.submission.serialNumber,
          data: task.submission.data,
          detailData: task.submission.detailData,
          createdAt: task.submission.createdAt,
          template: task.submission.template,
          user: task.submission.user,
        },
      })),
      total: tasks.length,
    };
  }

  /**
   * 处理审批任务
   */
  async processApprovalTask(
    taskId: string,
    userId: string,
    action: 'APPROVE' | 'REJECT' | 'RETURN',
    comment?: string,
  ) {
    const task = await this.prisma.approvalTask.findUnique({
      where: { id: taskId },
      include: {
        submission: {
          include: {
            approvalFlow: {
              include: {
                nodes: {
                  orderBy: { sequence: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new Error('审批任务不存在');
    }

    if (task.approverId !== userId) {
      throw new Error('无权处理此审批任务');
    }

    if (task.status !== 'PENDING') {
      throw new Error('此任务已被处理');
    }

    const submission = task.submission;
    const flow = submission.approvalFlow;
    const nodes = flow?.nodes || [];

    // 更新任务状态
    await this.prisma.approvalTask.update({
      where: { id: taskId },
      data: {
        status: action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'RETURNED',
        action,
        comment,
        completedAt: new Date(),
      },
    });

    // 根据操作类型处理流程
    if (action === 'APPROVE') {
      // 检查当前节点是否所有任务都已完成
      const currentNodeTasks = await this.prisma.approvalTask.findMany({
        where: {
          submissionId: submission.id,
          nodeSequence: task.nodeSequence,
        },
      });

      const allApproved = currentNodeTasks.every(t => t.status === 'APPROVED');
      const anyApproved = currentNodeTasks.some(t => t.status === 'APPROVED');

      const currentNode = nodes.find(n => n.sequence === task.nodeSequence);
      const shouldProceed =
        currentNode?.parallelMode === 'OR' ? anyApproved : allApproved;

      if (shouldProceed) {
        // 进入下一节点
        const nextNode = nodes.find(n => n.sequence === task.nodeSequence + 1);

        if (nextNode) {
          // 创建下一节点的审批任务
          await this.createTasksForNode(submission.id, nextNode, flow!.id);

          // 更新提交记录的当前节点
          await this.prisma.formSubmission.update({
            where: { id: submission.id },
            data: { currentNodeSequence: nextNode.sequence },
          });
        } else {
          // 流程完成
          await this.prisma.formSubmission.update({
            where: { id: submission.id },
            data: { approvalStatus: 'APPROVED' },
          });
        }
      }
    } else if (action === 'REJECT') {
      // 驳回 - 结束流程
      await this.prisma.formSubmission.update({
        where: { id: submission.id },
        data: { approvalStatus: 'REJECTED' },
      });

      // 取消其他待处理任务
      await this.prisma.approvalTask.updateMany({
        where: {
          submissionId: submission.id,
          status: 'PENDING',
        },
        data: { status: 'CANCELLED' },
      });
    } else if (action === 'RETURN') {
      // 退回
      await this.prisma.formSubmission.update({
        where: { id: submission.id },
        data: { approvalStatus: 'RETURNED' },
      });

      // 取消其他待处理任务
      await this.prisma.approvalTask.updateMany({
        where: {
          submissionId: submission.id,
          status: 'PENDING',
        },
        data: { status: 'CANCELLED' },
      });
    }

    return { success: true, message: '审批操作成功' };
  }

  /**
   * 启动审批流程
   */
  async startApprovalFlow(submissionId: string, flowId: string) {
    const flow = await this.prisma.approvalFlow.findUnique({
      where: { id: flowId },
      include: {
        nodes: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!flow || flow.nodes.length === 0) {
      throw new Error('审批流程不存在或没有配置节点');
    }

    const firstNode = flow.nodes[0];

    // 创建第一个节点的审批任务
    await this.createTasksForNode(submissionId, firstNode, flowId);

    // 更新提交记录
    await this.prisma.formSubmission.update({
      where: { id: submissionId },
      data: {
        approvalFlowId: flowId,
        approvalStatus: 'PENDING',
        currentNodeSequence: firstNode.sequence,
      },
    });

    return { success: true, message: '审批流程已启动' };
  }

  /**
   * 为节点创建审批任务
   */
  private async createTasksForNode(
    submissionId: string,
    node: any,
    flowId: string,
    submitterId?: string,
  ) {
    // 动态解析审批人
    let approvers: { userId: string; userName: string }[];

    if (submitterId) {
      approvers = await this.resolveApprovers(node, submitterId);
    } else {
      // 获取提交人ID
      const submission = await this.prisma.formSubmission.findUnique({
        where: { id: submissionId },
        select: { submittedBy: true },
      });
      approvers = await this.resolveApprovers(node, submission?.submittedBy || '');
    }

    if (!approvers || approvers.length === 0) {
      throw new Error(`节点 "${node.name}" 没有可用的审批人`);
    }

    // 为每个审批人创建任务
    const tasks = approvers.map(approver => ({
      submissionId,
      flowId,
      nodeId: node.id,
      nodeName: node.name,
      nodeSequence: node.sequence,
      approverId: approver.userId,
      status: 'PENDING' as const,
    }));

    await this.prisma.approvalTask.createMany({
      data: tasks,
    });
  }

  /**
   * 获取提交记录的审批历史
   */
  async getApprovalHistory(submissionId: string) {
    const tasks = await this.prisma.approvalTask.findMany({
      where: { submissionId },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            position: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: [{ nodeSequence: 'asc' }, { completedAt: 'asc' }],
    });

    return tasks.map(task => ({
      id: task.id,
      nodeName: task.nodeName,
      nodeSequence: task.nodeSequence,
      approver: {
        id: task.approver.id,
        name: task.approver.name,
        position: task.approver.position?.name,
      },
      status: task.status,
      action: task.action,
      comment: task.comment,
      assignedAt: task.assignedAt,
      completedAt: task.completedAt,
    }));
  }
}

// ==================== DTO 类型定义 ====================

interface CreateFlowDto {
  name: string;
  description?: string;
  formTemplateId?: string;
  nodes?: CreateNodeDto[];
}

interface UpdateFlowDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  nodes?: CreateNodeDto[];
}

interface CreateNodeDto {
  name: string;
  sequence?: number;
  type?: 'SERIAL' | 'PARALLEL';
  parallelMode?: 'AND' | 'OR';
  approvers?: { userId: string; userName: string }[];
  approverType?: 'user' | 'role' | 'position' | 'superior';
  canReject?: boolean;
  canReturn?: boolean;
  canTransfer?: boolean;
  rejectBehavior?: 'END' | 'RETURN_TO_START' | 'RETURN_TO_PREVIOUS';
  timeoutHours?: number;
}

interface UpdateNodeDto extends Partial<CreateNodeDto> {}
