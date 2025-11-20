import { useState, useEffect } from 'react';
import {
  Card, Button, Space, Input, Select, Switch, Modal, Form,
  Row, Col, Collapse, Tag, Tooltip, Checkbox, Alert, Divider,
  Typography, Empty
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined,
  ArrowUpOutlined, ArrowDownOutlined,
  LinkOutlined, FormOutlined, FileTextOutlined,
  UserOutlined, TeamOutlined, HomeOutlined, BankOutlined
} from '@ant-design/icons';
import { ENTITY_SCHEMAS, REFERENCE_AUTO_FILL_OPTIONS, getRequiredFields } from '../../config/entitySchemas';

const { Text, Title } = Typography;
const { Panel } = Collapse;

// 字段模式类型
export type FieldMode = 'basic' | 'reference' | 'input';

// 表单字段定义
export interface FormField {
  id: string;
  mode: FieldMode;
  label: string;
  required: boolean;

  // 基础字段属性
  type?: 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'select' | 'radio' | 'checkbox';
  placeholder?: string;
  readonly?: boolean;
  options?: Array<{ label: string; value: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };

  // 引用/填写字段属性
  entityType?: 'student' | 'teacher' | 'class' | 'campus';

  // 引用字段 - 自动填充配置
  autoFill?: Array<{ from: string; to: string }>;

  // 填写字段 - 收集的实体字段
  entityFields?: string[];
}

interface FormDesignerProps {
  value?: FormField[];
  onChange?: (fields: FormField[]) => void;
}

// 基础字段类型
const BASIC_FIELD_TYPES = [
  { type: 'text', label: '单行文本', icon: <FileTextOutlined /> },
  { type: 'textarea', label: '多行文本', icon: <FileTextOutlined /> },
  { type: 'number', label: '数字', icon: <FileTextOutlined /> },
  { type: 'date', label: '日期', icon: <FileTextOutlined /> },
  { type: 'select', label: '下拉选择', icon: <FileTextOutlined /> },
  { type: 'radio', label: '单选框', icon: <FileTextOutlined /> },
  { type: 'checkbox', label: '多选框', icon: <FileTextOutlined /> },
];

// 实体类型图标
const ENTITY_ICONS: Record<string, React.ReactNode> = {
  student: <UserOutlined />,
  teacher: <TeamOutlined />,
  class: <HomeOutlined />,
  campus: <BankOutlined />,
};

export default function FormDesigner({ value = [], onChange }: FormDesignerProps) {
  const [fields, setFields] = useState<FormField[]>(value);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [modalMode, setModalMode] = useState<FieldMode>('basic');
  const [form] = Form.useForm();

  useEffect(() => {
    setFields(value);
  }, [value]);

  const handleFieldsChange = (newFields: FormField[]) => {
    setFields(newFields);
    onChange?.(newFields);
  };

  // 添加基础字段
  const handleAddBasicField = (type: string) => {
    setEditingField(null);
    setModalMode('basic');
    form.resetFields();
    form.setFieldsValue({ type, mode: 'basic' });
    setIsModalOpen(true);
  };

  // 添加引用字段
  const handleAddReferenceField = (entityType: string) => {
    setEditingField(null);
    setModalMode('reference');
    form.resetFields();
    const schema = ENTITY_SCHEMAS[entityType];
    form.setFieldsValue({
      mode: 'reference',
      entityType,
      label: `选择${schema?.label || entityType}`,
      required: true,
    });
    setIsModalOpen(true);
  };

  // 添加填写字段
  const handleAddInputField = (entityType: string) => {
    setEditingField(null);
    setModalMode('input');
    form.resetFields();
    const schema = ENTITY_SCHEMAS[entityType];
    const requiredFields = getRequiredFields(entityType);
    form.setFieldsValue({
      mode: 'input',
      entityType,
      label: `${schema?.label || entityType}信息`,
      required: true,
      entityFields: requiredFields,
    });
    setIsModalOpen(true);
  };

  // 编辑字段
  const handleEditField = (field: FormField) => {
    setEditingField(field);
    setModalMode(field.mode);
    form.setFieldsValue({
      ...field,
      fieldId: field.id,
    });
    setIsModalOpen(true);
  };

  // 删除字段
  const handleDeleteField = (id: string) => {
    handleFieldsChange(fields.filter(f => f.id !== id));
  };

  // 移动字段
  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < fields.length) {
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
      handleFieldsChange(newFields);
    }
  };

  // 保存字段
  const handleSaveField = (values: any) => {
    const fieldData: FormField = {
      id: values.fieldId || editingField?.id || `field_${Date.now()}`,
      mode: values.mode || modalMode,
      label: values.label,
      required: values.required || false,
    };

    // 基础字段属性
    if (fieldData.mode === 'basic') {
      fieldData.type = values.type;
      fieldData.placeholder = values.placeholder;
      fieldData.readonly = values.readonly;
      fieldData.options = values.options;
      fieldData.validation = values.validation;
    }

    // 引用字段属性
    if (fieldData.mode === 'reference') {
      fieldData.entityType = values.entityType;
      if (values.autoFillEnabled && values.autoFill?.length > 0) {
        fieldData.autoFill = values.autoFill.filter((m: any) => m.from && m.to);
      }
    }

    // 填写字段属性
    if (fieldData.mode === 'input') {
      fieldData.entityType = values.entityType;
      fieldData.entityFields = values.entityFields || [];
    }

    if (editingField) {
      handleFieldsChange(fields.map(f => f.id === editingField.id ? fieldData : f));
    } else {
      handleFieldsChange([...fields, fieldData]);
    }

    setIsModalOpen(false);
    form.resetFields();
  };

  // 获取字段显示信息
  const getFieldDisplayInfo = (field: FormField) => {
    if (field.mode === 'basic') {
      const typeInfo = BASIC_FIELD_TYPES.find(t => t.type === field.type);
      return {
        icon: <FormOutlined />,
        typeName: typeInfo?.label || field.type,
        color: 'default',
        tags: [],
      };
    }

    if (field.mode === 'reference') {
      const schema = ENTITY_SCHEMAS[field.entityType || ''];
      return {
        icon: ENTITY_ICONS[field.entityType || ''] || <LinkOutlined />,
        typeName: `选择${schema?.label || ''}`,
        color: 'blue',
        tags: field.autoFill?.length ? [<Tag key="af" color="cyan" size="small">自动填充</Tag>] : [],
      };
    }

    if (field.mode === 'input') {
      const schema = ENTITY_SCHEMAS[field.entityType || ''];
      return {
        icon: ENTITY_ICONS[field.entityType || ''] || <PlusOutlined />,
        typeName: `创建${schema?.label || ''}`,
        color: 'green',
        tags: [<Tag key="create" color="green" size="small">新建记录</Tag>],
      };
    }

    return { icon: null, typeName: '', color: 'default', tags: [] };
  };

  // 渲染模态框内容
  const renderModalContent = () => {
    if (modalMode === 'basic') {
      return renderBasicFieldForm();
    }
    if (modalMode === 'reference') {
      return renderReferenceFieldForm();
    }
    if (modalMode === 'input') {
      return renderInputFieldForm();
    }
    return null;
  };

  // 基础字段表单
  const renderBasicFieldForm = () => (
    <>
      <Form.Item name="type" label="字段类型" rules={[{ required: true }]}>
        <Select>
          {BASIC_FIELD_TYPES.map(t => (
            <Select.Option key={t.type} value={t.type}>{t.label}</Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="fieldId" label="字段ID">
        <Input placeholder="如: userName (留空自动生成)" />
      </Form.Item>

      <Form.Item name="label" label="字段标签" rules={[{ required: true }]}>
        <Input placeholder="显示给用户的名称" />
      </Form.Item>

      <Form.Item name="placeholder" label="提示文字">
        <Input placeholder="输入框内的提示" />
      </Form.Item>

      <Space size="large">
        <Form.Item name="required" label="必填" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="readonly" label="只读" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Space>

      <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
        {({ getFieldValue }) => {
          const type = getFieldValue('type');
          if (['select', 'radio', 'checkbox'].includes(type)) {
            return (
              <Form.Item label="选项列表">
                <Form.List name="options">
                  {(subFields, { add, remove }) => (
                    <>
                      {subFields.map((subField) => (
                        <Space key={subField.key} style={{ display: 'flex', marginBottom: 8 }}>
                          <Form.Item {...subField} name={[subField.name, 'label']} noStyle>
                            <Input placeholder="选项文本" style={{ width: 150 }} />
                          </Form.Item>
                          <Form.Item {...subField} name={[subField.name, 'value']} noStyle>
                            <Input placeholder="选项值" style={{ width: 150 }} />
                          </Form.Item>
                          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(subField.name)} />
                        </Space>
                      ))}
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        添加选项
                      </Button>
                    </>
                  )}
                </Form.List>
              </Form.Item>
            );
          }
          return null;
        }}
      </Form.Item>
    </>
  );

  // 引用字段表单
  const renderReferenceFieldForm = () => {
    const entityType = form.getFieldValue('entityType');
    const autoFillOptions = REFERENCE_AUTO_FILL_OPTIONS[entityType] || [];

    return (
      <>
        <Alert
          message="引用字段说明"
          description="从系统现有数据中选择，不会创建新记录。选择后可自动填充相关信息到其他字段。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item name="entityType" label="数据类型" rules={[{ required: true }]}>
          <Select disabled={!!editingField}>
            {Object.entries(ENTITY_SCHEMAS).map(([key, schema]) => (
              <Select.Option key={key} value={key}>
                {schema.icon} {schema.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="fieldId" label="字段ID">
          <Input placeholder="如: studentRef (留空自动生成)" />
        </Form.Item>

        <Form.Item name="label" label="字段标签" rules={[{ required: true }]}>
          <Input placeholder="如: 选择学生" />
        </Form.Item>

        <Form.Item name="required" label="必填" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Divider>自动填充配置 (可选)</Divider>

        <Form.Item name="autoFillEnabled" valuePropName="checked">
          <Switch checkedChildren="启用自动填充" unCheckedChildren="关闭" />
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.autoFillEnabled !== curr.autoFillEnabled}>
          {({ getFieldValue }) =>
            getFieldValue('autoFillEnabled') && (
              <Form.List name="autoFill">
                {(subFields, { add, remove }) => (
                  <>
                    {subFields.map((subField) => (
                      <Space key={subField.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                        <Form.Item {...subField} name={[subField.name, 'from']} noStyle>
                          <Select placeholder="源属性" style={{ width: 160 }} options={autoFillOptions} />
                        </Form.Item>
                        <span>→</span>
                        <Form.Item {...subField} name={[subField.name, 'to']} noStyle>
                          <Input placeholder="目标字段ID" style={{ width: 160 }} />
                        </Form.Item>
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(subField.name)} />
                      </Space>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加填充映射
                    </Button>
                  </>
                )}
              </Form.List>
            )
          }
        </Form.Item>
      </>
    );
  };

  // 填写字段表单
  const renderInputFieldForm = () => {
    const entityType = form.getFieldValue('entityType');
    const schema = ENTITY_SCHEMAS[entityType];
    const requiredFields = getRequiredFields(entityType);

    return (
      <>
        <Alert
          message="填写字段说明"
          description="收集数据并在表单提交/审批后自动创建对应的记录。必填字段已自动选中。"
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item name="entityType" label="创建类型" rules={[{ required: true }]}>
          <Select disabled={!!editingField}>
            {Object.entries(ENTITY_SCHEMAS).map(([key, schema]) => (
              <Select.Option key={key} value={key}>
                {schema.icon} 创建{schema.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="fieldId" label="字段组ID">
          <Input placeholder="如: newStudent (留空自动生成)" />
        </Form.Item>

        <Form.Item name="label" label="显示标签" rules={[{ required: true }]}>
          <Input placeholder="如: 新生信息" />
        </Form.Item>

        <Form.Item name="required" label="必填" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Divider>选择要收集的字段</Divider>

        {schema && (
          <Form.Item name="entityFields" rules={[{ required: true, message: '请至少选择一个字段' }]}>
            <Checkbox.Group style={{ width: '100%' }}>
              <Row gutter={[8, 8]}>
                {schema.fields.map(fieldDef => (
                  <Col span={12} key={fieldDef.field}>
                    <Checkbox
                      value={fieldDef.field}
                      disabled={requiredFields.includes(fieldDef.field)}
                    >
                      {fieldDef.label}
                      {fieldDef.required && <Text type="danger"> *</Text>}
                      {fieldDef.unique && <Tag color="orange" style={{ marginLeft: 4 }}>唯一</Tag>}
                      {fieldDef.type === 'reference' && <Tag color="blue" style={{ marginLeft: 4 }}>引用</Tag>}
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
        )}

        <Alert
          message="提示"
          description="带 * 的为必填字段，会自动选中且不可取消。带「引用」标签的字段会显示为下拉选择。"
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      </>
    );
  };

  return (
    <Row gutter={16}>
      {/* 左侧：字段面板 */}
      <Col span={8}>
        <Card title="添加字段" size="small" style={{ height: '100%' }}>
          <Collapse defaultActiveKey={['basic', 'reference', 'input']} ghost>
            {/* 基础字段 */}
            <Panel header={<><FormOutlined /> 基础字段</>} key="basic">
              <Space direction="vertical" style={{ width: '100%' }}>
                {BASIC_FIELD_TYPES.map(t => (
                  <Button
                    key={t.type}
                    block
                    size="small"
                    onClick={() => handleAddBasicField(t.type)}
                  >
                    {t.icon} {t.label}
                  </Button>
                ))}
              </Space>
            </Panel>

            {/* 引用字段 */}
            <Panel header={<><LinkOutlined style={{ color: '#1890ff' }} /> 引用字段 <Text type="secondary">(选择现有数据)</Text></>} key="reference">
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(ENTITY_SCHEMAS).map(([key, schema]) => (
                  <Button
                    key={key}
                    block
                    size="small"
                    type="default"
                    onClick={() => handleAddReferenceField(key)}
                  >
                    {ENTITY_ICONS[key]} 选择{schema.label}
                  </Button>
                ))}
              </Space>
            </Panel>

            {/* 填写字段 */}
            <Panel header={<><PlusOutlined style={{ color: '#52c41a' }} /> 填写字段 <Text type="secondary">(创建新记录)</Text></>} key="input">
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(ENTITY_SCHEMAS).map(([key, schema]) => (
                  <Button
                    key={key}
                    block
                    size="small"
                    type="default"
                    onClick={() => handleAddInputField(key)}
                  >
                    {ENTITY_ICONS[key]} 填写{schema.label}信息
                  </Button>
                ))}
              </Space>
            </Panel>
          </Collapse>
        </Card>
      </Col>

      {/* 右侧：字段画布 */}
      <Col span={16}>
        <Card title="表单字段" size="small" style={{ minHeight: 400 }}>
          {fields.length === 0 ? (
            <Empty
              description="点击左侧按钮添加字段"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Space direction="vertical" style={{ width: '100%' }}>
              {fields.map((field, index) => {
                const displayInfo = getFieldDisplayInfo(field);
                return (
                  <Card
                    key={field.id}
                    size="small"
                    style={{
                      borderLeft: field.mode === 'reference' ? '3px solid #1890ff' :
                                  field.mode === 'input' ? '3px solid #52c41a' :
                                  '3px solid #d9d9d9'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        {displayInfo.icon}
                        <Text strong>{field.label}</Text>
                        {field.required && <Text type="danger">*</Text>}
                        <Tag color={displayInfo.color}>{displayInfo.typeName}</Tag>
                        {displayInfo.tags}
                      </Space>
                      <Space size="small">
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
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                      <Text type="secondary">ID: {field.id}</Text>
                      {field.mode === 'input' && field.entityFields && (
                        <div style={{ marginTop: 4 }}>
                          收集字段: {field.entityFields.join(', ')}
                        </div>
                      )}
                      {field.mode === 'reference' && field.autoFill && field.autoFill.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          自动填充: {field.autoFill.map(m => `${m.from}→${m.to}`).join(', ')}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </Space>
          )}
        </Card>
      </Col>

      {/* 编辑弹窗 */}
      <Modal
        title={editingField ? '编辑字段' : '添加字段'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveField}
          initialValues={{ mode: modalMode }}
        >
          <Form.Item name="mode" hidden>
            <Input />
          </Form.Item>
          {renderModalContent()}
        </Form>
      </Modal>
    </Row>
  );
}
