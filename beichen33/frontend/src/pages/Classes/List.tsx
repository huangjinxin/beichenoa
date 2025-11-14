import { useState } from 'react';
import { Table, Button, Space, Card, Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { classApi } from '../../services/api';
import axios from 'axios';

// Teacher API
const teacherApi = {
  getAll: () => axios.get('/api/users?role=TEACHER').then(res => res.data),
};

export default function ClassList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: classApi.getAll,
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: teacherApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: classApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => classApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: classApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      message.success(t('messages.deleteSuccess'));
    },
  });

  const handleSubmit = (values: any) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      teacherId: record.teacherId || record.teacher?.id,
    });
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
    { title: t('classes.className'), dataIndex: 'name', key: 'name' },
    { title: t('classes.grade'), dataIndex: 'grade', key: 'grade' },
    { title: t('classes.teacher'), dataIndex: ['teacher', 'name'], key: 'teacher' },
    { title: t('classes.capacity'), dataIndex: 'capacity', key: 'capacity' },
    {
      title: t('classes.currentStudents'),
      dataIndex: ['_count', 'students'],
      key: 'studentCount',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => navigate(`/classes/${record.id}`)} />
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>{t('classes.title')}</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          {t('classes.add')}
        </Button>
      </div>

      <Card>
        <Table
          dataSource={classes || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
        />
      </Card>

      <Modal
        title={editingId ? t('classes.edit') : t('classes.add')}
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
          <Form.Item name="name" label={t('classes.className')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="grade" label={t('classes.grade')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="teacherId" label={t('classes.teacher')} rules={[{ required: true }]}>
            <Select
              placeholder="请选择教师"
              options={teachersData?.map((teacher: any) => ({
                label: teacher.name,
                value: teacher.id,
              })) || []}
            />
          </Form.Item>
          <Form.Item name="capacity" label={t('classes.capacity')} rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
