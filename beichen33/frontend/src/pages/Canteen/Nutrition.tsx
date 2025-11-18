import { useState, useRef } from 'react';
import { Card, Row, Col, DatePicker, Select, Button, Table, Statistic, Space, Empty } from 'antd';
import {
  FireOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
  BarChartOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { nutritionApi, classApi } from '../../services/api';
import dayjs, { Dayjs } from 'dayjs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const { RangePicker } = DatePicker;

export default function Nutrition() {
  const { t } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('week'),
    dayjs().endOf('week'),
  ]);
  const [selectedClass, setSelectedClass] = useState<string | undefined>();

  // 查询班级列表
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll(),
  });

  // 查询营养分析数据
  const { data: analysisData, isLoading, refetch } = useQuery({
    queryKey: ['nutrition-analysis', dateRange, selectedClass],
    queryFn: () => {
      if (!dateRange[0] || !dateRange[1]) return null;
      return nutritionApi.analyze({
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        classId: selectedClass,
      });
    },
    enabled: !!dateRange[0] && !!dateRange[1],
  });

  const handleAnalyze = () => {
    refetch();
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Nutrition_Report_${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format('YYYY-MM-DD')}`,
  });

  // 图表数据
  const chartData = analysisData?.dailyData || [];

  // 详细数据表格列
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '餐次',
      dataIndex: 'mealType',
      key: 'mealType',
    },
    {
      title: '热量(kcal)',
      dataIndex: 'calories',
      key: 'calories',
      render: (val: number) => val?.toFixed(1) || '0',
    },
    {
      title: '蛋白质(g)',
      dataIndex: 'protein',
      key: 'protein',
      render: (val: number) => val?.toFixed(1) || '0',
    },
    {
      title: '脂肪(g)',
      dataIndex: 'fat',
      key: 'fat',
      render: (val: number) => val?.toFixed(1) || '0',
    },
    {
      title: '碳水化合物(g)',
      dataIndex: 'carbs',
      key: 'carbs',
      render: (val: number) => val?.toFixed(1) || '0',
    },
  ];

  return (
    <div>
      <h1>{t('canteen.nutrition.title')}</h1>

      {/* 查询区域 */}
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
            placeholder={['开始日期', '结束日期']}
          />
          <Select
            placeholder="选择班级（可选）"
            allowClear
            style={{ width: 200 }}
            value={selectedClass}
            onChange={setSelectedClass}
          >
            {classesData?.map((cls: any) => (
              <Select.Option key={cls.id} value={cls.id}>
                {cls.name}
              </Select.Option>
            ))}
          </Select>
          <Button type="primary" icon={<BarChartOutlined />} onClick={handleAnalyze}>
            分析
          </Button>
          <Button icon={<PrinterOutlined />} onClick={handlePrint} disabled={!analysisData}>
            打印报告
          </Button>
        </Space>
      </Card>

      {!analysisData ? (
        <Card>
          <Empty description="请选择日期范围后点击分析按钮" />
        </Card>
      ) : (
        <div ref={printRef}>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="总热量"
                  value={analysisData.totalCalories || 0}
                  suffix="kcal"
                  prefix={<FireOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="蛋白质"
                  value={analysisData.totalProtein || 0}
                  suffix="g"
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="脂肪"
                  value={analysisData.totalFat || 0}
                  suffix="g"
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="碳水化合物"
                  value={analysisData.totalCarbs || 0}
                  suffix="g"
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 营养成分趋势图 */}
          <Card title="每日营养趋势" style={{ marginBottom: 24 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="#ff4d4f"
                    name="热量(kcal)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="protein"
                    stroke="#1890ff"
                    name="蛋白质(g)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="fat"
                    stroke="#faad14"
                    name="脂肪(g)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="carbs"
                    stroke="#52c41a"
                    name="碳水化合物(g)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无图表数据" />
            )}
          </Card>

          {/* 营养成分分布图 */}
          <Card title="营养成分分布" style={{ marginBottom: 24 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="protein" fill="#1890ff" name="蛋白质(g)" />
                  <Bar dataKey="fat" fill="#faad14" name="脂肪(g)" />
                  <Bar dataKey="carbs" fill="#52c41a" name="碳水化合物(g)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无图表数据" />
            )}
          </Card>

          <Card title="详细数据">
            <Table
              dataSource={analysisData.details || []}
              columns={columns}
              rowKey={(record) => `${record.date}-${record.mealType}`}
              loading={isLoading}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
