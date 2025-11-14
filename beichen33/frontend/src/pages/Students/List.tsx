import { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { studentApi, classApi } from '../../services/api';
import dayjs from 'dayjs';

export default function StudentList() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentApi.getAll(),
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: classApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: studentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => studentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: studentApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      message.success(t('messages.deleteSuccess'));
    },
  });

  const handleSubmit = (values: any) => {
    const data = { ...values, birthday: values.birthday.toISOString(), enrollDate: values.enrollDate.toISOString() };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({ ...record, birthday: dayjs(record.birthday), enrollDate: dayjs(record.enrollDate) });
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
    { title: t('students.studentName'), dataIndex: 'name', key: 'name' },
    { title: t('students.gender'), dataIndex: 'gender', key: 'gender' },
    { title: t('students.className'), dataIndex: ['class', 'name'], key: 'class' },
    {
      title: t('students.birthDate'),
      dataIndex: 'birthday',
      key: 'birthday',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => navigate(`/students/${record.id}`)} />
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>{t('students.title')}</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          {t('students.add')}
        </Button>
      </div>

      <Table
        dataSource={studentsData?.data || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
      />

      <Modal
        title={editingId ? t('students.edit') : t('students.add')}
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
          <Form.Item name="name" label={t('students.studentName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="gender" label={t('students.gender')} rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Male">{t('students.male')}</Select.Option>
              <Select.Option value="Female">{t('students.female')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="birthday" label={t('students.birthDate')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="enrollDate" label={t('students.enrollmentDate')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="classId" label={t('students.className')} rules={[{ required: true }]}>
            <Select>
              {classes?.map((c: any) => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="address" label={t('students.address')}>
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
