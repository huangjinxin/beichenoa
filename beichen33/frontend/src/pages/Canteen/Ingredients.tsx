import { useState, useRef } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Space, Descriptions } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { ingredientApi } from '../../services/api';
import dayjs from 'dayjs';

export default function Ingredients() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);
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

  const handleView = (record: any) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Ingredient_${viewingRecord?.name || 'Print'}`,
  });

  const columns = [
    { title: '食材名称', dataIndex: 'name', key: 'name', width: 120 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
    { title: '热量(kcal)', dataIndex: 'calories', key: 'calories', width: 80 },
    { title: '蛋白质(g)', dataIndex: 'protein', key: 'protein', width: 80 },
    { title: '脂肪(g)', dataIndex: 'fat', key: 'fat', width: 80 },
    { title: '钙(mg)', dataIndex: 'calcium', key: 'calcium', width: 80 },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right' as const,
      width: 220,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>食材管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          添加食材
        </Button>
      </div>

      <Table
        dataSource={ingredientsData?.data || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
      />

      <Modal
        title="食材详情"
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        width={800}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            打印
          </Button>,
          <Button key="close" onClick={() => setIsViewModalOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        <div ref={printRef} style={{ padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>北辰幼儿园食材信息</h1>
            <h2 style={{ fontSize: '18px', margin: 0 }}>{viewingRecord?.name}</h2>
          </div>

          {viewingRecord && (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="食材名称">{viewingRecord.name}</Descriptions.Item>
              <Descriptions.Item label="单位">{viewingRecord.unit}</Descriptions.Item>
              <Descriptions.Item label="热量">{viewingRecord.calories} kcal/100g</Descriptions.Item>
              <Descriptions.Item label="蛋白质">{viewingRecord.protein} g/100g</Descriptions.Item>
              <Descriptions.Item label="脂肪">{viewingRecord.fat} g/100g</Descriptions.Item>
              <Descriptions.Item label="碳水化合物">{viewingRecord.carbs} g/100g</Descriptions.Item>
              <Descriptions.Item label="膳食纤维">{viewingRecord.fiber || 0} g/100g</Descriptions.Item>
              <Descriptions.Item label="维生素A">{viewingRecord.vitaminA || 0} μg/100g</Descriptions.Item>
              <Descriptions.Item label="维生素B1">{viewingRecord.vitaminB1 || 0} mg/100g</Descriptions.Item>
              <Descriptions.Item label="维生素B2">{viewingRecord.vitaminB2 || 0} mg/100g</Descriptions.Item>
              <Descriptions.Item label="维生素C">{viewingRecord.vitaminC || 0} mg/100g</Descriptions.Item>
              <Descriptions.Item label="钙">{viewingRecord.calcium || 0} mg/100g</Descriptions.Item>
              <Descriptions.Item label="铁">{viewingRecord.iron || 0} mg/100g</Descriptions.Item>
              <Descriptions.Item label="锌">{viewingRecord.zinc || 0} mg/100g</Descriptions.Item>
              <Descriptions.Item label="钠">{viewingRecord.sodium || 0} mg/100g</Descriptions.Item>
            </Descriptions>
          )}

          <div style={{ marginTop: '40px', textAlign: 'right', fontSize: '12px', color: '#666' }}>
            <p>打印时间: {dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
          </div>
        </div>
      </Modal>

      <Modal
        title={editingId ? '编辑食材' : '添加食材'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingId(null);
        }}
        okText="确认"
        cancelText="取消"
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="食材名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
            <Input placeholder="g, ml, 个" />
          </Form.Item>

          <h4 style={{ marginTop: 16, marginBottom: 12 }}>基础营养成分 (每100g)</h4>
          <Form.Item name="calories" label="热量 (kcal)" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="protein" label="蛋白质 (g)" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="fat" label="脂肪 (g)" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="carbs" label="碳水化合物 (g)" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="fiber" label="膳食纤维 (g)">
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>

          <h4 style={{ marginTop: 16, marginBottom: 12 }}>维生素 (每100g)</h4>
          <Form.Item name="vitaminA" label="维生素A (μg)">
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
          <Form.Item name="vitaminB1" label="维生素B1 (mg)">
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
          <Form.Item name="vitaminB2" label="维生素B2 (mg)">
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
          <Form.Item name="vitaminC" label="维生素C (mg)">
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>

          <h4 style={{ marginTop: 16, marginBottom: 12 }}>矿物质 (每100g)</h4>
          <Form.Item name="calcium" label="钙 (mg)">
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
          <Form.Item name="iron" label="铁 (mg)">
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
          <Form.Item name="zinc" label="锌 (mg)">
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
          <Form.Item name="sodium" label="钠 (mg)">
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
