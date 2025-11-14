import { Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, TeamOutlined, BookOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { reportApi } from '../../services/api';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: overview } = useQuery({
    queryKey: ['overview'],
    queryFn: reportApi.getOverview,
  });

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card
            hoverable
            onClick={() => navigate('/students')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title={t('dashboard.totalStudents')}
              value={overview?.studentCount || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            hoverable
            onClick={() => navigate('/classes')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title={t('dashboard.totalClasses')}
              value={overview?.classCount || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            hoverable
            onClick={() => navigate('/teachers')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title={t('dashboard.totalTeachers')}
              value={overview?.teacherCount || 0}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
