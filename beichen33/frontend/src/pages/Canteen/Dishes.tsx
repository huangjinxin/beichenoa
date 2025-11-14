import { Card, List, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { dishApi } from '../../services/api';

export default function Dishes() {
  const { t } = useTranslation();
  const { data: dishesData, isLoading } = useQuery({
    queryKey: ['dishes'],
    queryFn: () => dishApi.getAll(),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>{t('canteen.dishes.title')}</h1>
        <Button type="primary" icon={<PlusOutlined />}>{t('canteen.dishes.add')}</Button>
      </div>

      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={dishesData?.data || []}
        loading={isLoading}
        renderItem={(item: any) => (
          <List.Item>
            <Card title={item.name} extra={<a>{t('common.actions')}</a>}>
              <p>{t('canteen.dishes.category')}: {item.category}</p>
              <p>{t('canteen.dishes.ingredients')}: {item.ingredients?.length || 0}</p>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
