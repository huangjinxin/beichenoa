import { useState } from 'react';
import { Card, Button, message, Spin, Form, Table, InputNumber, Input, DatePicker, Space, Typography, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { formApi, userApi } from '../../services/api';
import FormRenderer from '../../components/FormRenderer/FormRenderer';
import dayjs from 'dayjs';

const { Text } = Typography;

interface DetailColumn {
  id: string;
  type: string;
  label: string;
  width?: number;
  required?: boolean;
  formula?: string;
}

interface DetailRow {
  key: string;
  seq?: number;
  [key: string]: any;
}

export default function FillForm() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [detailData, setDetailData] = useState<DetailRow[]>([]);
  const [calculatedValues, setCalculatedValues] = useState<any>({});

  const { data: template, isLoading } = useQuery({
    queryKey: ['form-template', templateId],
    queryFn: () => formApi.getTemplate(templateId!),
    enabled: !!templateId,
  });

  // 获取教师列表用于teacher_select字段
  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => userApi.getAll({ role: 'TEACHER', pageSize: 1000 }),
  });

  const teachers = teachersData?.data || teachersData || [];

  const submitMutation = useMutation({
    mutationFn: formApi.createSubmission,
    onSuccess: () => {
      message.success('提交成功');
      navigate('/forms/submissions');
    },
    onError: () => {
      message.error('提交失败');
    },
  });

  // 计算单行的计算字段
  const calculateRowFields = (row: DetailRow, columns: DetailColumn[]): DetailRow => {
    const newRow = { ...row };
    columns.forEach(col => {
      if (col.type === 'calculated' && col.formula) {
        // 简单乘法公式: "unitPrice * quantity"
        const multiplyMatch = col.formula.match(/(\w+)\s*\*\s*(\w+)/);
        if (multiplyMatch) {
          const a = Number(newRow[multiplyMatch[1]]) || 0;
          const b = Number(newRow[multiplyMatch[2]]) || 0;
          newRow[col.id] = Math.round(a * b * 100) / 100;
        }
        // 加法公式
        const addMatch = col.formula.match(/(\w+)\s*\+\s*(\w+)/);
        if (addMatch) {
          const a = Number(newRow[addMatch[1]]) || 0;
          const b = Number(newRow[addMatch[2]]) || 0;
          newRow[col.id] = Math.round((a + b) * 100) / 100;
        }
      }
    });
    return newRow;
  };

  // 计算汇总值
  const calculateSummary = (data: DetailRow[], calculations: any[]) => {
    if (!calculations?.length) return {};

    const result: any = {};
    calculations.forEach((calc: any) => {
      const { field, formula } = calc;

      if (formula.startsWith('SUM(details.')) {
        const fieldName = formula.match(/SUM\(details\.(\w+)\)/)?.[1];
        if (fieldName) {
          result[field] = data.reduce((sum, row) => sum + (Number(row[fieldName]) || 0), 0);
        }
      } else if (formula.startsWith('COUNT(details)')) {
        result[field] = data.length;
      }
    });
    return result;
  };

  // 更新明细数据并重新计算
  const updateDetailData = (newData: DetailRow[]) => {
    const config = template?.detailTableConfig as any;
    if (!config) {
      setDetailData(newData);
      return;
    }

    // 计算每行
    const calculatedData = newData.map((row, index) => ({
      ...calculateRowFields(row, config.columns || []),
      seq: index + 1,
    }));

    setDetailData(calculatedData);

    // 计算汇总
    if (template?.calculations) {
      const summary = calculateSummary(calculatedData, template.calculations as any[]);
      setCalculatedValues(summary);
    }
  };

  // 添加明细行
  const handleAddRow = () => {
    const newRow: DetailRow = {
      key: `row_${Date.now()}`,
      seq: detailData.length + 1,
    };
    updateDetailData([...detailData, newRow]);
  };

  // 删除明细行
  const handleDeleteRow = (key: string) => {
    updateDetailData(detailData.filter(row => row.key !== key));
  };

  // 更新明细行数据
  const handleRowChange = (key: string, field: string, value: any) => {
    const newData = detailData.map(row => {
      if (row.key === key) {
        return { ...row, [field]: value };
      }
      return row;
    });
    updateDetailData(newData);
  };

  // 生成明细表列配置
  const generateDetailColumns = () => {
    const config = template?.detailTableConfig as any;
    if (!config?.columns) return [];

    const columns = config.columns.map((col: DetailColumn) => ({
      title: col.label,
      dataIndex: col.id,
      width: col.width || 100,
      render: (value: any, record: DetailRow) => {
        if (col.type === 'sequence') {
          return record.seq;
        }
        if (col.type === 'calculated') {
          return value?.toFixed?.(2) || '0.00';
        }
        if (col.type === 'number') {
          return (
            <InputNumber
              value={value}
              onChange={(val) => handleRowChange(record.key, col.id, val)}
              style={{ width: '100%' }}
              min={0}
            />
          );
        }
        if (col.type === 'date') {
          return (
            <DatePicker
              value={value ? dayjs(value) : null}
              onChange={(date) => handleRowChange(record.key, col.id, date?.format('YYYY-MM-DD'))}
              style={{ width: '100%' }}
            />
          );
        }
        return (
          <Input
            value={value}
            onChange={(e) => handleRowChange(record.key, col.id, e.target.value)}
          />
        );
      },
    }));

    // 添加操作列
    columns.push({
      title: '操作',
      width: 60,
      render: (_: any, record: DetailRow) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteRow(record.key)}
        />
      ),
    });

    return columns;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 处理日期字段，转换为字符串
      const processedData: any = {};
      Object.keys(values).forEach(key => {
        if (dayjs.isDayjs(values[key])) {
          processedData[key] = values[key].toISOString();
        } else {
          processedData[key] = values[key];
        }
      });

      submitMutation.mutate({
        templateId: templateId!,
        formData: processedData,
        detailData: detailData.map(({ key, ...rest }) => rest), // 移除key字段
      });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!template) {
    return (
      <Card>
        <p>表单不存在</p>
      </Card>
    );
  }

  const detailConfig = template.detailTableConfig as any;
  const hasDetailTable = detailConfig?.enabled;

  // 处理字段，支持teacher_select类型
  let processedFields: any[] = [];
  try {
    console.log('Template fields:', template.fields);
    console.log('Teachers:', teachers);

    processedFields = (template.fields as any[] || []).map((field: any) => {
      if (field.type === 'teacher_select') {
        const processed = {
          ...field,
          type: 'select',
          options: (teachers || []).map((t: any) => ({ label: t.name, value: t.id })),
        };
        console.log('Processed teacher_select field:', field.id, processed);
        return processed;
      }
      // approval 字段不需要必填
      if (field.type === 'approval') {
        return {
          ...field,
          required: false,
        };
      }
      return field;
    });

    console.log('Final processed fields:', processedFields);
  } catch (error) {
    console.error('Error processing fields:', error);
    return (
      <Card>
        <p>处理表单字段时出错</p>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card
        title={template.title}
        extra={
          <Button type="primary" onClick={handleSubmit} loading={submitMutation.isPending}>
            提交
          </Button>
        }
      >
        {template.description && (
          <div style={{ marginBottom: 24, color: '#666' }}>
            {template.description}
          </div>
        )}

        {/* 主表单 */}
        <FormRenderer
          fields={processedFields}
          form={form}
        />

        {/* 明细表 */}
        {hasDetailTable && (
          <>
            <Divider>{detailConfig.title || '明细表'}</Divider>

            <div style={{ marginBottom: 16 }}>
              <Button type="dashed" onClick={handleAddRow} icon={<PlusOutlined />}>
                添加明细行
              </Button>
            </div>

            <Table
              dataSource={detailData}
              columns={generateDetailColumns()}
              pagination={false}
              rowKey="key"
              scroll={{ x: 'max-content' }}
              size="small"
              bordered
            />

            {/* 汇总信息 */}
            {template.calculations && (template.calculations as any[]).length > 0 && (
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Space direction="vertical" align="end">
                  {(template.calculations as any[]).map((calc: any) => (
                    <Text key={calc.field} strong>
                      {calc.label}: {calculatedValues[calc.field]?.toFixed?.(2) || calculatedValues[calc.field] || 0}
                    </Text>
                  ))}
                </Space>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
