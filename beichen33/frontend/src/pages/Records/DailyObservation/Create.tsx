import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Steps,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Space,
  Collapse,
  TimePicker,
  message,
  Row,
  Col,
  Divider,
  Alert,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, PrinterOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';
import { dailyObservationApi, classApi, campusApi, userApi } from '../../../services/api';

const { TextArea } = Input;

const weatherOptions = [
  { label: '☀️ 晴天', value: '☀️ 晴天' },
  { label: '☁️ 多云', value: '☁️ 多云' },
  { label: '🌥️ 阴天', value: '🌥️ 阴天' },
  { label: '🌧️ 雨天', value: '🌧️ 雨天' },
  { label: '❄️ 雪天', value: '❄️ 雪天' },
];

const DailyObservationCreate: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [timeline, setTimeline] = useState<Array<{ time: dayjs.Dayjs | null; event: string }>>([
    { time: null, event: '' },
  ]);
  const [selectedCampusId, setSelectedCampusId] = useState<string | undefined>();
  const printRef = useRef<HTMLDivElement>(null);

  // Set default date to today
  useEffect(() => {
    form.setFieldsValue({
      date: dayjs(),
    });
  }, [form]);

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll(),
  });

  // Fetch campuses
  const { data: campusesData } = useQuery({
    queryKey: ['campuses'],
    queryFn: () => campusApi.getAll(),
  });

  // Fetch teachers (filtered by campus if selected)
  const { data: teachersData } = useQuery({
    queryKey: ['teachers', selectedCampusId],
    queryFn: () => userApi.getAll({
      role: 'TEACHER',
      campusId: selectedCampusId,
      pageSize: 1000
    }),
  });

  // Normalize data formats (handle both array and { data: [...] } formats)
  const classesList = classesData?.data || classesData || [];
  const campusesList = campusesData?.data || campusesData || [];
  const teachersList = teachersData?.data || teachersData || [];

  // Filter classes by selected campus
  const filteredClasses = selectedCampusId
    ? classesList.filter((cls: any) => cls.campusId === selectedCampusId)
    : [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (values: any) => dailyObservationApi.create(values),
    onSuccess: () => {
      message.success('创建成功');
      navigate('/records/daily-observation');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || '创建失败，请重试');
    },
  });

  // Print functionality
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `每日观察_${form.getFieldValue('date')?.format('YYYY-MM-DD') || ''}`,
  });

  const steps = [
    { title: '基本信息' },
    { title: '时间日志' },
    { title: '观察要点' },
    { title: '汇总预览' },
  ];

  const validateCurrentStep = async () => {
    try {
      if (current === 0) {
        await form.validateFields(['date', 'weather', 'campusId', 'classId', 'teacherId']);
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setCurrent(current + 1);
    } else {
      message.error('请填写所有必填项');
    }
  };

  const handlePrev = () => {
    setCurrent(current - 1);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Format timeline data
      const formattedTimeline = timeline
        .filter((item) => item.time && item.event)
        .map((item) => ({
          time: item.time?.format('HH:mm') || '',
          event: item.event,
        }));

      const submitData = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        timeline: formattedTimeline.length > 0 ? formattedTimeline : undefined,
      };

      createMutation.mutate(submitData);
    } catch (error) {
      message.error('请完成所有必填项');
    }
  };

  const addTimelineItem = () => {
    setTimeline([...timeline, { time: null, event: '' }]);
  };

  const removeTimelineItem = (index: number) => {
    const newTimeline = timeline.filter((_, i) => i !== index);
    setTimeline(newTimeline);
  };

  const updateTimelineTime = (index: number, value: dayjs.Dayjs | null) => {
    const newTimeline = [...timeline];
    newTimeline[index].time = value;
    setTimeline(newTimeline);
  };

  const updateTimelineEvent = (index: number, value: string) => {
    const newTimeline = [...timeline];
    newTimeline[index].event = value;
    setTimeline(newTimeline);
  };

  // Step 1: Basic Information with cascade selection
  const renderBasicInfo = () => (
    <Row gutter={[16, 16]}>
      <Col span={12}>
        <Form.Item
          name="date"
          label="日期"
          rules={[{ required: true, message: '请选择日期' }]}
        >
          <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
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
      <Col span={12}>
        <Form.Item
          name="campusId"
          label="园区"
          rules={[{ required: true, message: '请选择园区' }]}
        >
          <Select
            placeholder="请先选择园区"
            onChange={(value) => {
              setSelectedCampusId(value);
              form.setFieldValue('classId', undefined);
              form.setFieldValue('teacherId', undefined);
            }}
            options={campusesList.map((campus: any) => ({
              label: campus.name,
              value: campus.id,
            }))}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="classId"
          label="班级"
          rules={[{ required: true, message: '请选择班级' }]}
        >
          <Select
            placeholder={selectedCampusId ? '请选择班级' : '请先选择园区'}
            disabled={!selectedCampusId}
            options={filteredClasses?.map((cls: any) => ({
              label: cls.name,
              value: cls.id,
            }))}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="teacherId"
          label="记录教师"
          rules={[{ required: true, message: '请选择记录教师' }]}
        >
          <Select
            placeholder={selectedCampusId ? '请选择记录教师' : '请先选择园区'}
            disabled={!selectedCampusId}
            showSearch
            optionFilterProp="label"
            options={teachersList.map((teacher: any) => ({
              label: teacher.name,
              value: teacher.id,
            }))}
          />
        </Form.Item>
      </Col>
      {!selectedCampusId && (
        <Col span={24}>
          <Alert message="提示：请先选择园区，然后选择该园区下的班级和教师" type="info" showIcon />
        </Col>
      )}
    </Row>
  );

  // Step 2: Timeline with TimePicker
  const renderTimeline = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h4>时间日志</h4>
        <p style={{ color: '#666' }}>记录一天中的重要时间节点和活动内容</p>
      </div>
      {timeline.map((item, index) => (
        <Row key={index} gutter={16} style={{ marginBottom: 12 }}>
          <Col span={6}>
            <TimePicker
              format="HH:mm"
              placeholder="选择时间"
              value={item.time}
              onChange={(value) => updateTimelineTime(index, value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={16}>
            <Input
              placeholder="活动内容（如：晨检、早餐、户外活动等）"
              value={item.event}
              onChange={(e) => updateTimelineEvent(index, e.target.value)}
            />
          </Col>
          <Col span={2}>
            {timeline.length > 1 && (
              <Button
                type="text"
                danger
                icon={<MinusCircleOutlined />}
                onClick={() => removeTimelineItem(index)}
              />
            )}
          </Col>
        </Row>
      ))}
      <Button type="dashed" onClick={addTimelineItem} block icon={<PlusOutlined />}>
        添加更多时间记录
      </Button>
    </div>
  );

  // Step 3: Observation Points
  const observationItems = [
    {
      key: '1',
      label: '精彩瞬间',
      children: (
        <div>
          <Form.Item name="gameActivity" label="游戏活动">
            <TextArea rows={4} placeholder="记录游戏活动情况..." />
          </Form.Item>
          <Form.Item name="learningActivity" label="学习活动">
            <TextArea rows={4} placeholder="记录学习活动的开展情况..." />
          </Form.Item>
          <Form.Item name="outdoorActivity" label="户外运动">
            <TextArea rows={4} placeholder="记录户外活动和运动情况..." />
          </Form.Item>
          <Form.Item name="lifeActivity" label="生活活动">
            <TextArea
              rows={4}
              placeholder="记录孩子们的生活活动情况，如：进餐、午睡、盥洗等..."
            />
          </Form.Item>
        </div>
      ),
    },
    {
      key: '2',
      label: '家园共育',
      children: (
        <Form.Item name="homeCooperation" label="">
          <TextArea rows={4} placeholder="记录家园沟通和协作情况..." />
        </Form.Item>
      ),
    },
  ];

  const renderObservationPoints = () => <Collapse defaultActiveKey={['1']} items={observationItems} />;

  // Step 4: Preview with print functionality
  const renderPreview = () => {
    const values = form.getFieldsValue();
    return (
      <div>
        <div className="no-print" style={{ marginBottom: 16 }}>
          <Space>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              打印预览
            </Button>
          </Space>
        </div>

        <div ref={printRef} className="print-content">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>每日观察记录表</h1>
            <p style={{ color: '#666', margin: 0 }}>
              {campusesList.find((c: any) => c.id === values.campusId)?.name || ''} -{' '}
              {classesList.find((c: any) => c.id === values.classId)?.name || ''}
            </p>
          </div>

          <table className="info-table" style={{ width: '100%', marginBottom: 24, borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 12px', border: '1px solid #d9d9d9', background: '#fafafa', width: '15%' }}>
                  <strong>日期</strong>
                </td>
                <td style={{ padding: '8px 12px', border: '1px solid #d9d9d9', width: '35%' }}>
                  {values.date?.format('YYYY-MM-DD') || '-'}
                </td>
                <td style={{ padding: '8px 12px', border: '1px solid #d9d9d9', background: '#fafafa', width: '15%' }}>
                  <strong>天气</strong>
                </td>
                <td style={{ padding: '8px 12px', border: '1px solid #d9d9d9', width: '35%' }}>
                  {values.weather || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', border: '1px solid #d9d9d9', background: '#fafafa' }}>
                  <strong>园区</strong>
                </td>
                <td style={{ padding: '8px 12px', border: '1px solid #d9d9d9' }}>
                  {campusesList.find((c: any) => c.id === values.campusId)?.name || '-'}
                </td>
                <td style={{ padding: '8px 12px', border: '1px solid #d9d9d9', background: '#fafafa' }}>
                  <strong>班级</strong>
                </td>
                <td style={{ padding: '8px 12px', border: '1px solid #d9d9d9' }}>
                  {classesList.find((c: any) => c.id === values.classId)?.name || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', border: '1px solid #d9d9d9', background: '#fafafa' }}>
                  <strong>记录教师</strong>
                </td>
                <td style={{ padding: '8px 12px', border: '1px solid #d9d9d9' }} colSpan={3}>
                  {teachersList.find((t: any) => t.id === values.teacherId)?.name || '-'}
                </td>
              </tr>
            </tbody>
          </table>

          {timeline.filter((t) => t.time && t.event).length > 0 && (
            <>
              <h3 style={{ borderBottom: '2px solid #1890ff', paddingBottom: 8, marginBottom: 16 }}>
                时间日志
              </h3>
              <table style={{ width: '100%', marginBottom: 24, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 12px', border: '1px solid #d9d9d9', background: '#fafafa', width: '20%' }}>
                      时间
                    </th>
                    <th style={{ padding: '8px 12px', border: '1px solid #d9d9d9', background: '#fafafa' }}>
                      活动内容
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.filter((t) => t.time && t.event).map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '8px 12px', border: '1px solid #d9d9d9', textAlign: 'center' }}>
                        {item.time?.format('HH:mm')}
                      </td>
                      <td style={{ padding: '8px 12px', border: '1px solid #d9d9d9' }}>{item.event}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <h3 style={{ borderBottom: '2px solid #1890ff', paddingBottom: 8, marginBottom: 16 }}>
            观察记录
          </h3>

          {(values.gameActivity || values.learningActivity || values.outdoorActivity || values.lifeActivity) && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ color: '#1890ff', marginBottom: 12, fontSize: 16 }}>精彩瞬间</h4>
              <div style={{
                padding: '16px',
                backgroundColor: '#f0f7ff',
                borderRadius: 8,
                border: '1px solid #d9e9ff'
              }}>
                {values.gameActivity && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#1890ff' }}>游戏活动</div>
                    <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                      {values.gameActivity}
                    </div>
                  </div>
                )}
                {values.learningActivity && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#1890ff' }}>学习活动</div>
                    <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                      {values.learningActivity}
                    </div>
                  </div>
                )}
                {values.outdoorActivity && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#1890ff' }}>户外运动</div>
                    <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                      {values.outdoorActivity}
                    </div>
                  </div>
                )}
                {values.lifeActivity && (
                  <div style={{ marginBottom: 0 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#1890ff' }}>生活活动</div>
                    <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                      {values.lifeActivity}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {values.homeCooperation && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ color: '#1890ff', marginBottom: 8 }}>家园共育</h4>
              <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                {values.homeCooperation}
              </div>
            </div>
          )}

          <div style={{ marginTop: 40, borderTop: '1px solid #d9d9d9', paddingTop: 16 }}>
            <Row gutter={24}>
              <Col span={12}>
                <div>记录教师：{teachersList.find((t: any) => t.id === values.teacherId)?.name || '________________'}</div>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <div>日期：{values.date?.format('YYYY年MM月DD日') || '-'}</div>
              </Col>
            </Row>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <h2>创建每日观察记录</h2>
        <Steps current={current} items={steps} style={{ marginBottom: 24 }} />

        <Form form={form} layout="vertical" preserve={true}>
          {/* 使用 display 控制显示隐藏，避免 DOM 销毁导致表单数据丢失 */}
          <div style={{ display: current === 0 ? 'block' : 'none' }}>
            {renderBasicInfo()}
          </div>
          <div style={{ display: current === 1 ? 'block' : 'none' }}>
            {renderTimeline()}
          </div>
          <div style={{ display: current === 2 ? 'block' : 'none' }}>
            {renderObservationPoints()}
          </div>
          <div style={{ display: current === 3 ? 'block' : 'none' }}>
            {renderPreview()}
          </div>
        </Form>

        <div style={{ marginTop: 24 }}>
          <Space>
            {current > 0 && <Button onClick={handlePrev}>上一步</Button>}
            {current < steps.length - 1 && (
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            )}
            {current === steps.length - 1 && (
              <>
                <Button type="primary" onClick={handleSubmit} loading={createMutation.isPending}>
                  保存记录
                </Button>
                <Button onClick={() => setCurrent(0)}>重新填写</Button>
              </>
            )}
            <Button onClick={() => navigate('/records/daily-observation')}>取消</Button>
          </Space>
        </div>
      </Card>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            margin: 0;
            padding: 0;
          }

          .ant-card {
            box-shadow: none !important;
            border: none !important;
          }

          .print-content {
            padding: 20mm;
            font-size: 12pt;
            line-height: 1.6;
          }

          .print-content h1 {
            font-size: 18pt;
          }

          .print-content h3 {
            font-size: 14pt;
          }

          .print-content h4 {
            font-size: 12pt;
          }

          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
};

export default DailyObservationCreate;
