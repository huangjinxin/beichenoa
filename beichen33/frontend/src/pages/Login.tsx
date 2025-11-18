import { useEffect } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/auth';
import LanguageSwitcher from '../components/LanguageSwitcher/LanguageSwitcher';

export default function Login() {
  const navigate = useNavigate();
  const { token, setAuth } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (token) {
      console.log('Already logged in, redirecting to dashboard');
      navigate('/');
    }
  }, [token, navigate]);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: any) => authApi.login(email, password),
    onSuccess: (data: any) => {
      console.log('Login response:', data);
      if (data && data.access_token && data.user) {
        setAuth(data.access_token, data.user);
        message.success(t('auth.loginSuccess'));
        navigate('/');
      } else {
        console.error('Invalid login response structure:', data);
        message.error('Invalid response from server');
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      message.error(t('auth.loginFailed'));
    },
  });

  const onFinish = (values: any) => {
    loginMutation.mutate(values);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 24, right: 24 }}>
        <LanguageSwitcher />
      </div>
      <Card
        title={t('menu.students').includes('学生') ? '北辰幼儿园管理系统' : 'Beichen Kindergarten Management System'}
        style={{ width: 400 }}
      >
        <Form onFinish={onFinish} autoComplete="off">
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: t('auth.usernameRequired') }]}>
            <Input prefix={<UserOutlined />} placeholder={t('auth.username')} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: t('auth.passwordRequired') }]}>
            <Input.Password prefix={<LockOutlined />} placeholder={t('auth.password')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loginMutation.isPending} block>
              {t('auth.login')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
