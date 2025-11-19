import { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Button, Drawer } from 'antd';
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
  MenuFoldOutlined,
  MenuUnfoldOutlined,
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
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    if (isMobile) {
      setDrawerVisible(false);
    }
  };

  const toggleCollapsed = () => {
    if (isMobile) {
      setDrawerVisible(!drawerVisible);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const menuContent = (
    <>
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed && !isMobile ? 14 : 18,
          fontWeight: 'bold',
          overflow: 'hidden',
          transition: 'all 0.2s',
        }}
      >
        {collapsed && !isMobile ? 'BC' : (t('menu.students').includes('学生') ? '北辰幼儿园' : 'Beichen KG')}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        inlineCollapsed={collapsed && !isMobile}
      />
    </>
  );

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {isMobile ? (
        <Drawer
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          styles={{ body: { padding: 0, background: '#001529' } }}
          width={200}
        >
          {menuContent}
        </Drawer>
      ) : (
        <Sider
          width={200}
          theme="dark"
          collapsible
          collapsed={collapsed}
          trigger={null}
          collapsedWidth={80}
        >
          {menuContent}
        </Sider>
      )}
      <AntLayout>
        <Header
          style={{
            background: '#fff',
            padding: '0 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed || drawerVisible ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapsed}
              style={{ fontSize: 18 }}
            />
            <div style={{ fontSize: isMobile ? 14 : 18, fontWeight: 500 }}>
              {isMobile
                ? (t('menu.students').includes('学生') ? '北辰' : 'Beichen')
                : (t('menu.students').includes('学生') ? '北辰幼儿园管理系统' : 'Beichen Kindergarten Management System')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
            <LanguageSwitcher />
            {!isMobile && <span>{user?.name}</span>}
            <Button
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              size={isMobile ? 'small' : 'middle'}
            >
              {!isMobile && '退出登录'}
            </Button>
          </div>
        </Header>
        <Content
          style={{
            margin: isMobile ? 8 : 24,
            background: '#fff',
            padding: isMobile ? 12 : 24,
            minHeight: 280,
            borderRadius: 8,
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
