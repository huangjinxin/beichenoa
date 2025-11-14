import { Layout as AntLayout, Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  RestOutlined,
  FileTextOutlined,
  BarChartOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/auth';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';

const { Header, Sider, Content } = AntLayout;

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: t('menu.dashboard') },
    { key: '/students', icon: <UserOutlined />, label: t('menu.students') },
    { key: '/teachers', icon: <TeamOutlined />, label: '教师管理' },
    { key: '/classes', icon: <TeamOutlined />, label: t('menu.classes') },
    {
      key: '/canteen',
      icon: <RestOutlined />,
      label: t('menu.canteen'),
      children: [
        { key: '/canteen/ingredients', label: t('menu.ingredients') },
        { key: '/canteen/dishes', label: t('menu.dishes') },
        { key: '/canteen/menus', label: t('menu.menus') },
        { key: '/canteen/nutrition', label: t('menu.nutrition') },
      ],
    },
    {
      key: '/forms',
      icon: <FileTextOutlined />,
      label: t('menu.forms'),
      children: [
        { key: '/forms/templates', label: t('menu.formTemplates') },
        { key: '/forms/submissions', label: t('menu.formSubmissions') },
      ],
    },
    { key: '/reports', icon: <BarChartOutlined />, label: t('menu.reports') },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          {t('menu.students').includes('学生') ? '北辰幼儿园' : 'Beichen KG'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 500 }}>
            {t('menu.students').includes('学生') ? '北辰幼儿园管理系统' : 'Beichen Kindergarten Management System'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <LanguageSwitcher />
            <span>{user?.name}</span>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              {t('auth.logout')}
            </Button>
          </div>
        </Header>
        <Content style={{ margin: 24, background: '#fff', padding: 24, minHeight: 280 }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
