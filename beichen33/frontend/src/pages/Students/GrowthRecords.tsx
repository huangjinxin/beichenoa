import { useState } from 'react';
import { Card, Timeline, Button, Modal, Form, Input, Select, DatePicker, Upload, Tag, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { growthRecordApi, studentApi } from '../../services/api';
import dayjs from 'dayjs';

const recordTypes = ['LEARNING', 'LIFE', 'HEALTH', 'BEHAVIOR', 'ARTWORK'];

export default function GrowthRecords() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: student } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentApi.getOne(id!),
  });

  const { data: timeline } = useQuery({
    queryKey: ['timeline', id],
    queryFn: () => growthRecordApi.getTimeline(id!),
  });

  const createMutation = useMutation({
    mutationFn: growthRecordApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', id] });
      message.success('Record created');
      setIsModalOpen(false);
      form.resetFields();
    },
  });

  const handleSubmit = (values: any) => {
    const data = {
      ...values,
      studentId: id,
      recordedAt: values.recordedAt.toISOString(),
      tags: values.tags || [],
      images: [],
    };
    createMutation.mutate(data);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/students/${id}`)} style={{ marginRight: 16 }}>Back</Button>
          <span style={{ fontSize: 18, fontWeight: 500 }}>{student?.name} - Growth Records</span>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Add Record</Button>
      </div>

      <Card>
        <Timeline
          items={timeline?.records?.map((record: any) => ({
            children: (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong>{record.title}</strong>
                  <span>{dayjs(record.recordedAt).format('YYYY-MM-DD HH:mm')}</span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Tag color="blue">{record.type}</Tag>
                  {record.tags?.map((tag: string) => <Tag key={tag}>{tag}</Tag>)}
                </div>
                <div>{record.content}</div>
                {record.height && record.weight && (
                  <div style={{ marginTop: 8 }}>Height: {record.height}cm, Weight: {record.weight}kg</div>
                )}
                <div style={{ marginTop: 8, color: '#666' }}>Recorded by: {record.teacher.name}</div>
              </div>
            ),
          })) || []}
        />
      </Card>

      <Modal
        title="Add Growth Record"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select>
              {recordTypes.map((type) => (
                <Select.Option key={type} value={type}>{type}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="content" label="Content" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="recordedAt" label="Date" rules={[{ required: true }]} initialValue={dayjs()}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="height" label="Height (cm)">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="weight" label="Weight (kg)">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="tags" label="Tags">
            <Select mode="tags" placeholder="Add tags" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
