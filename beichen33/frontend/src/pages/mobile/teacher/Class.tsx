import { Card, List, Avatar } from 'antd-mobile';
import { useQuery } from '@tanstack/react-query';
import { studentApi } from '../../../services/api';
import { useAuthStore } from '../../../store/auth';
import MobileLayout from '../../../components/mobile/MobileLayout';

export default function TeacherClass() {
  const { user } = useAuthStore();
  const classId = user?.classes?.[0]?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['classStudents', classId],
    queryFn: () => studentApi.getAll({ classId }),
    enabled: !!classId,
  });

  const students = data?.students || [];

  return (
    <MobileLayout role="teacher">
      <div style={{ padding: '12px' }}>
        <Card title={`我的班级 - ${user?.classes?.[0]?.name || ''}`}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>
          ) : (
            <List>
              {students.map((student: any) => (
                <List.Item
                  key={student.id}
                  prefix={
                    <Avatar
                      src={
                        student.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}`
                      }
                      style={{ '--border-radius': '50%' } as any}
                    />
                  }
                  description={`性别: ${student.gender} | 年龄: ${
                    new Date().getFullYear() - new Date(student.birthday).getFullYear()
                  }岁`}
                >
                  {student.name}
                </List.Item>
              ))}
            </List>
          )}
        </Card>
      </div>
    </MobileLayout>
  );
}
