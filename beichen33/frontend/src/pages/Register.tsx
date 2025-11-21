import { Form, Input, Button, message, DatePicker, Radio } from 'antd';
import { UserOutlined, IdcardOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../services/api';
import './Login.css'; // 复用登录页面样式

export default function Register() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const registerMutation = useMutation({
    mutationFn: (values: any) => authApi.register(values),
    onSuccess: (data: any) => {
      message.success(data.message || '注册成功！请等待管理员审核');
      // 3秒后跳转到登录页
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '注册失败，请稍后重试');
    },
  });

  const onFinish = (values: any) => {
    // 转换日期格式
    const submitData = {
      ...values,
      birthday: values.birthday.format('YYYY-MM-DD'),
    };
    registerMutation.mutate(submitData);
  };

  return (
    <div className="login-page">
      <div className="login-container" style={{ maxWidth: '500px' }}>
        <div className="login-header">
          <div className="login-logo">🏫</div>
          <h1 className="login-title">北辰幼儿园</h1>
          <p className="login-subtitle">用户注册</p>
        </div>

        <Form
          form={form}
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入您的姓名" />
          </Form.Item>

          <Form.Item
            label="身份证号"
            name="idCard"
            rules={[
              { required: true, message: '请输入身份证号' },
              { len: 18, message: '身份证号必须为18位' },
              {
                pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
                message: '身份证号格式不正确',
              },
            ]}
          >
            <Input
              prefix={<IdcardOutlined />}
              placeholder="请输入身份证号（18位）"
              maxLength={18}
            />
          </Form.Item>

          <Form.Item
            label="性别"
            name="gender"
            rules={[{ required: true, message: '请选择性别' }]}
          >
            <Radio.Group>
              <Radio value="男">男</Radio>
              <Radio value="女">女</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="出生日期"
            name="birthday"
            rules={[{ required: true, message: '请选择出生日期' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="请选择出生日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              {
                pattern: /^1[3-9]\d{9}$/,
                message: '请输入正确的手机号',
              },
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="手机号（选填）" />
          </Form.Item>

          <Form.Item
            label="家庭住址"
            name="address"
          >
            <Input.TextArea
              rows={2}
              placeholder="家庭住址（选填）"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={registerMutation.isPending}
              block
              style={{ height: '40px' }}
            >
              提交注册
            </Button>
          </Form.Item>

          <Form.Item>
            <Button
              block
              onClick={() => navigate('/login')}
              style={{ height: '40px' }}
            >
              返回登录
            </Button>
          </Form.Item>
        </Form>

        <div className="login-footer">
          <p>注册须知：</p>
          <p>1. 邮箱账号将根据姓名自动生成</p>
          <p>2. 初始密码为：123456</p>
          <p>3. 提交后请等待管理员审核</p>
          <p>4. 审核通过后可使用邮箱或身份证号登录</p>
        </div>
      </div>
    </div>
  );
}
