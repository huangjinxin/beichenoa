import { GlobalOutlined } from '@ant-design/icons';
import { Dropdown, MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const items: MenuProps['items'] = [
    {
      key: 'zh-CN',
      label: '简体中文',
      onClick: () => {
        i18n.changeLanguage('zh-CN');
        localStorage.setItem('i18nextLng', 'zh-CN');
      },
    },
    {
      key: 'en-US',
      label: 'English',
      onClick: () => {
        i18n.changeLanguage('en-US');
        localStorage.setItem('i18nextLng', 'en-US');
      },
    },
  ];

  const currentLanguage = i18n.language === 'zh-CN' ? '简体中文' : 'English';

  return (
    <Dropdown menu={{ items, selectedKeys: [i18n.language] }} placement="bottomRight">
      <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <GlobalOutlined style={{ fontSize: '16px' }} />
        <span>{currentLanguage}</span>
      </div>
    </Dropdown>
  );
};

export default LanguageSwitcher;
