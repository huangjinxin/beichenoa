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
  HomeOutlined,
  GiftOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  ApiOutlined,
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
    { key: '/', icon: <DashboardOutlined />, label: '首页' },
    {
      key: '/personnel',
      icon: <TeamOutlined />,
      label: '人员管理',
      children: [
        { key: '/students', icon: <UserOutlined />, label: '学生管理' },
        { key: '/teachers', icon: <TeamOutlined />, label: '教师管理' },
        { key: '/classes', icon: <TeamOutlined />, label: '班级管理' },
        { key: '/birthday', icon: <GiftOutlined />, label: '生日管理' },
        { key: '/campus', icon: <HomeOutlined />, label: '分校管理' },
        { key: '/positions', icon: <TeamOutlined />, label: '职位管理' },
      ],
    },
    {
      key: '/canteen',
      icon: <RestOutlined />,
      label: '食堂管理',
      children: [
        { key: '/canteen/ingredients', label: '食材管理' },
        { key: '/canteen/dishes', label: '菜品管理' },
        { key: '/canteen/menus', label: '食谱管理' },
        { key: '/canteen/nutrition-standards', label: '营养标准配置' },
        { key: '/canteen/suppliers', icon: <ShopOutlined />, label: '供应商管理' },
        { key: '/canteen/purchase/plans', icon: <ShoppingCartOutlined />, label: '采购计划管理' },
      ],
    },
    {
      key: '/forms',
      icon: <FileTextOutlined />,
      label: '表单管理',
      children: [
        { key: '/forms/templates', label: '表单模板' },
        { key: '/forms/submissions', label: '表单提交' },
        { key: '/forms/approvals', label: '我的审批' },
      ],
    },
    {
      key: '/records',
      icon: <FileTextOutlined />,
      label: '日常记录',
      children: [
        { key: '/records/daily-observation', label: '每日观察' },
        { key: '/records/duty-report', label: '值班播报' },
      ],
    },
    { key: '/reports', icon: <BarChartOutlined />, label: '报表统计' },
    {
      key: '/system',
      icon: <SettingOutlined />,
      label: '系统配置',
      children: [
        { key: '/system/api', icon: <ApiOutlined />, label: 'API文档' },
      ],
    },
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
              退出登录
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
