import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  message,
  Popconfirm,
  Tag,
  Tooltip,
  Empty,
  Spin,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ArrowDownOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import { approvalApi } from '../../services/api';

interface ApproverOption {
  userId: string;
  userName: string;
  email?: string;
  role?: string;
  position?: string;
  positionType?: string;
}

interface ApprovalNode {
  id?: string;
  name: string;
  sequence: number;
  type: 'SERIAL' | 'PARALLEL';
  parallelMode?: 'AND' | 'OR';
  approvers: { userId: string; userName: string }[];
  approverType: 'user' | 'role' | 'position' | 'superior';
  canReject: boolean;
  canReturn: boolean;
  canTransfer: boolean;
  rejectBehavior: 'END' | 'RETURN_TO_START' | 'RETURN_TO_PREVIOUS';
  timeoutHours?: number;
}

interface ApprovalFlow {
  id?: string;
  name: string;
  description?: string;
  formTemplateId?: string;
  nodes: ApprovalNode[];
  isActive: boolean;
}

interface ApprovalFlowDesignerProps {
  templateId?: string;
  flowId?: string;
  value?: ApprovalFlow;
  onChange?: (flow: ApprovalFlow) => void;
  onSave?: (flow: ApprovalFlow) => void;
  readOnly?: boolean;
}

const ApprovalFlowDesigner: React.FC<ApprovalFlowDesignerProps> = ({
  templateId,
  flowId,
  value,
  onChange,
  onSave,
  readOnly = false,
}) => {
  const [flow, setFlow] = useState<ApprovalFlow>({
    name: '',
    description: '',
    formTemplateId: templateId,
    nodes: [],
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [nodeModalVisible, setNodeModalVisible] = useState(false);
  const [editingNode, setEditingNode] = useState<ApprovalNode | null>(null);
  const [editingNodeIndex, setEditingNodeIndex] = useState<number>(-1);
  const [approverOptions, setApproverOptions] = useState<ApproverOption[]>([]);
  const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([]);
  const [positionOptions, setPositionOptions] = useState<{ value: string; label: string }[]>([]);
  const [form] = Form.useForm();

  // 加载审批流程
  useEffect(() => {
    if (flowId) {
      loadFlow(flowId);
    } else if (value) {
      setFlow(value);
    }
    loadOptions();
  }, [flowId, value]);

  const loadFlow = async (id: string) => {
    setLoading(true);
    try {
      const data = await approvalApi.getFlow(id);
      setFlow(data);
    } catch (error) {
      message.error('加载审批流程失败');
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [approvers, roles, positions] = await Promise.all([
        approvalApi.getApproverOptions(),
        approvalApi.getRoleOptions(),
        approvalApi.getPositionOptions(),
      ]);
      console.log('审批人选项:', approvers);
      console.log('角色选项:', roles);
      console.log('职位选项:', positions);
      setApproverOptions(approvers);
      setRoleOptions(roles);
      setPositionOptions(positions);
    } catch (error) {
      console.error('加载选项失败', error);
      message.error('加载审批人选项失败，请刷新重试');
    }
  };

  const handleFlowChange = (newFlow: ApprovalFlow) => {
    setFlow(newFlow);
    onChange?.(newFlow);
  };

  // 添加节点
  const handleAddNode = () => {
    setEditingNode(null);
    setEditingNodeIndex(-1);
    form.resetFields();
    form.setFieldsValue({
      name: `审批节点 ${flow.nodes.length + 1}`,
      type: 'SERIAL',
      approverType: 'user',
      approvers: [],
      canReject: true,
      canReturn: true,
      canTransfer: false,
      rejectBehavior: 'END',
    });
    setNodeModalVisible(true);
  };

  // 编辑节点
  const handleEditNode = (node: ApprovalNode, index: number) => {
    setEditingNode(node);
    setEditingNodeIndex(index);
    form.setFieldsValue({
      ...node,
      approvers: node.approvers.map(a => a.userId),
    });
    setNodeModalVisible(true);
  };

  // 删除节点
  const handleDeleteNode = (index: number) => {
    const newNodes = flow.nodes.filter((_, i) => i !== index);
    // 重新排序
    const reorderedNodes = newNodes.map((node, i) => ({
      ...node,
      sequence: i + 1,
    }));
    handleFlowChange({ ...flow, nodes: reorderedNodes });
    message.success('节点已删除');
  };

  // 移动节点
  const handleMoveNode = (index: number, direction: 'up' | 'down') => {
    const newNodes = [...flow.nodes];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newNodes.length) return;

    [newNodes[index], newNodes[targetIndex]] = [newNodes[targetIndex], newNodes[index]];
    // 重新排序
    const reorderedNodes = newNodes.map((node, i) => ({
      ...node,
      sequence: i + 1,
    }));
    handleFlowChange({ ...flow, nodes: reorderedNodes });
  };

  // 保存节点
  const handleSaveNode = async () => {
    try {
      const values = await form.validateFields();
      const approverType = values.approverType || 'user';

      // 根据审批人类型处理 approvers 数据
      let approvers: { userId: string; userName: string }[] = [];

      if (approverType === 'user') {
        // 指定用户：存储用户ID和名称
        approvers = values.approvers?.map((userId: string) => {
          const option = approverOptions.find(o => o.userId === userId);
          return {
            userId,
            userName: option?.userName || userId,
          };
        }) || [];
      } else if (approverType === 'role') {
        // 角色：存储角色值和名称
        approvers = values.approvers?.map((roleValue: string) => {
          const option = roleOptions.find(o => o.value === roleValue);
          return {
            userId: roleValue, // 存储角色值作为ID
            userName: option?.label || roleValue,
          };
        }) || [];
      } else if (approverType === 'position') {
        // 职位：存储职位ID和名称
        approvers = values.approvers?.map((positionId: string) => {
          const option = positionOptions.find(o => o.value === positionId);
          return {
            userId: positionId, // 存储职位ID
            userName: option?.label || positionId,
          };
        }) || [];
      } else if (approverType === 'superior') {
        // 上级：无需选择，动态解析
        approvers = [];
      }

      const nodeData: ApprovalNode = {
        ...values,
        approvers,
        sequence: editingNodeIndex >= 0 ? editingNodeIndex + 1 : flow.nodes.length + 1,
      };

      let newNodes: ApprovalNode[];
      if (editingNodeIndex >= 0) {
        // 编辑现有节点
        newNodes = flow.nodes.map((node, i) => (i === editingNodeIndex ? nodeData : node));
      } else {
        // 添加新节点
        newNodes = [...flow.nodes, nodeData];
      }

      handleFlowChange({ ...flow, nodes: newNodes });
      setNodeModalVisible(false);
      message.success(editingNodeIndex >= 0 ? '节点已更新' : '节点已添加');
    } catch (error) {
      console.error('保存节点失败', error);
    }
  };

  // 保存整个流程
  const handleSaveFlow = async () => {
    if (!flow.name) {
      message.error('请输入流程名称');
      return;
    }

    if (flow.nodes.length === 0) {
      message.error('请至少添加一个审批节点');
      return;
    }

    setLoading(true);
    try {
      let savedFlow: ApprovalFlow;
      if (flow.id) {
        savedFlow = await approvalApi.updateFlow(flow.id, flow);
      } else {
        savedFlow = await approvalApi.createFlow(flow);
      }
      setFlow(savedFlow);
      onSave?.(savedFlow);
      message.success('审批流程保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取审批人类型显示文本
  const getApproverTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      user: '指定用户',
      role: '角色',
      position: '职位',
      superior: '上级',
    };
    return labels[type] || type;
  };

  // 获取审批人类型图标
  const getApproverTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      user: <UserOutlined />,
      role: <TeamOutlined />,
      position: <SafetyCertificateOutlined />,
      superior: <ArrowUpOutlined />,
    };
    return icons[type] || <UserOutlined />;
  };

  // 获取驳回行为显示文本
  const getRejectBehaviorLabel = (behavior: string) => {
    const labels: Record<string, string> = {
      END: '结束流程',
      RETURN_TO_START: '退回发起人',
      RETURN_TO_PREVIOUS: '退回上一节点',
    };
    return labels[behavior] || behavior;
  };

  if (loading && !flow.id && !value) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="approval-flow-designer">
      {/* 流程基本信息 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="流程名称"
            value={flow.name}
            onChange={e => handleFlowChange({ ...flow, name: e.target.value })}
            disabled={readOnly}
            style={{ fontWeight: 'bold', fontSize: 16 }}
          />
          <Input.TextArea
            placeholder="流程描述（可选）"
            value={flow.description}
            onChange={e => handleFlowChange({ ...flow, description: e.target.value })}
            disabled={readOnly}
            rows={2}
          />
        </Space>
      </Card>

      {/* 节点列表 */}
      <div style={{ marginBottom: 16 }}>
        {flow.nodes.length === 0 ? (
          <Empty description="暂无审批节点" style={{ padding: '40px 0' }} />
        ) : (
          <div className="approval-nodes">
            {flow.nodes.map((node, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <ArrowDownOutlined style={{ fontSize: 20, color: '#999' }} />
                  </div>
                )}
                <Card
                  size="small"
                  style={{ marginBottom: 0 }}
                  bodyStyle={{ padding: '12px 16px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: 8 }}>
                        <Tag color="blue">第 {node.sequence} 级</Tag>
                        <strong style={{ marginLeft: 8 }}>{node.name}</strong>
                      </div>
                      <Space size={[8, 4]} wrap>
                        <Tooltip title="审批人类型">
                          <Tag icon={getApproverTypeIcon(node.approverType)}>
                            {getApproverTypeLabel(node.approverType)}
                          </Tag>
                        </Tooltip>
                        {node.type === 'PARALLEL' && (
                          <Tag color="orange">
                            {node.parallelMode === 'AND' ? '会签（全部通过）' : '或签（任意通过）'}
                          </Tag>
                        )}
                        {node.approverType === 'user' && node.approvers.length > 0 && (
                          <Tooltip title={node.approvers.map(a => a.userName).join(', ')}>
                            <Tag>{node.approvers.length} 人</Tag>
                          </Tooltip>
                        )}
                      </Space>
                      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                        <Space split={<Divider type="vertical" />}>
                          <span>驳回: {getRejectBehaviorLabel(node.rejectBehavior)}</span>
                          {node.canReturn && <span>可退回</span>}
                          {node.canTransfer && <span>可转交</span>}
                          {node.timeoutHours && <span>超时: {node.timeoutHours}h</span>}
                        </Space>
                      </div>
                    </div>
                    {!readOnly && (
                      <Space>
                        <Tooltip title="上移">
                          <Button
                            type="text"
                            size="small"
                            icon={<ArrowUpOutlined />}
                            disabled={index === 0}
                            onClick={() => handleMoveNode(index, 'up')}
                          />
                        </Tooltip>
                        <Tooltip title="下移">
                          <Button
                            type="text"
                            size="small"
                            icon={<ArrowDownOutlined />}
                            disabled={index === flow.nodes.length - 1}
                            onClick={() => handleMoveNode(index, 'down')}
                          />
                        </Tooltip>
                        <Tooltip title="编辑">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEditNode(node, index)}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="确定删除此节点？"
                          onConfirm={() => handleDeleteNode(index)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Tooltip title="删除">
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                            />
                          </Tooltip>
                        </Popconfirm>
                      </Space>
                    )}
                  </div>
                </Card>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {!readOnly && (
        <Space>
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddNode}>
            添加审批节点
          </Button>
          <Button type="primary" onClick={handleSaveFlow} loading={loading}>
            保存流程
          </Button>
        </Space>
      )}

      {/* 节点编辑弹窗 */}
      <Modal
        title={editingNodeIndex >= 0 ? '编辑审批节点' : '添加审批节点'}
        open={nodeModalVisible}
        onOk={handleSaveNode}
        onCancel={() => setNodeModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="节点名称"
            rules={[{ required: true, message: '请输入节点名称' }]}
          >
            <Input placeholder="如：部门主管审批、财务审核" />
          </Form.Item>

          <Form.Item
            name="approverType"
            label="审批人类型"
            rules={[{ required: true, message: '请选择审批人类型' }]}
          >
            <Select
              options={[
                { value: 'user', label: '指定用户' },
                { value: 'role', label: '角色' },
                { value: 'position', label: '职位' },
                { value: 'superior', label: '上级' },
              ]}
            />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.approverType !== curr.approverType}>
            {({ getFieldValue }) => {
              const approverType = getFieldValue('approverType');
              if (approverType === 'user') {
                return (
                  <Form.Item
                    name="approvers"
                    label="选择审批人"
                    rules={[{ required: true, message: '请选择审批人' }]}
                  >
                    <Select
                      mode="multiple"
                      placeholder={approverOptions.length === 0 ? '暂无可选审批人，请先添加教师' : '请选择审批人（可按姓名或职位搜索）'}
                      showSearch
                      notFoundContent={approverOptions.length === 0 ? '暂无审批人，请先在系统中添加教师' : '无匹配结果'}
                      filterOption={(input, option) => {
                        const label = option?.label as string || '';
                        return label.toLowerCase().includes(input.toLowerCase());
                      }}
                    >
                      {approverOptions.map(opt => (
                        <Select.Option
                          key={opt.userId}
                          value={opt.userId}
                          label={`${opt.userName} ${opt.position || ''} ${opt.email || ''}`}
                        >
                          <Space>
                            <strong>{opt.userName}</strong>
                            {opt.position && (
                              <Tag color="blue">{opt.position}</Tag>
                            )}
                            {opt.role && (
                              <Tag color="green">{opt.role}</Tag>
                            )}
                            <span style={{ color: '#999', fontSize: 12 }}>
                              {opt.email}
                            </span>
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                );
              }
              if (approverType === 'role') {
                return (
                  <Form.Item
                    name="approvers"
                    label="选择角色"
                    rules={[{ required: true, message: '请选择角色' }]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="请选择角色"
                      options={roleOptions}
                    />
                  </Form.Item>
                );
              }
              if (approverType === 'position') {
                return (
                  <Form.Item
                    name="approvers"
                    label="选择职位"
                    rules={[{ required: true, message: '请选择职位' }]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="请选择职位"
                    >
                      {positionOptions.map(opt => (
                        <Select.Option key={opt.value} value={opt.value}>
                          <Space>
                            <span>{opt.label}</span>
                            <Tag color="cyan">{opt.type}</Tag>
                            <Tag>层级 {opt.level}</Tag>
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                );
              }
              if (approverType === 'superior') {
                return (
                  <Form.Item label="上级审批说明">
                    <div style={{ padding: '12px', background: '#f6f8fa', borderRadius: 6 }}>
                      <p style={{ margin: 0, color: '#666' }}>
                        系统将根据提交人的职位层级，自动查找其直属上级作为审批人。
                      </p>
                      <p style={{ margin: '8px 0 0', color: '#999', fontSize: 12 }}>
                        查找规则：优先查找职位父级关系，其次按职位层级向上查找同园区的上级。
                      </p>
                    </div>
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.approverType !== curr.approverType}>
            {({ getFieldValue }) => {
              const approverType = getFieldValue('approverType');
              if (approverType === 'user' || approverType === 'role' || approverType === 'position') {
                return (
                  <>
                    <Form.Item name="type" label="审批方式">
                      <Select
                        options={[
                          { value: 'SERIAL', label: '串行（依次审批）' },
                          { value: 'PARALLEL', label: '并行（同时审批）' },
                        ]}
                      />
                    </Form.Item>

                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
                      {({ getFieldValue: getField }) => {
                        if (getField('type') === 'PARALLEL') {
                          return (
                            <Form.Item name="parallelMode" label="并行模式">
                              <Select
                                options={[
                                  { value: 'AND', label: '会签（全部通过才通过）' },
                                  { value: 'OR', label: '或签（任意通过即通过）' },
                                ]}
                              />
                            </Form.Item>
                          );
                        }
                        return null;
                      }}
                    </Form.Item>
                  </>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item name="rejectBehavior" label="驳回行为">
            <Select
              options={[
                { value: 'END', label: '结束流程' },
                { value: 'RETURN_TO_START', label: '退回发起人' },
                { value: 'RETURN_TO_PREVIOUS', label: '退回上一节点' },
              ]}
            />
          </Form.Item>

          <Form.Item name="timeoutHours" label="超时时间（小时）">
            <Input type="number" placeholder="留空表示不限时" min={1} />
          </Form.Item>

          <div style={{ display: 'flex', gap: 24 }}>
            <Form.Item name="canReject" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch checkedChildren="可驳回" unCheckedChildren="不可驳回" />
            </Form.Item>
            <Form.Item name="canReturn" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch checkedChildren="可退回" unCheckedChildren="不可退回" />
            </Form.Item>
            <Form.Item name="canTransfer" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch checkedChildren="可转交" unCheckedChildren="不可转交" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <style>{`
        .approval-flow-designer {
          padding: 16px;
          background: #f5f5f5;
          border-radius: 8px;
        }
        .approval-nodes .ant-card {
          border-left: 3px solid #1890ff;
        }
      `}</style>
    </div>
  );
};

export default ApprovalFlowDesigner;
