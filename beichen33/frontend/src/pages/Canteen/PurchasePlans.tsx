import { useState } from 'react';
import { Card, Table, Button, Space, Tag, Popconfirm, message, Modal } from 'antd';
import { PlusOutlined, EyeOutlined, PrinterOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { purchaseApi } from '../../services/api';
import dayjs from 'dayjs';

interface PurchasePlan {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'CONFIRMED' | 'ORDERED' | 'COMPLETED';
  studentStats: Record<string, number>;
  createdAt: string;
  creator: {
    name: string;
    email: string;
  };
}

export default function PurchasePlans() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // 获取采购计划列表
  const { data, isLoading } = useQuery({
    queryKey: ['purchase-plans', page, pageSize],
    queryFn: () => purchaseApi.getPlans({ page, pageSize }),
  });

  // 更新状态
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'confirm' | 'order' | 'complete' }) => {
      if (action === 'confirm') return purchaseApi.confirmPlan(id);
      if (action === 'order') return purchaseApi.orderPlan(id);
      return purchaseApi.completePlan(id);
    },
    onSuccess: () => {
      message.success('状态更新成功');
      queryClient.invalidateQueries({ queryKey: ['purchase-plans'] });
    },
    onError: () => {
      message.error('状态更新失败');
    },
  });

  // 删除采购计划
  const deleteMutation = useMutation({
    mutationFn: purchaseApi.deletePlan,
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['purchase-plans'] });
    },
    onError: () => {
      message.error('删除失败');
    },
  });

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的采购计划');
      return;
    }
    Modal.confirm({
      title: `确定删除 ${selectedRowKeys.length} 个采购计划？`,
      content: '此操作不可撤销',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map(id => purchaseApi.deletePlan(id)));
          message.success('批量删除成功');
          setSelectedRowKeys([]);
          queryClient.invalidateQueries({ queryKey: ['purchase-plans'] });
        } catch (error) {
          message.error('批量删除失败');
        }
      },
    });
  };

  const statusConfig = {
    DRAFT: { text: '草稿', color: 'default' },
    CONFIRMED: { text: '已确认', color: 'blue' },
    ORDERED: { text: '已下单', color: 'orange' },
    COMPLETED: { text: '已完成', color: 'green' },
  };

  const columns = [
    {
      title: '计划名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: PurchasePlan) => (
        <a onClick={() => navigate(`/canteen/purchase/plans/${record.id}`)}>
          {name}
        </a>
      ),
    },
    {
      title: '日期范围',
      key: 'dateRange',
      render: (_: any, record: PurchasePlan) => (
        <span>
          {dayjs(record.startDate).format('YYYY-MM-DD')} ~ {dayjs(record.endDate).format('YYYY-MM-DD')}
        </span>
      ),
    },
    {
      title: '学生人数',
      key: 'studentCount',
      render: (_: any, record: PurchasePlan) => {
        const total = Object.values(record.studentStats).reduce((sum, count) => sum + count, 0);
        return `${total}人`;
      },
    },
    {
      title: '年龄分布',
      key: 'ageGroups',
      render: (_: any, record: PurchasePlan) => (
        <Space size={4} wrap>
          {Object.entries(record.studentStats).map(([age, count]) => (
            <Tag key={age} color="blue">
              {age}岁: {count}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '创建人',
      key: 'creator',
      render: (_: any, record: PurchasePlan) => record.creator?.name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 250,
      render: (_: any, record: PurchasePlan) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/canteen/purchase/plans/${record.id}`)}
          >
            查看
          </Button>

          {record.status === 'DRAFT' && (
            <Popconfirm
              title="确认此采购计划？"
              onConfirm={() => updateStatusMutation.mutate({ id: record.id, action: 'confirm' })}
            >
              <Button type="link" size="small">
                确认
              </Button>
            </Popconfirm>
          )}

          {record.status === 'CONFIRMED' && (
            <Popconfirm
              title="标记为已下单？"
              onConfirm={() => updateStatusMutation.mutate({ id: record.id, action: 'order' })}
            >
              <Button type="link" size="small">
                下单
              </Button>
            </Popconfirm>
          )}

          {record.status === 'ORDERED' && (
            <Popconfirm
              title="标记为已完成？"
              onConfirm={() => updateStatusMutation.mutate({ id: record.id, action: 'complete' })}
            >
              <Button type="link" size="small">
                完成
              </Button>
            </Popconfirm>
          )}

          <Button
            type="link"
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => navigate(`/canteen/purchase/plans/${record.id}/print`)}
          >
            打印
          </Button>

          <Popconfirm
            title="确定删除此采购计划？"
            description="此操作不可撤销"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as string[]),
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="采购计划管理"
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleBatchDelete}
              >
                批量删除 ({selectedRowKeys.length})
              </Button>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/canteen/purchase/generate')}
            >
              生成采购计划
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={data?.data || []}
          columns={columns}
          loading={isLoading}
          rowKey="id"
          rowSelection={rowSelection}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            },
          }}
        />
      </Card>
    </div>
  );
}
