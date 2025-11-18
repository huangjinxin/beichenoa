import { useState, useRef } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, message, Descriptions } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { studentApi, classApi, campusApi } from '../../services/api';
import dayjs from 'dayjs';

const parseIdCard = (idCard: string) => {
  if (!idCard || idCard.length !== 18) {
    return null;
  }

  const year = idCard.substring(6, 10);
  const month = idCard.substring(10, 12);
  const day = idCard.substring(12, 14);
  const genderCode = parseInt(idCard.substring(16, 17));

  const birthday = dayjs(`${year}-${month}-${day}`);
  const gender = genderCode % 2 === 0 ? 'Female' : 'Male';

  return {
    birthday,
    gender,
  };
};

export default function StudentList() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingStudent, setViewingStudent] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<string | undefined>(undefined);
  const printRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentApi.getAll(),
  });

  const { data: campusData } = useQuery({
    queryKey: ['campus'],
    queryFn: campusApi.getAll,
  });

  // 根据选中的分校过滤班级
  const { data: classesData } = useQuery({
    queryKey: ['classes', selectedCampus],
    queryFn: async () => {
      const result = await classApi.getAll();
      // 如果选择了分校，过滤班级
      if (selectedCampus && result) {
        return result.filter((cls: any) => cls.campusId === selectedCampus);
      }
      return result;
    },
  });

  const createMutation = useMutation({
    mutationFn: studentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => studentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      message.success(t('messages.saveSuccess'));
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: studentApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      message.success(t('messages.deleteSuccess'));
    },
  });

  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idCard = e.target.value.trim();
    const parsed = parseIdCard(idCard);

    if (parsed) {
      form.setFieldsValue({
        birthday: parsed.birthday,
        gender: parsed.gender,
      });
    }
  };

  const handleSubmit = (values: any) => {
    const data = {
      ...values,
      birthday: values.birthday.toISOString(),
      enrollDate: values.enrollDate.toISOString()
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    // 设置选中的分校，以便过滤班级列表
    setSelectedCampus(record.class?.campusId || record.campus?.id);
    form.setFieldsValue({
      ...record,
      classId: record.class?.id,
      campusId: record.class?.campusId || record.campus?.id,
      birthday: dayjs(record.birthday),
      enrollDate: dayjs(record.enrollDate)
    });
    setIsModalOpen(true);
  };

  // 处理分校选择变化
  const handleCampusChange = (campusId: string | undefined) => {
    setSelectedCampus(campusId);
    // 清空班级选择
    form.setFieldsValue({ classId: undefined });
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: t('messages.deleteConfirm'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleView = (student: any) => {
    setViewingStudent(student);
    setIsViewModalOpen(true);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Student_${viewingStudent?.name || 'Print'}`,
  });

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select students to delete');
      return;
    }
    Modal.confirm({
      title: `Delete ${selectedRowKeys.length} students?`,
      content: 'This action cannot be undone',
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map(id => studentApi.delete(id)));
          queryClient.invalidateQueries({ queryKey: ['students'] });
          message.success('Batch delete successful');
          setSelectedRowKeys([]);
        } catch (error) {
          message.error('Batch delete failed');
        }
      },
    });
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: any) => setSelectedRowKeys(keys),
  };

  const columns = [
    { title: t('students.studentName'), dataIndex: 'name', key: 'name' },
    { title: 'ID Card', dataIndex: 'idCard', key: 'idCard' },
    { title: t('students.className'), dataIndex: ['class', 'name'], key: 'class' },
    {
      title: 'Age',
      key: 'age',
      render: (_: any, record: any) => {
        const age = dayjs().diff(dayjs(record.birthday), 'year');
        return age;
      },
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
        <h1>{t('students.title')}</h1>
        <Space>
          {selectedRowKeys.length > 0 && (
            <Button danger onClick={handleBatchDelete}>
              Batch Delete ({selectedRowKeys.length})
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setIsModalOpen(true);
            setSelectedCampus(undefined);
          }}>
            {t('students.add')}
          </Button>
        </Space>
      </div>

      <Table
        dataSource={studentsData?.data || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        rowSelection={rowSelection}
      />

      <Modal
        title={editingId ? t('students.edit') : t('students.add')}
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
          <Form.Item name="name" label={t('students.studentName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="idCard"
            label="ID Card"
            rules={[
              { required: true, message: 'Please input ID card number' },
              { len: 18, message: 'ID card must be 18 digits' }
            ]}
          >
            <Input onChange={handleIdCardChange} maxLength={18} />
          </Form.Item>
          <Form.Item name="gender" label={t('students.gender')} rules={[{ required: true }]}>
            <Select disabled>
              <Select.Option value="Male">{t('students.male')}</Select.Option>
              <Select.Option value="Female">{t('students.female')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="birthday" label={t('students.birthDate')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} disabled />
          </Form.Item>
          <Form.Item name="enrollDate" label={t('students.enrollmentDate')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="campusId" label="所属分校" rules={[{ required: true, message: '请先选择分校' }]}>
            <Select
              placeholder="请先选择分校"
              onChange={handleCampusChange}
              allowClear
            >
              {campusData?.map((campus: any) => (
                <Select.Option key={campus.id} value={campus.id}>{campus.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="classId"
            label={t('students.className')}
            rules={[{ required: true, message: '请先选择分校，再选择班级' }]}
          >
            <Select
              placeholder={selectedCampus ? "请选择班级" : "请先选择分校"}
              disabled={!selectedCampus}
            >
              {classesData?.map((c: any) => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="address" label={t('students.address')}>
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="学生详情"
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
            <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>北辰幼儿园学生档案</h1>
            <h2 style={{ fontSize: '18px', margin: 0 }}>{viewingStudent?.name}</h2>
          </div>

          <Descriptions bordered column={2}>
            <Descriptions.Item label="姓名">{viewingStudent?.name}</Descriptions.Item>
            <Descriptions.Item label="身份证号">{viewingStudent?.idCard}</Descriptions.Item>
            <Descriptions.Item label="性别">
              {viewingStudent?.gender === 'Male' ? '男' : '女'}
            </Descriptions.Item>
            <Descriptions.Item label="年龄">
              {viewingStudent?.birthday && dayjs().diff(dayjs(viewingStudent.birthday), 'year')} 岁
            </Descriptions.Item>
            <Descriptions.Item label="出生日期">
              {viewingStudent?.birthday && dayjs(viewingStudent.birthday).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="入园日期">
              {viewingStudent?.enrollDate && dayjs(viewingStudent.enrollDate).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="所在班级" span={2}>
              {viewingStudent?.class?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="家庭住址" span={2}>
              {viewingStudent?.address || '-'}
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
