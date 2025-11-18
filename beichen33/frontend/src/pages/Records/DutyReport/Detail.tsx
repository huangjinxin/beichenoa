import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Space, Spin, Divider, Descriptions } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, EditOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';
import { dutyReportApi } from '../../../services/api';

const DutyReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: record, isLoading } = useQuery({
    queryKey: ['duty-report', id],
    queryFn: () => dutyReportApi.getOne(id!),
    enabled: !!id,
  });

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `值班播报_${record?.date ? dayjs(record.date).format('YYYY-MM-DD') : ''}`,
  });

  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!record) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <p>记录不存在</p>
          <Button onClick={() => navigate('/records/duty-report')}>返回列表</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div className="no-print" style={{ marginBottom: 16 }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/records/duty-report')}>
              返回
            </Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              打印
            </Button>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/records/duty-report/edit/${id}`)}>
              编辑
            </Button>
          </Space>
        </div>

        <div ref={printRef} style={{ padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>值班播报表</h1>
            <p style={{ color: '#666' }}>{record.campus?.name || ''}</p>
          </div>

          <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="日期">
              {dayjs(record.date).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="天气">{record.weather}</Descriptions.Item>
            <Descriptions.Item label="园区">{record.campus?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="值班领导">{record.dutyLeader || '-'}</Descriptions.Item>
          </Descriptions>

          {record.attendance && (
            <>
              <Divider orientation="left">
                <strong>出勤情况</strong>
              </Divider>
              <div style={{ marginBottom: 24, padding: 12, backgroundColor: '#fafafa', borderRadius: 4 }}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{record.attendance}</p>
              </div>
            </>
          )}

          {record.entryExit && (
            <>
              <Divider orientation="left">
                <strong>入园离园</strong>
              </Divider>
              <div style={{ marginBottom: 24, padding: 12, backgroundColor: '#fafafa', borderRadius: 4 }}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{record.entryExit}</p>
              </div>
            </>
          )}

          {record.learningActivity && (
            <>
              <Divider orientation="left">
                <strong>学习活动</strong>
              </Divider>
              <div style={{ marginBottom: 24, padding: 12, backgroundColor: '#fafafa', borderRadius: 4 }}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{record.learningActivity}</p>
              </div>
            </>
          )}

          {record.areaActivity && (
            <>
              <Divider orientation="left">
                <strong>区域活动</strong>
              </Divider>
              <div style={{ marginBottom: 24, padding: 12, backgroundColor: '#fafafa', borderRadius: 4 }}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{record.areaActivity}</p>
              </div>
            </>
          )}

          {record.outdoorActivity && (
            <>
              <Divider orientation="left">
                <strong>户外活动</strong>
              </Divider>
              <div style={{ marginBottom: 24, padding: 12, backgroundColor: '#fafafa', borderRadius: 4 }}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{record.outdoorActivity}</p>
              </div>
            </>
          )}

          {record.lifeActivity && (
            <>
              <Divider orientation="left">
                <strong>生活活动</strong>
              </Divider>
              <div style={{ marginBottom: 24, padding: 12, backgroundColor: '#fafafa', borderRadius: 4 }}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{record.lifeActivity}</p>
              </div>
            </>
          )}

          {record.notice && (
            <>
              <Divider orientation="left">
                <strong>温馨提示</strong>
              </Divider>
              <div style={{ marginBottom: 24, padding: 12, backgroundColor: '#fff7e6', borderRadius: 4, border: '1px solid #ffd591' }}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{record.notice}</p>
              </div>
            </>
          )}

          {record.safety && (
            <>
              <Divider orientation="left">
                <strong>校园安全</strong>
              </Divider>
              <div style={{ marginBottom: 24, padding: 12, backgroundColor: '#f6ffed', borderRadius: 4, border: '1px solid #b7eb8f' }}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{record.safety}</p>
              </div>
            </>
          )}

          {record.other && (
            <>
              <Divider orientation="left">
                <strong>其他事项</strong>
              </Divider>
              <div style={{ marginBottom: 24, padding: 12, backgroundColor: '#fafafa', borderRadius: 4 }}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{record.other}</p>
              </div>
            </>
          )}

          <Divider />
          <div style={{ textAlign: 'right', color: '#999', fontSize: 12 }}>
            <p>创建时间：{dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
            <p>值班领导：{record.dutyLeader?.name || '-'}</p>
          </div>
        </div>
      </Card>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            margin: 0;
            padding: 0;
          }

          .ant-card {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DutyReportDetail;
