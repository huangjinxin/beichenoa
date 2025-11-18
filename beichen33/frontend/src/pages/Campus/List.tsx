import { useState, useRef } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Descriptions, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { campusApi, userApi } from '../../services/api';
import dayjs from 'dayjs';

export default function CampusList() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: campusData, isLoading } = useQuery({
    queryKey: ['campus'],
    queryFn: campusApi.getAll,
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => userApi.getAll({ role: 'TEACHER' }),
  });

  const createMutation = useMutation({
    mutationFn: campusApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campus'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => campusApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campus'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: campusApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campus'] });
      message.success(t('messages.deleteSuccess'));
    },
  });

  const handleSubmit = (values: any) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      address: record.address,
      phone: record.phone,
      principalId: record.principal?.id,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: t('messages.deleteConfirm'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleView = (record: any) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Campus_${viewingRecord?.name || 'Print'}`,
  });

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的分校');
      return;
    }
    Modal.confirm({
      title: `确定删除 ${selectedRowKeys.length} 个分校？`,
      content: '此操作无法撤销',
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map(id => campusApi.delete(id)));
          queryClient.invalidateQueries({ queryKey: ['campus'] });
          message.success('批量删除成功');
          setSelectedRowKeys([]);
        } catch (error) {
          message.error('批量删除失败');
        }
      },
    });
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: any) => setSelectedRowKeys(keys),
  };

  const columns = [
    { title: '分校名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '地址', dataIndex: 'address', key: 'address', width: 300 },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 150 },
    {
      title: '负责人',
      dataIndex: 'principal',
      key: 'principal',
      width: 150,
      render: (principal: any) => principal?.name || '-',
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right' as const,
      width: 220,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>分校管理</h1>
        <Space>
          {selectedRowKeys.length > 0 && (
            <Button danger onClick={handleBatchDelete}>
              批量删除 ({selectedRowKeys.length})
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            添加分校
          </Button>
        </Space>
      </div>

      <Table
        dataSource={campusData || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        rowSelection={rowSelection}
      />

      <Modal
        title="分校详情"
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        width={800}
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
            <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>北辰幼儿园分校信息</h1>
            <h2 style={{ fontSize: '18px', margin: 0 }}>{viewingRecord?.name}</h2>
          </div>

          {viewingRecord && (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="分校名称" span={2}>{viewingRecord.name}</Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>{viewingRecord.address || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{viewingRecord.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="负责人">{viewingRecord.principal?.name || '-'}</Descriptions.Item>
              {viewingRecord.principal && (
                <>
                  <Descriptions.Item label="负责人电话">{viewingRecord.principal.phone || '-'}</Descriptions.Item>
                  <Descriptions.Item label="负责人邮箱">{viewingRecord.principal.email || '-'}</Descriptions.Item>
                </>
              )}
            </Descriptions>
          )}

          <div style={{ marginTop: '40px', textAlign: 'right', fontSize: '12px', color: '#666' }}>
            <p>打印时间: {dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
          </div>
        </div>
      </Modal>

      <Modal
        title={editingId ? '编辑分校' : '添加分校'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingId(null);
        }}
        okText="确认"
        cancelText="取消"
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="分校名称" rules={[{ required: true, message: '请输入分校名称' }]}>
            <Input placeholder="请输入分校名称" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input.TextArea rows={2} placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="principalId" label="负责人">
            <Select
              allowClear
              showSearch
              placeholder="请选择负责人"
              optionFilterProp="label"
              options={teachersData?.data?.map((teacher: any) => ({
                label: `${teacher.name} (${teacher.email})`,
                value: teacher.id,
              })) || []}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
