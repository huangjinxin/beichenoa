import { useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, message, Space, Tag, Tabs, Popconfirm, Typography, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, ShareAltOutlined, DeleteOutlined, ReloadOutlined, CopyOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formApi, approvalApi } from '../../services/api';
import FormDesigner, { FormField } from '../../components/FormDesigner/FormDesigner';
import ApprovalFlowDesigner from '../../components/ApprovalFlowDesigner';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

export default function FormTemplates() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isApprovalFlowModalOpen, setIsApprovalFlowModalOpen] = useState(false);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [approvalFlowTemplateId, setApprovalFlowTemplateId] = useState<string | null>(null);
  const [approvalFlowTemplateName, setApprovalFlowTemplateName] = useState<string>('');
  const queryClient = useQueryClient();

  // 获取所有模板
  const { data: templates, isLoading } = useQuery({
    queryKey: ['form-templates'],
    queryFn: () => formApi.getTemplates(),
  });

  // 获取预置模板
  const { data: presetTemplates, isLoading: presetsLoading } = useQuery({
    queryKey: ['preset-templates'],
    queryFn: formApi.getPresetTemplates,
  });

  // 创建或更新模板
  const createMutation = useMutation({
    mutationFn: formApi.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
      setFormFields([]);
      setEditingId(null);
    },
    onError: () => {
      message.error(t('messages.saveFailed'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => formApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
      setFormFields([]);
      setEditingId(null);
    },
    onError: () => {
      message.error(t('messages.saveFailed'));
    },
  });

  // 生成分享链接
  const generateShareMutation = useMutation({
    mutationFn: formApi.generateShareLink,
    onSuccess: (data: any) => {
      const url = `${window.location.origin}/forms/share/${data.token}`;
      setShareUrl(url);
      setIsShareModalOpen(true);
    },
    onError: () => {
      message.error('生成分享链接失败');
    },
  });

  // 删除模板
  const deleteMutation = useMutation({
    mutationFn: formApi.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      message.success('删除成功');
    },
    onError: () => {
      message.error('删除失败');
    },
  });

  // 初始化预置模板
  const initPresetsMutation = useMutation({
    mutationFn: formApi.initPresetTemplates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      queryClient.invalidateQueries({ queryKey: ['preset-templates'] });
      message.success('预置模板初始化成功');
    },
    onError: () => {
      message.error('初始化失败');
    },
  });

  // 从预置模板创建
  const createFromPresetMutation = useMutation({
    mutationFn: formApi.createFromPreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      message.success('创建成功');
      setActiveTab('all');
    },
    onError: () => {
      message.error('创建失败');
    },
  });

  const handleSubmit = (values: any) => {
    if (formFields.length === 0) {
      message.warning('请至少添加一个表单字段');
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: {
          ...values,
          fields: formFields,
        },
      });
    } else {
      createMutation.mutate({
        ...values,
        fields: formFields,
      });
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    form.resetFields();
    setFormFields([]);
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
    });
    setFormFields(record.fields || []);
    setIsModalOpen(true);
  };

  const handleViewTemplate = (templateId: string) => {
    navigate(`/forms/fill/${templateId}`);
  };

  const handleShare = (templateId: string) => {
    generateShareMutation.mutate(templateId);
  };

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    message.success('链接已复制到剪贴板');
  };

  const handleCreateFromPreset = (presetId: string) => {
    createFromPresetMutation.mutate({ presetId });
  };

  const handleOpenApprovalFlow = (record: any) => {
    setApprovalFlowTemplateId(record.id);
    setApprovalFlowTemplateName(record.title);
    setIsApprovalFlowModalOpen(true);
  };

  const handleApprovalFlowSaved = () => {
    message.success('审批流程配置已保存');
    queryClient.invalidateQueries({ queryKey: ['form-templates'] });
  };

  const templateList = templates || [];
  const customTemplates = templateList.filter((t: any) => !t.isPreset);

  // 我的模板表格列定义
  const myTemplatesColumns = [
    {
      title: '模板名称',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '字段数',
      key: 'fieldCount',
      width: 80,
      render: (_: any, record: any) => Array.isArray(record.fields) ? record.fields.length : 0,
    },
    {
      title: '特性',
      key: 'features',
      width: 220,
      render: (_: any, record: any) => (
        <Space size={4}>
          {record.serialNumberConfig && <Tag color="blue">流水号</Tag>}
          {record.detailTableConfig?.enabled && <Tag color="purple">明细表</Tag>}
          {(record.approvalFlows?.length > 0) && <Tag color="orange">审批</Tag>}
          <Tag color={record.isActive ? 'green' : 'red'}>
            {record.isActive ? '启用' : '禁用'}
          </Tag>
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 360,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewTemplate(record.id)}
          >
            预览
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Tooltip title="配置审批流程">
            <Button
              size="small"
              icon={<ApartmentOutlined />}
              onClick={() => handleOpenApprovalFlow(record)}
            >
              审批
            </Button>
          </Tooltip>
          <Button
            size="small"
            icon={<ShareAltOutlined />}
            onClick={() => handleShare(record.id)}
            loading={generateShareMutation.isPending}
          >
            分享
          </Button>
          <Popconfirm
            title="确定删除此模板？"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 预置模板表格列定义
  const presetTemplatesColumns = [
    {
      title: '模板名称',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text: string) => (
        <Space>
          <Text>{text}</Text>
          <Tag color="gold">预置</Tag>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '字段数',
      key: 'fieldCount',
      width: 80,
      render: (_: any, record: any) => Array.isArray(record.fields) ? record.fields.length : 0,
    },
    {
      title: '特性',
      key: 'features',
      width: 220,
      render: (_: any, record: any) => (
        <Space size={4}>
          {record.serialNumberConfig && <Tag color="blue">流水号</Tag>}
          {record.detailTableConfig?.enabled && <Tag color="purple">明细表</Tag>}
          {(record.approvalFlows?.length > 0) && <Tag color="orange">审批</Tag>}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            type="primary"
            icon={<CopyOutlined />}
            onClick={() => handleCreateFromPreset(record.id)}
            loading={createFromPresetMutation.isPending}
          >
            使用模板
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewTemplate(record.id)}
          >
            预览
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>表单模板管理</h1>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => initPresetsMutation.mutate()}
            loading={initPresetsMutation.isPending}
          >
            初始化预置模板
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>
            添加模板
          </Button>
        </Space>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: (
                <span>
                  我的模板
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    {customTemplates.length}
                  </Tag>
                </span>
              ),
              children: (
                <Table
                  dataSource={customTemplates}
                  columns={myTemplatesColumns}
                  rowKey="id"
                  loading={isLoading}
                  locale={{ emptyText: '暂无自定义模板，可从预置模板创建' }}
                  scroll={{ x: 1200 }}
                  pagination={{
                    pageSize: 10,
                    showTotal: (total) => `共 ${total} 个模板`,
                  }}
                />
              ),
            },
            {
              key: 'presets',
              label: (
                <span>
                  预置模板
                  <Tag color="gold" style={{ marginLeft: 8 }}>
                    {presetTemplates?.length || 0}
                  </Tag>
                </span>
              ),
              children: (
                <Table
                  dataSource={presetTemplates || []}
                  columns={presetTemplatesColumns}
                  rowKey="id"
                  loading={presetsLoading}
                  locale={{ emptyText: '暂无预置模板，请点击"初始化预置模板"按钮' }}
                  scroll={{ x: 1200 }}
                  pagination={{
                    pageSize: 10,
                    showTotal: (total) => `共 ${total} 个模板`,
                  }}
                />
              ),
            },
          ]}
        />

      </Card>

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingId ? '编辑表单模板' : '添加表单模板'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setFormFields([]);
          setEditingId(null);
        }}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        onOk={() => form.submit()}
        width={800}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="title" label="表单标题" rules={[{ required: true }]}>
            <Input placeholder="请输入表单标题" />
          </Form.Item>
          <Form.Item name="description" label="表单描述">
            <Input.TextArea rows={3} placeholder="请输入表单描述" />
          </Form.Item>
          <Form.Item label="表单字段" required>
            <FormDesigner value={formFields} onChange={setFormFields} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 分享链接模态框 */}
      <Modal
        title="分享表单"
        open={isShareModalOpen}
        onCancel={() => setIsShareModalOpen(false)}
        footer={[
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={handleCopyShareUrl}>
            复制链接
          </Button>,
          <Button key="close" onClick={() => setIsShareModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">将此链接分享给需要填写表单的人，无需登录即可填写：</Text>
        </div>
        <Paragraph
          copyable
          style={{
            padding: '12px',
            background: '#f5f5f5',
            borderRadius: '4px',
            wordBreak: 'break-all',
          }}
        >
          {shareUrl}
        </Paragraph>
        <div style={{ marginTop: 16 }}>
          <Text type="warning">提示：分享链接支持手机端优化填写体验</Text>
        </div>
      </Modal>

      {/* 审批流程配置模态框 */}
      <Modal
        title={`配置审批流程 - ${approvalFlowTemplateName}`}
        open={isApprovalFlowModalOpen}
        onCancel={() => {
          setIsApprovalFlowModalOpen(false);
          setApprovalFlowTemplateId(null);
          setApprovalFlowTemplateName('');
        }}
        footer={null}
        width={900}
        destroyOnClose
      >
        {approvalFlowTemplateId && (
          <ApprovalFlowDesigner
            templateId={approvalFlowTemplateId}
            onSave={handleApprovalFlowSaved}
          />
        )}
      </Modal>
    </div>
  );
}
