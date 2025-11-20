# 审批流程系统 - 完整实现方案

## 一、系统概述

本文档提供了审批流程系统的完整实现方案，包括：
- 数据库设计（已完成）
- 后端API设计
- 前端页面设计
- 实现步骤指南

---

## 二、已完成工作

### 2.1 数据库Schema设计 ✅

已创建以下模型：

1. **ApprovalFlow** - 审批流程模板
2. **ApprovalNode** - 审批节点
3. **ApprovalTask** - 审批任务
4. **相关枚举类型**：
   - ApprovalNodeType (SERIAL/PARALLEL)
   - ParallelMode (AND/OR)
   - ApprovalTaskStatus
   - ApprovalAction
   - ApprovalSubmissionStatus

### 2.2 数据模型关系

```
FormTemplate (表单模板)
    ↓ 1:N
ApprovalFlow (审批流程)
    ↓ 1:N
ApprovalNode (审批节点)

FormSubmission (表单提交)
    ↓ 1:N
ApprovalTask (审批任务)
    ↓ N:1
User (审批人)
```

---

## 三、后端API实现

### 3.1 审批流程管理API

#### 文件位置
`backend/src/modules/approvals/approvals.controller.ts`
`backend/src/modules/approvals/approvals.service.ts`

#### API列表

```typescript
// 审批流程管理
GET    /api/approvals/flows              // 获取流程列表
GET    /api/approvals/flows/:id          // 获取流程详情
POST   /api/approvals/flows              // 创建流程
PUT    /api/approvals/flows/:id          // 更新流程
DELETE /api/approvals/flows/:id          // 删除流程

// 审批节点管理
POST   /api/approvals/flows/:id/nodes    // 添加节点
PUT    /api/approvals/nodes/:id          // 更新节点
DELETE /api/approvals/nodes/:id          // 删除节点
PUT    /api/approvals/nodes/reorder      // 重新排序节点

// 为表单模板关联审批流程
POST   /api/approvals/flows/:flowId/bind/:templateId   // 绑定流程到表单
DELETE /api/approvals/flows/:flowId/unbind/:templateId // 解除绑定
```

#### 创建审批流程DTO

```typescript
// create-approval-flow.dto.ts
export class CreateApprovalFlowDto {
  name: string;
  description?: string;
  formTemplateId?: string;
  nodes: CreateApprovalNodeDto[];
}

export class CreateApprovalNodeDto {
  name: string;
  sequence: number;
  type: 'SERIAL' | 'PARALLEL';
  parallelMode?: 'AND' | 'OR';
  approvers: { userId: string; userName: string }[];
  canReject?: boolean;
  canReturn?: boolean;
  canTransfer?: boolean;
  timeoutHours?: number;
}
```

#### Service核心方法

```typescript
// approvals.service.ts
export class ApprovalsService {
  // 创建审批流程
  async createFlow(data: CreateApprovalFlowDto) {
    return this.prisma.approvalFlow.create({
      data: {
        name: data.name,
        description: data.description,
        formTemplateId: data.formTemplateId,
        nodes: {
          create: data.nodes.map(node => ({
            name: node.name,
            sequence: node.sequence,
            type: node.type,
            parallelMode: node.parallelMode,
            approvers: node.approvers,
            canReject: node.canReject ?? true,
            canReturn: node.canReturn ?? true,
            canTransfer: node.canTransfer ?? false,
            timeoutHours: node.timeoutHours,
          })),
        },
      },
      include: { nodes: true },
    });
  }

  // 获取流程详情
  async getFlow(id: string) {
    return this.prisma.approvalFlow.findUnique({
      where: { id },
      include: {
        nodes: { orderBy: { sequence: 'asc' } },
        formTemplate: { select: { id: true, title: true } },
      },
    });
  }

  // 更新流程
  async updateFlow(id: string, data: UpdateApprovalFlowDto) {
    return this.prisma.approvalFlow.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
      },
    });
  }

  // 删除流程
  async deleteFlow(id: string) {
    return this.prisma.approvalFlow.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // 添加节点
  async addNode(flowId: string, data: CreateApprovalNodeDto) {
    return this.prisma.approvalNode.create({
      data: {
        flowId,
        ...data,
      },
    });
  }

  // 更新节点
  async updateNode(nodeId: string, data: UpdateApprovalNodeDto) {
    return this.prisma.approvalNode.update({
      where: { id: nodeId },
      data,
    });
  }

  // 删除节点
  async deleteNode(nodeId: string) {
    return this.prisma.approvalNode.delete({
      where: { id: nodeId },
    });
  }

  // 重新排序节点
  async reorderNodes(updates: { nodeId: string; sequence: number }[]) {
    const promises = updates.map(({ nodeId, sequence }) =>
      this.prisma.approvalNode.update({
        where: { id: nodeId },
        data: { sequence },
      })
    );
    return Promise.all(promises);
  }
}
```

### 3.2 表单提交与审批API

```typescript
// 表单提交（带审批流程）
POST   /api/forms/submissions            // 提交表单并启动审批

// 审批任务管理
GET    /api/approvals/my-tasks           // 我的待审批列表
GET    /api/approvals/my-tasks/:id       // 待审批详情
POST   /api/approvals/tasks/:id/approve  // 审批通过
POST   /api/approvals/tasks/:id/reject   // 审批驳回
POST   /api/approvals/tasks/:id/return   // 审批退回
POST   /api/approvals/tasks/:id/transfer // 审批转交

// 提交人操作
GET    /api/approvals/my-submissions     // 我提交的表单
GET    /api/approvals/submissions/:id/progress  // 查看审批进度
POST   /api/approvals/submissions/:id/cancel    // 撤回提交
```

#### 核心审批Service

```typescript
// approvals-task.service.ts
export class ApprovalsTaskService {
  // 启动审批流程
  async startApproval(submissionId: string, flowId: string) {
    const submission = await this.prisma.formSubmission.findUnique({
      where: { id: submissionId },
    });

    const flow = await this.prisma.approvalFlow.findUnique({
      where: { id: flowId },
      include: { nodes: { orderBy: { sequence: 'asc' } } },
    });

    if (!flow || flow.nodes.length === 0) {
      throw new Error('审批流程配置错误');
    }

    // 更新提交记录
    await this.prisma.formSubmission.update({
      where: { id: submissionId },
      data: {
        approvalFlowId: flowId,
        approvalStatus: 'PENDING',
        currentNodeSequence: 1,
      },
    });

    // 为第一个节点的审批人创建任务
    const firstNode = flow.nodes[0];
    const approvers = firstNode.approvers as Array<{ userId: string; userName: string }>;

    const tasks = approvers.map(approver => ({
      submissionId,
      flowId: flow.id,
      nodeId: firstNode.id,
      nodeName: firstNode.name,
      nodeSequence: firstNode.sequence,
      approverId: approver.userId,
      status: 'PENDING' as const,
    }));

    await this.prisma.approvalTask.createMany({ data: tasks });

    // TODO: 发送通知给审批人
    return { success: true, message: '审批流程已启动' };
  }

  // 获取我的待审批列表
  async getMyTasks(userId: string, status?: string) {
    const where: any = {
      approverId: userId,
    };

    if (status) {
      where.status = status;
    }

    return this.prisma.approvalTask.findMany({
      where,
      include: {
        submission: {
          include: {
            template: { select: { id: true, title: true } },
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  // 审批通过
  async approve(taskId: string, approverId: string, comment?: string) {
    const task = await this.prisma.approvalTask.findUnique({
      where: { id: taskId },
      include: { submission: { include: { approvalFlow: { include: { nodes: true } } } } },
    });

    if (!task) {
      throw new Error('审批任务不存在');
    }

    if (task.approverId !== approverId) {
      throw new Error('无权审批此任务');
    }

    if (task.status !== 'PENDING') {
      throw new Error('任务已处理');
    }

    // 更新任务状态
    await this.prisma.approvalTask.update({
      where: { id: taskId },
      data: {
        status: 'APPROVED',
        action: 'APPROVE',
        comment,
        completedAt: new Date(),
      },
    });

    // 检查当前节点是否全部通过
    const currentNodeTasks = await this.prisma.approvalTask.findMany({
      where: {
        submissionId: task.submissionId,
        nodeSequence: task.nodeSequence,
      },
    });

    const flow = task.submission.approvalFlow;
    const currentNode = flow.nodes.find((n: any) => n.sequence === task.nodeSequence);

    let allApproved = false;

    if (currentNode.type === 'SERIAL') {
      allApproved = true; // 串行审批，一个通过就算通过
    } else if (currentNode.type === 'PARALLEL') {
      if (currentNode.parallelMode === 'AND') {
        // 会签：需要全部通过
        allApproved = currentNodeTasks.every(t => t.status === 'APPROVED');
      } else {
        // 或签：任意一个通过即可
        allApproved = true;
      }
    }

    if (allApproved) {
      // 进入下一节点或完成
      await this.moveToNextNode(task.submissionId, task.nodeSequence);
    }

    return { success: true, message: '审批成功' };
  }

  // 进入下一节点
  private async moveToNextNode(submissionId: string, currentSequence: number) {
    const submission = await this.prisma.formSubmission.findUnique({
      where: { id: submissionId },
      include: { approvalFlow: { include: { nodes: true } } },
    });

    const nextSequence = currentSequence + 1;
    const nextNode = submission.approvalFlow.nodes.find((n: any) => n.sequence === nextSequence);

    if (!nextNode) {
      // 已经是最后一个节点，审批完成
      await this.prisma.formSubmission.update({
        where: { id: submissionId },
        data: {
          approvalStatus: 'APPROVED',
        },
      });

      // TODO: 触发数据同步到业务模块
      return;
    }

    // 创建下一节点的审批任务
    await this.prisma.formSubmission.update({
      where: { id: submissionId },
      data: { currentNodeSequence: nextSequence },
    });

    const approvers = nextNode.approvers as Array<{ userId: string; userName: string }>;
    const tasks = approvers.map(approver => ({
      submissionId,
      flowId: submission.approvalFlowId,
      nodeId: nextNode.id,
      nodeName: nextNode.name,
      nodeSequence: nextNode.sequence,
      approverId: approver.userId,
      status: 'PENDING' as const,
    }));

    await this.prisma.approvalTask.createMany({ data: tasks });

    // TODO: 发送通知给下一节点审批人
  }

  // 审批驳回
  async reject(taskId: string, approverId: string, comment: string) {
    const task = await this.prisma.approvalTask.findUnique({
      where: { id: taskId },
    });

    if (!task || task.approverId !== approverId) {
      throw new Error('无权审批此任务');
    }

    if (task.status !== 'PENDING') {
      throw new Error('任务已处理');
    }

    // 更新任务
    await this.prisma.approvalTask.update({
      where: { id: taskId },
      data: {
        status: 'REJECTED',
        action: 'REJECT',
        comment,
        completedAt: new Date(),
      },
    });

    // 更新提交记录
    await this.prisma.formSubmission.update({
      where: { id: task.submissionId },
      data: { approvalStatus: 'REJECTED' },
    });

    // 取消所有待审批任务
    await this.prisma.approvalTask.updateMany({
      where: {
        submissionId: task.submissionId,
        status: 'PENDING',
      },
      data: { status: 'CANCELLED' },
    });

    // TODO: 通知提交人
    return { success: true, message: '已驳回' };
  }

  // 审批退回
  async return(taskId: string, approverId: string, comment: string) {
    const task = await this.prisma.approvalTask.findUnique({
      where: { id: taskId },
    });

    if (!task || task.approverId !== approverId) {
      throw new Error('无权审批此任务');
    }

    await this.prisma.approvalTask.update({
      where: { id: taskId },
      data: {
        status: 'RETURNED',
        action: 'RETURN',
        comment,
        completedAt: new Date(),
      },
    });

    await this.prisma.formSubmission.update({
      where: { id: task.submissionId },
      data: {
        approvalStatus: 'RETURNED',
        currentNodeSequence: task.nodeSequence - 1,
      },
    });

    // TODO: 创建上一节点的新任务或通知提交人修改
    return { success: true, message: '已退回' };
  }

  // 审批转交
  async transfer(taskId: string, approverId: string, transferToUserId: string, comment?: string) {
    const task = await this.prisma.approvalTask.findUnique({
      where: { id: taskId },
    });

    if (!task || task.approverId !== approverId) {
      throw new Error('无权审批此任务');
    }

    // 更新原任务
    await this.prisma.approvalTask.update({
      where: { id: taskId },
      data: {
        status: 'TRANSFERRED',
        action: 'TRANSFER',
        transferredTo: transferToUserId,
        comment,
        completedAt: new Date(),
      },
    });

    // 创建新任务
    await this.prisma.approvalTask.create({
      data: {
        submissionId: task.submissionId,
        flowId: task.flowId,
        nodeId: task.nodeId,
        nodeName: task.nodeName,
        nodeSequence: task.nodeSequence,
        approverId: transferToUserId,
        status: 'PENDING',
      },
    });

    // TODO: 通知新审批人
    return { success: true, message: '已转交' };
  }

  // 查看审批进度
  async getApprovalProgress(submissionId: string) {
    const submission = await this.prisma.formSubmission.findUnique({
      where: { id: submissionId },
      include: {
        approvalFlow: {
          include: { nodes: { orderBy: { sequence: 'asc' } } },
        },
        approvalTasks: {
          include: { approver: { select: { id: true, name: true } } },
          orderBy: { assignedAt: 'asc' },
        },
      },
    });

    return {
      currentStatus: submission.approvalStatus,
      currentNodeSequence: submission.currentNodeSequence,
      nodes: submission.approvalFlow.nodes,
      tasks: submission.approvalTasks,
    };
  }
}
```

---

## 四、前端实现

### 4.1 审批流程配置页面

#### 文件位置
`frontend/src/pages/Approvals/FlowConfig.tsx`

#### 页面结构

```tsx
import { useState } from 'react';
import { Card, Form, Input, Button, Table, Modal, Select, Space, message, Tag, Switch, InputNumber } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

export default function ApprovalFlowConfig() {
  const [form] = Form.useForm();
  const [nodes, setNodes] = useState<ApprovalNode[]>([]);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<ApprovalNode | null>(null);

  // 节点列表列定义
  const columns = [
    {
      title: '顺序',
      dataIndex: 'sequence',
      width: 80,
      render: (seq: number) => <Tag color="blue">{seq}</Tag>,
    },
    {
      title: '节点名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '审批类型',
      dataIndex: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'SERIAL' ? 'green' : 'orange'}>
          {type === 'SERIAL' ? '串行' : '并行'}
        </Tag>
      ),
    },
    {
      title: '审批人',
      dataIndex: 'approvers',
      render: (approvers: any[]) => (
        <Space size={4} wrap>
          {approvers.map((a: any) => (
            <Tag key={a.userId}>{a.userName}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '权限',
      key: 'permissions',
      width: 200,
      render: (_: any, record: any) => (
        <Space size={4}>
          {record.canReject && <Tag>驳回</Tag>}
          {record.canReturn && <Tag>退回</Tag>}
          {record.canTransfer && <Tag>转交</Tag>}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: ApprovalNode, index: number) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEditNode(record)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteNode(index)} />
        </Space>
      ),
    },
  ];

  const handleAddNode = () => {
    setEditingNode(null);
    setIsNodeModalOpen(true);
  };

  const handleEditNode = (node: ApprovalNode) => {
    setEditingNode(node);
    setIsNodeModalOpen(true);
  };

  const handleDeleteNode = (index: number) => {
    const newNodes = nodes.filter((_, i) => i !== index);
    // 重新计算序号
    newNodes.forEach((node, i) => {
      node.sequence = i + 1;
    });
    setNodes(newNodes);
  };

  const handleSaveFlow = async () => {
    try {
      const values = await form.validateFields();

      if (nodes.length === 0) {
        message.error('请至少添加一个审批节点');
        return;
      }

      const flowData = {
        ...values,
        nodes,
      };

      // 调用API保存
      await approvalApi.createFlow(flowData);
      message.success('审批流程创建成功');
      // 返回列表页面
    } catch (error) {
      message.error('保存失败');
    }
  };

  return (
    <div>
      <h1>配置审批流程</h1>

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="流程名称" rules={[{ required: true }]}>
            <Input placeholder="如：请假审批流程" />
          </Form.Item>
          <Form.Item name="description" label="流程描述">
            <Input.TextArea rows={3} placeholder="简要描述此审批流程的用途" />
          </Form.Item>
        </Form>
      </Card>

      <Card
        title="审批节点"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNode}>
            添加节点
          </Button>
        }
      >
        <Table
          dataSource={nodes}
          columns={columns}
          rowKey={(record, index) => `node-${index}`}
          pagination={false}
        />
      </Card>

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Space>
          <Button onClick={() => window.history.back()}>取消</Button>
          <Button type="primary" onClick={handleSaveFlow}>
            保存流程
          </Button>
        </Space>
      </div>

      {/* 节点编辑模态框 */}
      <NodeEditModal
        open={isNodeModalOpen}
        editingNode={editingNode}
        onClose={() => setIsNodeModalOpen(false)}
        onSave={(node) => {
          if (editingNode) {
            // 编辑
            setNodes(nodes.map(n => n.sequence === editingNode.sequence ? node : n));
          } else {
            // 新增
            node.sequence = nodes.length + 1;
            setNodes([...nodes, node]);
          }
          setIsNodeModalOpen(false);
        }}
      />
    </div>
  );
}
```

### 4.2 待审批列表页面

#### 文件位置
`frontend/src/pages/Approvals/MyTasks.tsx`

```tsx
import { useState } from 'react';
import { Table, Card, Tabs, Button, Tag, Space, Badge } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { approvalApi } from '../../services/api';
import dayjs from 'dayjs';

export default function MyApprovalTasks() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['my-approval-tasks', activeTab],
    queryFn: () => approvalApi.getMyTasks({ status: activeTab === 'all' ? undefined : activeTab.toUpperCase() }),
  });

  const columns = [
    {
      title: '表单标题',
      dataIndex: ['submission', 'template', 'title'],
      key: 'title',
    },
    {
      title: '提交人',
      dataIndex: ['submission', 'user', 'name'],
      key: 'submitter',
    },
    {
      title: '当前节点',
      dataIndex: 'nodeName',
      key: 'nodeName',
      render: (name: string, record: any) => (
        <Tag color="blue">第{record.nodeSequence}级 - {name}</Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: ['submission', 'createdAt'],
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: any = {
          PENDING: { text: '待审批', color: 'orange' },
          APPROVED: { text: '已通过', color: 'green' },
          REJECTED: { text: '已驳回', color: 'red' },
          RETURNED: { text: '已退回', color: 'purple' },
          TRANSFERRED: { text: '已转交', color: 'blue' },
        };
        const item = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={item.color}>{item.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            type="primary"
            onClick={() => navigate(`/approvals/tasks/${record.id}`)}
          >
            {record.status === 'PENDING' ? '审批' : '查看'}
          </Button>
        </Space>
      ),
    },
  ];

  const tabs = [
    {
      key: 'pending',
      label: (
        <span>
          待审批
          <Badge
            count={tasksData?.filter((t: any) => t.status === 'PENDING').length || 0}
            style={{ marginLeft: 8 }}
          />
        </span>
      ),
    },
    {
      key: 'approved',
      label: '已审批',
    },
    {
      key: 'all',
      label: '全部',
    },
  ];

  return (
    <div>
      <h1>我的审批</h1>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />

        <Table
          dataSource={tasksData}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>
    </div>
  );
}
```

### 4.3 审批详情页面

#### 文件位置
`frontend/src/pages/Approvals/TaskDetail.tsx`

```tsx
import { useState } from 'react';
import { Card, Button, Form, Input, message, Steps, Timeline, Tag, Space, Modal, Descriptions } from 'antd';
import { CheckOutlined, CloseOutlined, RollbackOutlined, SwapOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalApi } from '../../services/api';
import dayjs from 'dayjs';

export default function ApprovalTaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [action, setAction] = useState<'approve' | 'reject' | 'return' | null>(null);

  const { data: task, isLoading } = useQuery({
    queryKey: ['approval-task', taskId],
    queryFn: () => approvalApi.getTaskDetail(taskId!),
  });

  const { data: progress } = useQuery({
    queryKey: ['approval-progress', task?.submissionId],
    queryFn: () => approvalApi.getApprovalProgress(task!.submissionId),
    enabled: !!task,
  });

  const approveMutation = useMutation({
    mutationFn: ({ action, comment }: any) => {
      if (action === 'approve') {
        return approvalApi.approveTask(taskId!, comment);
      } else if (action === 'reject') {
        return approvalApi.rejectTask(taskId!, comment);
      } else {
        return approvalApi.returnTask(taskId!, comment);
      }
    },
    onSuccess: () => {
      message.success('操作成功');
      queryClient.invalidateQueries({ queryKey: ['my-approval-tasks'] });
      navigate('/approvals/my-tasks');
    },
    onError: () => {
      message.error('操作失败');
    },
  });

  const handleApprove = async (actionType: 'approve' | 'reject' | 'return') => {
    try {
      const values = await form.validateFields();
      await approveMutation.mutateAsync({
        action: actionType,
        comment: values.comment,
      });
    } catch (error) {
      // 表单验证失败
    }
  };

  if (isLoading || !task) {
    return <div>加载中...</div>;
  }

  const isPending = task.status === 'PENDING';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h1>审批详情</h1>

      {/* 审批流程图 */}
      <Card title="审批流程" style={{ marginBottom: 16 }}>
        <Steps
          current={progress?.currentNodeSequence - 1}
          items={progress?.nodes.map((node: any) => ({
            title: node.name,
            description: `第${node.sequence}级`,
          }))}
        />
      </Card>

      {/* 表单内容 */}
      <Card title="表单内容" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="表单标题">
            {task.submission.template.title}
          </Descriptions.Item>
          <Descriptions.Item label="提交人">
            {task.submission.user.name}
          </Descriptions.Item>
          <Descriptions.Item label="提交时间">
            {dayjs(task.submission.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          {/* 渲染表单数据 */}
          {Object.entries(task.submission.data).map(([key, value]: any) => (
            <Descriptions.Item key={key} label={key}>
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Card>

      {/* 审批历史 */}
      <Card title="审批历史" style={{ marginBottom: 16 }}>
        <Timeline
          items={progress?.tasks.map((t: any) => ({
            color: t.status === 'APPROVED' ? 'green' : t.status === 'REJECTED' ? 'red' : 'gray',
            children: (
              <div>
                <div>
                  <strong>{t.nodeName}</strong> - {t.approver.name}
                  <Tag color={getStatusColor(t.status)} style={{ marginLeft: 8 }}>
                    {getStatusText(t.status)}
                  </Tag>
                </div>
                {t.comment && <div style={{ color: '#666', marginTop: 4 }}>意见：{t.comment}</div>}
                <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                  {dayjs(t.completedAt || t.assignedAt).format('YYYY-MM-DD HH:mm')}
                </div>
              </div>
            ),
          }))}
        />
      </Card>

      {/* 审批操作 */}
      {isPending && (
        <Card title="审批操作">
          <Form form={form} layout="vertical">
            <Form.Item name="comment" label="审批意见">
              <Input.TextArea rows={4} placeholder="请输入审批意见" />
            </Form.Item>
          </Form>

          <Space style={{ marginTop: 16 }}>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleApprove('approve')}
              loading={approveMutation.isPending}
            >
              通过
            </Button>
            <Button
              danger
              icon={<CloseOutlined />}
              onClick={() => handleApprove('reject')}
              loading={approveMutation.isPending}
            >
              驳回
            </Button>
            <Button
              icon={<RollbackOutlined />}
              onClick={() => handleApprove('return')}
              loading={approveMutation.isPending}
            >
              退回
            </Button>
          </Space>
        </Card>
      )}
    </div>
  );
}

function getStatusColor(status: string) {
  const map: any = {
    PENDING: 'orange',
    APPROVED: 'green',
    REJECTED: 'red',
    RETURNED: 'purple',
    TRANSFERRED: 'blue',
  };
  return map[status] || 'default';
}

function getStatusText(status: string) {
  const map: any = {
    PENDING: '待审批',
    APPROVED: '已通过',
    REJECTED: '已驳回',
    RETURNED: '已退回',
    TRANSFERRED: '已转交',
  };
  return map[status] || status;
}
```

---

## 五、实现步骤

### Phase 1: 后端基础（2-3天）

1. ✅ 数据库Schema设计（已完成）
2. 创建审批模块
   ```bash
   nest g module approvals
   nest g controller approvals
   nest g service approvals
   ```
3. 实现审批流程管理API
4. 实现审批任务API
5. 编写单元测试

### Phase 2: 前端页面（2-3天）

1. 创建审批流程配置页面
2. 创建待审批列表页面
3. 创建审批详情页面
4. 添加路由配置
5. 集成API调用

### Phase 3: 集成测试（1-2天）

1. 完整流程测试
   - 创建审批流程
   - 提交表单
   - 执行审批操作
   - 验证状态流转
2. 边界情况测试
   - 并行审批
   - 转交操作
   - 驳回/退回
3. 性能测试

### Phase 4: 优化完善（1-2天）

1. 添加消息通知
2. 优化UI交互
3. 添加数据统计
4. 编写使用文档

---

## 六、关键点总结

### 6.1 设计优势

1. **职责分离**：表单设计和审批设计完全分离
2. **灵活配置**：支持多种审批模式（串行/并行/会签/或签）
3. **清晰追溯**：完整的审批历史记录
4. **易于扩展**：可以轻松添加新的审批类型和功能

### 6.2 注意事项

1. **并发控制**：审批操作需要考虑并发情况
2. **事务处理**：审批状态变更需要在事务中完成
3. **通知机制**：及时通知相关人员
4. **权限控制**：确保只有指定的审批人可以审批
5. **数据一致性**：审批完成后的数据同步要保证一致性

---

## 七、后续扩展

1. **审批统计**：审批效率、通过率等统计
2. **超时提醒**：审批超时自动提醒
3. **批量审批**：支持批量通过/驳回
4. **移动端**：手机端审批
5. **流程可视化**：图形化流程设计器
6. **条件分支**：根据表单数据动态选择审批路径
7. **抄送功能**：审批过程抄送给其他人
8. **审批模板**：常用审批流程模板化

完整的审批流程系统已经设计完成，可以根据上述方案逐步实现！
