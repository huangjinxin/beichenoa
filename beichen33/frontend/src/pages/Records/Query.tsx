import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Tabs,
  Form,
  DatePicker,
  Select,
  Button,
  Space,
  Table,
  Row,
  Col,
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { dailyObservationApi, dutyReportApi, classApi, campusApi } from '../../services/api';

const { RangePicker } = DatePicker;

const RecordsQuery: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('daily-observation');
  const [observationForm] = Form.useForm();
  const [dutyForm] = Form.useForm();
  const [observationFilters, setObservationFilters] = useState<any>({});
  const [dutyFilters, setDutyFilters] = useState<any>({});
  const [selectedCampusId, setSelectedCampusId] = useState<string | undefined>();

  // Fetch classes
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll(),
  });

  // Fetch campuses
  const { data: campuses } = useQuery({
    queryKey: ['campuses'],
    queryFn: () => campusApi.getAll(),
  });

  // Fetch daily observations
  const { data: observationsResponse, isLoading: observationsLoading } = useQuery({
    queryKey: ['daily-observations-query', observationFilters],
    queryFn: () => dailyObservationApi.getAll(observationFilters),
    enabled: activeTab === 'daily-observation',
  });

  // Fetch duty reports
  const { data: dutyReportsResponse, isLoading: dutyReportsLoading } = useQuery({
    queryKey: ['duty-reports-query', dutyFilters],
    queryFn: () => dutyReportApi.getAll(dutyFilters),
    enabled: activeTab === 'duty-report',
  });

  // Extract data arrays from responses
  const observations = observationsResponse?.data || [];
  const dutyReports = dutyReportsResponse?.data || [];

  const handleObservationSearch = (values: any) => {
    const params: any = {};
    if (values.dateRange) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD');
      params.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }
    if (values.classId) params.classId = values.classId;
    if (values.campusId) params.campusId = values.campusId;
    setObservationFilters(params);
  };

  const handleDutySearch = (values: any) => {
    const params: any = {};
    if (values.dateRange) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD');
      params.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }
    if (values.campusId) params.campusId = values.campusId;
    setDutyFilters(params);
  };

  const observationColumns = [
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
      title: '教师',
      dataIndex: 'teacher',
      key: 'teacher',
      width: 100,
      render: (teacher: any) => teacher?.name || '-',
    },
    {
      title: '园区',
      dataIndex: 'campus',
      key: 'campus',
      width: 120,
      render: (campus: any) => campus?.name || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/records/daily-observation/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  const dutyColumns = [
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
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/records/duty-report/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  const renderObservationTab = () => {
    // Filter classes by selected campus
    const filteredClasses = selectedCampusId
      ? classes?.filter((cls: any) => cls.campusId === selectedCampusId)
      : classes;

    return (
      <div>
        <Card style={{ marginBottom: 16 }}>
          <Form form={observationForm} onFinish={handleObservationSearch}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Form.Item name="dateRange" label="日期范围">
                  <RangePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="campusId" label="园区">
                  <Select
                    placeholder="请选择园区"
                    allowClear
                    onChange={(value) => {
                      setSelectedCampusId(value);
                      observationForm.setFieldValue('classId', undefined);
                    }}
                    options={campuses?.map((campus: any) => ({
                      label: campus.name,
                      value: campus.id,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="classId" label="班级">
                  <Select
                    placeholder="请选择班级"
                    allowClear
                    options={filteredClasses?.map((cls: any) => ({
                      label: cls.name,
                      value: cls.id,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label=" ">
                  <Space>
                    <Button type="primary" htmlType="submit">
                      查询
                    </Button>
                    <Button
                      onClick={() => {
                        observationForm.resetFields();
                        setObservationFilters({});
                        setSelectedCampusId(undefined);
                      }}
                    >
                      重置
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <Table
          columns={observationColumns}
          dataSource={observations}
          rowKey="id"
          loading={observationsLoading}
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </div>
    );
  };

  const renderDutyTab = () => (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form form={dutyForm} onFinish={handleDutySearch}>
          <Row gutter={[16, 16]}>
            <Col span={10}>
              <Form.Item name="dateRange" label="日期范围">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="campusId" label="园区">
                <Select
                  placeholder="请选择园区"
                  allowClear
                  options={campuses?.map((campus: any) => ({
                    label: campus.name,
                    value: campus.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label=" ">
                <Space>
                  <Button type="primary" htmlType="submit">
                    查询
                  </Button>
                  <Button
                    onClick={() => {
                      dutyForm.resetFields();
                      setDutyFilters({});
                    }}
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <Table
          columns={dutyColumns}
          dataSource={dutyReports}
          rowKey="id"
          loading={dutyReportsLoading}
          scroll={{ x: 700 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>
    </div>
  );

  const tabItems = [
    {
      key: 'daily-observation',
      label: '每日观察',
      children: renderObservationTab(),
    },
    {
      key: 'duty-report',
      label: '值班播报',
      children: renderDutyTab(),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <h2 style={{ marginBottom: 16 }}>记录查询</h2>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  );
};

export default RecordsQuery;
