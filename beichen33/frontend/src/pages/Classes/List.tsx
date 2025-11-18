import { useState, useRef } from 'react';
import { Table, Button, Space, Card, Modal, Form, Input, InputNumber, Select, message, Descriptions } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { classApi, userApi, campusApi } from '../../services/api';
import dayjs from 'dayjs';

export default function ClassList() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingClass, setViewingClass] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<string | undefined>(undefined);
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

  // 根据选中的分校过滤教师
  const { data: teachersData } = useQuery({
    queryKey: ['teachers', selectedCampus],
    queryFn: async () => {
      const result = await userApi.getAll({ role: 'TEACHER' });
      if (!result?.data) return [];

      // 如果选择了分校，过滤该分校的教师
      if (selectedCampus) {
        return result.data.filter((teacher: any) =>
          teacher.campusId === selectedCampus || teacher.campus?.id === selectedCampus
        );
      }

      // 如果没有选择分校，返回所有教师（包括未分配学校的）
      return result.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: classApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => classApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: classApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      message.success(t('messages.deleteSuccess'));
    },
  });

  const handleSubmit = (values: any) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    // 设置选中的分校，以便过滤教师列表
    setSelectedCampus(record.campusId || record.campus?.id);
    form.setFieldsValue({
      ...record,
      campusId: record.campusId || record.campus?.id,
      teacherIds: record.teachers?.map((t: any) => t.id) || [],
    });
    setIsModalOpen(true);
  };

  // 处理分校选择变化
  const handleCampusChange = (campusId: string | undefined) => {
    setSelectedCampus(campusId);
    // 清空教师选择
    form.setFieldsValue({ teacherIds: [] });
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: t('messages.deleteConfirm'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: () => deleteMutation.mutate(id),
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
      content: '此操作无法撤销',
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map(id => classApi.delete(id)));
          queryClient.invalidateQueries({ queryKey: ['classes'] });
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
    { title: t('classes.className'), dataIndex: 'name', key: 'name' },
    {
      title: '所属分校',
      dataIndex: ['campus', 'name'],
      key: 'campus',
      render: (campusName: string) => campusName || '-'
    },
    { title: t('classes.grade'), dataIndex: 'grade', key: 'grade' },
    {
      title: '任课老师',
      dataIndex: 'teachers',
      key: 'teachers',
      render: (teachers: any[]) => teachers?.map(t => t.name).join('、') || '-'
    },
    { title: t('classes.capacity'), dataIndex: 'capacity', key: 'capacity' },
    {
      title: t('classes.currentStudents'),
      dataIndex: ['_count', 'students'],
      key: 'studentCount',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>{t('classes.title')}</h1>
        <Space>
          {selectedRowKeys.length > 0 && (
            <Button danger onClick={handleBatchDelete}>
              批量删除 ({selectedRowKeys.length})
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setIsModalOpen(true);
            setSelectedCampus(undefined);
          }}>
            {t('classes.add')}
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          dataSource={classes || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          rowSelection={rowSelection}
        />
      </Card>

      <Modal
        title={editingId ? t('classes.edit') : t('classes.add')}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingId(null);
          setSelectedCampus(undefined);
        }}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label={t('classes.className')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="campusId" label="所属分校" rules={[{ required: true, message: '请选择所属分校' }]}>
            <Select
              placeholder="请选择分校（选择后教师列表会自动筛选）"
              onChange={handleCampusChange}
              allowClear
            >
              {campusData?.map((campus: any) => (
                <Select.Option key={campus.id} value={campus.id}>{campus.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="grade" label={t('classes.grade')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="teacherIds"
            label="任课老师"
            rules={[{ required: true, message: '请至少选择一位任课老师' }]}
            help={selectedCampus
              ? `已筛选该分校的教师（共${teachersData?.length || 0}位）`
              : "选择分校后会自动筛选该分校的教师"}
          >
            <Select
              mode="multiple"
              placeholder={selectedCampus
                ? `请选择任课老师（可多选，共${teachersData?.length || 0}位可选）`
                : "请先选择分校"}
              disabled={!selectedCampus}
              options={teachersData?.map((teacher: any) => ({
                label: `${teacher.name}${teacher.campus ? ` (${teacher.campus.name})` : ' (未分配学校)'}`,
                value: teacher.id,
              })) || []}
              maxTagCount="responsive"
            />
          </Form.Item>
          <Form.Item name="capacity" label={t('classes.capacity')} rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

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
            <Descriptions.Item label="年级">{viewingClass?.grade}</Descriptions.Item>
            <Descriptions.Item label="任课老师" span={2}>
              {viewingClass?.teachers?.map((t: any) => t.name).join('、') || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="班级容量">{viewingClass?.capacity}</Descriptions.Item>
            <Descriptions.Item label="当前学生数">
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
