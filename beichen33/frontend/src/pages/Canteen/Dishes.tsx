import { useState, useMemo, useRef } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Drawer,
  Descriptions,
  Tag,
  Popconfirm,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { dishApi, ingredientApi } from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

// 菜品分类枚举
const DISH_CATEGORIES = [
  { value: 'Main', label: '主菜', color: 'blue' },
  { value: 'Soup', label: '汤品', color: 'cyan' },
  { value: 'Staple', label: '主食', color: 'green' },
  { value: 'Snack', label: '小食', color: 'orange' },
];

export default function Dishes() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDish, setSelectedDish] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const printRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // 查询菜品列表
  const { data: dishesData, isLoading } = useQuery({
    queryKey: ['dishes'],
    queryFn: () => dishApi.getAll(),
  });

  // 查询食材列表（用于选择器）
  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => ingredientApi.getAll(),
  });

  // 创建菜品
  const createMutation = useMutation({
    mutationFn: dishApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: () => {
      message.error(t('messages.saveFailed'));
    },
  });

  // 更新菜品
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => dishApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
    },
    onError: () => {
      message.error(t('messages.saveFailed'));
    },
  });

  // 删除菜品
  const deleteMutation = useMutation({
    mutationFn: dishApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      message.success(t('messages.deleteSuccess'));
    },
    onError: () => {
      message.error(t('messages.deleteFailed'));
    },
  });

  // 提交表单
  const handleSubmit = (values: any) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  // 打开编辑Modal
  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      category: record.category,
      description: record.description,
      ingredientIds: record.ingredients?.map((item: any) => item.ingredientId) || [],
    });
    setIsModalOpen(true);
  };

  // 删除菜品
  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleView = (record: any) => {
    setSelectedDish(record);
    setIsDrawerOpen(true);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Dish_${selectedDish?.name || 'Print'}`,
  });

  // 打开添加Modal
  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // 关闭Modal
  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setEditingId(null);
  };

  // 获取分类标签
  const getCategoryLabel = (category: string) => {
    return DISH_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  // 获取分类颜色
  const getCategoryColor = (category: string) => {
    return DISH_CATEGORIES.find((c) => c.value === category)?.color || 'default';
  };

  // 过滤菜品
  const filteredDishes = useMemo(() => {
    if (!dishesData?.data) return [];

    return dishesData.data.filter((dish: any) => {
      const matchName = dish.name.toLowerCase().includes(searchText.toLowerCase());
      const matchCategory = !selectedCategory || dish.category === selectedCategory;
      return matchName && matchCategory;
    });
  }, [dishesData, searchText, selectedCategory]);

  // 表格列定义
  const columns = [
    {
      title: t('canteen.dishes.name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: t('canteen.dishes.category'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        <Tag color={getCategoryColor(category)}>{getCategoryLabel(category)}</Tag>
      ),
    },
    {
      title: t('canteen.dishes.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('canteen.dishes.ingredients'),
      key: 'ingredients',
      width: 100,
      render: (_: any, record: any) => (
        <span>{record.ingredients?.length || 0} 种</span>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      fixed: 'right' as const,
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个菜品吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>{t('canteen.dishes.title')}</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          {t('canteen.dishes.add')}
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="搜索菜品名称"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="选择分类"
            allowClear
            style={{ width: 150 }}
            value={selectedCategory}
            onChange={setSelectedCategory}
          >
            {DISH_CATEGORIES.map((cat) => (
              <Select.Option key={cat.value} value={cat.value}>
                {cat.label}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* 菜品表格 */}
      <Table
        dataSource={filteredDishes}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      {/* 添加/编辑Modal */}
      <Modal
        title={editingId ? '编辑菜品' : '添加菜品'}
        open={isModalOpen}
        onCancel={handleCancel}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        onOk={() => form.submit()}
        width={700}
        destroyOnClose
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label={t('canteen.dishes.name')}
            rules={[{ required: true, message: '请输入菜品名称' }]}
          >
            <Input placeholder="例如：鸡蛋炒饭" />
          </Form.Item>

          <Form.Item
            name="category"
            label={t('canteen.dishes.category')}
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择">
              {DISH_CATEGORIES.map((cat) => (
                <Select.Option key={cat.value} value={cat.value}>
                  {cat.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label={t('canteen.dishes.description')}>
            <TextArea rows={3} placeholder="菜品描述" />
          </Form.Item>

          <Form.Item name="ingredientIds" label={t('canteen.dishes.ingredients')}>
            <Select
              mode="multiple"
              placeholder="选择食材"
              showSearch
              optionFilterProp="children"
            >
              {ingredientsData?.data?.map((ingredient: any) => (
                <Select.Option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="菜品详情"
        placement="right"
        width={650}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        extra={
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            打印
          </Button>
        }
      >
        <div ref={printRef} style={{ padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>北辰幼儿园菜品信息</h1>
            <h2 style={{ fontSize: '18px', margin: 0 }}>{selectedDish?.name}</h2>
          </div>

          {selectedDish && (
            <Descriptions column={1} bordered>
              <Descriptions.Item label="名称">{selectedDish.name}</Descriptions.Item>
              <Descriptions.Item label="分类">
                <Tag color={getCategoryColor(selectedDish.category)}>
                  {getCategoryLabel(selectedDish.category)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="描述">
                {selectedDish.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="食材配方">
                {selectedDish.ingredients && selectedDish.ingredients.length > 0 ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {selectedDish.ingredients.map((item: any) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Tag>{item.ingredient?.name}</Tag>
                        {item.amount && <span>{item.amount}g</span>}
                      </div>
                    ))}
                  </Space>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
            </Descriptions>
          )}

          <div style={{ marginTop: '40px', textAlign: 'right', fontSize: '12px', color: '#666' }}>
            <p>打印时间: {dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
