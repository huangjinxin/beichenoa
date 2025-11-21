import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import {
  AppOutline,
  UnorderedListOutline,
  EditSOutline,
  FileOutline,
  UserOutline,
} from 'antd-mobile-icons';
import './MobileLayout.css';

interface MobileLayoutProps {
  children: ReactNode;
  role: 'teacher' | 'parent';
}

export default function MobileLayout({ children, role }: MobileLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const teacherTabs = [
    {
      key: '/teacher/home',
      title: '首页',
      icon: <AppOutline />,
    },
    {
      key: '/teacher/attendance',
      title: '考勤',
      icon: <UnorderedListOutline />,
    },
    {
      key: '/teacher/daily',
      title: '记录',
      icon: <EditSOutline />,
    },
    {
      key: '/teacher/forms',
      title: '表单',
      icon: <FileOutline />,
    },
    {
      key: '/teacher/profile',
      title: '我的',
      icon: <UserOutline />,
    },
  ];

  const parentTabs = [
    {
      key: '/parent/home',
      title: '首页',
      icon: <AppOutline />,
    },
    {
      key: '/parent/records',
      title: '记录',
      icon: <UnorderedListOutline />,
    },
    {
      key: '/parent/forms',
      title: '表单',
      icon: <FileOutline />,
    },
  ];

  const tabs = role === 'teacher' ? teacherTabs : parentTabs;

  const setRouteActive = (value: string) => {
    navigate(value);
  };

  return (
    <div className="mobile-layout">
      <div className="mobile-content">{children}</div>
      <div className="mobile-tab-bar">
        <TabBar activeKey={location.pathname} onChange={setRouteActive}>
          {tabs.map((item) => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      </div>
    </div>
  );
}
