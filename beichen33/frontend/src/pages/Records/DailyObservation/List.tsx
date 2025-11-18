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
  Tag,
} from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { dailyObservationApi, classApi } from '../../../services/api';

const { RangePicker } = DatePicker;

const DailyObservationList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<any>({});

  // Fetch classes for filter
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll(),
  });

  // Fetch daily observations
  const { data: response, isLoading } = useQuery({
    queryKey: ['daily-observations', filters],
    queryFn: () => dailyObservationApi.getAll(filters),
  });

  // Extract data array from response
  const data = response?.data || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => dailyObservationApi.delete(id),
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['daily-observations'] });
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

    if (values.classId) {
      searchParams.classId = values.classId;
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
      title: '班级',
      dataIndex: 'class',
      key: 'class',
      width: 120,
      render: (classItem: any) => classItem?.name || '-',
    },
    {
      title: '园区',
      dataIndex: 'campus',
      key: 'campus',
      width: 120,
      render: (campus: any) => campus?.name || '-',
    },
    {
      title: '教师',
      dataIndex: 'teacher',
      key: 'teacher',
      width: 100,
      render: (teacher: any) => teacher?.name || '-',
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
            onClick={() => navigate(`/records/daily-observation/${record.id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/records/daily-observation/edit/${record.id}`)}
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
          <Form.Item name="classId" label="班级">
            <Select
              placeholder="请选择班级"
              style={{ width: 200 }}
              allowClear
              options={classes?.map((cls: any) => ({
                label: cls.name,
                value: cls.id,
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
            onClick={() => navigate('/records/daily-observation/create')}
          >
            新建每日观察
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
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

export default DailyObservationList;
