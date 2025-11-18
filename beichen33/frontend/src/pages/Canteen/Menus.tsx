import { useState, useRef } from 'react';
import {
  Card,
  DatePicker,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Steps,
  message,
  Space,
  Tag,
  Divider,
  Descriptions,
  Popconfirm,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, PrinterOutlined, BarChartOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { menuApi, dishApi, userApi, nutritionApi } from '../../services/api';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

// 餐次类型
const MEAL_TYPES = [
  { key: 'Breakfast', label: '早餐', color: 'gold' },
  { key: 'Lunch', label: '中餐', color: 'green' },
  { key: 'Snack', label: '午点', color: 'blue' },
  { key: 'Dinner', label: '晚餐', color: 'purple' },
];

// 周几
const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const WEEK_DAYS_CN = ['周一', '周二', '周三', '周四', '周五'];

interface MenuItemData {
  day: string;
  mealType: string;
  dishIds: string[];
}

export default function Menus() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [editingMenu, setEditingMenu] = useState<any>(null);
  const [viewingMenu, setViewingMenu] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false);
  const [nutritionData, setNutritionData] = useState<any>(null);
  const [loadingNutrition, setLoadingNutrition] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const nutritionPrintRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // 查询食谱列表
  const { data: menus, isLoading } = useQuery({
    queryKey: ['menus', selectedDate.format('YYYY-MM-DD')],
    queryFn: () => menuApi.getByDate(selectedDate.format('YYYY-MM-DD')),
  });

  // 查询菜品列表
  const { data: dishesData } = useQuery({
    queryKey: ['dishes'],
    queryFn: () => dishApi.getAll(),
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => userApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: menuApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      message.success('创建成功');
      setIsModalOpen(false);
      resetForm();
    },
    onError: () => {
      message.error('创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => menuApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      message.success('更新成功');
      setIsModalOpen(false);
      resetForm();
    },
    onError: () => {
      message.error('更新失败');
    },
  });

  // 删除食谱
  const deleteMutation = useMutation({
    mutationFn: menuApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      message.success('删除成功');
    },
  });

  const resetForm = () => {
    form.resetFields();
    setCurrentStep(0);
    setMenuItems([]);
    setEditingMenu(null);
  };

  const handleAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (menu: any) => {
    setEditingMenu(menu);
    form.setFieldsValue({
      name: menu.name,
      dateRange: [dayjs(menu.startDate), dayjs(menu.endDate)],
      grade: menu.grade,
      teacherId: menu.teacherId,
    });
    const items = menu.menuItems?.map((mi: any) => ({
      day: mi.day,
      mealType: mi.mealType,
      dishIds: [mi.dishId],
    })) || [];
    const groupedItems = items.reduce((acc: MenuItemData[], item: MenuItemData) => {
      const existing = acc.find((i) => i.day === item.day && i.mealType === item.mealType);
      if (existing) {
        existing.dishIds.push(...item.dishIds);
      } else {
        acc.push(item);
      }
      return acc;
    }, []);
    setMenuItems(groupedItems);
    setIsModalOpen(true);
  };

  // 关闭Modal
  const handleCancel = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // 下一步
  const handleNext = async () => {
    if (currentStep === 0) {
      try {
        await form.validateFields(['name', 'dateRange']);
        setCurrentStep(1);
      } catch (error) {
        console.error('表单验证失败:', error);
      }
    } else if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  // 上一步
  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  // 处理菜品选择
  const handleDishSelect = (day: string, mealType: string, dishIds: string[]) => {
    setMenuItems((prev) => {
      const filtered = prev.filter((item) => !(item.day === day && item.mealType === mealType));
      if (dishIds.length > 0) {
        return [...filtered, { day, mealType, dishIds }];
      }
      return filtered;
    });
  };

  // 获取已选择的菜品
  const getSelectedDishes = (day: string, mealType: string) => {
    const item = menuItems.find((i) => i.day === day && i.mealType === mealType);
    return item?.dishIds || [];
  };

  // 提交创建
  const handleSubmit = async () => {
    try {
      const values = form.getFieldsValue();

      if (!values.name || !values.dateRange || !values.dateRange[0] || !values.dateRange[1]) {
        message.error('请完成基本信息填写');
        setCurrentStep(0);
        return;
      }

      const [startDate, endDate] = values.dateRange;

      const data = {
        name: values.name,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        grade: values.grade || null,
        teacherId: values.teacherId || null,
        items: menuItems.map((item) => ({
          day: item.day,
          mealType: item.mealType,
          dishIds: item.dishIds,
        })),
      };

      if (editingMenu) {
        await updateMutation.mutateAsync({ id: editingMenu.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error: any) {
      console.error('提交失败:', error);
      message.error('提交失败');
    }
  };

  // 删除食谱
  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleView = (menu: any) => {
    setViewingMenu(menu);
    setIsViewModalOpen(true);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Menu_${viewingMenu?.name || 'Print'}`,
  });

  const handleNutritionPrint = useReactToPrint({
    content: () => nutritionPrintRef.current,
    documentTitle: `Nutrition_Analysis_${nutritionData?.menuName || 'Print'}`,
  });

  const handleNutritionAnalysis = async (menu: any) => {
    setLoadingNutrition(true);
    setIsNutritionModalOpen(true);
    try {
      const result = await nutritionApi.weeklyReport({
        startDate: dayjs(menu.startDate).format('YYYY-MM-DD'),
        endDate: dayjs(menu.endDate).format('YYYY-MM-DD'),
        grade: menu.grade || undefined,
      });
      setNutritionData(result);
    } catch (error) {
      message.error('获取营养分析数据失败');
      setIsNutritionModalOpen(false);
    } finally {
      setLoadingNutrition(false);
    }
  };

  // 获取餐次标签
  const getMealTypeLabel = (mealType: string) => {
    return MEAL_TYPES.find((m) => m.key === mealType)?.label || mealType;
  };

  // 获取餐次颜色
  const getMealTypeColor = (mealType: string) => {
    return MEAL_TYPES.find((m) => m.key === mealType)?.color || 'default';
  };

  const columns = [
    {
      title: '食谱名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '日期范围',
      key: 'dateRange',
      render: (_: any, record: any) => (
        <span>
          {dayjs(record.startDate).format('YYYY-MM-DD')} ~ {dayjs(record.endDate).format('YYYY-MM-DD')}
        </span>
      ),
    },
    {
      title: '年级',
      dataIndex: 'grade',
      key: 'grade',
      render: (grade: string) => grade || '全部年级',
    },
    {
      title: '负责老师',
      dataIndex: 'teacherId',
      key: 'teacherId',
      render: (teacherId: string) => {
        if (!teacherId) return '-';
        const teacher = teachersData?.data?.find((t: any) => t.id === teacherId);
        return teacher?.name || '-';
      },
    },
    {
      title: '餐次数量',
      key: 'itemCount',
      render: (_: any, record: any) => record.menuItems?.length || 0,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          <Button size="small" icon={<BarChartOutlined />} onClick={() => handleNutritionAnalysis(record)}>
            营养分析
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除此食谱吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record: any) => {
    const groupedItems = record.menuItems?.reduce((acc: any, item: any) => {
      const key = `${item.day}-${item.mealType}`;
      if (!acc[key]) {
        acc[key] = {
          day: item.day,
          mealType: item.mealType,
          dishes: [],
        };
      }
      acc[key].dishes.push(item.dish);
      return acc;
    }, {});

    const dataSource = Object.values(groupedItems || {});

    const innerColumns = [
      {
        title: '日期',
        dataIndex: 'day',
        key: 'day',
        render: (day: string) => {
          const index = WEEK_DAYS.indexOf(day);
          return WEEK_DAYS_CN[index] || day;
        },
      },
      {
        title: '餐次',
        dataIndex: 'mealType',
        key: 'mealType',
        render: (mealType: string) => (
          <Tag color={getMealTypeColor(mealType)}>{getMealTypeLabel(mealType)}</Tag>
        ),
      },
      {
        title: '菜品',
        dataIndex: 'dishes',
        key: 'dishes',
        render: (dishes: any[]) => dishes?.map((d) => d.name).join('、') || '-',
      },
    ];

    return <Table dataSource={dataSource} columns={innerColumns} pagination={false} />;
  };

  // Step 1: 基本信息
  const renderBasicInfo = () => (
    <div style={{ padding: '24px 0' }}>
      <Form.Item
        name="name"
        label="食谱名称"
        rules={[{ required: true, message: '请输入食谱名称' }]}
      >
        <Input placeholder="例如：第一周食谱" />
      </Form.Item>

      <Form.Item
        name="dateRange"
        label="日期范围"
        rules={[{ required: true, message: '请选择日期范围' }]}
      >
        <RangePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="grade" label="适用年级">
        <Select placeholder="选择年级" allowClear>
          <Select.Option value="ALL">全部年级</Select.Option>
          <Select.Option value="SMALL">小班</Select.Option>
          <Select.Option value="MEDIUM">中班</Select.Option>
          <Select.Option value="LARGE">大班</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="teacherId" label="负责老师">
        <Select placeholder="选择负责老师" allowClear showSearch filterOption={(input, option: any) =>
          option?.children?.toLowerCase().includes(input.toLowerCase())
        }>
          {teachersData?.data?.map((teacher: any) => (
            <Select.Option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </div>
  );

  // Step 2: 菜品安排
  const renderMenuItems = () => {
    const dataSource = MEAL_TYPES.map((meal) => ({
      key: meal.key,
      mealType: meal.label,
      ...WEEK_DAYS.reduce((acc, day, index) => {
        acc[day] = { day, mealType: meal.key };
        return acc;
      }, {} as any),
    }));

    const weekColumns = [
      {
        title: '餐次',
        dataIndex: 'mealType',
        key: 'mealType',
        width: 100,
        fixed: 'left' as const,
      },
      ...WEEK_DAYS.map((day, index) => ({
        title: WEEK_DAYS_CN[index],
        dataIndex: day,
        key: day,
        width: 200,
        render: (_: any, record: any) => {
          const cellData = record[day];
          return (
            <Select
              mode="multiple"
              placeholder="选择菜品"
              style={{ width: '100%' }}
              value={getSelectedDishes(cellData.day, cellData.mealType)}
              onChange={(dishIds) => handleDishSelect(cellData.day, cellData.mealType, dishIds)}
              maxTagCount="responsive"
            >
              {dishesData?.data?.map((dish: any) => (
                <Select.Option key={dish.id} value={dish.id}>
                  {dish.name}
                </Select.Option>
              ))}
            </Select>
          );
        },
      })),
    ];

    return (
      <div style={{ padding: '24px 0' }}>
        <Table
          dataSource={dataSource}
          columns={weekColumns}
          pagination={false}
          scroll={{ x: 1200 }}
          bordered
        />
      </div>
    );
  };

  const renderPreview = () => {
    const values = form.getFieldsValue(['name', 'dateRange', 'grade', 'teacherId']);
    const startDate = values.dateRange?.[0];
    const endDate = values.dateRange?.[1];

    return (
      <div style={{ padding: '24px 0' }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="食谱名称">{values.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="日期范围">
            {startDate && endDate
              ? `${startDate.format('YYYY-MM-DD')} 至 ${endDate.format('YYYY-MM-DD')}`
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="适用年级">
            {values.grade || '全部年级'}
          </Descriptions.Item>
          <Descriptions.Item label="负责老师">
            {values.teacherId
              ? teachersData?.data?.find((t: any) => t.id === values.teacherId)?.name
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="已安排餐次">{menuItems.length} 餐</Descriptions.Item>
        </Descriptions>

        <Divider />

        <h3>菜品安排详情</h3>
        {menuItems.length === 0 ? (
          <p style={{ color: '#999' }}>未安排任何菜品</p>
        ) : (
          <Table
            dataSource={menuItems}
            columns={[
              {
                title: '日期',
                dataIndex: 'day',
                render: (day: string) => {
                  const index = WEEK_DAYS.indexOf(day);
                  return WEEK_DAYS_CN[index] || day;
                },
              },
              {
                title: '餐次',
                dataIndex: 'mealType',
                render: (type: string) => (
                  <Tag color={getMealTypeColor(type)}>{getMealTypeLabel(type)}</Tag>
                ),
              },
              {
                title: '菜品',
                dataIndex: 'dishIds',
                render: (dishIds: string[]) =>
                  dishIds
                    .map((id) => dishesData?.data?.find((d: any) => d.id === id)?.name)
                    .filter(Boolean)
                    .join('、'),
              },
            ]}
            pagination={false}
            rowKey={(record) => `${record.day}-${record.mealType}`}
          />
        )}
      </div>
    );
  };

  const steps = [
    { title: '基本信息' },
    { title: '安排菜品' },
    { title: '预览确认' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>{t('canteen.menus.title')}</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          {t('canteen.menus.add')}
        </Button>
      </div>

      {/* 查询区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <DatePicker
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            placeholder="选择日期"
          />
          <Select
            placeholder="选择年级"
            style={{ width: 200 }}
            onChange={(value) => console.log('筛选年级:', value)}
            allowClear
          >
            <Select.Option value="ALL">全部年级</Select.Option>
            <Select.Option value="SMALL">小班</Select.Option>
            <Select.Option value="MEDIUM">中班</Select.Option>
            <Select.Option value="LARGE">大班</Select.Option>
          </Select>
        </Space>
      </Card>

      <Card>
        <Table
          dataSource={menus || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          expandable={{ expandedRowRender }}
        />
      </Card>

      <Modal
        title={editingMenu ? '编辑食谱' : '创建食谱'}
        open={isModalOpen}
        onCancel={handleCancel}
        width={1200}
        footer={[
          <Button key="back" onClick={handlePrev} disabled={currentStep === 0}>
            上一步
          </Button>,
          currentStep < steps.length - 1 && (
            <Button key="next" type="primary" onClick={handleNext}>
              下一步
            </Button>
          ),
          currentStep === steps.length - 1 && (
            <Button
              key="submit"
              type="primary"
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingMenu ? '更新' : '提交'}
            </Button>
          ),
        ]}
      >
        <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />
        <Form form={form} layout="vertical">
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            {renderBasicInfo()}
          </div>
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            {renderMenuItems()}
          </div>
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
            {renderPreview()}
          </div>
        </Form>
      </Modal>

      <Modal
        title="食谱详情"
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        width={900}
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
            <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>北辰幼儿园食谱</h1>
            <h2 style={{ fontSize: '18px', margin: 0 }}>{viewingMenu?.name}</h2>
          </div>

          <Descriptions bordered column={2} style={{ marginBottom: '20px' }}>
            <Descriptions.Item label="食谱名称">{viewingMenu?.name}</Descriptions.Item>
            <Descriptions.Item label="日期范围">
              {viewingMenu && `${dayjs(viewingMenu.startDate).format('YYYY-MM-DD')} ~ ${dayjs(viewingMenu.endDate).format('YYYY-MM-DD')}`}
            </Descriptions.Item>
            <Descriptions.Item label="适用年级">
              {viewingMenu?.grade || '全部年级'}
            </Descriptions.Item>
            <Descriptions.Item label="餐次数量">
              {viewingMenu?.menuItems?.length || 0}
            </Descriptions.Item>
          </Descriptions>

          <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>详细菜品安排</h3>
          <Table
            dataSource={(() => {
              const groupedItems = viewingMenu?.menuItems?.reduce((acc: any, item: any) => {
                const key = `${item.day}-${item.mealType}`;
                if (!acc[key]) {
                  acc[key] = {
                    day: item.day,
                    mealType: item.mealType,
                    dishes: [],
                  };
                }
                acc[key].dishes.push(item.dish);
                return acc;
              }, {});
              return Object.values(groupedItems || {});
            })()}
            columns={[
              {
                title: '日期',
                dataIndex: 'day',
                key: 'day',
                render: (day: string) => {
                  const index = WEEK_DAYS.indexOf(day);
                  return WEEK_DAYS_CN[index] || day;
                },
              },
              {
                title: '餐次',
                dataIndex: 'mealType',
                key: 'mealType',
                render: (mealType: string) => (
                  <Tag color={getMealTypeColor(mealType)}>{getMealTypeLabel(mealType)}</Tag>
                ),
              },
              {
                title: '菜品',
                dataIndex: 'dishes',
                key: 'dishes',
                render: (dishes: any[]) => dishes?.map((d) => d.name).join('、') || '-',
              },
            ]}
            pagination={false}
            size="small"
          />

          <div style={{ marginTop: '40px', textAlign: 'right', fontSize: '12px', color: '#666' }}>
            <p>打印时间: {dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
          </div>
        </div>
      </Modal>

      <Modal
        title="营养分析"
        open={isNutritionModalOpen}
        onCancel={() => {
          setIsNutritionModalOpen(false);
          setNutritionData(null);
        }}
        width={1200}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handleNutritionPrint}>
            打印营养分析
          </Button>,
          <Button key="close" onClick={() => {
            setIsNutritionModalOpen(false);
            setNutritionData(null);
          }}>
            关闭
          </Button>,
        ]}
      >
        {loadingNutrition ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
        ) : nutritionData ? (
          <div ref={nutritionPrintRef}>
            <h3>{nutritionData.menuName}</h3>
            <p>
              日期范围: {dayjs(nutritionData.startDate).format('YYYY-MM-DD')} ~ {dayjs(nutritionData.endDate).format('YYYY-MM-DD')}
            </p>
            {nutritionData.className && <p>班级: {nutritionData.className}</p>}

            <Divider>每日营养摄入详情</Divider>

            {WEEK_DAYS_CN.map((dayName, index) => {
              const dayKey = WEEK_DAYS[index];
              const dayData = nutritionData.days?.find((d: any) => d.day === dayKey);

              if (!dayData || !dayData.meals || dayData.meals.length === 0) {
                return null;
              }

              return (
                <Card key={dayKey} style={{ marginBottom: 16 }} size="small">
                  <h4>{dayName}</h4>
                  <Table
                    dataSource={dayData.meals}
                    columns={[
                      {
                        title: '餐次',
                        dataIndex: 'mealType',
                        key: 'mealType',
                        render: (mealType: string) => (
                          <Tag color={getMealTypeColor(mealType)}>{getMealTypeLabel(mealType)}</Tag>
                        ),
                      },
                      {
                        title: '菜品',
                        dataIndex: 'dishes',
                        key: 'dishes',
                        render: (dishes: any[]) => dishes?.map((d) => d.name).join('、') || '-',
                      },
                      {
                        title: '热量(kcal)',
                        dataIndex: 'nutrition',
                        key: 'calories',
                        render: (n: any) => n?.calories?.toFixed(1) || 0,
                      },
                      {
                        title: '蛋白质(g)',
                        dataIndex: 'nutrition',
                        key: 'protein',
                        render: (n: any) => n?.protein?.toFixed(1) || 0,
                      },
                      {
                        title: '脂肪(g)',
                        dataIndex: 'nutrition',
                        key: 'fat',
                        render: (n: any) => n?.fat?.toFixed(1) || 0,
                      },
                      {
                        title: '碳水(g)',
                        dataIndex: 'nutrition',
                        key: 'carbs',
                        render: (n: any) => n?.carbs?.toFixed(1) || 0,
                      },
                      {
                        title: '钙(mg)',
                        dataIndex: 'nutrition',
                        key: 'calcium',
                        render: (n: any) => n?.calcium?.toFixed(1) || 0,
                      },
                    ]}
                    pagination={false}
                    size="small"
                  />
                  <div style={{ marginTop: 12, padding: '8px', background: '#f0f0f0', borderRadius: 4 }}>
                    <strong>当日总计:</strong>
                    <span style={{ marginLeft: 16 }}>热量: {dayData.totalNutrition?.calories?.toFixed(1) || 0} kcal</span>
                    <span style={{ marginLeft: 16 }}>蛋白质: {dayData.totalNutrition?.protein?.toFixed(1) || 0} g</span>
                    <span style={{ marginLeft: 16 }}>脂肪: {dayData.totalNutrition?.fat?.toFixed(1) || 0} g</span>
                    <span style={{ marginLeft: 16 }}>碳水: {dayData.totalNutrition?.carbs?.toFixed(1) || 0} g</span>
                    <span style={{ marginLeft: 16 }}>钙: {dayData.totalNutrition?.calcium?.toFixed(1) || 0} mg</span>
                  </div>
                </Card>
              );
            })}

            {nutritionData.weeklyAverage && (
              <>
                <Divider>周平均营养摄入</Divider>
                <Descriptions bordered column={4} size="small">
                  <Descriptions.Item label="热量">
                    {nutritionData.weeklyAverage.calories?.toFixed(1) || 0} kcal/天
                  </Descriptions.Item>
                  <Descriptions.Item label="蛋白质">
                    {nutritionData.weeklyAverage.protein?.toFixed(1) || 0} g/天
                  </Descriptions.Item>
                  <Descriptions.Item label="脂肪">
                    {nutritionData.weeklyAverage.fat?.toFixed(1) || 0} g/天
                  </Descriptions.Item>
                  <Descriptions.Item label="碳水化合物">
                    {nutritionData.weeklyAverage.carbs?.toFixed(1) || 0} g/天
                  </Descriptions.Item>
                  <Descriptions.Item label="膳食纤维">
                    {nutritionData.weeklyAverage.fiber?.toFixed(1) || 0} g/天
                  </Descriptions.Item>
                  <Descriptions.Item label="维生素A">
                    {nutritionData.weeklyAverage.vitaminA?.toFixed(1) || 0} μg/天
                  </Descriptions.Item>
                  <Descriptions.Item label="维生素B1">
                    {nutritionData.weeklyAverage.vitaminB1?.toFixed(2) || 0} mg/天
                  </Descriptions.Item>
                  <Descriptions.Item label="维生素B2">
                    {nutritionData.weeklyAverage.vitaminB2?.toFixed(2) || 0} mg/天
                  </Descriptions.Item>
                  <Descriptions.Item label="维生素C">
                    {nutritionData.weeklyAverage.vitaminC?.toFixed(1) || 0} mg/天
                  </Descriptions.Item>
                  <Descriptions.Item label="钙">
                    {nutritionData.weeklyAverage.calcium?.toFixed(1) || 0} mg/天
                  </Descriptions.Item>
                  <Descriptions.Item label="铁">
                    {nutritionData.weeklyAverage.iron?.toFixed(1) || 0} mg/天
                  </Descriptions.Item>
                  <Descriptions.Item label="锌">
                    {nutritionData.weeklyAverage.zinc?.toFixed(1) || 0} mg/天
                  </Descriptions.Item>
                  <Descriptions.Item label="钠">
                    {nutritionData.weeklyAverage.sodium?.toFixed(1) || 0} mg/天
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
