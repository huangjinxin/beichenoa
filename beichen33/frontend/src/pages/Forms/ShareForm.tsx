import { useState, useEffect } from 'react';
import { Card, Button, message, Spin, Form, Table, InputNumber, Input, DatePicker, Space, Typography, Divider, Result } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { formApi } from '../../services/api';
import FormRenderer from '../../components/FormRenderer/FormRenderer';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

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

export default function ShareForm() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [detailData, setDetailData] = useState<DetailRow[]>([]);
  const [calculatedValues, setCalculatedValues] = useState<any>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: template, isLoading, error } = useQuery({
    queryKey: ['share-template', token],
    queryFn: () => formApi.getTemplateByShareToken(token!),
    enabled: !!token,
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => formApi.submitByShareToken(token!, data),
    onSuccess: () => {
      message.success('提交成功');
      setIsSubmitted(true);
    },
    onError: () => {
      message.error('提交失败，请稍后重试');
    },
  });

  // 计算单行的计算字段
  const calculateRowFields = (row: DetailRow, columns: DetailColumn[]): DetailRow => {
    const newRow = { ...row };
    columns.forEach(col => {
      if (col.type === 'calculated' && col.formula) {
        const multiplyMatch = col.formula.match(/(\w+)\s*\*\s*(\w+)/);
        if (multiplyMatch) {
          const a = Number(newRow[multiplyMatch[1]]) || 0;
          const b = Number(newRow[multiplyMatch[2]]) || 0;
          newRow[col.id] = Math.round(a * b * 100) / 100;
        }
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

    const calculatedData = newData.map((row, index) => ({
      ...calculateRowFields(row, config.columns || []),
      seq: index + 1,
    }));

    setDetailData(calculatedData);

    if (template?.calculations) {
      const summary = calculateSummary(calculatedData, template.calculations as any[]);
      setCalculatedValues(summary);
    }
  };

  const handleAddRow = () => {
    const newRow: DetailRow = {
      key: `row_${Date.now()}`,
      seq: detailData.length + 1,
    };
    updateDetailData([...detailData, newRow]);
  };

  const handleDeleteRow = (key: string) => {
    updateDetailData(detailData.filter(row => row.key !== key));
  };

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

    columns.push({
      title: '操作',
      width: 60,
      render: (_: any, record: DetailRow) => (
        <Button
          type="link"
          danger
          size="small"
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
      const fields = template?.fields as any[] || [];

      const processedData: any = {};
      const inputFieldsData: Record<string, any> = {};

      Object.keys(values).forEach(key => {
        const value = values[key];

        if (key.includes('.')) {
          const [fieldId, entityField] = key.split('.');
          if (!inputFieldsData[fieldId]) {
            inputFieldsData[fieldId] = {};
          }
          if (dayjs.isDayjs(value)) {
            inputFieldsData[fieldId][entityField] = value.format('YYYY-MM-DD');
          } else if (value !== undefined && value !== null && value !== '') {
            inputFieldsData[fieldId][entityField] = value;
          }
        } else {
          if (dayjs.isDayjs(value)) {
            processedData[key] = value.format('YYYY-MM-DD');
          } else if (value !== undefined && value !== null && value !== '') {
            processedData[key] = value;
          }
        }
      });

      Object.keys(inputFieldsData).forEach(fieldId => {
        processedData[fieldId] = inputFieldsData[fieldId];
      });

      const config = template?.detailTableConfig as any;
      if (config?.enabled && config?.columns) {
        const requiredColumns = config.columns.filter((col: any) => col.required);
        if (detailData.length > 0 && requiredColumns.length > 0) {
          for (const row of detailData) {
            for (const col of requiredColumns) {
              if (!row[col.id] && row[col.id] !== 0) {
                message.error(`明细表中的 "${col.label}" 为必填项`);
                return;
              }
            }
          }
        }
      }

      submitMutation.mutate({
        formData: processedData,
        detailData: detailData.map(({ key, ...rest }) => rest),
      });
    } catch (error: any) {
      console.error('表单验证失败:', error);
      message.error('请检查表单填写是否完整');
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5'
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
        padding: '20px'
      }}>
        <Card style={{ maxWidth: 500, width: '100%' }}>
          <Result
            status="error"
            title="链接无效或已过期"
            subTitle="请联系管理员获取新的填写链接"
          />
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
        padding: '20px'
      }}>
        <Card style={{ maxWidth: 500, width: '100%' }}>
          <Result
            status="success"
            title="提交成功"
            subTitle="感谢您的填写，我们已经收到您的信息"
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          />
        </Card>
      </div>
    );
  }

  const detailConfig = template.detailTableConfig as any;
  const hasDetailTable = detailConfig?.enabled;

  const processedFields = (template.fields as any[] || []).map((field: any) => {
    if (!field.mode) {
      if (['student_select', 'teacher_select', 'class_select', 'campus_select'].includes(field.type)) {
        return {
          ...field,
          mode: 'reference',
          entityType: field.type.replace('_select', ''),
        };
      }
      return {
        ...field,
        mode: 'basic',
      };
    }
    return field;
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f2f5',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: 800,
        margin: '0 auto'
      }}>
        <Card
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: 20
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={3} style={{ marginBottom: 8 }}>
              {template.title}
            </Title>
            {template.description && (
              <Text type="secondary">{template.description}</Text>
            )}
          </div>

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
                <Button type="dashed" onClick={handleAddRow} icon={<PlusOutlined />} block>
                  添加明细行
                </Button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <Table
                  dataSource={detailData}
                  columns={generateDetailColumns()}
                  pagination={false}
                  rowKey="key"
                  size="small"
                  bordered
                  scroll={{ x: 'max-content' }}
                />
              </div>

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

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={submitMutation.isPending}
              style={{ minWidth: 200 }}
            >
              提交
            </Button>
          </div>
        </Card>

        <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
          <Text type="secondary">本表单由北辰幼儿园管理系统提供</Text>
        </div>
      </div>
    </div>
  );
}
