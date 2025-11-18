import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Space,
  message,
  Row,
  Col,
  Divider,
  Spin,
} from 'antd';
import dayjs from 'dayjs';
import { dutyReportApi, campusApi, userApi } from '../../../services/api';

const { TextArea } = Input;

const weatherOptions = [
  { label: '☀️ 晴天', value: '☀️ 晴天' },
  { label: '☁️ 多云', value: '☁️ 多云' },
  { label: '🌥️ 阴天', value: '🌥️ 阴天' },
  { label: '🌧️ 雨天', value: '🌧️ 雨天' },
  { label: '❄️ 雪天', value: '❄️ 雪天' },
];

const DutyReportEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const selectedCampusId = Form.useWatch('campusId', form);

  // Fetch existing record
  const { data: record, isLoading: recordLoading } = useQuery({
    queryKey: ['duty-report', id],
    queryFn: () => dutyReportApi.getOne(id!),
    enabled: !!id,
  });

  // Fetch campuses
  const { data: campuses } = useQuery({
    queryKey: ['campuses'],
    queryFn: () => campusApi.getAll(),
  });

  // Fetch teachers (filtered by campus if selected)
  const { data: teachers } = useQuery({
    queryKey: ['teachers', selectedCampusId],
    queryFn: () => userApi.getAll({
      role: 'TEACHER',
      campusId: selectedCampusId,
      pageSize: 1000
    }),
  });

  // Load existing data into form
  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        date: record.date ? dayjs(record.date) : undefined,
        weather: record.weather,
        campusId: record.campusId,
        dutyLeaderId: record.dutyLeaderId,
        attendance: record.attendance || '',
        entryExit: record.entryExit || '',
        learningActivity: record.learningActivity || '',
        areaActivity: record.areaActivity || '',
        outdoorActivity: record.outdoorActivity || '',
        lifeActivity: record.lifeActivity || '',
        notice: record.notice || '',
        safety: record.safety || '',
        other: record.other || '',
      });
    }
  }, [record, form]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (values: any) => dutyReportApi.update(id!, values),
    onSuccess: () => {
      message.success('更新成功');
      navigate('/records/duty-report');
    },
    onError: () => {
      message.error('更新失败，请重试');
    },
  });

  const handleSubmit = async (values: any) => {
    const submitData = {
      ...values,
      date: values.date.format('YYYY-MM-DD'),
    };

    updateMutation.mutate(submitData);
  };

  if (recordLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!record) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <p>记录不存在</p>
          <Button onClick={() => navigate('/records/duty-report')}>返回列表</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <h2>编辑值班播报记录</h2>
        <Divider />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="weather"
                label="天气"
                rules={[{ required: true, message: '请选择天气' }]}
              >
                <Select options={weatherOptions} placeholder="请选择天气" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="campusId"
                label="园区"
                rules={[{ required: true, message: '请选择园区' }]}
              >
                <Select
                  placeholder="请选择园区"
                  options={campuses?.map((campus: any) => ({
                    label: campus.name,
                    value: campus.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dutyLeaderId"
                label="值班领导"
                rules={[{ required: true, message: '请选择值班领导' }]}
              >
                <Select
                  placeholder="请选择值班领导"
                  showSearch
                  optionFilterProp="label"
                  options={(teachers?.data || teachers || []).map((teacher: any) => ({
                    label: teacher.name,
                    value: teacher.id,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">播报内容</Divider>

          <Form.Item name="attendance" label="出勤情况">
            <TextArea
              rows={3}
              placeholder="记录全园出勤情况，包括到园人数、请假人数等..."
            />
          </Form.Item>

          <Form.Item name="entryExit" label="入园离园">
            <TextArea rows={3} placeholder="记录入园离园情况..." />
          </Form.Item>

          <Form.Item name="learningActivity" label="学习活动">
            <TextArea rows={3} placeholder="记录全园学习活动开展情况..." />
          </Form.Item>

          <Form.Item name="areaActivity" label="区域活动">
            <TextArea rows={3} placeholder="记录区域活动情况..." />
          </Form.Item>

          <Form.Item name="outdoorActivity" label="户外活动">
            <TextArea rows={3} placeholder="记录户外活动情况..." />
          </Form.Item>

          <Form.Item name="lifeActivity" label="生活活动">
            <TextArea rows={3} placeholder="记录生活活动情况..." />
          </Form.Item>

          <Form.Item name="notice" label="温馨提示">
            <TextArea rows={3} placeholder="需要家长配合的温馨提示..." />
          </Form.Item>

          <Form.Item name="safety" label="校园安全">
            <TextArea rows={3} placeholder="记录校园安全检查情况..." />
          </Form.Item>

          <Form.Item name="other" label="其他事项">
            <TextArea rows={3} placeholder="其他需要播报的事项..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                保存修改
              </Button>
              <Button onClick={() => navigate('/records/duty-report')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DutyReportEdit;
