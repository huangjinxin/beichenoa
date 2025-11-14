import { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

// 临时 API - 后续需要在 services/api.ts 中添加
const teacherApi = {
  getAll: () => axios.get('/api/users?role=TEACHER').then(res => res.data),
  create: (data: any) => axios.post('/api/users', { ...data, role: 'TEACHER' }).then(res => res.data),
  update: (id: string, data: any) => axios.put(`/api/users/${id}`, data).then(res => res.data),
  delete: (id: string) => axios.delete(`/api/users/${id}`).then(res => res.data),
};

export default function TeacherList() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: teachersData, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: teacherApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: teacherApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: () => {
      message.error(t('messages.saveFailed'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => teacherApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
    },
    onError: () => {
      message.error(t('messages.saveFailed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: teacherApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      message.success(t('messages.deleteSuccess'));
    },
    onError: () => {
      message.error(t('messages.deleteFailed'));
    },
  });

  const handleSubmit = (values: any) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: values });
    } else {
      // 创建时需要添加默认密码
      createMutation.mutate({ ...values, password: '123456' });
    }
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: t('messages.deleteConfirm'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const columns = [
    { title: '教师姓名', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>教师管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          添加教师
        </Button>
      </div>

      <Table
        dataSource={teachersData?.data || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
      />

      <Modal
        title={editingId ? '编辑教师' : '添加教师'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingId(null);
        }}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="教师姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          {!editingId && (
            <div style={{ marginBottom: 16, color: '#666', fontSize: 12 }}>
              * 默认密码：123456，请提醒教师登录后修改密码
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}
