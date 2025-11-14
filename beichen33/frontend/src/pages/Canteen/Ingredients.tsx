import { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ingredientApi } from '../../services/api';

export default function Ingredients() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: ingredientsData, isLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => ingredientApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: ingredientApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => ingredientApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ingredientApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
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
    { title: t('canteen.ingredients.name'), dataIndex: 'name', key: 'name' },
    { title: t('canteen.ingredients.unit'), dataIndex: 'unit', key: 'unit' },
    { title: `${t('canteen.ingredients.protein')}(g)`, dataIndex: 'protein', key: 'protein' },
    { title: `${t('canteen.ingredients.fat')}(g)`, dataIndex: 'fat', key: 'fat' },
    { title: `${t('canteen.ingredients.carbohydrates')}(g)`, dataIndex: 'carbs', key: 'carbs' },
    { title: `${t('canteen.ingredients.calories')}(kcal)`, dataIndex: 'calories', key: 'calories' },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: any) => (
        <>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ marginRight: 8 }} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
        </>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>{t('canteen.ingredients.title')}</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          {t('canteen.ingredients.add')}
        </Button>
      </div>

      <Table
        dataSource={ingredientsData?.data || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
      />

      <Modal
        title={editingId ? t('canteen.ingredients.edit') : t('canteen.ingredients.add')}
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
          <Form.Item name="name" label={t('canteen.ingredients.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="unit" label={t('canteen.ingredients.unit')} rules={[{ required: true }]}>
            <Input placeholder="g, ml, 个" />
          </Form.Item>
          <Form.Item name="protein" label={`${t('canteen.ingredients.protein')} (g/100g)`} rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="fat" label={`${t('canteen.ingredients.fat')} (g/100g)`} rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="carbs" label={`${t('canteen.ingredients.carbohydrates')} (g/100g)`} rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="calories" label={`${t('canteen.ingredients.calories')} (kcal/100g)`} rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
