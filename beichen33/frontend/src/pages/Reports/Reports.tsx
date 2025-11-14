import { Card, Table, Select } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../../services/api';
import { useState } from 'react';

export default function Reports() {
  const [classId, setClassId] = useState<string>();

  const { data: studentStats, isLoading } = useQuery({
    queryKey: ['student-stats', classId],
    queryFn: () => reportApi.getStudentStats({ classId }),
  });

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Class', dataIndex: 'class', key: 'class' },
    { title: 'Age', dataIndex: 'age', key: 'age' },
    { title: 'Height (cm)', dataIndex: 'latestHeight', key: 'height' },
    { title: 'Weight (kg)', dataIndex: 'latestWeight', key: 'weight' },
  ];

  return (
    <div>
      <h1>Reports & Statistics</h1>

      <Card title="Student Statistics" style={{ marginTop: 16 }}>
        <Select
          placeholder="Filter by class"
          style={{ width: 200, marginBottom: 16 }}
          allowClear
          onChange={setClassId}
        >
        </Select>

        <Table
          dataSource={studentStats || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
        />
      </Card>
    </div>
  );
}
