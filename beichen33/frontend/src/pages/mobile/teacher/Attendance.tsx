import { useState, useEffect } from 'react';
import { Card, Grid, Avatar, Button, DatePicker, Selector, Toast, Dialog } from 'antd-mobile';
import { useQuery, useMutation } from '@tanstack/react-query';
import { studentApi, attendanceApi } from '../../../services/api';
import { useAuthStore } from '../../../store/auth';
import MobileLayout from '../../../components/mobile/MobileLayout';
import dayjs from 'dayjs';
import './Attendance.css';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';

interface StudentAttendance {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export default function TeacherAttendance() {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, StudentAttendance>>({});

  // 获取教师所带班级
  const classes = user?.classes || [];

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].id);
    }
  }, [classes, selectedClass]);

  // 获取班级学生列表
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['classStudents', selectedClass],
    queryFn: () => studentApi.getAll({ classId: selectedClass }),
    enabled: !!selectedClass,
  });

  const students = studentsData?.students || [];

  // 初始化考勤状态（默认全部到校）
  useEffect(() => {
    if (students.length > 0) {
      const initialMap: Record<string, StudentAttendance> = {};
      students.forEach((student: any) => {
        initialMap[student.id] = {
          studentId: student.id,
          status: 'PRESENT',
        };
      });
      setAttendanceMap(initialMap);
    }
  }, [students]);

  // 提交考勤记录
  const submitMutation = useMutation({
    mutationFn: (data: any) => attendanceApi.createRecord(data),
    onSuccess: () => {
      Toast.show({
        icon: 'success',
        content: '考勤提交成功',
      });
    },
    onError: () => {
      Toast.show({
        icon: 'fail',
        content: '考勤提交失败',
      });
    },
  });

  // 切换学生状态
  const toggleStatus = (studentId: string) => {
    const statusOrder: AttendanceStatus[] = ['PRESENT', 'LEAVE', 'LATE', 'ABSENT'];
    const current = attendanceMap[studentId]?.status || 'PRESENT';
    const currentIndex = statusOrder.indexOf(current);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const nextStatus = statusOrder[nextIndex];

    setAttendanceMap({
      ...attendanceMap,
      [studentId]: {
        ...attendanceMap[studentId],
        status: nextStatus,
      },
    });
  };

  // 获取状态样式
  const getStatusStyle = (status: AttendanceStatus) => {
    const styles = {
      PRESENT: { backgroundColor: '#52c41a', color: '#fff' },
      LEAVE: { backgroundColor: '#faad14', color: '#fff' },
      LATE: { backgroundColor: '#ff7a45', color: '#fff' },
      ABSENT: { backgroundColor: '#ff4d4f', color: '#fff' },
    };
    return styles[status];
  };

  // 获取状态文字
  const getStatusText = (status: AttendanceStatus) => {
    const texts = {
      PRESENT: '到校',
      LEAVE: '请假',
      LATE: '迟到',
      ABSENT: '缺勤',
    };
    return texts[status];
  };

  // 提交考勤
  const handleSubmit = async () => {
    const attendances = Object.values(attendanceMap);

    const result = await Dialog.confirm({
      content: `确认提交 ${students.length} 名学生的考勤记录吗？`,
    });

    if (result) {
      submitMutation.mutate({
        date: dayjs(selectedDate).format('YYYY-MM-DD'),
        classId: selectedClass,
        attendances,
      });
    }
  };

  return (
    <MobileLayout role="teacher">
      <div className="teacher-attendance">
        {/* 日期和班级选择 */}
        <Card className="filter-card">
          <div className="filter-item">
            <div className="filter-label">日期</div>
            <Button
              size="small"
              onClick={() => {
                Dialog.alert({
                  content: (
                    <DatePicker
                      visible
                      onClose={() => {}}
                      onConfirm={(val) => setSelectedDate(val)}
                      defaultValue={selectedDate}
                    />
                  ),
                });
              }}
            >
              {dayjs(selectedDate).format('YYYY-MM-DD')}
            </Button>
          </div>
          {classes.length > 1 && (
            <div className="filter-item">
              <div className="filter-label">班级</div>
              <Selector
                options={classes.map((c: any) => ({ label: c.name, value: c.id }))}
                value={[selectedClass]}
                onChange={(arr) => setSelectedClass(arr[0])}
              />
            </div>
          )}
        </Card>

        {/* 学生网格 */}
        <Card className="students-card" title={`学生名单 (${students.length}人)`}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
          ) : (
            <>
              <Grid columns={4} gap={8}>
                {students.map((student: any) => {
                  const attendance = attendanceMap[student.id];
                  const status = attendance?.status || 'PRESENT';
                  return (
                    <Grid.Item key={student.id}>
                      <div
                        className="student-item"
                        onClick={() => toggleStatus(student.id)}
                        style={getStatusStyle(status)}
                      >
                        <Avatar
                          src={
                            student.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}`
                          }
                          style={{ '--size': '50px' } as any}
                        />
                        <div className="student-name">{student.name}</div>
                        <div className="student-status">{getStatusText(status)}</div>
                      </div>
                    </Grid.Item>
                  );
                })}
              </Grid>

              {/* 统计信息 */}
              <div className="attendance-stats">
                <div className="stat-item">
                  <span className="stat-label">到校:</span>
                  <span className="stat-value">
                    {Object.values(attendanceMap).filter((a) => a.status === 'PRESENT').length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">请假:</span>
                  <span className="stat-value">
                    {Object.values(attendanceMap).filter((a) => a.status === 'LEAVE').length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">迟到:</span>
                  <span className="stat-value">
                    {Object.values(attendanceMap).filter((a) => a.status === 'LATE').length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">缺勤:</span>
                  <span className="stat-value">
                    {Object.values(attendanceMap).filter((a) => a.status === 'ABSENT').length}
                  </span>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* 提交按钮 */}
        <div className="submit-section">
          <Button
            block
            color="primary"
            size="large"
            onClick={handleSubmit}
            loading={submitMutation.isPending}
            disabled={students.length === 0}
          >
            提交考勤
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
