import { Card, Descriptions, Table, Button } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { classApi } from '../../services/api';
import dayjs from 'dayjs';

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: classData, isLoading } = useQuery({
    queryKey: ['class', id],
    queryFn: () => classApi.getOne(id!),
  });

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Gender', dataIndex: 'gender', key: 'gender' },
    {
      title: 'Birthday',
      dataIndex: 'birthday',
      key: 'birthday',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
  ];

  if (isLoading) return <div>Loading...</div>;
  if (!classData) return <div>Class not found</div>;

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/classes')} style={{ marginBottom: 16 }}>Back</Button>

      <Card title="Class Information">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Name">{classData.name}</Descriptions.Item>
          <Descriptions.Item label="Grade">{classData.grade}</Descriptions.Item>
          <Descriptions.Item label="Teacher">{classData.teacher?.name}</Descriptions.Item>
          <Descriptions.Item label="Capacity">{classData.capacity}</Descriptions.Item>
          <Descriptions.Item label="Student Count">{classData.students?.length || 0}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Students" style={{ marginTop: 16 }}>
        <Table
          dataSource={classData.students || []}
          columns={columns}
          rowKey="id"
        />
      </Card>
    </div>
  );
}
