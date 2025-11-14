import { ConfigProvider } from 'antd';
import { useTranslation } from 'react-i18next';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import App from './App';

const AppWrapper = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'zh-CN' ? zhCN : enUS;

  return (
    <ConfigProvider locale={locale}>
      <App />
    </ConfigProvider>
  );
};

export default AppWrapper;
