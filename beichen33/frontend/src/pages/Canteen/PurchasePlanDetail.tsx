import { useRef, useState } from 'react';
import { Card, Descriptions, Tag, Space, Button, Table, Typography, Divider, Tabs, Alert } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, CalendarOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { purchaseApi } from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function PurchasePlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [printMode, setPrintMode] = useState<'daily' | 'summary'>('daily');

  // 获取采购计划详情
  const { data: plan, isLoading } = useQuery({
    queryKey: ['purchase-plan', id],
    queryFn: () => purchaseApi.getPlan(id!),
    enabled: !!id,
  });

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `采购计划_${plan?.name}`,
  });

  const statusConfig = {
    DRAFT: { text: '草稿', color: 'default' },
    CONFIRMED: { text: '已确认', color: 'blue' },
    ORDERED: { text: '已下单', color: 'orange' },
    COMPLETED: { text: '已完成', color: 'green' },
  };

  const status = plan?.status || 'DRAFT';
  const config = statusConfig[status as keyof typeof statusConfig];

  // 合并表格数据：将所有供应商的食材汇总
  const allItems = plan?.purchaseItems
    ? Object.entries(plan.purchaseItems).flatMap(([supplier, items]: [string, any]) =>
        items.map((item: any) => ({
          ...item,
          supplier,
        }))
      )
    : [];

  const columns = [
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 120,
    },
    {
      title: '食材名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '总采购数量',
      key: 'amount',
      width: 150,
      render: (_: any, record: any) => `${record.amount} ${record.unit}`,
    },
    {
      title: '每日用量',
      key: 'dailyAmount',
      width: 150,
      render: (_: any, record: any) =>
        record.dailyAmount
          ? `${record.dailyAmount} ${record.unit}/天`
          : '-',
    },
  ];

  if (isLoading || !plan) {
    return (
      <div style={{ padding: 24 }}>
        <Card loading={isLoading}>加载中...</Card>
      </div>
    );
  }

  const totalStudents = Object.values(plan.studentStats || {}).reduce(
    (sum: number, count: any) => sum + count,
    0
  );

  // 渲染每日采购清单
  const renderDailyPurchaseList = () => {
    if (!plan.dailyPurchaseItems) {
      return (
        <Alert
          message="无每日采购数据"
          description="此采购计划未包含每日明细数据。请重新生成采购计划以获取每日采购清单。"
          type="info"
          showIcon
        />
      );
    }

    const sortedDays = Object.keys(plan.dailyPurchaseItems).sort();

    return (
      <div className="daily-purchase-list">
        {sortedDays.map((dateStr) => {
          const dayData = plan.dailyPurchaseItems[dateStr];
          return (
            <Card
              key={dateStr}
              title={
                <Space>
                  <CalendarOutlined />
                  <span>{dayjs(dateStr).format('YYYY年MM月DD日')}</span>
                  <Tag color="blue">{dayData.dayOfWeek}</Tag>
                </Space>
              }
              size="small"
              style={{ marginBottom: 16, pageBreakInside: 'avoid' }}
            >
              {Object.entries(dayData.items || {}).map(([supplier, items]: [string, any]) => (
                <div key={supplier} style={{ marginBottom: 12 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    {supplier}:
                    {supplier === '粮油' && dayData.dayOfWeek === '周一' && (
                      <Tag color="orange" style={{ marginLeft: 8 }}>本周采购量</Tag>
                    )}
                  </Text>
                  <Table
                    dataSource={items}
                    columns={[
                      {
                        title: '食材',
                        dataIndex: 'name',
                        key: 'name',
                        width: '40%',
                      },
                      {
                        title: '数量',
                        key: 'amount',
                        width: '30%',
                        render: (_: any, record: any) => (
                          <Text strong>{record.amount} {record.unit}</Text>
                        ),
                      },
                      {
                        title: '餐次',
                        dataIndex: 'meals',
                        key: 'meals',
                        width: '30%',
                        render: (meals: string) => (
                          <Tag color="green">{meals}</Tag>
                        ),
                      },
                    ]}
                    pagination={false}
                    bordered
                    size="small"
                    rowKey={(record, index) => `${record.name}-${index}`}
                  />
                </div>
              ))}
            </Card>
          );
        })}
      </div>
    );
  };

  // 渲染按品类分组的采购清单（粮油一周总量，蔬菜每日用量）
  const renderCategoryGroupedList = () => {
    if (!plan.dailyPurchaseItems || !plan.purchaseItems) {
      return (
        <Alert
          message="无采购数据"
          description="此采购计划未包含采购数据。请重新生成采购计划。"
          type="info"
          showIcon
        />
      );
    }

    // 获取粮油类的一周总量
    const grainOilItems = plan.purchaseItems['粮油'] || [];

    // 获取其他类的每日用量
    const sortedDays = Object.keys(plan.dailyPurchaseItems).sort();

    return (
      <div className="category-grouped-list">
        {/* 粮油类 - 一周总量 */}
        {grainOilItems.length > 0 && (
          <Card
            title={
              <Space>
                <span>粮油类（一周采购量）</span>
                <Tag color="orange">周一采购</Tag>
              </Space>
            }
            size="small"
            style={{ marginBottom: 24, background: '#fffbe6', pageBreakInside: 'avoid' }}
          >
            <Table
              dataSource={grainOilItems}
              columns={[
                {
                  title: '食材',
                  dataIndex: 'name',
                  key: 'name',
                  width: '50%',
                },
                {
                  title: '一周总量',
                  key: 'amount',
                  width: '25%',
                  render: (_: any, record: any) => (
                    <Text strong style={{ color: '#fa8c16' }}>{record.amount} {record.unit}</Text>
                  ),
                },
                {
                  title: '每日用量',
                  key: 'dailyAmount',
                  width: '25%',
                  render: (_: any, record: any) =>
                    record.dailyAmount
                      ? `${record.dailyAmount} ${record.unit}/天`
                      : '-',
                },
              ]}
              pagination={false}
              bordered
              size="small"
              rowKey={(record, index) => `grain-${record.name}-${index}`}
            />
          </Card>
        )}

        {/* 其他类 - 每日用量 */}
        <Divider orientation="left">每日采购（蔬菜及其他）</Divider>
        {sortedDays.map((dateStr) => {
          const dayData = plan.dailyPurchaseItems[dateStr];
          // 过滤掉粮油类
          const otherCategories = Object.entries(dayData.items || {})
            .filter(([supplier]) => supplier !== '粮油');

          if (otherCategories.length === 0) {
            return null;
          }

          return (
            <Card
              key={dateStr}
              title={
                <Space>
                  <CalendarOutlined />
                  <span>{dayjs(dateStr).format('YYYY年MM月DD日')}</span>
                  <Tag color="blue">{dayData.dayOfWeek}</Tag>
                </Space>
              }
              size="small"
              style={{ marginBottom: 16, pageBreakInside: 'avoid' }}
            >
              {otherCategories.map(([supplier, items]: [string, any]) => (
                <div key={supplier} style={{ marginBottom: 12 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    {supplier}:
                  </Text>
                  <Table
                    dataSource={items}
                    columns={[
                      {
                        title: '食材',
                        dataIndex: 'name',
                        key: 'name',
                        width: '40%',
                      },
                      {
                        title: '数量',
                        key: 'amount',
                        width: '30%',
                        render: (_: any, record: any) => (
                          <Text strong>{record.amount} {record.unit}</Text>
                        ),
                      },
                      {
                        title: '餐次',
                        dataIndex: 'meals',
                        key: 'meals',
                        width: '30%',
                        render: (meals: string) => (
                          <Tag color="green">{meals}</Tag>
                        ),
                      },
                    ]}
                    pagination={false}
                    bordered
                    size="small"
                    rowKey={(record, index) => `${record.name}-${index}`}
                  />
                </div>
              ))}
            </Card>
          );
        })}
      </div>
    );
  };

  // 渲染每日采购清单（打印专用格式）
  const renderDailyPurchaseListForPrint = () => {
    if (!plan.dailyPurchaseItems) {
      return null;
    }

    const sortedDays = Object.keys(plan.dailyPurchaseItems).sort();

    return (
      <div className="daily-purchase-print">
        {sortedDays.map((dateStr) => {
          const dayData = plan.dailyPurchaseItems[dateStr];
          return (
            <div key={dateStr} className="day-section" style={{ pageBreakInside: 'avoid', marginBottom: 24 }}>
              <div style={{
                background: '#f0f0f0',
                padding: '8px 16px',
                borderRadius: 4,
                marginBottom: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Text strong style={{ fontSize: 16 }}>
                  {dayjs(dateStr).format('YYYY年MM月DD日')} ({dayData.dayOfWeek})
                </Text>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'left', width: '20%' }}>供应商</th>
                    <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'left', width: '35%' }}>食材</th>
                    <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', width: '20%' }}>数量</th>
                    <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', width: '25%' }}>餐次</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(dayData.items || {}).flatMap(([supplier, items]: [string, any], sIdx) =>
                    items.map((item: any, idx: number) => (
                      <tr key={`${supplier}-${item.name}-${idx}`}>
                        {idx === 0 && (
                          <td
                            rowSpan={items.length}
                            style={{
                              border: '1px solid #d9d9d9',
                              padding: '8px',
                              verticalAlign: 'top',
                              fontWeight: 'bold',
                              background: sIdx % 2 === 0 ? '#fff' : '#fafafa'
                            }}
                          >
                            {supplier}
                          </td>
                        )}
                        <td style={{ border: '1px solid #d9d9d9', padding: '6px 8px' }}>{item.name}</td>
                        <td style={{ border: '1px solid #d9d9d9', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>
                          {item.amount} {item.unit}
                        </td>
                        <td style={{ border: '1px solid #d9d9d9', padding: '6px 8px', textAlign: 'center' }}>
                          {item.meals}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div style={{ marginTop: 12, textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  采购员签字：_____________ 日期：_____________
                </Text>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="采购计划详情"
        extra={
          <Space>
            <Button
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              type="primary"
            >
              打印{printMode === 'daily' ? '每日' : '汇总'}采购计划
            </Button>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/canteen/purchase/plans')}>
              返回列表
            </Button>
          </Space>
        }
      >
        {/* 切换打印模式 */}
        <Alert
          message="打印模式选择"
          description={
            <Space>
              <Text>选择打印格式：</Text>
              <Button
                type={printMode === 'daily' ? 'primary' : 'default'}
                size="small"
                onClick={() => setPrintMode('daily')}
              >
                按每日打印
              </Button>
              <Button
                type={printMode === 'summary' ? 'primary' : 'default'}
                size="small"
                onClick={() => setPrintMode('summary')}
              >
                汇总打印
              </Button>
            </Space>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <div ref={printRef} style={{ padding: 20 }}>
          {/* 打印时的标题 */}
          <div className="print-header" style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={2} style={{ marginBottom: 8 }}>
              北辰幼儿园采购计划
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              {dayjs(plan.startDate).format('YYYY年MM月DD日')} 至{' '}
              {dayjs(plan.endDate).format('YYYY年MM月DD日')}
            </Text>
          </div>

          {/* 基本信息 */}
          <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="计划名称">{plan.name}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={config.color}>{config.text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="开始日期">
              {dayjs(plan.startDate).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="结束日期">
              {dayjs(plan.endDate).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="创建人">{plan.creator?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(plan.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>

          {/* 学生统计 */}
          <Card title="学生统计" size="small" style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>总人数：</Text>
                <Text>{totalStudents} 人</Text>
              </div>
              <div>
                <Text strong>年龄分布：</Text>
                <Space size={4} wrap style={{ marginLeft: 8 }}>
                  {Object.entries(plan.studentStats || {}).map(([age, count]) => (
                    <Tag key={age} color="blue">
                      {age}岁: {count}人
                    </Tag>
                  ))}
                </Space>
              </div>
            </Space>
          </Card>

          {/* 根据打印模式显示不同内容 */}
          {printMode === 'daily' ? (
            <>
              <Divider>每日采购清单</Divider>
              <div className="screen-only">
                <Tabs
                  defaultActiveKey="category"
                  items={[
                    {
                      key: 'category',
                      label: '按品类分组（推荐）',
                      children: renderCategoryGroupedList(),
                    },
                    {
                      key: 'daily',
                      label: '按日期查看',
                      children: renderDailyPurchaseList(),
                    },
                    {
                      key: 'summary',
                      label: '汇总查看',
                      children: (
                        <>
                          <Table
                            dataSource={allItems}
                            columns={columns}
                            pagination={false}
                            bordered
                            size="small"
                            rowKey={(record, index) => `${record.supplier}-${record.name}-${index}`}
                            style={{ marginBottom: 24 }}
                          />
                          <Divider>按供应商分类</Divider>
                          <div className="supplier-sections">
                            {Object.entries(plan.purchaseItems || {}).map(([supplier, items]: [string, any]) => (
                              <Card
                                key={supplier}
                                title={supplier}
                                size="small"
                                style={{ marginBottom: 16 }}
                              >
                                <Space wrap>
                                  {items.map((item: any, idx: number) => (
                                    <Tag key={idx} color="blue" style={{ fontSize: 14, padding: '4px 8px' }}>
                                      {item.name}: {item.amount}{item.unit}
                                    </Tag>
                                  ))}
                                </Space>
                              </Card>
                            ))}
                          </div>
                        </>
                      ),
                    },
                  ]}
                />
              </div>
              <div className="print-only">
                {renderDailyPurchaseListForPrint()}
              </div>
            </>
          ) : (
            <>
              <Divider>采购清单汇总</Divider>
              {/* 采购清单表格 */}
              <Table
                dataSource={allItems}
                columns={columns}
                pagination={false}
                bordered
                size="small"
                rowKey={(record, index) => `${record.supplier}-${record.name}-${index}`}
                style={{ marginBottom: 24 }}
              />

              {/* 按供应商分组显示 */}
              <Divider>按供应商分类</Divider>
              <div className="supplier-sections">
                {Object.entries(plan.purchaseItems || {}).map(([supplier, items]: [string, any]) => (
                  <Card
                    key={supplier}
                    title={supplier}
                    size="small"
                    style={{ marginBottom: 16, pageBreakInside: 'avoid' }}
                  >
                    <Space wrap>
                      {items.map((item: any, idx: number) => (
                        <Tag key={idx} color="blue" style={{ fontSize: 14, padding: '4px 8px' }}>
                          {item.name}: {item.amount}{item.unit}
                          {item.dailyAmount && ` (每天${item.dailyAmount}${item.unit})`}
                        </Tag>
                      ))}
                    </Space>
                  </Card>
                ))}
              </div>

              {/* 打印时的页脚 */}
              <div className="print-footer" style={{ marginTop: 40, textAlign: 'right' }}>
                <Space direction="vertical" align="end">
                  <Text type="secondary">采购员签字：___________</Text>
                  <Text type="secondary">日期：___________</Text>
                </Space>
              </div>
            </>
          )}
        </div>
      </Card>

      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          @page {
            size: A4;
            margin: 10mm;
          }

          .ant-card-extra,
          .ant-btn,
          .ant-alert,
          .ant-tabs-nav,
          .screen-only {
            display: none !important;
          }

          .print-header {
            display: block !important;
          }

          .print-only {
            display: block !important;
          }

          .supplier-sections .ant-card {
            page-break-inside: avoid;
          }

          .day-section {
            page-break-inside: avoid;
          }

          .print-footer {
            display: block !important;
          }

          table {
            font-size: 11px !important;
          }

          .ant-descriptions {
            font-size: 11px !important;
          }
        }

        @media screen {
          .print-header {
            display: none;
          }

          .print-footer {
            display: none;
          }

          .print-only {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
