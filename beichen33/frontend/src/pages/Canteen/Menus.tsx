import { useState } from 'react';
import { Card, DatePicker, Table, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { menuApi } from '../../services/api';
import dayjs, { Dayjs } from 'dayjs';

export default function Menus() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  const { data: menus, isLoading } = useQuery({
    queryKey: ['menus', selectedDate.format('YYYY-MM-DD')],
    queryFn: () => menuApi.getByDate(selectedDate.format('YYYY-MM-DD')),
  });

  const columns = [
    { title: t('canteen.menus.mealType'), dataIndex: 'mealType', key: 'mealType' },
    {
      title: t('canteen.menus.dishes'),
      dataIndex: 'dishes',
      key: 'dishes',
      render: (dishes: any[]) => dishes?.map((d) => d.dish.name).join(', '),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: () => <Button size="small">{t('canteen.nutrition.title')}</Button>,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>{t('canteen.menus.title')}</h1>
        <Button type="primary" icon={<PlusOutlined />}>{t('canteen.menus.add')}</Button>
      </div>

      <Card>
        <DatePicker
          value={selectedDate}
          onChange={(date) => date && setSelectedDate(date)}
          style={{ marginBottom: 16 }}
        />
        <Table
          dataSource={menus || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
        />
      </Card>
    </div>
  );
}
