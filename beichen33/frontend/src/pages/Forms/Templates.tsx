import { useState } from 'react';
import { Card, List, Button, Modal, Form, Input, message, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
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
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['form-templates'],
    queryFn: formApi.getTemplates,
  });

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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>{t('forms.templates.title')}</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          {t('forms.templates.add')}
        </Button>
      </div>

      <List
        grid={{ gutter: 16, column: 2 }}
        dataSource={templates || []}
        loading={isLoading}
        renderItem={(item: any) => (
          <List.Item>
            <Card
              title={item.title}
              extra={
                <Space>
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
                <Button type="link" icon={<EditOutlined />}>
                  编辑
                </Button>,
              ]}
            >
              <p>{item.description}</p>
              <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                字段数量: {Array.isArray(item.fields) ? item.fields.length : 0}
              </div>
            </Card>
          </List.Item>
        )}
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
