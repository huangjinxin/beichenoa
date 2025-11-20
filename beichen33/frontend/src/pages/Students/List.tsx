import { useState, useRef } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, message, Descriptions, Card, Tabs, Tag, Radio } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, PrinterOutlined, SearchOutlined, BankOutlined } from '@ant-design/icons';
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
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState('');
  const [searchMode, setSearchMode] = useState<'global' | 'campus' | 'class'>('global');
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

  const { data: allClassesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll(),
  });

  // 根据选中的分校过滤班级（用于表单）
  const { data: classesData } = useQuery({
    queryKey: ['classes', selectedCampus],
    queryFn: async () => {
      const result = await classApi.getAll();
      if (selectedCampus && selectedCampus !== 'all' && result) {
        return result.filter((cls: any) => cls.campusId === selectedCampus || cls.campus?.id === selectedCampus);
      }
      return result;
    },
  });

  // 先按分校筛选，再按班级筛选，最后按搜索文本筛选
  const filteredStudents = studentsData?.data?.filter((student: any) => {
    // 分校筛选
    if (selectedCampus !== 'all') {
      const studentCampusId = student.class?.campusId || student.class?.campus?.id;
      if (studentCampusId !== selectedCampus) return false;
    }

    // 班级筛选（如果选择了班级）
    if (selectedClass) {
      if (student.class?.id !== selectedClass) return false;
    }

    // 搜索文本筛选
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.idCard?.toLowerCase().includes(searchLower) ||
      student.class?.name?.toLowerCase().includes(searchLower)
    );
  }) || [];

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
    const campusId = record.class?.campusId || record.class?.campus?.id;
    setSelectedCampus(campusId || 'all');
    form.setFieldsValue({
      ...record,
      classId: record.class?.id,
      campusId: campusId,
      birthday: dayjs(record.birthday),
      enrollDate: dayjs(record.enrollDate)
    });
    setIsModalOpen(true);
  };

  const handleCampusChangeInForm = (campusId: string | undefined) => {
    // 用于表单中的分校选择
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
      message.warning('请选择要删除的学生');
      return;
    }
    Modal.confirm({
      title: `确定删除 ${selectedRowKeys.length} 名学生？`,
      content: '此操作无法撤销',
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map(id => studentApi.delete(id)));
          queryClient.invalidateQueries({ queryKey: ['students'] });
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

  // 构建选项卡数据
  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          <BankOutlined /> 全部
          <Tag color="blue" style={{ marginLeft: 8 }}>{studentsData?.data?.length || 0}</Tag>
        </span>
      ),
    },
    ...(campusData?.map((campus: any) => {
      const campusStudents = studentsData?.data?.filter((s: any) => {
        const studentCampusId = s.class?.campusId || s.class?.campus?.id;
        return studentCampusId === campus.id;
      }) || [];
      return {
        key: campus.id,
        label: (
          <span>
            {campus.name}
            <Tag color="green" style={{ marginLeft: 8 }}>{campusStudents.length}</Tag>
          </span>
        ),
      };
    }) || []),
  ];

  // 当前分校下的班级列表（用于筛选）
  const currentCampusClasses = allClassesData?.filter((cls: any) => {
    if (selectedCampus === 'all') return true;
    return cls.campusId === selectedCampus || cls.campus?.id === selectedCampus;
  }) || [];

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '身份证号', dataIndex: 'idCard', key: 'idCard' },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => gender === 'Male' ? '男' : '女'
    },
    {
      title: '年龄',
      key: 'age',
      render: (_: any, record: any) => {
        const age = dayjs().diff(dayjs(record.birthday), 'year');
        return age;
      },
    },
    {
      title: '班级',
      dataIndex: ['class', 'name'],
      key: 'class'
    },
    {
      title: '分校',
      key: 'campus',
      render: (_: any, record: any) => record.class?.campus?.name || '-'
    },
    {
      title: '入园日期',
      dataIndex: 'enrollDate',
      key: 'enrollDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '操作',
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
              批量删除 ({selectedRowKeys.length})
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingId(null);
            form.resetFields();
            if (selectedCampus !== 'all') {
              form.setFieldsValue({ campusId: selectedCampus });
            }
            setIsModalOpen(true);
          }}>
            {t('students.add')}
          </Button>
        </Space>
      </div>

      <Card>
        <Tabs
          activeKey={selectedCampus}
          onChange={(key) => {
            setSelectedCampus(key);
            setSelectedClass(undefined);
            setSelectedRowKeys([]);
          }}
          items={tabItems}
        />

        {/* 搜索区域 */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Radio.Group value={searchMode} onChange={(e) => {
            setSearchMode(e.target.value);
            if (e.target.value !== 'class') {
              setSelectedClass(undefined);
            }
          }} size="small">
            <Radio.Button value="global">全局搜索</Radio.Button>
            <Radio.Button value="campus">当前分校</Radio.Button>
            <Radio.Button value="class">按班级</Radio.Button>
          </Radio.Group>

          {searchMode === 'class' && (
            <Select
              placeholder="选择班级"
              style={{ width: 150 }}
              allowClear
              value={selectedClass}
              onChange={setSelectedClass}
              options={currentCampusClasses.map((cls: any) => ({
                label: cls.name,
                value: cls.id,
              }))}
            />
          )}

          <Input
            placeholder={
              searchMode === 'global' ? "搜索姓名、身份证号、班级" :
              searchMode === 'campus' ? `在${selectedCampus === 'all' ? '全部' : campusData?.find((c: any) => c.id === selectedCampus)?.name || ''}中搜索` :
              "搜索姓名、身份证号"
            }
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />

          <span style={{ color: '#666', fontSize: 12 }}>
            共 {filteredStudents.length} 人
          </span>
        </div>

        <Table
          dataSource={filteredStudents}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          rowSelection={rowSelection}
        />
      </Card>

      <Modal
        title={editingId ? t('students.edit') : t('students.add')}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingId(null);
        }}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label={t('students.studentName')} rules={[{ required: true }]}>
            <Input />
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
              onChange={handleCampusChangeInForm}
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
            rules={[{ required: true, message: '请选择班级' }]}
          >
            <Select
              placeholder="请选择班级"
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
            <Descriptions.Item label="所在班级">
              {viewingStudent?.class?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="所在分校">
              {viewingStudent?.class?.campus?.name || '-'}
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
