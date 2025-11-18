import { useState } from 'react';
import { Table, Card, Tabs, DatePicker, Space, Tag } from 'antd';
import { GiftOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { studentApi, userApi } from '../../services/api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

export default function BirthdayList() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs(),
    dayjs().add(30, 'days'),
  ]);

  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentApi.getAll(),
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => userApi.getAll({ role: 'TEACHER' }),
  });

  const getUpcomingBirthdays = (people: any[], startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) => {
    if (!people) return [];

    return people
      .filter((person: any) => {
        if (!person.birthday) return false;

        const birthday = dayjs(person.birthday);
        const thisYearBirthday = birthday.year(dayjs().year());
        const nextYearBirthday = birthday.year(dayjs().year() + 1);

        return (
          (thisYearBirthday.isAfter(startDate) && thisYearBirthday.isBefore(endDate)) ||
          (nextYearBirthday.isAfter(startDate) && nextYearBirthday.isBefore(endDate))
        );
      })
      .map((person: any) => {
        const birthday = dayjs(person.birthday);
        const thisYearBirthday = birthday.year(dayjs().year());
        const nextYearBirthday = birthday.year(dayjs().year() + 1);

        const upcomingBirthday = thisYearBirthday.isAfter(dayjs())
          ? thisYearBirthday
          : nextYearBirthday;

        const age = dayjs().diff(birthday, 'year');
        const daysUntil = upcomingBirthday.diff(dayjs(), 'days');

        return {
          ...person,
          upcomingBirthday: upcomingBirthday.format('YYYY-MM-DD'),
          age,
          daysUntil,
          birthdayFormatted: birthday.format('MM-DD'),
        };
      })
      .sort((a: any, b: any) => a.daysUntil - b.daysUntil);
  };

  const upcomingStudentBirthdays = getUpcomingBirthdays(
    studentsData?.data || [],
    dateRange[0],
    dateRange[1]
  );

  const upcomingTeacherBirthdays = getUpcomingBirthdays(
    teachersData?.data || [],
    dateRange[0],
    dateRange[1]
  );

  const studentColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '班级',
      dataIndex: ['class', 'name'],
      key: 'class',
    },
    {
      title: '生日日期',
      dataIndex: 'birthdayFormatted',
      key: 'birthdayFormatted',
      render: (text: string) => (
        <Space>
          <GiftOutlined style={{ color: '#ff4d4f' }} />
          {text}
        </Space>
      ),
    },
    {
      title: '即将年龄',
      dataIndex: 'age',
      key: 'age',
      render: (age: number) => `${age + 1} 岁`,
    },
    {
      title: '距今天数',
      dataIndex: 'daysUntil',
      key: 'daysUntil',
      render: (days: number) => {
        let color = 'default';
        let text = `${days} 天`;

        if (days === 0) {
          color = 'red';
          text = '今天';
        } else if (days === 1) {
          color = 'orange';
          text = '明天';
        } else if (days <= 7) {
          color = 'gold';
        } else if (days <= 14) {
          color = 'blue';
        }

        return <Tag color={color}>{text}</Tag>;
      },
      sorter: (a: any, b: any) => a.daysUntil - b.daysUntil,
    },
  ];

  const teacherColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <TeamOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '生日日期',
      dataIndex: 'birthdayFormatted',
      key: 'birthdayFormatted',
      render: (text: string) => (
        <Space>
          <GiftOutlined style={{ color: '#ff4d4f' }} />
          {text}
        </Space>
      ),
    },
    {
      title: '即将年龄',
      dataIndex: 'age',
      key: 'age',
      render: (age: number) => `${age + 1} 岁`,
    },
    {
      title: '距今天数',
      dataIndex: 'daysUntil',
      key: 'daysUntil',
      render: (days: number) => {
        let color = 'default';
        let text = `${days} 天`;

        if (days === 0) {
          color = 'red';
          text = '今天';
        } else if (days === 1) {
          color = 'orange';
          text = '明天';
        } else if (days <= 7) {
          color = 'gold';
        } else if (days <= 14) {
          color = 'blue';
        }

        return <Tag color={color}>{text}</Tag>;
      },
      sorter: (a: any, b: any) => a.daysUntil - b.daysUntil,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>生日管理</h1>
        <RangePicker
          value={dateRange}
          onChange={(dates: any) => {
            if (dates) {
              setDateRange(dates);
            }
          }}
          format="YYYY-MM-DD"
        />
      </div>

      <Tabs defaultActiveKey="students">
        <TabPane
          tab={
            <span>
              <UserOutlined />
              学生生日 ({upcomingStudentBirthdays.length})
            </span>
          }
          key="students"
        >
          <Card>
            <Table
              dataSource={upcomingStudentBirthdays}
              columns={studentColumns}
              rowKey="id"
              pagination={{ pageSize: 20 }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <TeamOutlined />
              教师生日 ({upcomingTeacherBirthdays.length})
            </span>
          }
          key="teachers"
        >
          <Card>
            <Table
              dataSource={upcomingTeacherBirthdays}
              columns={teacherColumns}
              rowKey="id"
              pagination={{ pageSize: 20 }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}
