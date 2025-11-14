import { Card } from 'antd';
import { useTranslation } from 'react-i18next';

export default function Nutrition() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('canteen.nutrition.title')}</h1>
      <Card style={{ marginTop: 16 }}>
        <p>{t('canteen.nutrition.analysis')}</p>
      </Card>
    </div>
  );
}
