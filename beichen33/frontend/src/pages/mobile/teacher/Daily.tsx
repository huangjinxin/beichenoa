import { Card } from 'antd-mobile';
import MobileLayout from '../../../components/mobile/MobileLayout';

export default function TeacherDaily() {
  return (
    <MobileLayout role="teacher">
      <div style={{ padding: '12px' }}>
        <Card title="日常记录">
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            功能开发中...
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
}
