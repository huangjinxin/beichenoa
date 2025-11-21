import { Form, Input, Button, message, Radio, Select } from 'antd';
import { UserOutlined, IdcardOutlined, PhoneOutlined, BankOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../services/api';
import axios from 'axios';
import { useState } from 'react';
import './Login.css'; // 复用登录页面样式

export default function Register() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [roleType, setRoleType] = useState<'TEACHER' | 'STUDENT'>('TEACHER');

  // 获取校区列表
  const { data: campusData } = useQuery({
    queryKey: ['campus'],
    queryFn: async () => {
      const response = await axios.get('/api/campus');
      return response.data;
    },
  });

  // 获取班级列表
  const { data: classData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await axios.get('/api/classes');
      return response.data;
    },
  });

  // 获取职位列表
  const { data: positionData } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const response = await axios.get('/api/positions');
      return response.data;
    },
  });

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

  // 从身份证号解析性别和生日
  const parseIdCard = (idCard: string) => {
    if (idCard.length !== 18) return null;

    const year = idCard.substring(6, 10);
    const month = idCard.substring(10, 12);
    const day = idCard.substring(12, 14);
    const genderCode = parseInt(idCard.substring(16, 17));

    return {
      birthday: `${year}-${month}-${day}`,
      gender: genderCode % 2 === 0 ? '女' : '男',
    };
  };

  const onFinish = (values: any) => {
    // 从身份证解析生日和性别
    const parsedData = parseIdCard(values.idCard);

    if (!parsedData) {
      message.error('身份证号格式不正确');
      return;
    }

    const submitData = {
      ...values,
      ...parsedData,
      roleType, // 添加角色类型用于后端处理
    };

    registerMutation.mutate(submitData);
  };

  const handleRoleChange = (e: any) => {
    setRoleType(e.target.value);
    // 清空职位和电话字段
    if (e.target.value === 'STUDENT') {
      form.setFieldsValue({ positionId: undefined, phone: undefined });
    }
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
            label="注册身份"
            name="roleType"
            initialValue="TEACHER"
            rules={[{ required: true, message: '请选择注册身份' }]}
          >
            <Radio.Group onChange={handleRoleChange}>
              <Radio value="TEACHER">教师</Radio>
              <Radio value="STUDENT">学生</Radio>
            </Radio.Group>
          </Form.Item>

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
            tooltip="性别和出生日期将自动从身份证号中解析"
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
            label="校区"
            name="campusId"
            rules={[{ required: true, message: '请选择校区' }]}
          >
            <Select
              placeholder="请选择校区"
              suffixIcon={<BankOutlined />}
              options={campusData?.data?.map((campus: any) => ({
                label: campus.name,
                value: campus.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="班级"
            name="classId"
            rules={[{ required: true, message: '请选择班级' }]}
          >
            <Select
              placeholder="请选择班级"
              suffixIcon={<TeamOutlined />}
              options={classData?.data?.map((cls: any) => ({
                label: cls.name,
                value: cls.id,
              }))}
            />
          </Form.Item>

          {roleType === 'TEACHER' && (
            <>
              <Form.Item
                label="职位"
                name="positionId"
                rules={[{ required: true, message: '请选择职位' }]}
              >
                <Select
                  placeholder="请选择职位"
                  options={positionData?.data?.map((position: any) => ({
                    label: position.name,
                    value: position.id,
                  }))}
                />
              </Form.Item>

              <Form.Item
                label="手机号"
                name="phone"
                rules={[
                  { required: true, message: '请输入手机号' },
                  {
                    pattern: /^1[3-9]\d{9}$/,
                    message: '请输入正确的手机号',
                  },
                ]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
              </Form.Item>
            </>
          )}

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
          <p>1. 邮箱账号将根据姓名自动生成（姓名全拼@gichengbeiyou.cn）</p>
          <p>2. 性别和出生日期将从身份证号自动解析</p>
          <p>3. 初始密码为：123456</p>
          <p>4. 提交后请等待管理员审核</p>
          <p>5. 审核通过后可使用邮箱或身份证号登录</p>
        </div>
      </div>
    </div>
  );
}
