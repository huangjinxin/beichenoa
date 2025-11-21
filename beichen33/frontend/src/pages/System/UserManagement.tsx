import { useState, useMemo } from 'react';
import {
  Tabs,
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
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  LockOutlined,
  StopOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, campusApi, classApi } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import dayjs from 'dayjs';

const { TabPane } = Tabs;

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [form] = Form.useForm();
  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  // 搜索和筛选状态
  const [searchText, setSearchText] = useState('');
  const [filterCampusId, setFilterCampusId] = useState<string>('');
  const [filterClassId, setFilterClassId] = useState<string>('');

  // 监听表单中的校区字段变化
  const selectedCampusId = Form.useWatch('campusId', form);
  const approveCampusId = Form.useWatch('campusId', approveForm);

  // 获取统计数据
  const { data: statisticsData } = useQuery({
    queryKey: ['user-statistics'],
    queryFn: () => userApi.getStatistics(),
  });

  // 获取待审核用户列表
  const { data: pendingUsersData, isLoading: isPendingLoading } = useQuery({
    queryKey: ['pending-users'],
    queryFn: () => userApi.getPending(),
  });

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

  const statistics = statisticsData?.data || {};
  const pendingUsers = pendingUsersData?.data || [];
  const users = usersData?.data || [];
  const campusList = campusData || [];
  const classesList = classesData || [];

  // 根据校区ID找到校区名称
  const getCampusName = (campusId: string) => {
    const campus = campusList.find((c: any) => c.id === campusId);
    return campus?.name || '';
  };

  // 根据选中的校区过滤班级列表
  const filteredClassesList = useMemo(() => {
    if (!selectedCampusId) return classesList;
    return classesList.filter((cls: any) =>
      cls.campusId === selectedCampusId || cls.campus?.id === selectedCampusId
    );
  }, [selectedCampusId, classesList]);

  // 筛选器的班级列表（用于筛选条）
  const filterClassesList = useMemo(() => {
    if (!filterCampusId) return classesList;
    return classesList.filter((cls: any) =>
      cls.campusId === filterCampusId || cls.campus?.id === filterCampusId
    );
  }, [filterCampusId, classesList]);

  // 审核表单的班级列表
  const approveClassesList = useMemo(() => {
    if (!approveCampusId) return [];
    return classesList.filter((cls: any) =>
      cls.campusId === approveCampusId || cls.campus?.id === approveCampusId
    );
  }, [approveCampusId, classesList]);

  // 分类统计用户（带搜索和筛选）
  const userStats = useMemo(() => {
    const filterUsers = (userList: any[]) => {
      return userList.filter((u: any) => {
        // 搜索过滤
        const matchSearch = !searchText ||
          u.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchText.toLowerCase()) ||
          u.phone?.includes(searchText);

        // 校区过滤
        const matchCampus = !filterCampusId || u.campusId === filterCampusId;

        // 班级过滤
        const matchClass = !filterClassId ||
          u.classes?.some((cls: any) => cls.id === filterClassId);

        return matchSearch && matchCampus && matchClass;
      });
    };

    const stats = {
      admin: filterUsers(users.filter((u: any) => u.role === 'ADMIN')),
      beichen1: filterUsers(users.filter((u: any) => {
        const campusName = getCampusName(u.campusId);
        return u.role === 'TEACHER' && (campusName.includes('北辰核心') || campusName === '北辰幼儿园');
      })),
      beichen2: filterUsers(users.filter((u: any) => {
        const campusName = getCampusName(u.campusId);
        return u.role === 'TEACHER' && (campusName.includes('三岔路') || campusName === '北辰二幼');
      })),
      beichen3: filterUsers(users.filter((u: any) => {
        const campusName = getCampusName(u.campusId);
        return u.role === 'TEACHER' && (campusName.includes('彭家山') || campusName === '北辰三幼');
      })),
      parent: filterUsers(users.filter((u: any) => u.role === 'PARENT')),
    };
    return stats;
  }, [users, campusList, searchText, filterCampusId, filterClassId]);

  // 禁用/启用用户
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: any) => userApi.update(id, { isActive }),
    onSuccess: () => {
      message.success('状态更新成功');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '操作失败');
    },
  });

  // 重置密码
  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => userApi.update(id, { password: '123456' }),
    onSuccess: () => {
      message.success('密码已重置为 123456');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '重置失败');
    },
  });

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

  // 审核通过
  const approveMutation = useMutation({
    mutationFn: ({ id, data }: any) => userApi.approve(id, data),
    onSuccess: () => {
      message.success('审核通过成功');
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-statistics'] });
      setIsApproveModalOpen(false);
      setSelectedUser(null);
      approveForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '审核失败');
    },
  });

  // 拒绝注册
  const rejectMutation = useMutation({
    mutationFn: ({ id, data }: any) => userApi.reject(id, data),
    onSuccess: () => {
      message.success('已拒绝该用户注册');
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-statistics'] });
      setIsRejectModalOpen(false);
      setSelectedUser(null);
      rejectForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '操作失败');
    },
  });

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    // 根据当前Tab设置默认角色和校区
    if (activeTab === 'admin') {
      form.setFieldsValue({ role: 'ADMIN' });
    } else if (activeTab.startsWith('beichen')) {
      form.setFieldsValue({ role: 'TEACHER' });
      // 根据Tab设置对应的校区
      const campusMap: any = {
        beichen1: campusList.find((c: any) => c.name === '北辰幼儿园')?.id,
        beichen2: campusList.find((c: any) => c.name === '北辰二幼')?.id,
        beichen3: campusList.find((c: any) => c.name === '北辰三幼')?.id,
      };
      const campusId = campusMap[activeTab];
      if (campusId) {
        form.setFieldsValue({ campusId });
      }
    }
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    // 检查是否为同步用户
    if (record.sourceType === 'STUDENT') {
      Modal.info({
        title: '提示',
        content: '该账号从学生管理同步而来，核心信息请到"学生管理"页面修改。这里只能修改账号状态和密码。',
        okText: '知道了',
      });
      return;
    }

    setEditingUser(record);
    const classIds = record.classes?.map((c: any) => c.id) || [];
    form.setFieldsValue({
      name: record.name,
      email: record.email,
      phone: record.phone,
      role: record.role,
      campusId: record.campus?.id,
      classIds,
    });
    setIsModalOpen(true);
  };

  const handleApprove = (record: any) => {
    setSelectedUser(record);
    approveForm.resetFields();
    setIsApproveModalOpen(true);
  };

  const handleReject = (record: any) => {
    setSelectedUser(record);
    rejectForm.resetFields();
    setIsRejectModalOpen(true);
  };

  const handleApproveSubmit = async () => {
    try {
      const values = await approveForm.validateFields();
      approveMutation.mutate({
        id: selectedUser.id,
        data: {
          ...values,
          adminId: currentUser?.id,
        },
      });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleRejectSubmit = async () => {
    try {
      const values = await rejectForm.validateFields();
      rejectMutation.mutate({
        id: selectedUser.id,
        data: {
          adminId: currentUser?.id,
          note: values.note,
        },
      });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleToggleStatus = (record: any) => {
    toggleStatusMutation.mutate({ id: record.id, isActive: !record.isActive });
  };

  const handleResetPassword = (id: string) => {
    resetPasswordMutation.mutate(id);
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
        // 新增时，如果没有设置密码，使用默认密码
        if (!values.password) {
          values.password = '123456';
        }
        createMutation.mutate(values);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleClearFilters = () => {
    setSearchText('');
    setFilterCampusId('');
    setFilterClassId('');
  };

  const getStatusTag = (isActive: boolean) => {
    return isActive ? (
      <Tag color="success">启用</Tag>
    ) : (
      <Tag color="default">禁用</Tag>
    );
  };

  const getSourceTag = (sourceType: string) => {
    const sourceMap: Record<string, { color: string; text: string }> = {
      MANUAL: { color: 'blue', text: '手动创建' },
      STUDENT: { color: 'green', text: '学生同步' },
      TEACHER_SYNC: { color: 'orange', text: '教师同步' },
    };
    const config = sourceMap[sourceType] || sourceMap.MANUAL;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getApprovalStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'gold', text: '待审核' },
      APPROVED: { color: 'success', text: '已通过' },
      REJECTED: { color: 'error', text: '已拒绝' },
    };
    const config = statusMap[status] || statusMap.PENDING;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 待审核用户Tab列定义
  const pendingColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 180,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (gender: string) => gender === 'MALE' ? '男' : gender === 'FEMALE' ? '女' : '-',
    },
    {
      title: '出生日期',
      dataIndex: 'birthDate',
      key: 'birthDate',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record)}
          >
            审核通过
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleReject(record)}
          >
            拒绝
          </Button>
        </Space>
      ),
    },
  ];

  // 教联体（管理员）Tab列定义
  const adminColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '账号',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (text: string) => text || '-',
    },
    {
      title: '所属校区',
      dataIndex: ['campus', 'name'],
      key: 'campus',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '审核状态',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 100,
      render: (status: string) => status ? getApprovalStatusTag(status) : getApprovalStatusTag('APPROVED'),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => getStatusTag(isActive),
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
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
          <Button
            type="link"
            size="small"
            icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
            onClick={() => handleToggleStatus(record)}
            danger={record.isActive}
          >
            {record.isActive ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="重置密码"
            description="确定要将密码重置为 123456 吗？"
            onConfirm={() => handleResetPassword(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" icon={<LockOutlined />}>
              重置密码
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 校区Tab列定义（教师）
  const teacherColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '账号',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '所属班级',
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
      title: '学生数量',
      dataIndex: 'classes',
      key: 'studentCount',
      width: 100,
      render: (classes: any[]) => {
        if (!classes || classes.length === 0) return 0;
        const totalStudents = classes.reduce((sum, cls) => sum + (cls._count?.students || 0), 0);
        return totalStudents;
      },
    },
    {
      title: '审核状态',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 100,
      render: (status: string) => status ? getApprovalStatusTag(status) : getApprovalStatusTag('APPROVED'),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => getStatusTag(isActive),
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
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
          <Button
            type="link"
            size="small"
            icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
            onClick={() => handleToggleStatus(record)}
            danger={record.isActive}
          >
            {record.isActive ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="重置密码"
            description="确定要将密码重置为 123456 吗？"
            onConfirm={() => handleResetPassword(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" icon={<LockOutlined />}>
              重置密码
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 学生家长Tab列定义
  const parentColumns = [
    {
      title: '家长姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '账号',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '来源',
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 100,
      render: (sourceType: string) => getSourceTag(sourceType || 'MANUAL'),
    },
    {
      title: '孩子姓名',
      dataIndex: 'parentProfile',
      key: 'children',
      width: 150,
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
      title: '所属校区',
      dataIndex: ['campus', 'name'],
      key: 'campus',
      width: 120,
    },
    {
      title: '所属班级',
      dataIndex: 'parentProfile',
      key: 'classes',
      width: 150,
      render: (parentProfile: any) => {
        if (!parentProfile?.students || parentProfile.students.length === 0) return '-';
        const classes = parentProfile.students.map((s: any) => s.student.class);
        const uniqueClasses = Array.from(new Set(classes.map((c: any) => c?.id)))
          .map(id => classes.find((c: any) => c?.id === id))
          .filter(Boolean);
        return (
          <Space size={[0, 4]} wrap>
            {uniqueClasses.map((cls: any) => (
              <Tag key={cls.id} color="blue">
                {cls.name}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '审核状态',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 100,
      render: (status: string) => status ? getApprovalStatusTag(status) : getApprovalStatusTag('APPROVED'),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => getStatusTag(isActive),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
            onClick={() => handleToggleStatus(record)}
            danger={record.isActive}
          >
            {record.isActive ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="重置密码"
            description="确定要将密码重置为 123456 吗？"
            onConfirm={() => handleResetPassword(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" icon={<LockOutlined />}>
              重置密码
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={statistics.totalUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待审核用户"
              value={statistics.pendingUsers || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已审核通过"
              value={statistics.approvedUsers || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已拒绝用户"
              value={statistics.rejectedUsers || 0}
              prefix={<CloseOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 按角色统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="教师用户"
              value={statistics.teacherUsers || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="家长用户"
              value={statistics.parentUsers || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="管理员"
              value={statistics.adminUsers || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="用户管理">
        {/* 搜索和筛选栏 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Input
              placeholder="搜索姓名、账号、手机号"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="筛选校区"
              style={{ width: '100%' }}
              value={filterCampusId || undefined}
              onChange={(value) => {
                setFilterCampusId(value || '');
                setFilterClassId(''); // 清空班级筛选
              }}
              allowClear
            >
              {campusList.map((campus: any) => (
                <Select.Option key={campus.id} value={campus.id}>
                  {campus.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="筛选班级"
              style={{ width: '100%' }}
              value={filterClassId || undefined}
              onChange={(value) => setFilterClassId(value || '')}
              allowClear
              disabled={!filterCampusId}
            >
              {filterClassesList.map((cls: any) => (
                <Select.Option key={cls.id} value={cls.id}>
                  {cls.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Space>
              <Button onClick={handleClearFilters}>清空筛选</Button>
            </Space>
          </Col>
        </Row>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={`待审核用户 (${pendingUsers.length})`} key="pending">
            <Table
              columns={pendingColumns}
              dataSource={pendingUsers}
              rowKey="id"
              loading={isPendingLoading}
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>

          <TabPane tab={`教联体 (${userStats.admin.length})`} key="admin">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加教联体账号
              </Button>
            </div>
            <Table
              columns={adminColumns}
              dataSource={userStats.admin}
              rowKey="id"
              loading={isLoading}
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>

          <TabPane tab={`北辰核心园 (${userStats.beichen1.length})`} key="beichen1">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加教师
              </Button>
            </div>
            <Table
              columns={teacherColumns}
              dataSource={userStats.beichen1}
              rowKey="id"
              loading={isLoading}
              scroll={{ x: 1400 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>

          <TabPane tab={`三岔路分园 (${userStats.beichen2.length})`} key="beichen2">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加教师
              </Button>
            </div>
            <Table
              columns={teacherColumns}
              dataSource={userStats.beichen2}
              rowKey="id"
              loading={isLoading}
              scroll={{ x: 1400 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>

          <TabPane tab={`彭家山幼儿园 (${userStats.beichen3.length})`} key="beichen3">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加教师
              </Button>
            </div>
            <Table
              columns={teacherColumns}
              dataSource={userStats.beichen3}
              rowKey="id"
              loading={isLoading}
              scroll={{ x: 1400 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>

          <TabPane tab={`学生家长 (${userStats.parent.length})`} key="parent">
            <Table
              columns={parentColumns}
              dataSource={userStats.parent}
              rowKey="id"
              loading={isLoading}
              scroll={{ x: 1400 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 编辑/新增用户Modal */}
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
            <Input placeholder="请输入邮箱（登录账号）" disabled={!!editingUser} />
          </Form.Item>

          <Form.Item label="手机号" name="phone">
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色" disabled={!!editingUser && editingUser.sourceType === 'STUDENT'}>
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
            <Select
              placeholder="请选择所属校区"
              onChange={() => {
                // 切换校区时清空班级选择
                form.setFieldsValue({ classIds: [] });
              }}
            >
              {campusList.map((campus: any) => (
                <Select.Option key={campus.id} value={campus.id}>
                  {campus.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {(editingUser?.role === 'TEACHER' || form.getFieldValue('role') === 'TEACHER') && (
            <Form.Item label="关联班级" name="classIds">
              <Select
                mode="multiple"
                placeholder="请选择教师所带班级（可多选）"
                allowClear
                disabled={!selectedCampusId}
              >
                {filteredClassesList.map((cls: any) => (
                  <Select.Option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.grade})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

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

      {/* 审核通过Modal */}
      <Modal
        title="审核通过"
        open={isApproveModalOpen}
        onOk={handleApproveSubmit}
        onCancel={() => {
          setIsApproveModalOpen(false);
          setSelectedUser(null);
          approveForm.resetFields();
        }}
        width={600}
        confirmLoading={approveMutation.isPending}
      >
        <Form form={approveForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="待审核用户信息">
            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
              <p><strong>姓名：</strong>{selectedUser?.name}</p>
              <p><strong>身份证号：</strong>{selectedUser?.idCard}</p>
              <p><strong>手机号：</strong>{selectedUser?.phone}</p>
            </div>
          </Form.Item>

          <Form.Item
            label="分配角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Select.Option value="TEACHER">教师</Select.Option>
              <Select.Option value="PARENT">家长</Select.Option>
              <Select.Option value="ADMIN">管理员</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="所属校区"
            name="campusId"
            rules={[{ required: true, message: '请选择所属校区' }]}
          >
            <Select
              placeholder="请选择所属校区"
              onChange={() => {
                approveForm.setFieldsValue({ classIds: [] });
              }}
            >
              {campusList.map((campus: any) => (
                <Select.Option key={campus.id} value={campus.id}>
                  {campus.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {approveForm.getFieldValue('role') === 'TEACHER' && (
            <Form.Item label="关联班级" name="classIds">
              <Select
                mode="multiple"
                placeholder="请选择教师所带班级（可多选）"
                allowClear
                disabled={!approveCampusId}
              >
                {approveClassesList.map((cls: any) => (
                  <Select.Option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.grade})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item label="备注" name="note">
            <Input.TextArea
              placeholder="填写审核备注（可选）"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 拒绝注册Modal */}
      <Modal
        title="拒绝注册"
        open={isRejectModalOpen}
        onOk={handleRejectSubmit}
        onCancel={() => {
          setIsRejectModalOpen(false);
          setSelectedUser(null);
          rejectForm.resetFields();
        }}
        width={600}
        confirmLoading={rejectMutation.isPending}
      >
        <Form form={rejectForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="待审核用户信息">
            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
              <p><strong>姓名：</strong>{selectedUser?.name}</p>
              <p><strong>身份证号：</strong>{selectedUser?.idCard}</p>
              <p><strong>手机号：</strong>{selectedUser?.phone}</p>
            </div>
          </Form.Item>

          <Form.Item
            label="拒绝原因"
            name="note"
            rules={[{ required: true, message: '请填写拒绝原因' }]}
          >
            <Input.TextArea
              placeholder="请详细说明拒绝原因，该信息将通知给用户"
              rows={6}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
