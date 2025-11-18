import { useState, useEffect, useRef } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Select, DatePicker, Descriptions } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { userApi, campusApi, positionApi } from '../../services/api';
import dayjs from 'dayjs';

const teacherApi = {
  getAll: () => userApi.getAll({ role: 'TEACHER' }),
  create: (data: any) => userApi.create({ ...data, role: 'TEACHER' }),
  update: (id: string, data: any) => userApi.update(id, data),
  delete: (id: string) => userApi.delete(id),
};

const parseIdCard = (idCard: string) => {
  if (!idCard || idCard.length !== 18) {
    return null;
  }

  const year = idCard.substring(6, 10);
  const month = idCard.substring(10, 12);
  const day = idCard.substring(12, 14);
  const genderCode = parseInt(idCard.substring(16, 17));

  const birthday = dayjs(`${year}-${month}-${day}`);
  const gender = genderCode % 2 === 0 ? '女' : '男';

  return {
    birthday,
    gender,
  };
};

export default function TeacherList() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: teachersData, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: teacherApi.getAll,
  });

  const { data: campusData } = useQuery({
    queryKey: ['campus'],
    queryFn: campusApi.getAll,
  });

  const { data: positionsData } = useQuery({
    queryKey: ['positions'],
    queryFn: positionApi.getAll,
  });

  const calculateAge = (birthday: string | Date | dayjs.Dayjs) => {
    if (!birthday) return null;
    const birthDate = dayjs(birthday);
    return dayjs().diff(birthDate, 'year');
  };

  useEffect(() => {
    const birthday = form.getFieldValue('birthday');
    if (birthday) {
      setAge(calculateAge(birthday));
    } else {
      setAge(null);
    }
  }, [form.getFieldValue('birthday')]);

  const filteredTeachers = teachersData?.data?.filter((teacher: any) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      teacher.name?.toLowerCase().includes(searchLower) ||
      teacher.email?.toLowerCase().includes(searchLower) ||
      teacher.phone?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const createMutation = useMutation({
    mutationFn: teacherApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: () => {
      message.error(t('messages.saveFailed'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => teacherApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
    },
    onError: () => {
      message.error(t('messages.saveFailed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: teacherApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      message.success(t('messages.deleteSuccess'));
    },
    onError: () => {
      message.error(t('messages.deleteFailed'));
    },
  });

  const handleSubmit = (values: any) => {
    const submitData = {
      ...values,
      birthday: values.birthday ? values.birthday.toISOString() : null,
      hireDate: values.hireDate ? values.hireDate.toISOString() : null,
      resignationDate: values.resignationDate ? values.resignationDate.toISOString() : null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: submitData });
    } else {
      createMutation.mutate({ ...submitData, password: '123456' });
    }
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      campusId: record.campus?.id,
      positionId: record.position?.id,
      birthday: record.birthday ? dayjs(record.birthday) : null,
      hireDate: record.hireDate ? dayjs(record.hireDate) : null,
      resignationDate: record.resignationDate ? dayjs(record.resignationDate) : null,
    });
    if (record.birthday) {
      setAge(calculateAge(record.birthday));
    }
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    form.resetFields();
    setAge(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: t('messages.deleteConfirm'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleView = (record: any) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Teacher_${viewingRecord?.name || 'Print'}`,
  });

  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idCard = e.target.value.trim();
    const parsed = parseIdCard(idCard);

    if (parsed) {
      form.setFieldsValue({
        birthday: parsed.birthday,
        gender: parsed.gender,
      });
      setAge(calculateAge(parsed.birthday));
    }
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的教师');
      return;
    }
    Modal.confirm({
      title: `确定删除 ${selectedRowKeys.length} 位教师？`,
      content: '此操作无法撤销',
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map(id => teacherApi.delete(id)));
          queryClient.invalidateQueries({ queryKey: ['teachers'] });
          message.success('批量删除成功');
          setSelectedRowKeys([]);
        } catch (error) {
          message.error('批量删除失败');
        }
      },
    });
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: any) => setSelectedRowKeys(keys),
  };

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    {
      title: '分校',
      dataIndex: 'campus',
      key: 'campus',
      render: (campus: any) => campus?.name || '-'
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
      render: (position: any) => position?.name || '-'
    },
    {
      title: '在职状态',
      dataIndex: 'employmentStatus',
      key: 'employmentStatus',
      render: (status: string) => {
        const statusMap: any = {
          ACTIVE: '在职',
          RESIGNED: '离职',
          PROBATION: '试用期',
          SUSPENDED: '停职'
        };
        return statusMap[status] || '-';
      }
    },
    { title: '身份证号', dataIndex: 'idCard', key: 'idCard' },
    { title: '性别', dataIndex: 'gender', key: 'gender' },
    {
      title: '年龄',
      key: 'age',
      render: (_: any, record: any) => record.birthday ? calculateAge(record.birthday) : '-'
    },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    {
      title: '任职日期',
      dataIndex: 'hireDate',
      key: 'hireDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>教师管理</h1>
        <Space>
          <Input
            placeholder="搜索教师姓名、邮箱或电话"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          {selectedRowKeys.length > 0 && (
            <Button danger onClick={handleBatchDelete}>
              批量删除 ({selectedRowKeys.length})
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>
            添加教师
          </Button>
        </Space>
      </div>

      <Table
        dataSource={filteredTeachers}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        rowSelection={rowSelection}
      />

      <Modal
        title="教师详情"
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        width={800}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            打印
          </Button>,
          <Button key="close" onClick={() => setIsViewModalOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        <div ref={printRef} style={{ padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>北辰幼儿园教师档案</h1>
            <h2 style={{ fontSize: '18px', margin: 0 }}>{viewingRecord?.name}</h2>
          </div>

          {viewingRecord && (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="姓名">{viewingRecord.name}</Descriptions.Item>
              <Descriptions.Item label="身份证号">{viewingRecord.idCard || '-'}</Descriptions.Item>
              <Descriptions.Item label="分校">{viewingRecord.campus?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="职位">{viewingRecord.position?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="在职状态">
                {viewingRecord.employmentStatus === 'ACTIVE' ? '在职' :
                 viewingRecord.employmentStatus === 'RESIGNED' ? '离职' :
                 viewingRecord.employmentStatus === 'PROBATION' ? '试用期' :
                 viewingRecord.employmentStatus === 'SUSPENDED' ? '停职' : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="性别">{viewingRecord.gender}</Descriptions.Item>
              <Descriptions.Item label="年龄">
                {viewingRecord.birthday ? `${calculateAge(viewingRecord.birthday)} 岁` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="出生日期">
                {viewingRecord.birthday ? dayjs(viewingRecord.birthday).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">{viewingRecord.email}</Descriptions.Item>
              <Descriptions.Item label="电话" span={2}>{viewingRecord.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="任职日期">
                {viewingRecord.hireDate ? dayjs(viewingRecord.hireDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="离职日期">
                {viewingRecord.resignationDate ? dayjs(viewingRecord.resignationDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
            </Descriptions>
          )}

          <div style={{ marginTop: '40px', textAlign: 'right', fontSize: '12px', color: '#666' }}>
            <p>打印时间: {dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
          </div>
        </div>
      </Modal>

      <Modal
        title={editingId ? '编辑教师' : '添加教师'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingId(null);
          setAge(null);
        }}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="教师姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="campusId" label="所属分校" rules={[{ required: true, message: '请选择分校' }]}>
            <Select placeholder="请选择分校">
              {campusData?.map((campus: any) => (
                <Select.Option key={campus.id} value={campus.id}>
                  {campus.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="positionId" label="职位" rules={[{ required: true, message: '请选择职位' }]}>
            <Select placeholder="请选择职位">
              {positionsData?.map((position: any) => (
                <Select.Option key={position.id} value={position.id}>
                  {position.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="employmentStatus" label="在职状态" rules={[{ required: true, message: '请选择在职状态' }]}>
            <Select placeholder="请选择在职状态">
              <Select.Option value="ACTIVE">在职</Select.Option>
              <Select.Option value="PROBATION">试用期</Select.Option>
              <Select.Option value="SUSPENDED">停职</Select.Option>
              <Select.Option value="RESIGNED">离职</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="idCard"
            label="身份证号"
            rules={[
              { required: true, message: '请输入身份证号' },
              { len: 18, message: '身份证号必须为18位' }
            ]}
          >
            <Input onChange={handleIdCardChange} maxLength={18} placeholder="输入身份证号自动填充生日和性别" />
          </Form.Item>
          <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
            <Select disabled>
              <Select.Option value="男">男</Select.Option>
              <Select.Option value="女">女</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="birthday" label="出生日期">
            <DatePicker
              style={{ width: '100%' }}
              disabled
              onChange={(date) => {
                if (date) {
                  setAge(calculateAge(date));
                } else {
                  setAge(null);
                }
              }}
            />
          </Form.Item>
          {age !== null && (
            <div style={{ marginBottom: 16, color: '#1890ff', fontSize: 14 }}>
              年龄: {age} 岁
            </div>
          )}
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          <Form.Item name="hireDate" label="任职日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="resignationDate" label="离职日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          {!editingId && (
            <div style={{ marginBottom: 16, color: '#666', fontSize: 12 }}>
              * 默认密码：123456，请提醒教师登录后修改密码
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}
