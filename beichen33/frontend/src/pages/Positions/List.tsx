import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, Tree, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const POSITION_TYPES = [
  { value: 'PRINCIPAL', label: '园长' },
  { value: 'VICE_PRINCIPAL', label: '副园长' },
  { value: 'DIRECTOR', label: '主任' },
  { value: 'FINANCE', label: '财务' },
  { value: 'TEACHER', label: '教师' },
  { value: 'NURSERY_TEACHER', label: '保育老师' },
  { value: 'LOGISTICS', label: '后勤' },
  { value: 'FRONTLINE', label: '前台' },
  { value: 'OTHER', label: '其他' },
];

export default function PositionsList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<any>(null);
  const [showHierarchy, setShowHierarchy] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: positions, isLoading } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const res = await api.get('/positions');
      return res || [];
    },
  });

  const { data: hierarchy } = useQuery({
    queryKey: ['positions-hierarchy'],
    queryFn: async () => {
      const res = await api.get('/positions/hierarchy');
      return res || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/positions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['positions-hierarchy'] });
      message.success('创建成功');
      setIsModalOpen(false);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/positions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['positions-hierarchy'] });
      message.success('更新成功');
      setIsModalOpen(false);
      setEditingPosition(null);
      form.resetFields();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/positions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['positions-hierarchy'] });
      message.success('删除成功');
    },
  });

  const handleSubmit = (values: any) => {
    if (editingPosition) {
      updateMutation.mutate({ id: editingPosition.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (position: any) => {
    setEditingPosition(position);
    form.setFieldsValue(position);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确定删除此职位吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const buildTreeData = (items: any[]): any[] => {
    return items.map(item => ({
      title: (
        <Space>
          <Tag color="blue">{POSITION_TYPES.find(t => t.value === item.type)?.label || item.type}</Tag>
          <span>{item.name}</span>
          <Tag>{item._count?.users || 0} 人</Tag>
        </Space>
      ),
      key: item.id,
      children: item.children?.length > 0 ? buildTreeData(item.children) : undefined,
    }));
  };

  // Create a unique flat list for table view
  const getUniquePositions = (positions: any[]): any[] => {
    const seen = new Set();
    const result: any[] = [];

    const addPosition = (pos: any) => {
      if (!seen.has(pos.id)) {
        seen.add(pos.id);
        result.push(pos);
      }
    };

    positions?.forEach(pos => addPosition(pos));
    return result;
  };

  const uniquePositions = getUniquePositions(positions || []);

  const columns = [
    { title: '职位名称', dataIndex: 'name', key: 'name' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{POSITION_TYPES.find(t => t.value === type)?.label || type}</Tag>,
    },
    { title: '级别', dataIndex: 'level', key: 'level' },
    {
      title: '上级职位',
      dataIndex: 'parent',
      key: 'parent',
      render: (parent: any) => parent?.name || '-',
    },
    {
      title: '人数',
      dataIndex: '_count',
      key: 'users',
      render: (count: any) => count?.users || 0,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>职位管理</h2>
        <Space>
          <Button
            icon={<ApartmentOutlined />}
            onClick={() => setShowHierarchy(!showHierarchy)}
          >
            {showHierarchy ? '列表视图' : '组织架构图'}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingPosition(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            添加职位
          </Button>
        </Space>
      </div>

      {showHierarchy ? (
        <Tree
          showLine
          defaultExpandAll
          treeData={buildTreeData(hierarchy || [])}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={uniquePositions}
          loading={isLoading}
          rowKey="id"
        />
      )}

      <Modal
        title={editingPosition ? '编辑职位' : '创建职位'}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingPosition(null);
          form.resetFields();
        }}
        okText="确定"
        cancelText="取消"
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okButtonProps={{ disabled: createMutation.isPending || updateMutation.isPending }}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="职位名称" rules={[{ required: true, message: '请输入职位名称' }]}>
            <Input placeholder="例如：大班班主任" />
          </Form.Item>
          <Form.Item name="type" label="职位类型" rules={[{ required: true, message: '请选择职位类型' }]}>
            <Select options={POSITION_TYPES} placeholder="请选择" />
          </Form.Item>
          <Form.Item name="level" label="职位级别" rules={[{ required: true, message: '请输入职位级别' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="数字越小级别越高" />
          </Form.Item>
          <Form.Item name="parentId" label="上级职位">
            <Select
              allowClear
              placeholder="选择上级职位（可选）"
              options={positions?.map((p: any) => ({ label: p.name, value: p.id }))}
            />
          </Form.Item>
          <Form.Item name="description" label="职位描述">
            <Input.TextArea rows={3} placeholder="输入职位描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
