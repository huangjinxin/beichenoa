import { Table, Tag, Space, Button, Modal, Input, message, Card, Descriptions, Divider, Typography } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { formApi } from '../../services/api';
import { useState } from 'react';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function FormSubmissions() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<any>(null);
  const [approvalComment, setApprovalComment] = useState('');

  const { data: submissionsData, isLoading } = useQuery({
    queryKey: ['form-submissions'],
    queryFn: () => formApi.getSubmissions(),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, status, comment }: any) =>
      formApi.approveSubmission(id, { status, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
      message.success('审批成功');
      setApproveModalOpen(false);
      setApprovalComment('');
    },
    onError: () => {
      message.error('审批失败');
    },
  });

  const handleView = (record: any) => {
    setCurrentSubmission(record);
    setViewModalOpen(true);
  };

  const handleApprove = (record: any, status: 'APPROVED' | 'REJECTED') => {
    setCurrentSubmission(record);
    if (status === 'REJECTED') {
      setApproveModalOpen(true);
    } else {
      approveMutation.mutate({ id: record.id, status, comment: '' });
    }
  };

  const handleApproveSubmit = () => {
    if (!currentSubmission) return;
    approveMutation.mutate({
      id: currentSubmission.id,
      status: 'REJECTED',
      comment: approvalComment,
    });
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'PENDING': t('forms.submissions.pending') || '待审批',
      'APPROVED': t('forms.submissions.approved') || '已通过',
      'REJECTED': t('forms.submissions.rejected') || '已拒绝',
    };
    return statusMap[status] || status;
  };

  // 渲染表单主数据
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

  // 格式化字段值
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

  // 渲染明细表数据
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

  const columns = [
    {
      title: '流水号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      render: (text: string) => text || '-',
    },
    { title: t('forms.submissions.formName') || '表单名称', dataIndex: ['template', 'title'], key: 'template' },
    { title: t('forms.submissions.submitter') || '提交人', dataIndex: ['user', 'name'], key: 'submitter' },
    {
      title: t('forms.submissions.status') || '审批状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'APPROVED' ? 'green' : status === 'REJECTED' ? 'red' : 'orange';
        return <Tag color={color}>{getStatusText(status)}</Tag>;
      },
    },
    {
      title: t('forms.submissions.submitTime') || '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('common.actions') || '操作',
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
          {record.status === 'PENDING' && (
            <>
              <Button
                type="link"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record, 'APPROVED')}
              >
                通过
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleApprove(record, 'REJECTED')}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1>{t('forms.submissions.title')}</h1>
      <Table
        dataSource={submissionsData?.data || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        style={{ marginTop: 16 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      <Modal
        title="查看提交内容"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        {currentSubmission && (
          <>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={3}>
                {currentSubmission.serialNumber && (
                  <Descriptions.Item label="流水号">
                    <Text strong>{currentSubmission.serialNumber}</Text>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="表单">
                  {currentSubmission.template?.title}
                </Descriptions.Item>
                <Descriptions.Item label="提交人">
                  {currentSubmission.user?.name} ({currentSubmission.user?.email})
                </Descriptions.Item>
                <Descriptions.Item label="提交时间">
                  {dayjs(currentSubmission.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="审批状态">
                  <Tag color={currentSubmission.status === 'APPROVED' ? 'green' : currentSubmission.status === 'REJECTED' ? 'red' : 'orange'}>
                    {getStatusText(currentSubmission.status)}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 主表数据 */}
            <Divider orientation="left">主表数据</Divider>
            {renderFormData(currentSubmission.data, currentSubmission.template?.fields || [])}

            {/* 明细表数据 */}
            {currentSubmission.detailData && currentSubmission.detailData.length > 0 && (
              <>
                <Divider orientation="left">
                  {currentSubmission.template?.detailTableConfig?.title || '明细表'}
                </Divider>
                {renderDetailData(
                  currentSubmission.detailData,
                  currentSubmission.template?.detailTableConfig
                )}
              </>
            )}

            {/* 计算汇总 */}
            {currentSubmission.calculatedValues && Object.keys(currentSubmission.calculatedValues).length > 0 && (
              <>
                <Divider orientation="left">汇总统计</Divider>
                <Card size="small">
                  <Space direction="vertical">
                    {currentSubmission.template?.calculations?.map((calc: any) => (
                      <Text key={calc.field}>
                        <Text strong>{calc.label}:</Text>{' '}
                        {currentSubmission.calculatedValues[calc.field]?.toFixed?.(2) ||
                          currentSubmission.calculatedValues[calc.field] ||
                          0}
                      </Text>
                    ))}
                  </Space>
                </Card>
              </>
            )}

            {/* 审批记录 */}
            {currentSubmission.approvals && currentSubmission.approvals.length > 0 && (
              <>
                <Divider orientation="left">审批记录</Divider>
                <Table
                  dataSource={currentSubmission.approvals}
                  columns={[
                    {
                      title: '审批人',
                      dataIndex: 'approverId',
                      key: 'approverId',
                    },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status: string) => (
                        <Tag color={status === 'APPROVED' ? 'green' : status === 'REJECTED' ? 'red' : 'orange'}>
                          {getStatusText(status)}
                        </Tag>
                      ),
                    },
                    {
                      title: '意见',
                      dataIndex: 'comment',
                      key: 'comment',
                      render: (text: string) => text || '-',
                    },
                    {
                      title: '时间',
                      dataIndex: 'createdAt',
                      key: 'createdAt',
                      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
                    },
                  ]}
                  pagination={false}
                  size="small"
                  rowKey="id"
                />
              </>
            )}
          </>
        )}
      </Modal>

      <Modal
        title="拒绝审批"
        open={approveModalOpen}
        onCancel={() => {
          setApproveModalOpen(false);
          setApprovalComment('');
        }}
        onOk={handleApproveSubmit}
        okText="确认拒绝"
        cancelText="取消"
      >
        <Input.TextArea
          rows={4}
          placeholder="请输入拒绝原因"
          value={approvalComment}
          onChange={(e) => setApprovalComment(e.target.value)}
        />
      </Modal>
    </div>
  );
}
