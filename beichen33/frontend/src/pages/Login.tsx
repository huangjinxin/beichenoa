import { useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/auth';
import LanguageSwitcher from '../components/LanguageSwitcher/LanguageSwitcher';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { token, setAuth } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (token) {
      console.log('Already logged in, redirecting...');
      const user = useAuthStore.getState().user;
      const role = user?.role;

      // 根据角色跳转
      if (role === 'TEACHER') {
        navigate('/teacher/home', { replace: true });
      } else if (role === 'PARENT') {
        navigate('/parent/home', { replace: true });
      } else {
        navigate('/', { replace: true }); // ADMIN
      }
    }
  }, [token, navigate]);

  const loginMutation = useMutation({
    mutationFn: ({ identifier, password }: any) => authApi.login(identifier, password),
    onSuccess: (data: any) => {
      console.log('Login response:', data);
      if (data && data.access_token && data.user) {
        setAuth(data.access_token, data.user);
        message.success(t('auth.loginSuccess'));

        // 根据用户角色跳转到不同页面
        const role = data.user.role;
        if (role === 'TEACHER') {
          navigate('/teacher/home', { replace: true });
        } else if (role === 'PARENT') {
          navigate('/parent/home', { replace: true });
        } else {
          navigate('/', { replace: true }); // ADMIN 跳转到管理后台
        }
      } else {
        console.error('Invalid login response structure:', data);
        message.error('Invalid response from server');
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      message.error(error.response?.data?.message || t('auth.loginFailed'));
    },
  });

  const onFinish = (values: any) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="login-page">
      <div className="language-switcher-wrapper">
        <LanguageSwitcher />
      </div>

      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">🏫</div>
          <h1 className="login-title">
            {t('menu.students').includes('学生') ? '北辰幼儿园' : 'Beichen Kindergarten'}
          </h1>
          <p className="login-subtitle">
            {t('menu.students').includes('学生') ? '管理系统登录' : 'Management System'}
          </p>
        </div>

        <Form onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="identifier"
            rules={[{ required: true, message: '请输入邮箱或身份证号' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t('menu.students').includes('学生') ? '邮箱或身份证号' : 'Email or ID Card'}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('auth.passwordRequired') }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('auth.password')}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loginMutation.isPending}
              block
              style={{ height: '40px' }}
            >
              {t('auth.login')}
            </Button>
          </Form.Item>
        </Form>

        <div className="login-footer">
          <p>{t('menu.students').includes('学生') ? '默认密码：123456' : 'Default password: 123456'}</p>
          <p>{t('menu.students').includes('学生') ? '首次登录请修改密码' : 'Please change password after first login'}</p>
          <p style={{ marginTop: '20px' }}>
            <a
              onClick={() => navigate('/register')}
              style={{ color: '#1890ff', cursor: 'pointer' }}
            >
              {t('menu.students').includes('学生') ? '没有账号？立即注册' : 'No account? Register now'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
