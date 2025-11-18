import { useState } from 'react';
import { Card, Button, Space, Input, Select, InputNumber, Switch, Modal, Form, List } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'radio' | 'checkbox' | 'select' | 'date' | 'datetime' | 'teacher_select' | 'approval';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: Array<{ label: string; value: string }>;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

interface FormDesignerProps {
  value?: FormField[];
  onChange?: (fields: FormField[]) => void;
}

export default function FormDesigner({ value = [], onChange }: FormDesignerProps) {
  const [fields, setFields] = useState<FormField[]>(value);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [form] = Form.useForm();

  const handleFieldsChange = (newFields: FormField[]) => {
    setFields(newFields);
    onChange?.(newFields);
  };

  const handleAddField = () => {
    setEditingField(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
    form.setFieldsValue(field);
    setIsModalOpen(true);
  };

  const handleDeleteField = (id: string) => {
    handleFieldsChange(fields.filter(f => f.id !== id));
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < fields.length) {
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
      handleFieldsChange(newFields);
    }
  };

  const handleSaveField = (values: any) => {
    const fieldData: FormField = {
      id: editingField?.id || `field_${Date.now()}`,
      type: values.type,
      label: values.label,
      placeholder: values.placeholder,
      required: values.required || false,
      options: values.options,
      defaultValue: values.defaultValue,
      validation: values.validation,
    };

    if (editingField) {
      handleFieldsChange(fields.map(f => f.id === editingField.id ? fieldData : f));
    } else {
      handleFieldsChange([...fields, fieldData]);
    }

    setIsModalOpen(false);
    form.resetFields();
  };

  const fieldTypeOptions = [
    { label: '单行文本', value: 'text' },
    { label: '多行文本', value: 'textarea' },
    { label: '数字', value: 'number' },
    { label: '单选框', value: 'radio' },
    { label: '多选框', value: 'checkbox' },
    { label: '下拉选择', value: 'select' },
    { label: '日期', value: 'date' },
    { label: '日期时间', value: 'datetime' },
  ];

  const [selectedType, setSelectedType] = useState<string>('text');

  const needsOptions = ['radio', 'checkbox', 'select'].includes(selectedType);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="dashed" block icon={<PlusOutlined />} onClick={handleAddField}>
          添加表单字段
        </Button>
      </div>

      <List
        dataSource={fields}
        renderItem={(field, index) => (
          <Card
            size="small"
            style={{ marginBottom: 8 }}
            title={
              <Space>
                <span>{field.label}</span>
                {field.required && <span style={{ color: 'red' }}>*</span>}
                <span style={{ color: '#999', fontSize: 12 }}>
                  ({fieldTypeOptions.find(t => t.value === field.type)?.label})
                </span>
              </Space>
            }
            extra={
              <Space>
                <Button
                  size="small"
                  icon={<ArrowUpOutlined />}
                  disabled={index === 0}
                  onClick={() => handleMoveField(index, 'up')}
                />
                <Button
                  size="small"
                  icon={<ArrowDownOutlined />}
                  disabled={index === fields.length - 1}
                  onClick={() => handleMoveField(index, 'down')}
                />
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEditField(field)}
                />
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteField(field.id)}
                />
              </Space>
            }
          >
            {field.placeholder && <div>提示文字: {field.placeholder}</div>}
            {field.options && field.options.length > 0 && (
              <div>选项: {field.options.map(o => o.label).join(', ')}</div>
            )}
          </Card>
        )}
      />

      <Modal
        title={editingField ? '编辑字段' : '添加字段'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveField}>
          <Form.Item name="type" label="字段类型" rules={[{ required: true }]} initialValue="text">
            <Select options={fieldTypeOptions} onChange={setSelectedType} />
          </Form.Item>

          <Form.Item name="label" label="字段标签" rules={[{ required: true }]}>
            <Input placeholder="请输入字段标签" />
          </Form.Item>

          <Form.Item name="placeholder" label="提示文字">
            <Input placeholder="请输入提示文字" />
          </Form.Item>

          <Form.Item name="required" label="是否必填" valuePropName="checked">
            <Switch />
          </Form.Item>

          {needsOptions && (
            <Form.Item
              name="options"
              label="选项设置"
              rules={[{ required: true, message: '请至少添加一个选项' }]}
            >
              <Form.List name="options">
                {(subFields, { add, remove }) => (
                  <>
                    {subFields.map((subField) => (
                      <Space key={subField.key} style={{ display: 'flex', marginBottom: 8 }}>
                        <Form.Item
                          {...subField}
                          name={[subField.name, 'label']}
                          rules={[{ required: true, message: '请输入选项文本' }]}
                          noStyle
                        >
                          <Input placeholder="选项文本" style={{ width: 200 }} />
                        </Form.Item>
                        <Form.Item
                          {...subField}
                          name={[subField.name, 'value']}
                          rules={[{ required: true, message: '请输入选项值' }]}
                          noStyle
                        >
                          <Input placeholder="选项值" style={{ width: 200 }} />
                        </Form.Item>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(subField.name)}
                        />
                      </Space>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加选项
                    </Button>
                  </>
                )}
              </Form.List>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
