import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Card,
  Alert,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, campusApi, classApi, studentApi } from '../../services/api';
import dayjs from 'dayjs';

export default function UserManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // 监听表单中的角色字段变化
  const selectedRole = Form.useWatch('role', form) || '';

  // 获取用户列表
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll({ role: '' }),
  });

  // 获取校区列表
  const { data: campusData } = useQuery({
    queryKey: ['campus'],
    queryFn: () => campusApi.getAll(),
  });

  // 获取班级列表
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll(),
  });

  // 获取学生列表
  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentApi.getAll(),
  });

  const users = usersData?.data || [];
  const campusList = campusData || [];
  const classesList = classesData || [];
  const studentsList = studentsData?.data || [];

  // 创建用户
  const createMutation = useMutation({
    mutationFn: (data: any) => userApi.create(data),
    onSuccess: () => {
      message.success('用户创建成功');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '创建失败');
    },
  });

  // 更新用户
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => userApi.update(id, data),
    onSuccess: () => {
      message.success('用户更新成功');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setEditingUser(null);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '更新失败');
    },
  });

  // 删除用户
  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => {
      message.success('用户删除成功');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '删除失败');
    },
  });

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingUser(record);

    // 提取班级ID列表
    const classIds = record.classes?.map((c: any) => c.id) || [];

    // 提取学生ID列表（从家长档案中获取）
    const studentIds = record.parentProfile?.students?.map((s: any) => s.student.id) || [];

    form.setFieldsValue({
      ...record,
      campusId: record.campus?.id,
      classIds,
      studentIds,
      password: undefined, // 编辑时不显示密码
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 编辑模式下，如果密码为空则不更新密码
      if (editingUser && !values.password) {
        delete values.password;
      }

      if (editingUser) {
        updateMutation.mutate({ id: editingUser.id, data: values });
      } else {
        createMutation.mutate(values);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const getRoleTag = (role: string) => {
    const roleMap: Record<string, { color: string; text: string }> = {
      ADMIN: { color: 'red', text: '管理员' },
      TEACHER: { color: 'blue', text: '教师' },
      PARENT: { color: 'green', text: '家长' },
    };
    const config = roleMap[role] || { color: 'default', text: role };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getStatusTag = (isActive: boolean) => {
    return isActive ? (
      <Tag color="success">启用</Tag>
    ) : (
      <Tag color="default">禁用</Tag>
    );
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 180,
      render: (text: string) => text || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => getRoleTag(role),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => getStatusTag(isActive),
    },
    {
      title: '所属校区',
      dataIndex: ['campus', 'name'],
      key: 'campus',
      width: 150,
    },
    {
      title: '关联班级',
      dataIndex: 'classes',
      key: 'classes',
      width: 200,
      render: (classes: any[]) => {
        if (!classes || classes.length === 0) return '-';
        return (
          <Space size={[0, 4]} wrap>
            {classes.map((cls) => (
              <Tag key={cls.id} color="blue">
                {cls.name}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '关联学生',
      dataIndex: 'parentProfile',
      key: 'students',
      width: 200,
      render: (parentProfile: any) => {
        if (!parentProfile?.students || parentProfile.students.length === 0) return '-';
        return (
          <Space size={[0, 4]} wrap>
            {parentProfile.students.map((s: any) => (
              <Tag key={s.student.id} color="green">
                {s.student.name}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (text: string) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="用户管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加用户
          </Button>
        }
      >
        <Alert
          message="说明"
          description="用户管理用于添加和管理系统用户。教师用户可关联多个班级，家长用户可关联多个学生（孩子）。默认密码为 123456。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1800 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingUser(null);
          form.resetFields();
        }}
        width={600}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱（登录凭证）" disabled={!!editingUser} />
          </Form.Item>

          <Form.Item label="身份证号" name="idCard">
            <Input placeholder="可用于登录（选填）" />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select
              placeholder="请选择角色"
              onChange={() => {
                // 切换角色时清空班级和学生选择
                form.setFieldsValue({ classIds: [], studentIds: [] });
              }}
            >
              <Select.Option value="ADMIN">管理员</Select.Option>
              <Select.Option value="TEACHER">教师</Select.Option>
              <Select.Option value="PARENT">家长</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="所属校区"
            name="campusId"
            rules={[{ required: true, message: '请选择所属校区' }]}
          >
            <Select placeholder="请选择所属校区">
              {campusList.map((campus: any) => (
                <Select.Option key={campus.id} value={campus.id}>
                  {campus.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* 教师角色：关联班级（多选） */}
          {selectedRole === 'TEACHER' && (
            <Form.Item label="关联班级" name="classIds">
              <Select
                mode="multiple"
                placeholder="请选择教师所带班级（可多选）"
                allowClear
              >
                {classesList.map((cls: any) => (
                  <Select.Option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.grade})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {/* 家长角色：关联学生（多选） */}
          {selectedRole === 'PARENT' && (
            <Form.Item
              label="关联学生"
              name="studentIds"
              rules={[{ required: true, message: '家长用户必须关联至少一个学生' }]}
            >
              <Select
                mode="multiple"
                placeholder="请选择关联的学生（可多选）"
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {studentsList.map((student: any) => (
                  <Select.Option key={student.id} value={student.id}>
                    {student.name} - {student.class?.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item label="手机号" name="phone">
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: !editingUser, message: '请输入密码' },
              { min: 6, message: '密码至少6位' },
            ]}
            extra={editingUser ? '留空则不修改密码' : '默认密码为 123456'}
          >
            <Input.Password placeholder={editingUser ? '留空则不修改' : '请输入密码'} />
          </Form.Item>

          <Form.Item label="状态" name="isActive" initialValue={true}>
            <Select>
              <Select.Option value={true}>启用</Select.Option>
              <Select.Option value={false}>禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
