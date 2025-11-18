import { Form, Input, InputNumber, Radio, Checkbox, Select, DatePicker } from 'antd';
import { FormField } from '../FormDesigner/FormDesigner';
import dayjs from 'dayjs';

interface FormRendererProps {
  fields: FormField[];
  form?: any;
  initialValues?: any;
}

export default function FormRenderer({ fields, form, initialValues }: FormRendererProps) {
  const renderField = (field: FormField) => {
    const commonProps = {
      placeholder: field.placeholder,
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
          <Radio.Group>
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
            options={field.options?.map(option => ({
              label: option.label,
              value: option.value,
            }))}
          />
        );

      case 'select':
      case 'teacher_select':
        return (
          <Select
            {...commonProps}
            options={field.options}
            allowClear
          />
        );

      case 'date':
        return <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />;

      case 'datetime':
        return <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />;

      case 'approval':
        return <Input.TextArea {...commonProps} rows={3} placeholder="请输入审批意见" />;

      default:
        return <Input {...commonProps} />;
    }
  };

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

  // 处理 initialValues，将日期字符串转换为 dayjs 对象
  const processedInitialValues: any = {};
  if (initialValues) {
    Object.keys(initialValues).forEach(key => {
      const field = fields.find(f => f.id === key);
      if (field && (field.type === 'date' || field.type === 'datetime')) {
        const value = initialValues[key];
        processedInitialValues[key] = value ? dayjs(value) : undefined;
      } else {
        processedInitialValues[key] = initialValues[key];
      }
    });
  }

  // 添加 field.defaultValue 到 initialValues
  fields.forEach(field => {
    if (processedInitialValues[field.id] === undefined && field.defaultValue !== undefined) {
      if (field.type === 'date' || field.type === 'datetime') {
        processedInitialValues[field.id] = dayjs(field.defaultValue);
      } else {
        processedInitialValues[field.id] = field.defaultValue;
      }
    }
  });

  return (
    <Form form={form} layout="vertical" initialValues={processedInitialValues}>
      {fields.map((field, index) => {
        if (!field || !field.id || !field.type) {
          console.error('FormRenderer: invalid field at index', index, field);
          return null;
        }

        return (
          <Form.Item
            key={field.id}
            name={field.id}
            label={field.label}
            rules={getRules(field)}
          >
            {renderField(field)}
          </Form.Item>
        );
      })}
    </Form>
  );
}
