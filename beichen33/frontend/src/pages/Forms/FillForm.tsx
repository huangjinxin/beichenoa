import { Card, Button, message, Spin, Form } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { formApi } from '../../services/api';
import FormRenderer from '../../components/FormRenderer/FormRenderer';
import dayjs from 'dayjs';

export default function FillForm() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { data: template, isLoading } = useQuery({
    queryKey: ['form-template', templateId],
    queryFn: () => formApi.getTemplate(templateId!),
    enabled: !!templateId,
  });

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
        data: processedData,
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

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
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

        <FormRenderer
          fields={template.fields || []}
          form={form}
        />
      </Card>
    </div>
  );
}
