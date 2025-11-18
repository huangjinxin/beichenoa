import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Space, Spin, Divider, Tag, Descriptions } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, EditOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';
import { dailyObservationApi } from '../../../services/api';

const DailyObservationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: record, isLoading } = useQuery({
    queryKey: ['daily-observation', id],
    queryFn: () => dailyObservationApi.getOne(id!),
    enabled: !!id,
  });

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `每日观察_${record?.date ? dayjs(record.date).format('YYYY-MM-DD') : ''}`,
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
          <Button onClick={() => navigate('/records/daily-observation')}>返回列表</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div className="no-print" style={{ marginBottom: 16 }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/records/daily-observation')}>
              返回
            </Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              打印
            </Button>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/records/daily-observation/edit/${id}`)}>
              编辑
            </Button>
          </Space>
        </div>

        <div ref={printRef} style={{ padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>每日观察记录表</h1>
            <p style={{ color: '#666' }}>
              {record.campus?.name || ''} - {record.class?.name || ''}
            </p>
          </div>

          <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="日期">
              {dayjs(record.date).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="天气">{record.weather}</Descriptions.Item>
            <Descriptions.Item label="班级">{record.class?.name}</Descriptions.Item>
            <Descriptions.Item label="教师">{record.teacher?.name}</Descriptions.Item>
            {record.campus && (
              <Descriptions.Item label="园区" span={2}>
                {record.campus.name}
              </Descriptions.Item>
            )}
          </Descriptions>

          {record.timeline && record.timeline.length > 0 && (
            <>
              <Divider orientation="left">
                <strong>时间日志</strong>
              </Divider>
              <div style={{ marginBottom: 24 }}>
                {record.timeline.map((item: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      marginBottom: 8,
                      padding: '8px 12px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: 4,
                    }}
                  >
                    <Tag color="blue" style={{ marginRight: 12 }}>
                      {item.time}
                    </Tag>
                    <span>{item.event}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {(record.gameActivity || record.learningActivity || record.outdoorActivity || record.lifeActivity) && (
            <>
              <Divider orientation="left">
                <strong style={{ fontSize: 16 }}>精彩瞬间</strong>
              </Divider>
              <div style={{
                marginBottom: 24,
                padding: 16,
                backgroundColor: '#f0f7ff',
                borderRadius: 8,
                border: '1px solid #d9e9ff'
              }}>
                {record.gameActivity && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#1890ff' }}>游戏活动</div>
                    <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: 4 }}>
                      <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{record.gameActivity}</p>
                    </div>
                  </div>
                )}
                {record.learningActivity && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#1890ff' }}>学习活动</div>
                    <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: 4 }}>
                      <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{record.learningActivity}</p>
                    </div>
                  </div>
                )}
                {record.outdoorActivity && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#1890ff' }}>户外运动</div>
                    <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: 4 }}>
                      <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{record.outdoorActivity}</p>
                    </div>
                  </div>
                )}
                {record.lifeActivity && (
                  <div style={{ marginBottom: 0 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#1890ff' }}>生活活动</div>
                    <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: 4 }}>
                      <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{record.lifeActivity}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {record.homeCooperation && (
            <>
              <Divider orientation="left">
                <strong>家园共育</strong>
              </Divider>
              <div style={{ marginBottom: 24, padding: 12, backgroundColor: '#fafafa', borderRadius: 4 }}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{record.homeCooperation}</p>
              </div>
            </>
          )}

          <Divider />
          <div style={{ textAlign: 'right', color: '#999', fontSize: 12 }}>
            <p>创建时间：{dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
            <p>记录人：{record.teacher?.name}</p>
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

export default DailyObservationDetail;
