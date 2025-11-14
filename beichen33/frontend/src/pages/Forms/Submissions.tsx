import { Table, Tag, Space, Button, Modal, Input, message, Card } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { formApi } from '../../services/api';
import { useState } from 'react';
import dayjs from 'dayjs';

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
      formApi.updateSubmission(id, { status, comment }),
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

  const columns = [
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
        width={800}
      >
        {currentSubmission && (
          <Card>
            <div style={{ marginBottom: 16 }}>
              <strong>表单：</strong> {currentSubmission.template?.title}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>提交人：</strong> {currentSubmission.user?.name} ({currentSubmission.user?.email})
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>提交时间：</strong> {dayjs(currentSubmission.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>审批状态：</strong> <Tag color={currentSubmission.status === 'APPROVED' ? 'green' : currentSubmission.status === 'REJECTED' ? 'red' : 'orange'}>{getStatusText(currentSubmission.status)}</Tag>
            </div>
            <div>
              <strong>提交内容：</strong>
              <pre style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                {JSON.stringify(currentSubmission.data, null, 2)}
              </pre>
            </div>
          </Card>
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
