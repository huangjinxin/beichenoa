import { useState } from 'react';
import { Card, Form, DatePicker, Select, Button, Space, Alert, Tag, message, Spin } from 'antd';
import { ArrowLeftOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { purchaseApi, menuApi, classApi, studentApi, campusApi } from '../../services/api';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

export default function PurchaseGenerate() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<any>(null);
  const [selectedCampus, setSelectedCampus] = useState<string | undefined>(undefined);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // 获取学校列表
  const { data: campusData } = useQuery({
    queryKey: ['campus'],
    queryFn: () => campusApi.getAll(),
  });

  // 获取班级列表（根据学校筛选）
  const { data: classesData } = useQuery({
    queryKey: ['classes', selectedCampus],
    queryFn: async () => {
      const result = await classApi.getAll();
      // 如果选择了学校，过滤班级
      if (selectedCampus && result) {
        return result.filter((cls: any) => cls.campusId === selectedCampus);
      }
      return result;
    },
  });

  // 获取食谱列表（所有食谱，不需要日期过滤）
  const { data: menusData } = useQuery({
    queryKey: ['menus-all'],
    queryFn: async () => {
      // 获取最近一个月的食谱
      const date = dayjs().format('YYYY-MM-DD');
      return menuApi.getByDate(date);
    },
  });

  // 获取学生统计
  const { data: studentStats, isLoading: statsLoading } = useQuery({
    queryKey: ['student-stats', selectedClasses],
    queryFn: () => studentApi.getStats(selectedClasses),
    enabled: selectedClasses.length > 0,
  });

  // 生成采购计划
  const generateMutation = useMutation({
    mutationFn: (values: any) => {
      return purchaseApi.generate({
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        menuIds: [values.menuId], // 将单个menuId转换为数组
        classIds: values.classIds,
      });
    },
    onSuccess: (data: any) => {
      message.success('采购计划生成成功！');
      // API返回的数据直接就是计划对象，不需要 .data
      navigate(`/canteen/purchase/plans/${data.id}`);
    },
    onError: (error: any) => {
      console.error('生成采购计划失败:', error);
      message.error(error.response?.data?.message || '生成采购计划失败');
    },
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      generateMutation.mutate(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // 处理食谱选择变化
  const handleMenuChange = (menuId: string) => {
    const menu = menusData?.find((m: any) => m.id === menuId);
    if (menu) {
      setSelectedMenu(menu);
      // 自动填充日期范围
      form.setFieldsValue({
        dateRange: [dayjs(menu.startDate), dayjs(menu.endDate)],
      });
      setDateRange([dayjs(menu.startDate), dayjs(menu.endDate)]);
    }
  };

  // 处理学校选择变化
  const handleCampusChange = (campusId: string | undefined) => {
    setSelectedCampus(campusId);
    // 清空班级选择
    form.setFieldsValue({ classIds: [] });
    setSelectedClasses([]);
  };

  // 处理班级选择变化
  const handleClassChange = (classIds: string[]) => {
    // 如果选择了"全部班级"
    if (classIds.includes('ALL')) {
      // 获取所有班级ID
      const allClassIds = classesData?.map((cls: any) => cls.id) || [];
      form.setFieldsValue({ classIds: allClassIds });
      setSelectedClasses(allClassIds);
    } else {
      setSelectedClasses(classIds);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="生成采购计划"
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/canteen/purchase/plans')}>
            返回列表
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            menuId: undefined,
            dateRange: null,
            campusId: undefined,
            classIds: [],
          }}
        >
          <Form.Item
            label="选择食谱"
            name="menuId"
            rules={[{ required: true, message: '请选择食谱' }]}
            help="选择食谱后会自动填充日期范围"
          >
            <Select
              placeholder="请选择要生成采购计划的食谱"
              onChange={handleMenuChange}
              options={menusData?.map((menu: any) => ({
                label: `${menu.name} (${dayjs(menu.startDate).format('MM-DD')} ~ ${dayjs(menu.endDate).format('MM-DD')})`,
                value: menu.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="日期范围"
            name="dateRange"
            rules={[{ required: true, message: '请先选择食谱' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              disabled
              placeholder={['开始日期（自动填充）', '结束日期（自动填充）']}
            />
          </Form.Item>

          <Form.Item
            label="选择学校"
            name="campusId"
            help="可选，选择后班级下拉将只显示该学校的班级"
          >
            <Select
              placeholder="请选择学校（可选）"
              allowClear
              onChange={handleCampusChange}
              options={campusData?.map((campus: any) => ({
                label: campus.name,
                value: campus.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="适用班级"
            name="classIds"
            rules={[{ required: true, message: '请选择班级' }]}
            help="选择班级用于计算学生数量和年龄分布，可选择全部班级"
          >
            <Select
              mode="multiple"
              placeholder="选择班级（用于计算学生数量）"
              onChange={handleClassChange}
              maxTagCount="responsive"
            >
              <Select.Option value="ALL">全部班级</Select.Option>
              {classesData?.map((cls: any) => (
                <Select.Option key={cls.id} value={cls.id}>
                  {cls.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* 学生统计预览 */}
          {selectedClasses.length > 0 && (
            <Alert
              message="学生统计预览"
              description={
                statsLoading ? (
                  <Spin size="small" />
                ) : studentStats ? (
                  <div>
                    <p>
                      <strong>总人数：</strong>
                      {studentStats.total || 0} 人
                    </p>
                    {studentStats.byAgeGroup && Object.keys(studentStats.byAgeGroup).length > 0 ? (
                      <Space size={4} wrap>
                        <strong>年龄分布：</strong>
                        {Object.entries(studentStats.byAgeGroup).map(([age, count]) => (
                          <Tag key={age} color="blue">
                            {age}岁: {count as number}人
                          </Tag>
                        ))}
                      </Space>
                    ) : (
                      <p style={{ color: '#999' }}>暂无年龄分布数据</p>
                    )}
                    <p style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                      系统将根据各年龄段人数和营养标准自动计算食材用量
                    </p>
                  </div>
                ) : (
                  <p style={{ color: '#999' }}>暂无学生数据</p>
                )
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Alert
            message="计算说明"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>系统将根据选定食谱中的所有菜品和食材，计算总采购量</li>
                <li>根据学生年龄段应用不同的用量系数（2-3岁: 0.8，3-4岁: 0.9，4-5岁: 1.0，5-6岁: 1.1，6-7岁: 1.2）</li>
                <li>自动汇总相同食材，并转换为斤（1斤=500克）</li>
                <li>按供应商类别分类展示采购清单</li>
              </ul>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleSubmit}
                loading={generateMutation.isPending}
                size="large"
              >
                生成采购计划
              </Button>
              <Button onClick={() => navigate('/canteen/purchase/plans')} size="large">
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
