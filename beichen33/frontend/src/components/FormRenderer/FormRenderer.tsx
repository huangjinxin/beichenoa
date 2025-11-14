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

      default:
        return <Input {...commonProps} />;
    }
  };

  const getInitialValue = (field: FormField) => {
    if (initialValues && initialValues[field.id]) {
      const value = initialValues[field.id];
      if (field.type === 'date' || field.type === 'datetime') {
        return dayjs(value);
      }
      return value;
    }
    return field.defaultValue;
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

  return (
    <Form form={form} layout="vertical" initialValues={initialValues}>
      {fields.map(field => (
        <Form.Item
          key={field.id}
          name={field.id}
          label={field.label}
          rules={getRules(field)}
          initialValue={getInitialValue(field)}
        >
          {renderField(field)}
        </Form.Item>
      ))}
    </Form>
  );
}
