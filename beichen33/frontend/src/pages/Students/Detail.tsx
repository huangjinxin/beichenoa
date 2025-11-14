import { Card, Descriptions, Button, Space } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons';
import { studentApi } from '../../services/api';
import dayjs from 'dayjs';

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentApi.getOne(id!),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!student) return <div>Student not found</div>;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/students')}>Back</Button>
        <Button icon={<FileTextOutlined />} onClick={() => navigate(`/students/${id}/records`)}>Growth Records</Button>
      </Space>

      <Card title="Student Information">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Name">{student.name}</Descriptions.Item>
          <Descriptions.Item label="Gender">{student.gender}</Descriptions.Item>
          <Descriptions.Item label="Birthday">{dayjs(student.birthday).format('YYYY-MM-DD')}</Descriptions.Item>
          <Descriptions.Item label="Enroll Date">{dayjs(student.enrollDate).format('YYYY-MM-DD')}</Descriptions.Item>
          <Descriptions.Item label="Class">{student.class?.name}</Descriptions.Item>
          <Descriptions.Item label="Teacher">{student.class?.teacher?.name}</Descriptions.Item>
          <Descriptions.Item label="Address" span={2}>{student.address}</Descriptions.Item>
        </Descriptions>
      </Card>

      {student.parents?.length > 0 && (
        <Card title="Parents" style={{ marginTop: 16 }}>
          {student.parents.map((sp: any) => (
            <Descriptions key={sp.parent.id} bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Name">{sp.parent.name}</Descriptions.Item>
              <Descriptions.Item label="Phone">{sp.parent.phone}</Descriptions.Item>
              <Descriptions.Item label="Email">{sp.parent.email}</Descriptions.Item>
              <Descriptions.Item label="Relation">{sp.parent.relation}</Descriptions.Item>
            </Descriptions>
          ))}
        </Card>
      )}
    </div>
  );
}
