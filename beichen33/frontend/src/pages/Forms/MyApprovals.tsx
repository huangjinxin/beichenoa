import { useState } from 'react';
import { Table, Tag, Space, Button, Modal, Input, message, Card, Descriptions, Divider, Typography, Tabs, Badge } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined, RollbackOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formApi } from '../../services/api';
import dayjs from 'dayjs';

const { Text } = Typography;
const { TextArea } = Input;

export default function MyApprovals() {
  const queryClient = useQueryClient();
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [currentApproval, setCurrentApproval] = useState<any>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'RETURN'>('APPROVE');
  const [comment, setComment] = useState('');

  // 获取待审批列表
  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['my-pending-approvals'],
    queryFn: () => formApi.getMyPendingApprovals(),
  });

  // 获取已审批列表
  const { data: approvedData, isLoading: approvedLoading } = useQuery({
    queryKey: ['my-approved-list'],
    queryFn: () => formApi.getMyApprovedList(),
  });

  // 审批操作
  const approveMutation = useMutation({
    mutationFn: ({ id, action, comment }: { id: string; action: 'APPROVE' | 'REJECT' | 'RETURN'; comment?: string }) =>
      formApi.approveSubmission(id, { action, comment }),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['my-pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['my-approved-list'] });
      queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
      message.success(result.message || '操作成功');
      setActionModalOpen(false);
      setComment('');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '操作失败');
    },
  });

  const handleView = (record: any) => {
    setCurrentApproval(record);
    setViewModalOpen(true);
  };

  const handleAction = (record: any, action: 'APPROVE' | 'REJECT' | 'RETURN') => {
    setCurrentApproval(record);
    setActionType(action);
    if (action === 'APPROVE') {
      // 通过可以直接操作
      approveMutation.mutate({
        id: record.submission.id,
        action: 'APPROVE',
        comment: '',
      });
    } else {
      // 驳回和退回需要填写意见
      setActionModalOpen(true);
    }
  };

  const handleActionSubmit = () => {
    if (!currentApproval) return;
    approveMutation.mutate({
      id: currentApproval.submission.id,
      action: actionType,
      comment,
    });
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      PENDING: '待审批',
      APPROVED: '已通过',
      REJECTED: '已驳回',
    };
    return map[status] || status;
  };

  const getActionText = (action: string) => {
    const map: Record<string, string> = {
      APPROVE: '通过',
      REJECT: '驳回',
      RETURN: '退回',
    };
    return map[action] || action;
  };

  // 待审批表格列
  const pendingColumns = [
    {
      title: '表单名称',
      dataIndex: ['submission', 'template', 'title'],
      key: 'template',
    },
    {
      title: '流水号',
      dataIndex: ['submission', 'serialNumber'],
      key: 'serialNumber',
      render: (text: string) => text || '-',
    },
    {
      title: '提交人',
      dataIndex: ['submission', 'user', 'name'],
      key: 'submitter',
    },
    {
      title: '审批节点',
      dataIndex: 'stepName',
      key: 'stepName',
      render: (text: string, record: any) => (
        <Tag color="blue">{text || `第${record.step}级`}</Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: ['submission', 'createdAt'],
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<CheckOutlined />}
            style={{ color: '#52c41a' }}
            onClick={() => handleAction(record, 'APPROVE')}
          >
            通过
          </Button>
          <Button
            type="link"
            icon={<RollbackOutlined />}
            style={{ color: '#faad14' }}
            onClick={() => handleAction(record, 'RETURN')}
          >
            退回
          </Button>
          <Button
            type="link"
            danger
            icon={<CloseOutlined />}
            onClick={() => handleAction(record, 'REJECT')}
          >
            驳回
          </Button>
        </Space>
      ),
    },
  ];

  // 已审批表格列
  const approvedColumns = [
    {
      title: '表单名称',
      dataIndex: ['submission', 'template', 'title'],
      key: 'template',
    },
    {
      title: '流水号',
      dataIndex: ['submission', 'serialNumber'],
      key: 'serialNumber',
      render: (text: string) => text || '-',
    },
    {
      title: '提交人',
      dataIndex: ['submission', 'user', 'name'],
      key: 'submitter',
    },
    {
      title: '审批结果',
      dataIndex: 'action',
      key: 'action',
      render: (action: string, record: any) => {
        const color = action === 'APPROVE' ? 'green' : action === 'REJECT' ? 'red' : 'orange';
        return <Tag color={color}>{getActionText(action)}</Tag>;
      },
    },
    {
      title: '审批意见',
      dataIndex: 'comment',
      key: 'comment',
      render: (text: string) => text || '-',
      ellipsis: true,
    },
    {
      title: '审批时间',
      dataIndex: 'approvedAt',
      key: 'approvedAt',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
        >
          查看
        </Button>
      ),
    },
  ];

  // 渲染表单数据
  const renderFormData = (data: any, fields: any[]) => {
    if (!data || !fields) return null;

    return (
      <Descriptions column={2} bordered size="small">
        {fields.map((field: any) => (
          <Descriptions.Item key={field.id} label={field.label}>
            {formatFieldValue(data[field.id], field.type)}
          </Descriptions.Item>
        ))}
      </Descriptions>
    );
  };

  const formatFieldValue = (value: any, type: string) => {
    if (value === null || value === undefined) return '-';
    if (type === 'date' || type === 'datetime') {
      return dayjs(value).format(type === 'date' ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm:ss');
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  };

  // 渲染明细表
  const renderDetailData = (detailData: any[], detailConfig: any) => {
    if (!detailData || !detailConfig?.columns) return null;

    const columns = detailConfig.columns.map((col: any) => ({
      title: col.label,
      dataIndex: col.id,
      key: col.id,
      width: col.width || 100,
      render: (value: any) => {
        if (col.type === 'calculated' || col.type === 'number') {
          return value?.toFixed?.(2) || value || '-';
        }
        if (col.type === 'date') {
          return value ? dayjs(value).format('YYYY-MM-DD') : '-';
        }
        return value || '-';
      },
    }));

    return (
      <Table
        dataSource={detailData}
        columns={columns}
        pagination={false}
        size="small"
        bordered
        rowKey={(_, index) => index?.toString() || '0'}
        scroll={{ x: 'max-content' }}
      />
    );
  };

  const pendingCount = pendingData?.total || 0;

  return (
    <div>
      <h1>我的审批</h1>

      <Tabs
        defaultActiveKey="pending"
        items={[
          {
            key: 'pending',
            label: (
              <Badge count={pendingCount} offset={[10, 0]}>
                <span>待审批</span>
              </Badge>
            ),
            children: (
              <Table
                dataSource={pendingData?.data || []}
                columns={pendingColumns}
                rowKey="id"
                loading={pendingLoading}
                pagination={{
                  pageSize: 10,
                  showTotal: (total) => `共 ${total} 条`,
                }}
              />
            ),
          },
          {
            key: 'approved',
            label: '已审批',
            children: (
              <Table
                dataSource={approvedData?.data || []}
                columns={approvedColumns}
                rowKey="id"
                loading={approvedLoading}
                pagination={{
                  pageSize: 10,
                  showTotal: (total) => `共 ${total} 条`,
                }}
              />
            ),
          },
        ]}
      />

      {/* 查看详情模态框 */}
      <Modal
        title="审批详情"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        {currentApproval && currentApproval.submission && (
          <>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={3}>
                {currentApproval.submission.serialNumber && (
                  <Descriptions.Item label="流水号">
                    <Text strong>{currentApproval.submission.serialNumber}</Text>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="表单">
                  {currentApproval.submission.template?.title}
                </Descriptions.Item>
                <Descriptions.Item label="提交人">
                  {currentApproval.submission.user?.name}
                </Descriptions.Item>
                <Descriptions.Item label="提交时间">
                  {dayjs(currentApproval.submission.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <Tag color={currentApproval.submission.status === 'APPROVED' ? 'green' : currentApproval.submission.status === 'REJECTED' ? 'red' : 'orange'}>
                    {getStatusText(currentApproval.submission.status)}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 主表数据 */}
            <Divider orientation="left">主表数据</Divider>
            {renderFormData(currentApproval.submission.data, currentApproval.submission.template?.fields || [])}

            {/* 明细表数据 */}
            {currentApproval.submission.detailData && currentApproval.submission.detailData.length > 0 && (
              <>
                <Divider orientation="left">
                  {currentApproval.submission.template?.detailTableConfig?.title || '明细表'}
                </Divider>
                {renderDetailData(
                  currentApproval.submission.detailData,
                  currentApproval.submission.template?.detailTableConfig
                )}
              </>
            )}

            {/* 计算汇总 */}
            {currentApproval.submission.calculatedValues && Object.keys(currentApproval.submission.calculatedValues).length > 0 && (
              <>
                <Divider orientation="left">汇总统计</Divider>
                <Card size="small">
                  <Space direction="vertical">
                    {currentApproval.submission.template?.calculations?.map((calc: any) => (
                      <Text key={calc.field}>
                        <Text strong>{calc.label}:</Text>{' '}
                        {currentApproval.submission.calculatedValues[calc.field]?.toFixed?.(2) ||
                          currentApproval.submission.calculatedValues[calc.field] ||
                          0}
                      </Text>
                    ))}
                  </Space>
                </Card>
              </>
            )}
          </>
        )}
      </Modal>

      {/* 审批操作模态框 */}
      <Modal
        title={actionType === 'REJECT' ? '驳回审批' : '退回修改'}
        open={actionModalOpen}
        onCancel={() => {
          setActionModalOpen(false);
          setComment('');
        }}
        onOk={handleActionSubmit}
        okText={actionType === 'REJECT' ? '确认驳回' : '确认退回'}
        cancelText="取消"
        okButtonProps={{
          danger: actionType === 'REJECT',
          loading: approveMutation.isPending,
        }}
      >
        <TextArea
          rows={4}
          placeholder={actionType === 'REJECT' ? '请输入驳回原因（必填）' : '请输入退回原因（可选）'}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </Modal>
    </div>
  );
}
