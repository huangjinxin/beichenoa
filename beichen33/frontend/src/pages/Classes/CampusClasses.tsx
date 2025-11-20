import { useState, useRef } from 'react';
import { Table, Button, Space, Card, Modal, Form, Input, InputNumber, Select, message, Descriptions, Tabs, Tag, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, PrinterOutlined, BankOutlined, SettingOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { classApi, userApi, campusApi } from '../../services/api';
import dayjs from 'dayjs';

export default function CampusClasses() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [campusForm] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCampusId, setEditingCampusId] = useState<string | null>(null);
  const [viewingClass, setViewingClass] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: classApi.getAll,
  });

  const { data: campusData } = useQuery({
    queryKey: ['campus'],
    queryFn: campusApi.getAll,
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers', selectedCampus],
    queryFn: async () => {
      const result = await userApi.getAll({ role: 'TEACHER' });
      if (!result?.data) return [];
      if (selectedCampus && selectedCampus !== 'all') {
        return result.data.filter((teacher: any) =>
          teacher.campusId === selectedCampus || teacher.campus?.id === selectedCampus
        );
      }
      return result.data;
    },
  });

  // 按分校筛选班级
  const filteredClasses = classes?.filter((cls: any) => {
    if (selectedCampus === 'all') return true;
    return cls.campusId === selectedCampus || cls.campus?.id === selectedCampus;
  }) || [];

  // 班级操作
  const createMutation = useMutation({
    mutationFn: classApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      message.success('创建成功');
      setIsModalOpen(false);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => classApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      message.success('更新成功');
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: classApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      message.success('删除成功');
    },
  });

  // 分校操作
  const createCampusMutation = useMutation({
    mutationFn: campusApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campus'] });
      message.success('创建成功');
      setIsCampusModalOpen(false);
      campusForm.resetFields();
    },
  });

  const updateCampusMutation = useMutation({
    mutationFn: ({ id, data }: any) => campusApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campus'] });
      message.success('更新成功');
      setIsCampusModalOpen(false);
      campusForm.resetFields();
      setEditingCampusId(null);
    },
  });

  const deleteCampusMutation = useMutation({
    mutationFn: campusApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campus'] });
      message.success('删除成功');
      if (selectedCampus !== 'all') {
        setSelectedCampus('all');
      }
    },
  });

  const handleSubmit = (values: any) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleCampusSubmit = (values: any) => {
    if (editingCampusId) {
      updateCampusMutation.mutate({ id: editingCampusId, data: values });
    } else {
      createCampusMutation.mutate(values);
    }
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      campusId: record.campusId || record.campus?.id,
      teacherIds: record.teachers?.map((t: any) => t.id) || [],
    });
    setIsModalOpen(true);
  };

  const handleEditCampus = (campus: any) => {
    setEditingCampusId(campus.id);
    campusForm.setFieldsValue({
      name: campus.name,
      address: campus.address,
      phone: campus.phone,
      principalId: campus.principal?.id,
    });
    setIsCampusModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确定删除此班级？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleDeleteCampus = (id: string) => {
    Modal.confirm({
      title: '确定删除此分校？',
      content: '删除分校会影响该分校下的班级和教师',
      okText: '确定',
      cancelText: '取消',
      onOk: () => deleteCampusMutation.mutate(id),
    });
  };

  const handleView = (classRecord: any) => {
    setViewingClass(classRecord);
    setIsViewModalOpen(true);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Class_${viewingClass?.name || 'Print'}`,
  });

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的班级');
      return;
    }
    Modal.confirm({
      title: `确定删除 ${selectedRowKeys.length} 个班级？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map(id => classApi.delete(id)));
          queryClient.invalidateQueries({ queryKey: ['classes'] });
          message.success('批量删除成功');
          setSelectedRowKeys([]);
        } catch {
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
    { title: '班级名称', dataIndex: 'name', key: 'name' },
    { title: '年级', dataIndex: 'grade', key: 'grade' },
    {
      title: '任课老师',
      dataIndex: 'teachers',
      key: 'teachers',
      render: (teachers: any[]) => teachers?.map(t => t.name).join('、') || '-'
    },
    { title: '容量', dataIndex: 'capacity', key: 'capacity' },
    {
      title: '学生数',
      dataIndex: ['_count', 'students'],
      key: 'studentCount',
      render: (count: number, record: any) => (
        <Badge
          count={count || 0}
          showZero
          color={count >= record.capacity ? 'red' : 'blue'}
        />
      ),
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

  // 构建选项卡数据
  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          <BankOutlined /> 全部
          <Tag color="blue" style={{ marginLeft: 8 }}>{classes?.length || 0}</Tag>
        </span>
      ),
    },
    ...(campusData?.map((campus: any) => {
      const campusClasses = classes?.filter((c: any) =>
        c.campusId === campus.id || c.campus?.id === campus.id
      ) || [];
      return {
        key: campus.id,
        label: (
          <span>
            {campus.name}
            <Tag color="green" style={{ marginLeft: 8 }}>{campusClasses.length}</Tag>
          </span>
        ),
      };
    }) || []),
  ];

  // 当前选中的分校信息
  const currentCampus = campusData?.find((c: any) => c.id === selectedCampus);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>班级与分校管理</h1>
        <Space>
          {selectedRowKeys.length > 0 && (
            <Button danger onClick={handleBatchDelete}>
              批量删除 ({selectedRowKeys.length})
            </Button>
          )}
          <Button icon={<SettingOutlined />} onClick={() => {
            setEditingCampusId(null);
            campusForm.resetFields();
            setIsCampusModalOpen(true);
          }}>
            管理分校
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingId(null);
            form.resetFields();
            if (selectedCampus !== 'all') {
              form.setFieldsValue({ campusId: selectedCampus });
            }
            setIsModalOpen(true);
          }}>
            添加班级
          </Button>
        </Space>
      </div>

      <Card>
        <Tabs
          activeKey={selectedCampus}
          onChange={setSelectedCampus}
          items={tabItems}
          tabBarExtraContent={
            currentCampus && (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => handleEditCampus(currentCampus)}>
                  编辑分校
                </Button>
                <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDeleteCampus(currentCampus.id)}>
                  删除分校
                </Button>
              </Space>
            )
          }
        />

        {currentCampus && (
          <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
            <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
              <span><strong>地址：</strong>{currentCampus.address || '-'}</span>
              <span><strong>电话：</strong>{currentCampus.phone || '-'}</span>
              <span><strong>负责人：</strong>{currentCampus.principal?.name || '-'}</span>
            </Space>
          </Card>
        )}

        <Table
          dataSource={filteredClasses}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          rowSelection={rowSelection}
        />
      </Card>

      {/* 班级表单弹窗 */}
      <Modal
        title={editingId ? '编辑班级' : '添加班级'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingId(null);
        }}
        okText="确定"
        cancelText="取消"
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="班级名称" rules={[{ required: true }]}>
            <Input placeholder="例如：大一班" />
          </Form.Item>
          <Form.Item name="campusId" label="所属分校" rules={[{ required: true, message: '请选择所属分校' }]}>
            <Select placeholder="请选择分校">
              {campusData?.map((campus: any) => (
                <Select.Option key={campus.id} value={campus.id}>{campus.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="grade" label="年级" rules={[{ required: true }]}>
            <Input placeholder="例如：大班、中班、小班" />
          </Form.Item>
          <Form.Item name="teacherIds" label="任课老师">
            <Select
              mode="multiple"
              placeholder="选择任课老师（可多选）"
              options={teachersData?.map((teacher: any) => ({
                label: `${teacher.name}${teacher.campus ? ` (${teacher.campus.name})` : ''}`,
                value: teacher.id,
              })) || []}
              maxTagCount="responsive"
            />
          </Form.Item>
          <Form.Item name="capacity" label="班级容量" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="最大学生数" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 分校表单弹窗 */}
      <Modal
        title={editingCampusId ? '编辑分校' : '添加分校'}
        open={isCampusModalOpen}
        onCancel={() => {
          setIsCampusModalOpen(false);
          campusForm.resetFields();
          setEditingCampusId(null);
        }}
        okText="确定"
        cancelText="取消"
        onOk={() => campusForm.submit()}
        confirmLoading={createCampusMutation.isPending || updateCampusMutation.isPending}
      >
        <Form form={campusForm} onFinish={handleCampusSubmit} layout="vertical">
          <Form.Item name="name" label="分校名称" rules={[{ required: true, message: '请输入分校名称' }]}>
            <Input placeholder="请输入分校名称" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input.TextArea rows={2} placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="principalId" label="负责人">
            <Select
              allowClear
              showSearch
              placeholder="请选择负责人"
              optionFilterProp="label"
              options={teachersData?.map((teacher: any) => ({
                label: `${teacher.name} (${teacher.email || ''})`,
                value: teacher.id,
              })) || []}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 班级详情弹窗 */}
      <Modal
        title="班级详情"
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
            <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>北辰幼儿园班级信息</h1>
            <h2 style={{ fontSize: '18px', margin: 0 }}>{viewingClass?.name}</h2>
          </div>

          <Descriptions bordered column={2}>
            <Descriptions.Item label="班级名称">{viewingClass?.name}</Descriptions.Item>
            <Descriptions.Item label="所属分校">{viewingClass?.campus?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="年级">{viewingClass?.grade}</Descriptions.Item>
            <Descriptions.Item label="班级容量">{viewingClass?.capacity}</Descriptions.Item>
            <Descriptions.Item label="任课老师" span={2}>
              {viewingClass?.teachers?.map((t: any) => t.name).join('、') || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="当前学生数" span={2}>
              {viewingClass?._count?.students || 0}
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: '40px', textAlign: 'right', fontSize: '12px', color: '#666' }}>
            <p>打印时间: {dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
