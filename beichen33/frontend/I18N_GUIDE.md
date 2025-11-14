# 国际化 (i18n) 使用指南

## 概览

本项目已集成中英文双语支持，默认语言为简体中文。

## 已实现功能

### 1. 语言切换器
- 位置：右上角（登录页面和主界面）
- 支持语言：简体中文、English
- 切换后自动保存到 localStorage

### 2. 已国际化的页面
- ✅ 登录页面
- ✅ 布局导航菜单
- ✅ 仪表板页面
- ⚠️ 其他页面需要逐步添加

### 3. Ant Design 组件国际化
- 已配置 Ant Design 的中英文 locale
- 所有 Ant Design 组件（如日期选择器、表格等）会自动适配当前语言

## 如何在新页面使用 i18n

### 基本用法

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('students.title')}</h1>
      <Button>{t('common.save')}</Button>
    </div>
  );
}
```

### 添加新的翻译文本

1. 打开 `src/i18n/locales/zh-CN.ts`，添加中文翻译：
```ts
export default {
  myFeature: {
    title: '我的功能',
    description: '功能描述',
  },
};
```

2. 打开 `src/i18n/locales/en-US.ts`，添加英文翻译：
```ts
export default {
  myFeature: {
    title: 'My Feature',
    description: 'Feature description',
  },
};
```

3. 在组件中使用：
```tsx
<h1>{t('myFeature.title')}</h1>
```

## 翻译文本分类

### common（通用）
常用按钮、操作、状态等

### auth（认证）
登录、登出相关

### menu（菜单）
导航菜单项

### dashboard（仪表板）
仪表板相关文本

### students（学生）
学生管理相关

### classes（班级）
班级管理相关

### canteen（食堂）
食堂管理相关，包括：
- ingredients（食材）
- dishes（菜品）
- menus（菜单）
- nutrition（营养）

### forms（表单）
表单管理相关

### reports（报表）
报表相关

### messages（消息）
提示、错误、成功等消息

## 最佳实践

### 1. 表单验证消息
```tsx
<Form.Item
  name="email"
  rules={[
    { required: true, message: t('auth.usernameRequired') },
    { type: 'email', message: t('auth.emailInvalid') }
  ]}
>
  <Input placeholder={t('auth.username')} />
</Form.Item>
```

### 2. 提示消息
```tsx
import { message } from 'antd';
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

// 成功提示
message.success(t('messages.saveSuccess'));

// 错误提示
message.error(t('messages.saveFailed'));

// 警告提示
message.warning(t('messages.warning'));
```

### 3. 确认对话框
```tsx
import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

Modal.confirm({
  title: t('messages.deleteConfirm'),
  okText: t('common.confirm'),
  cancelText: t('common.cancel'),
  onOk: handleDelete,
});
```

### 4. 表格列标题
```tsx
const columns = [
  {
    title: t('students.studentName'),
    dataIndex: 'name',
  },
  {
    title: t('students.className'),
    dataIndex: 'className',
  },
  {
    title: t('common.actions'),
    render: () => (
      <>
        <Button>{t('common.edit')}</Button>
        <Button>{t('common.delete')}</Button>
      </>
    ),
  },
];
```

## 待完成的页面国际化

以下页面还需要添加国际化支持：

- [ ] 学生列表页面 `/pages/Students/List.tsx`
- [ ] 学生详情页面 `/pages/Students/Detail.tsx`
- [ ] 成长记录页面 `/pages/Students/GrowthRecords.tsx`
- [ ] 班级列表页面 `/pages/Classes/List.tsx`
- [ ] 班级详情页面 `/pages/Classes/Detail.tsx`
- [ ] 食材管理页面 `/pages/Canteen/Ingredients.tsx`
- [ ] 菜品管理页面 `/pages/Canteen/Dishes.tsx`
- [ ] 菜单管理页面 `/pages/Canteen/Menus.tsx`
- [ ] 营养分析页面 `/pages/Canteen/Nutrition.tsx`
- [ ] 表单模板页面 `/pages/Forms/Templates.tsx`
- [ ] 表单提交页面 `/pages/Forms/Submissions.tsx`
- [ ] 报表页面 `/pages/Reports/Reports.tsx`

## 语言切换测试

1. 打开应用
2. 点击右上角语言切换器
3. 选择 "English" 或 "简体中文"
4. 界面文本和 Ant Design 组件应立即切换语言
5. 刷新页面，语言设置应保持不变（存储在 localStorage）

## 配置说明

### 默认语言
在 `src/i18n/index.ts` 中配置：
```ts
i18n.init({
  fallbackLng: 'zh-CN', // 回退语言
  lng: 'zh-CN',         // 初始语言
});
```

### 语言检测顺序
1. localStorage（用户手动选择的语言）
2. navigator（浏览器语言设置）

## 注意事项

1. **所有用户可见的文本**都应该使用 `t()` 函数包裹
2. **不要硬编码文本**，即使是中文也要放在翻译文件中
3. **翻译 key 命名**应该语义化，便于理解
4. **添加新翻译**时，中英文都要同步添加
5. **表单验证消息**也要国际化
6. **console.log** 等开发调试信息不需要国际化

## 技术栈

- **i18next**: 核心国际化库
- **react-i18next**: React 集成
- **i18next-browser-languagedetector**: 自动检测用户语言
- **Ant Design locale**: UI 组件库的国际化支持
