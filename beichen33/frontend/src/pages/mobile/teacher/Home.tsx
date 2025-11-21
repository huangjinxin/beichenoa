import { useEffect } from 'react';
import { Card, List, NoticeBar, Tag, Avatar, Space } from 'antd-mobile';
import { useQuery } from '@tanstack/react-query';
import { announcementApi } from '../../../services/api';
import { useAuthStore } from '../../../store/auth';
import MobileLayout from '../../../components/mobile/MobileLayout';
import dayjs from 'dayjs';
import './Home.css';

export default function TeacherHome() {
  const { user } = useAuthStore();

  // 获取我的公告
  const { data: announcements, isLoading } = useQuery({
    queryKey: ['myAnnouncements'],
    queryFn: () => announcementApi.getMy(),
  });

  return (
    <MobileLayout role="teacher">
      <div className="teacher-home">
        {/* 用户信息卡片 */}
        <Card className="user-info-card">
          <Space align="center">
            <Avatar
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
              style={{ '--size': '60px' } as any}
            />
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">
                <Tag color="primary">教师</Tag>
                {user?.position?.name && <Tag color="default">{user.position.name}</Tag>}
              </div>
              <div className="user-campus">{user?.campus?.name}</div>
            </div>
          </Space>
        </Card>

        {/* 待办提醒 */}
        <Card title="待办提醒" className="todo-card">
          <NoticeBar content="今日考勤尚未提交" color="alert" />
        </Card>

        {/* 公告列表 */}
        <Card title="学校公告" className="announcement-card">
          {isLoading ? (
            <div>加载中...</div>
          ) : (
            <List>
              {announcements?.announcements?.length > 0 ? (
                announcements.announcements.map((item: any) => (
                  <List.Item
                    key={item.id}
                    prefix={
                      <Tag color={item.type === 'urgent' ? 'danger' : 'primary'}>
                        {item.type === 'urgent' ? '紧急' : '通知'}
                      </Tag>
                    }
                    description={dayjs(item.publishedAt).format('YYYY-MM-DD HH:mm')}
                  >
                    {item.title}
                  </List.Item>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>暂无公告</div>
              )}
            </List>
          )}
        </Card>
      </div>
    </MobileLayout>
  );
}
