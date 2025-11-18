import { useState } from 'react';
import { Card, List, Button, Modal, Form, Input, message, Space, Tag, Tabs, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, CopyOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formApi } from '../../services/api';
import FormDesigner, { FormField } from '../../components/FormDesigner/FormDesigner';

export default function FormTemplates() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [activeTab, setActiveTab] = useState('all');
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

  // 创建模板
  const createMutation = useMutation({
    mutationFn: formApi.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
      setFormFields([]);
    },
    onError: () => {
      message.error(t('messages.saveFailed'));
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
    createMutation.mutate({
      ...values,
      fields: formFields,
    });
  };

  const handleViewTemplate = (templateId: string) => {
    navigate(`/forms/fill/${templateId}`);
  };

  const handleCreateFromPreset = (presetId: string) => {
    createFromPresetMutation.mutate({ presetId });
  };

  const templateList = templates || [];
  const customTemplates = templateList.filter((t: any) => !t.isPreset);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>{t('forms.templates.title')}</h1>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => initPresetsMutation.mutate()}
            loading={initPresetsMutation.isPending}
          >
            初始化预置模板
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            {t('forms.templates.add')}
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'all',
            label: '我的模板',
            children: (
              <List
                grid={{ gutter: 16, column: 2 }}
                dataSource={customTemplates}
                loading={isLoading}
                locale={{ emptyText: '暂无自定义模板，可从预置模板创建' }}
                renderItem={(item: any) => (
                  <List.Item>
                    <Card
                      title={item.title}
                      extra={
                        <Space>
                          {item.serialNumberConfig && (
                            <Tag color="blue">流水号</Tag>
                          )}
                          {item.detailTableConfig?.enabled && (
                            <Tag color="purple">明细表</Tag>
                          )}
                          <Tag color={item.isActive ? 'green' : 'red'}>
                            {item.isActive ? '启用' : '禁用'}
                          </Tag>
                        </Space>
                      }
                      actions={[
                        <Button
                          type="link"
                          icon={<EyeOutlined />}
                          onClick={() => handleViewTemplate(item.id)}
                        >
                          填写
                        </Button>,
                        <Popconfirm
                          title="确定删除此模板？"
                          onConfirm={() => deleteMutation.mutate(item.id)}
                        >
                          <Button type="link" danger icon={<DeleteOutlined />}>
                            删除
                          </Button>
                        </Popconfirm>,
                      ]}
                    >
                      <p>{item.description || '暂无描述'}</p>
                      <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                        <Space>
                          <span>字段数量: {Array.isArray(item.fields) ? item.fields.length : 0}</span>
                          {item.calculations?.length > 0 && (
                            <span>计算项: {item.calculations.length}</span>
                          )}
                        </Space>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            ),
          },
          {
            key: 'presets',
            label: '预置模板',
            children: (
              <List
                grid={{ gutter: 16, column: 2 }}
                dataSource={presetTemplates || []}
                loading={presetsLoading}
                locale={{ emptyText: '暂无预置模板，请点击"初始化预置模板"按钮' }}
                renderItem={(item: any) => (
                  <List.Item>
                    <Card
                      title={
                        <Space>
                          {item.title}
                          <Tag color="gold">预置</Tag>
                        </Space>
                      }
                      extra={
                        <Space>
                          {item.serialNumberConfig && (
                            <Tag color="blue">流水号</Tag>
                          )}
                          {item.detailTableConfig?.enabled && (
                            <Tag color="purple">明细表</Tag>
                          )}
                          {item.approvalConfig && (
                            <Tag color="orange">审批流程</Tag>
                          )}
                        </Space>
                      }
                      actions={[
                        <Button
                          type="link"
                          icon={<CopyOutlined />}
                          onClick={() => handleCreateFromPreset(item.id)}
                          loading={createFromPresetMutation.isPending}
                        >
                          使用此模板
                        </Button>,
                        <Button
                          type="link"
                          icon={<EyeOutlined />}
                          onClick={() => handleViewTemplate(item.id)}
                        >
                          预览
                        </Button>,
                      ]}
                    >
                      <p>{item.description || '暂无描述'}</p>
                      <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                        <Space direction="vertical" size={0}>
                          <span>主表字段: {Array.isArray(item.fields) ? item.fields.length : 0}</span>
                          {item.detailTableConfig?.columns && (
                            <span>明细列: {item.detailTableConfig.columns.length}</span>
                          )}
                          {item.calculations?.length > 0 && (
                            <span>计算项: {item.calculations.length}</span>
                          )}
                          {item.approvalConfig?.levels && (
                            <span>审批级别: {item.approvalConfig.levels.length}</span>
                          )}
                        </Space>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            ),
          },
        ]}
      />

      <Modal
        title={t('forms.templates.add')}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setFormFields([]);
        }}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="title" label="表单标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="表单描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="表单字段" required>
            <FormDesigner value={formFields} onChange={setFormFields} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
