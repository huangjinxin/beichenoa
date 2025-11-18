import { useState } from 'react';
import { Card, Table, Button, Space, Alert, message, Modal, Form, Input, InputNumber } from 'antd';
import { CheckCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionApi } from '../../services/api';

interface NutritionStandard {
  id?: string;
  ageGroup: string;
  ageLabel: string;
  caloriesMin: number;
  caloriesMax: number;
  proteinMin: number;
  proteinMax: number;
  fatMin: number;
  fatMax: number;
  carbsMin: number;
  carbsMax: number;
  grainPerMeal: number;
  vegetablePerMeal: number;
  meatPerMeal: number;
  eggPerMeal: number;
  milkPerDay: number;
  description?: string;
}

export default function NutritionStandards() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStandard, setEditingStandard] = useState<NutritionStandard | null>(null);
  const [form] = Form.useForm();

  // 获取当前营养标准
  const { data: standards, isLoading } = useQuery({
    queryKey: ['nutrition-standards'],
    queryFn: () => nutritionApi.getStandards(),
  });

  // 获取推荐标准
  const { data: recommended } = useQuery({
    queryKey: ['recommended-standards'],
    queryFn: () => nutritionApi.getRecommendedStandards(),
  });

  // 应用推荐标准
  const applyRecommendedMutation = useMutation({
    mutationFn: () => nutritionApi.applyRecommendedStandards(),
    onSuccess: () => {
      message.success('推荐标准已成功应用！');
      queryClient.invalidateQueries({ queryKey: ['nutrition-standards'] });
    },
    onError: () => {
      message.error('应用推荐标准失败');
    },
  });

  // 保存营养标准
  const saveMutation = useMutation({
    mutationFn: (data: NutritionStandard) => nutritionApi.upsertStandard(data),
    onSuccess: () => {
      message.success('营养标准保存成功！');
      queryClient.invalidateQueries({ queryKey: ['nutrition-standards'] });
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: () => {
      message.error('保存营养标准失败');
    },
  });

  const columns = [
    {
      title: '年龄段',
      dataIndex: 'ageLabel',
      width: 100,
      fixed: 'left' as const,
    },
    {
      title: '热量 (kcal/天)',
      children: [
        {
          title: '最低',
          dataIndex: 'caloriesMin',
          width: 80,
        },
        {
          title: '最高',
          dataIndex: 'caloriesMax',
          width: 80,
        },
      ],
    },
    {
      title: '蛋白质 (g/天)',
      children: [
        {
          title: '最低',
          dataIndex: 'proteinMin',
          width: 80,
        },
        {
          title: '最高',
          dataIndex: 'proteinMax',
          width: 80,
        },
      ],
    },
    {
      title: '脂肪 (g/天)',
      children: [
        {
          title: '最低',
          dataIndex: 'fatMin',
          width: 80,
        },
        {
          title: '最高',
          dataIndex: 'fatMax',
          width: 80,
        },
      ],
    },
    {
      title: '碳水 (g/天)',
      children: [
        {
          title: '最低',
          dataIndex: 'carbsMin',
          width: 80,
        },
        {
          title: '最高',
          dataIndex: 'carbsMax',
          width: 80,
        },
      ],
    },
    {
      title: '主食 (g/餐)',
      dataIndex: 'grainPerMeal',
      width: 100,
    },
    {
      title: '蔬菜 (g/餐)',
      dataIndex: 'vegetablePerMeal',
      width: 100,
    },
    {
      title: '肉类 (g/餐)',
      dataIndex: 'meatPerMeal',
      width: 100,
    },
    {
      title: '蛋类 (g/餐)',
      dataIndex: 'eggPerMeal',
      width: 100,
    },
    {
      title: '奶类 (ml/天)',
      dataIndex: 'milkPerDay',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: NutritionStandard) => (
        <Button type="link" onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  const handleEdit = (record: NutritionStandard) => {
    setEditingStandard(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingStandard(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      saveMutation.mutate(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="幼儿营养标准配置"
        extra={
          <Space>
            <Button
              type="default"
              icon={<CheckCircleOutlined />}
              onClick={() => applyRecommendedMutation.mutate()}
              loading={applyRecommendedMutation.isPending}
            >
              应用推荐标准
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              自定义标准
            </Button>
          </Space>
        }
      >
        <Alert
          message="营养标准说明"
          description="以下标准参考《中国居民膳食营养素参考摄入量》和联合国儿童基金会推荐标准制定，用于计算采购计划时各年龄段幼儿的食材用量系数。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          dataSource={standards?.data || []}
          columns={columns}
          loading={isLoading}
          pagination={false}
          rowKey="ageGroup"
          scroll={{ x: 1500 }}
          bordered
        />
      </Card>

      {/* 推荐标准展示 */}
      <Card title="推荐标准参考" style={{ marginTop: 16 }}>
        <Table
          dataSource={Array.isArray(recommended?.data) ? recommended.data : (Array.isArray(recommended) ? recommended : [])}
          columns={columns.filter((col) => col.key !== 'action')}
          pagination={false}
          rowKey="ageGroup"
          scroll={{ x: 1400 }}
          bordered
        />
      </Card>

      {/* 编辑/新增弹窗 */}
      <Modal
        title={editingStandard ? '编辑营养标准' : '新增营养标准'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        width={800}
        confirmLoading={saveMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="年龄段"
            name="ageGroup"
            rules={[{ required: true, message: '请输入年龄段' }]}
          >
            <Input placeholder="如：2-3" disabled={!!editingStandard} />
          </Form.Item>

          <Form.Item
            label="年龄段标签"
            name="ageLabel"
            rules={[{ required: true, message: '请输入年龄段标签' }]}
          >
            <Input placeholder="如：2-3岁" />
          </Form.Item>

          <Card title="每日营养摄入标准" size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Form.Item
                  label="热量最低值 (kcal)"
                  name="caloriesMin"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={0} />
                </Form.Item>
                <Form.Item
                  label="热量最高值 (kcal)"
                  name="caloriesMax"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={0} />
                </Form.Item>
              </Space>

              <Space>
                <Form.Item label="蛋白质最低值 (g)" name="proteinMin" rules={[{ required: true }]}>
                  <InputNumber min={0} />
                </Form.Item>
                <Form.Item label="蛋白质最高值 (g)" name="proteinMax" rules={[{ required: true }]}>
                  <InputNumber min={0} />
                </Form.Item>
              </Space>

              <Space>
                <Form.Item label="脂肪最低值 (g)" name="fatMin" rules={[{ required: true }]}>
                  <InputNumber min={0} />
                </Form.Item>
                <Form.Item label="脂肪最高值 (g)" name="fatMax" rules={[{ required: true }]}>
                  <InputNumber min={0} />
                </Form.Item>
              </Space>

              <Space>
                <Form.Item label="碳水最低值 (g)" name="carbsMin" rules={[{ required: true }]}>
                  <InputNumber min={0} />
                </Form.Item>
                <Form.Item label="碳水最高值 (g)" name="carbsMax" rules={[{ required: true }]}>
                  <InputNumber min={0} />
                </Form.Item>
              </Space>
            </Space>
          </Card>

          <Card title="食材用量参考（克/人/餐）" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item label="主食类（米面）" name="grainPerMeal" rules={[{ required: true }]}>
                <InputNumber min={0} addonAfter="克/餐" />
              </Form.Item>
              <Form.Item label="蔬菜类" name="vegetablePerMeal" rules={[{ required: true }]}>
                <InputNumber min={0} addonAfter="克/餐" />
              </Form.Item>
              <Form.Item label="肉类" name="meatPerMeal" rules={[{ required: true }]}>
                <InputNumber min={0} addonAfter="克/餐" />
              </Form.Item>
              <Form.Item label="蛋类" name="eggPerMeal" rules={[{ required: true }]}>
                <InputNumber min={0} addonAfter="克/餐" />
              </Form.Item>
              <Form.Item label="奶类（每日）" name="milkPerDay" rules={[{ required: true }]}>
                <InputNumber min={0} addonAfter="毫升/天" />
              </Form.Item>
            </Space>
          </Card>

          <Form.Item label="备注说明" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
