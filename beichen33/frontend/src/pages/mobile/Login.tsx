import { useEffect } from 'react';
import { Form, Input, Button, Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import './Login.css';

export default function MobileLogin() {
  const navigate = useNavigate();
  const { token, setAuth } = useAuthStore();
  const [form] = Form.useForm();

  useEffect(() => {
    if (token) {
      console.log('Already logged in, redirecting...');
      // 已登录则跳转
      const user = useAuthStore.getState().user;
      if (user?.role === 'TEACHER') {
        navigate('/teacher/home', { replace: true });
      } else if (user?.role === 'PARENT') {
        navigate('/parent/home', { replace: true });
      }
    }
  }, [token, navigate]);

  const loginMutation = useMutation({
    mutationFn: ({ identifier, password }: any) => authApi.login(identifier, password),
    onSuccess: (data: any) => {
      console.log('Login response:', data);
      if (data && data.access_token && data.user) {
        setAuth(data.access_token, data.user);
        Toast.show({
          icon: 'success',
          content: '登录成功',
        });

        // 根据用户角色跳转
        const role = data.user.role;
        if (role === 'TEACHER') {
          navigate('/teacher/home', { replace: true });
        } else if (role === 'PARENT') {
          navigate('/parent/home', { replace: true });
        } else {
          // 管理员跳转到桌面端
          navigate('/', { replace: true });
        }
      } else {
        console.error('Invalid login response structure:', data);
        Toast.show({
          icon: 'fail',
          content: '登录失败，返回数据异常',
        });
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      Toast.show({
        icon: 'fail',
        content: error.response?.data?.message || '登录失败，请检查账号密码',
      });
    },
  });

  const onFinish = () => {
    form.validateFields().then((values) => {
      loginMutation.mutate(values);
    });
  };

  return (
    <div className="mobile-login">
      <div className="mobile-login-container">
        <div className="mobile-login-header">
          <div className="mobile-login-logo">🏫</div>
          <h1 className="mobile-login-title">北辰幼儿园</h1>
          <p className="mobile-login-subtitle">移动端登录</p>
        </div>

        <Form
          form={form}
          layout="vertical"
          footer={
            <Button
              block
              type="submit"
              color="primary"
              size="large"
              loading={loginMutation.isPending}
              onClick={onFinish}
            >
              登录
            </Button>
          }
        >
          <Form.Item
            name="identifier"
            label="账号"
            rules={[{ required: true, message: '请输入邮箱或身份证号' }]}
          >
            <Input placeholder="邮箱或身份证号" clearable />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input placeholder="默认密码 123456" type="password" clearable />
          </Form.Item>
        </Form>

        <div className="mobile-login-footer">
          <p>默认密码：123456</p>
          <p>首次登录请修改密码</p>
        </div>
      </div>
    </div>
  );
}
