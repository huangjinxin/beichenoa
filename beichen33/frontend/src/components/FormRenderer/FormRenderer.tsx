import { Form, Input, InputNumber, Radio, Checkbox, Select, DatePicker, Card, Divider, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ENTITY_SCHEMAS } from '../../config/entitySchemas';
import { formApi, classApi, campusApi, positionApi } from '../../services/api';

// 从 FormDesigner 导入类型
interface FormField {
  id: string;
  mode: 'basic' | 'reference' | 'input';
  label: string;
  required: boolean;
  type?: string;
  placeholder?: string;
  readonly?: boolean;
  options?: Array<{ label: string; value: string }>;
  validation?: any;
  entityType?: string;
  autoFill?: Array<{ from: string; to: string }>;
  entityFields?: string[];
}

interface FormRendererProps {
  fields: FormField[];
  form?: any;
  initialValues?: any;
  onEntitySelect?: (fieldId: string, entityType: string, entityData: any) => void;
}

export default function FormRenderer({ fields, form, initialValues, onEntitySelect }: FormRendererProps) {
  // 获取各实体数据用于引用字段和填写字段中的引用类型
  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['students-for-form'],
    queryFn: () => formApi.searchEntities({ entityType: 'student' }),
  });

  const { data: teachersData, isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers-for-form'],
    queryFn: () => formApi.searchEntities({ entityType: 'teacher' }),
  });

  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes-for-form'],
    queryFn: () => formApi.searchEntities({ entityType: 'class' }),
  });

  const { data: campusesData, isLoading: loadingCampuses } = useQuery({
    queryKey: ['campuses-for-form'],
    queryFn: () => formApi.searchEntities({ entityType: 'campus' }),
  });

  const { data: positionsData } = useQuery({
    queryKey: ['positions-for-form'],
    queryFn: () => positionApi.getAll(),
  });

  // 构建实体选项
  const entityOptions: Record<string, Array<{ label: string; value: string; data?: any }>> = {
    student: (studentsData?.data || []).map((item: any) => ({
      label: item.label,
      value: item.value,
      data: item.extra,
    })),
    teacher: (teachersData?.data || []).map((item: any) => ({
      label: item.label,
      value: item.value,
      data: item.extra,
    })),
    class: (classesData?.data || []).map((item: any) => ({
      label: item.label,
      value: item.value,
      data: item.extra,
    })),
    campus: (campusesData?.data || []).map((item: any) => ({
      label: item.label,
      value: item.value,
      data: item.extra,
    })),
    position: (positionsData || []).map((item: any) => ({
      label: item.name,
      value: item.id,
      data: item,
    })),
  };

  const isLoading = loadingStudents || loadingTeachers || loadingClasses || loadingCampuses;

  // 处理引用字段选择变化
  const handleReferenceChange = (field: FormField, value: string) => {
    if (!field.entityType) return;

    const options = entityOptions[field.entityType] || [];
    const selectedOption = options.find(opt => opt.value === value);

    if (selectedOption?.data && field.autoFill && field.autoFill.length > 0) {
      // 自动填充其他字段
      const updates: Record<string, any> = {};
      field.autoFill.forEach(mapping => {
        const sourceValue = getNestedValue(selectedOption.data, mapping.from);
        if (sourceValue !== undefined) {
          updates[mapping.to] = sourceValue;
        }
      });

      if (Object.keys(updates).length > 0) {
        form?.setFieldsValue(updates);
      }
    }

    // 通知父组件
    if (onEntitySelect && selectedOption?.data) {
      onEntitySelect(field.id, field.entityType, selectedOption.data);
    }
  };

  // 获取嵌套属性值
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  };

  // 渲染基础字段
  const renderBasicField = (field: FormField) => {
    const commonProps = {
      placeholder: field.placeholder,
      disabled: field.readonly,
    };

    switch (field.type) {
      case 'text':
        return <Input {...commonProps} />;

      case 'textarea':
        return <Input.TextArea {...commonProps} rows={4} />;

      case 'number':
        return (
          <InputNumber
            {...commonProps}
            style={{ width: '100%' }}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'radio':
        return (
          <Radio.Group disabled={field.readonly}>
            {field.options?.map(option => (
              <Radio key={option.value} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        );

      case 'checkbox':
        return (
          <Checkbox.Group
            disabled={field.readonly}
            options={field.options?.map(option => ({
              label: option.label,
              value: option.value,
            }))}
          />
        );

      case 'select':
        return (
          <Select
            {...commonProps}
            options={field.options}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
          />
        );

      case 'date':
        return <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabled={field.readonly} />;

      case 'datetime':
        return <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" disabled={field.readonly} />;

      default:
        return <Input {...commonProps} />;
    }
  };

  // 渲染引用字段
  const renderReferenceField = (field: FormField) => {
    const options = entityOptions[field.entityType || ''] || [];

    return (
      <Select
        placeholder={field.placeholder || `请选择${ENTITY_SCHEMAS[field.entityType || '']?.label || ''}`}
        allowClear
        showSearch
        filterOption={(input, option) =>
          (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
        }
        options={options.map(opt => ({ label: opt.label, value: opt.value }))}
        onChange={(value) => handleReferenceChange(field, value)}
        loading={isLoading}
      />
    );
  };

  // 渲染填写字段（实体字段组）
  const renderInputField = (field: FormField) => {
    const schema = ENTITY_SCHEMAS[field.entityType || ''];
    if (!schema || !field.entityFields) {
      return <div>配置错误</div>;
    }

    // 获取需要渲染的字段定义
    const fieldsToRender = schema.fields.filter(f => field.entityFields!.includes(f.field));

    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        {fieldsToRender.map(fieldDef => {
          const fieldName = `${field.id}.${fieldDef.field}`;

          return (
            <Form.Item
              key={fieldName}
              name={fieldName}
              label={fieldDef.label}
              rules={fieldDef.required ? [{ required: true, message: `请输入${fieldDef.label}` }] : []}
            >
              {renderEntityFieldInput(fieldDef)}
            </Form.Item>
          );
        })}
      </Card>
    );
  };

  // 渲染实体字段输入控件
  const renderEntityFieldInput = (fieldDef: any) => {
    switch (fieldDef.type) {
      case 'text':
        return <Input placeholder={fieldDef.placeholder} />;

      case 'textarea':
        return <Input.TextArea placeholder={fieldDef.placeholder} rows={3} />;

      case 'number':
        return <InputNumber style={{ width: '100%' }} placeholder={fieldDef.placeholder} />;

      case 'date':
        return <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />;

      case 'select':
        return (
          <Select
            placeholder={`请选择${fieldDef.label}`}
            options={fieldDef.options?.map((opt: string) => ({ label: opt, value: opt }))}
          />
        );

      case 'reference':
        // 引用其他实体
        const refOptions = entityOptions[fieldDef.refType] || [];
        return (
          <Select
            placeholder={`请选择${fieldDef.label}`}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
            options={refOptions.map(opt => ({ label: opt.label, value: opt.value }))}
            loading={isLoading}
          />
        );

      default:
        return <Input placeholder={fieldDef.placeholder} />;
    }
  };

  // 获取字段校验规则
  const getRules = (field: FormField) => {
    const rules: any[] = [];

    if (field.required) {
      rules.push({
        required: true,
        message: `请输入${field.label}`,
      });
    }

    if (field.validation) {
      if (field.validation.pattern) {
        rules.push({
          pattern: new RegExp(field.validation.pattern),
          message: field.validation.message || '格式不正确',
        });
      }

      if (field.type === 'number') {
        if (field.validation.min !== undefined) {
          rules.push({
            type: 'number',
            min: field.validation.min,
            message: `最小值为 ${field.validation.min}`,
          });
        }
        if (field.validation.max !== undefined) {
          rules.push({
            type: 'number',
            max: field.validation.max,
            message: `最大值为 ${field.validation.max}`,
          });
        }
      }
    }

    return rules;
  };

  if (!fields || !Array.isArray(fields)) {
    console.error('FormRenderer: fields is not an array', fields);
    return <div>表单字段数据格式错误</div>;
  }

  // 处理初始值
  const processedInitialValues: any = {};
  if (initialValues) {
    Object.keys(initialValues).forEach(key => {
      const field = fields.find(f => f.id === key);
      if (field && field.mode === 'basic' && (field.type === 'date' || field.type === 'datetime')) {
        const value = initialValues[key];
        processedInitialValues[key] = value ? dayjs(value) : undefined;
      } else {
        processedInitialValues[key] = initialValues[key];
      }
    });
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        <Spin tip="加载数据中..." />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical" initialValues={processedInitialValues}>
      {fields.map((field) => {
        if (!field || !field.id) {
          return null;
        }

        // 填写字段特殊处理 - 渲染为字段组
        if (field.mode === 'input') {
          return (
            <div key={field.id}>
              <Divider orientation="left">{field.label}</Divider>
              {renderInputField(field)}
            </div>
          );
        }

        // 基础字段和引用字段
        return (
          <Form.Item
            key={field.id}
            name={field.id}
            label={field.label}
            rules={getRules(field)}
          >
            {field.mode === 'reference' ? renderReferenceField(field) : renderBasicField(field)}
          </Form.Item>
        );
      })}
    </Form>
  );
}
