import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Space,
  Card,
  Form,
  DatePicker,
  Select,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { dutyReportApi, campusApi } from '../../../services/api';

const { RangePicker } = DatePicker;

const DutyReportList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<any>({});

  // Fetch campuses for filter
  const { data: campuses } = useQuery({
    queryKey: ['campuses'],
    queryFn: () => campusApi.getAll(),
  });

  // Fetch duty reports
  const { data: response, isLoading } = useQuery({
    queryKey: ['duty-reports', filters],
    queryFn: () => dutyReportApi.getAll(filters),
  });

  // Extract data array from response
  const data = response?.data || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => dutyReportApi.delete(id),
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['duty-reports'] });
    },
    onError: () => {
      message.error('删除失败');
    },
  });

  const handleSearch = (values: any) => {
    const searchParams: any = {};

    if (values.dateRange) {
      searchParams.startDate = values.dateRange[0].format('YYYY-MM-DD');
      searchParams.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }

    if (values.campusId) {
      searchParams.campusId = values.campusId;
    }

    setFilters(searchParams);
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({});
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '天气',
      dataIndex: 'weather',
      key: 'weather',
      width: 100,
    },
    {
      title: '园区',
      dataIndex: 'campus',
      key: 'campus',
      width: 120,
      render: (campus: any) => campus?.name || '-',
    },
    {
      title: '值班领导',
      dataIndex: 'dutyLeader',
      key: 'dutyLeader',
      width: 120,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/records/duty-report/${record.id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/records/duty-report/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这条记录吗？"
            onConfirm={() => deleteMutation.mutate(record.id)}
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
    <div style={{ padding: '24px' }}>
      <Card>
        <Form form={form} layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker />
          </Form.Item>
          <Form.Item name="campusId" label="园区">
            <Select
              placeholder="请选择园区"
              style={{ width: 200 }}
              allowClear
              options={campuses?.map((campus: any) => ({
                label: campus.name,
                value: campus.id,
              }))}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                查询
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/records/duty-report/create')}
          >
            新建值班播报
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>
    </div>
  );
};

export default DutyReportList;
