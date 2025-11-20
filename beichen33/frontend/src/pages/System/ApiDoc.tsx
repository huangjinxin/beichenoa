import { Card, Table, Typography, Tabs, Alert, Space, Tag, Select, Button, Descriptions } from 'antd';
import { CopyOutlined, GlobalOutlined, ApiOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { useState } from 'react';

const { Title, Text, Paragraph } = Typography;

export default function ApiDoc() {
  // API访问地址配置
  const apiEndpoints = [
    {
      label: '域名访问（推荐）',
      value: 'domain',
      baseUrl: 'http://beichen.706tech.cn:8828/api',
      frontendUrl: 'http://beichen.706tech.cn:8828',
      description: '外网访问，nginx反向代理，同源无跨域',
    },
    {
      label: '内网IP访问',
      value: 'ip',
      baseUrl: 'http://192.168.88.228:8891/api',
      frontendUrl: 'http://192.168.88.228:8828',
      description: '内网访问，直连API端口，速度最快',
    },
    {
      label: '本地访问',
      value: 'localhost',
      baseUrl: 'http://localhost:8891/api',
      frontendUrl: 'http://localhost:8828',
      description: '仅限服务器本机访问，开发测试用',
    },
  ];

  const [selectedEndpoint, setSelectedEndpoint] = useState('domain');
  const currentEndpoint = apiEndpoints.find(e => e.value === selectedEndpoint);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  };

  // 数据库连接信息
  const dbInfo = {
    type: 'PostgreSQL 15',
    host: 'beichen.706tech.cn (或 192.168.88.228)',
    port: '5432',
    database: 'kindergarten',
    username: 'postgres',
    password: 'postgres',
    connectionString: 'postgresql://postgres:postgres@beichen.706tech.cn:5432/kindergarten?schema=public',
  };

  // 测试账号信息
  const testAccounts = [
    {
      email: 'admin@beichen.com',
      password: 'admin123',
      role: 'ADMIN',
      description: '管理员账号，拥有所有权限',
    },
  ];

  // API 接口分类
  const apiCategories = [
    {
      key: 'auth',
      label: '认证相关',
      apis: [
        { method: 'POST', path: '/auth/login', description: '用户登录获取Token', auth: false },
        { method: 'POST', path: '/auth/register', description: '用户注册', auth: false },
        { method: 'GET', path: '/auth/profile', description: '获取当前用户信息', auth: true },
      ],
    },
    {
      key: 'users',
      label: '用户管理',
      apis: [
        { method: 'GET', path: '/users', description: '获取用户列表（支持分页、筛选）', auth: true },
        { method: 'GET', path: '/users/:id', description: '获取用户详情', auth: true },
        { method: 'POST', path: '/users', description: '创建用户', auth: true },
        { method: 'PUT', path: '/users/:id', description: '更新用户信息', auth: true },
        { method: 'DELETE', path: '/users/:id', description: '删除用户', auth: true },
      ],
    },
    {
      key: 'campus',
      label: '园区管理',
      apis: [
        { method: 'GET', path: '/campus', description: '获取园区列表', auth: true },
        { method: 'GET', path: '/campus/:id', description: '获取园区详情', auth: true },
        { method: 'POST', path: '/campus', description: '创建园区', auth: true },
        { method: 'PUT', path: '/campus/:id', description: '更新园区信息', auth: true },
        { method: 'DELETE', path: '/campus/:id', description: '删除园区', auth: true },
      ],
    },
    {
      key: 'classes',
      label: '班级管理',
      apis: [
        { method: 'GET', path: '/classes', description: '获取班级列表', auth: true },
        { method: 'GET', path: '/classes/:id', description: '获取班级详情', auth: true },
        { method: 'POST', path: '/classes', description: '创建班级', auth: true },
        { method: 'PUT', path: '/classes/:id', description: '更新班级信息', auth: true },
        { method: 'DELETE', path: '/classes/:id', description: '删除班级', auth: true },
      ],
    },
    {
      key: 'students',
      label: '学生管理',
      apis: [
        { method: 'GET', path: '/students', description: '获取学生列表', auth: true },
        { method: 'GET', path: '/students/:id', description: '获取学生详情', auth: true },
        { method: 'POST', path: '/students', description: '创建学生', auth: true },
        { method: 'PUT', path: '/students/:id', description: '更新学生信息', auth: true },
        { method: 'DELETE', path: '/students/:id', description: '删除学生', auth: true },
      ],
    },
    {
      key: 'positions',
      label: '职位管理',
      apis: [
        { method: 'GET', path: '/positions', description: '获取职位列表', auth: true },
        { method: 'POST', path: '/positions', description: '创建职位', auth: true },
        { method: 'PUT', path: '/positions/:id', description: '更新职位', auth: true },
        { method: 'DELETE', path: '/positions/:id', description: '删除职位', auth: true },
      ],
    },
    {
      key: 'daily-observation',
      label: '每日观察记录',
      apis: [
        { method: 'GET', path: '/records/daily-observation', description: '获取每日观察记录列表', auth: true },
        { method: 'GET', path: '/records/daily-observation/:id', description: '获取记录详情', auth: true },
        { method: 'POST', path: '/records/daily-observation', description: '创建每日观察记录', auth: true },
        { method: 'PUT', path: '/records/daily-observation/:id', description: '更新记录', auth: true },
        { method: 'DELETE', path: '/records/daily-observation/:id', description: '删除记录', auth: true },
      ],
    },
    {
      key: 'duty-report',
      label: '值班播报记录',
      apis: [
        { method: 'GET', path: '/records/duty-report', description: '获取值班播报记录列表', auth: true },
        { method: 'GET', path: '/records/duty-report/:id', description: '获取记录详情', auth: true },
        { method: 'POST', path: '/records/duty-report', description: '创建值班播报记录', auth: true },
        { method: 'PUT', path: '/records/duty-report/:id', description: '更新记录', auth: true },
        { method: 'DELETE', path: '/records/duty-report/:id', description: '删除记录', auth: true },
      ],
    },
    {
      key: 'growth-records',
      label: '成长档案',
      apis: [
        { method: 'GET', path: '/growth-records', description: '获取成长档案列表', auth: true },
        { method: 'GET', path: '/growth-records/:id', description: '获取档案详情', auth: true },
        { method: 'POST', path: '/growth-records', description: '创建成长档案', auth: true },
        { method: 'PUT', path: '/growth-records/:id', description: '更新档案', auth: true },
        { method: 'DELETE', path: '/growth-records/:id', description: '删除档案', auth: true },
      ],
    },
    {
      key: 'menu',
      label: '菜谱管理',
      apis: [
        { method: 'GET', path: '/menus', description: '获取菜谱列表', auth: true },
        { method: 'GET', path: '/menus/:id', description: '获取菜谱详情', auth: true },
        { method: 'POST', path: '/menus', description: '创建菜谱', auth: true },
        { method: 'PUT', path: '/menus/:id', description: '更新菜谱', auth: true },
        { method: 'DELETE', path: '/menus/:id', description: '删除菜谱', auth: true },
      ],
    },
    {
      key: 'ingredients',
      label: '食材管理',
      apis: [
        { method: 'GET', path: '/ingredients', description: '获取食材列表', auth: true },
        { method: 'POST', path: '/ingredients', description: '创建食材', auth: true },
        { method: 'PUT', path: '/ingredients/:id', description: '更新食材', auth: true },
        { method: 'DELETE', path: '/ingredients/:id', description: '删除食材', auth: true },
      ],
    },
    {
      key: 'purchase',
      label: '采购计划',
      apis: [
        { method: 'GET', path: '/purchase-plans', description: '获取采购计划列表', auth: true },
        { method: 'GET', path: '/purchase-plans/:id', description: '获取采购计划详情', auth: true },
        { method: 'POST', path: '/purchase-plans', description: '创建采购计划', auth: true },
        { method: 'PUT', path: '/purchase-plans/:id', description: '更新采购计划', auth: true },
      ],
    },
    {
      key: 'forms',
      label: '表单系统',
      apis: [
        { method: 'GET', path: '/form-templates', description: '获取表单模板列表', auth: true },
        { method: 'GET', path: '/form-templates/:id', description: '获取表单模板详情', auth: true },
        { method: 'POST', path: '/form-templates', description: '创建表单模板', auth: true },
        { method: 'GET', path: '/form-submissions', description: '获取表单提交列表', auth: true },
        { method: 'POST', path: '/form-submissions', description: '提交表单', auth: true },
      ],
    },
  ];

  const apiColumns = [
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method: string) => {
        const colors: Record<string, string> = {
          GET: 'green',
          POST: 'blue',
          PUT: 'orange',
          DELETE: 'red',
        };
        return <Tag color={colors[method]}>{method}</Tag>;
      },
    },
    {
      title: 'API路径',
      dataIndex: 'path',
      key: 'path',
      width: 350,
      render: (path: string) => (
        <code style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>
          {path}
        </code>
      ),
    },
    { title: '说明', dataIndex: 'description', key: 'description' },
    {
      title: '认证',
      dataIndex: 'auth',
      key: 'auth',
      width: 80,
      render: (auth: boolean) =>
        auth ? <Tag color="orange">需要</Tag> : <Tag>公开</Tag>,
    },
  ];

  // 代码示例
  const baseUrl = currentEndpoint?.baseUrl || apiEndpoints[0].baseUrl;

  const loginExample = `// 1. 登录获取 Token
const response = await fetch('${baseUrl}/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@beichen.com',
    password: 'admin123'
  })
});

const data = await response.json();
const token = data.access_token;

console.log('Token:', token);
console.log('User:', data.user);`;

  const getDataExample = `// 2. 使用 Token 获取数据
const token = 'your-token-here';

// 获取用户列表（教师）
const users = await fetch('${baseUrl}/users?role=TEACHER&page=1&pageSize=20', {
  headers: {
    'Authorization': \`Bearer \${token}\`
  }
}).then(r => r.json());

// 获取园区列表
const campuses = await fetch('${baseUrl}/campus', {
  headers: {
    'Authorization': \`Bearer \${token}\`
  }
}).then(r => r.json());

// 获取班级列表
const classes = await fetch('${baseUrl}/classes', {
  headers: {
    'Authorization': \`Bearer \${token}\`
  }
}).then(r => r.json());`;

  const createRecordExample = `// 3. 创建每日观察记录
const record = await fetch('${baseUrl}/records/daily-observation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${token}\`
  },
  body: JSON.stringify({
    date: '2025-11-19',
    weather: '晴天',
    teacherId: 'teacher-uuid',
    classId: 'class-uuid',
    campusId: 'campus-uuid',
    timeline: [
      { time: '08:00', activity: '晨间接待', description: '迎接幼儿入园' },
      { time: '09:00', activity: '早餐', description: '组织用餐' },
      { time: '10:00', activity: '学习活动', description: '开展主题活动' }
    ],
    lifeActivity: '生活活动观察内容...',
    outdoorActivity: '户外活动观察内容...',
    learningActivity: '学习活动观察内容...',
    gameActivity: '游戏活动观察内容...',
    homeCooperation: '家园共育内容...'
  })
}).then(r => r.json());

console.log('创建成功:', record);`;

  const pythonExample = `# Python 示例
import requests

# 1. 登录获取 Token
login_url = '${baseUrl}/auth/login'
login_data = {
    'email': 'admin@beichen.com',
    'password': 'admin123'
}

response = requests.post(login_url, json=login_data)
token = response.json()['access_token']

# 2. 使用 Token 获取数据
headers = {
    'Authorization': f'Bearer {token}'
}

# 获取用户列表
users = requests.get('${baseUrl}/users?role=TEACHER', headers=headers).json()

# 获取园区列表
campuses = requests.get('${baseUrl}/campus', headers=headers).json()

# 3. 创建每日观察记录
record_data = {
    'date': '2025-11-19',
    'weather': '晴天',
    'teacherId': 'teacher-uuid',
    'classId': 'class-uuid',
    'campusId': 'campus-uuid',
    'timeline': [
        {'time': '08:00', 'activity': '晨间接待', 'description': '迎接幼儿入园'}
    ],
    'lifeActivity': '生活活动观察...',
    'outdoorActivity': '户外活动观察...'
}

record = requests.post(
    '${baseUrl}/records/daily-observation',
    headers=headers,
    json=record_data
).json()

print('创建成功:', record)`;

  const curlExample = `# cURL 测试示例

# 1. 登录获取Token
curl -X POST ${baseUrl}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@beichen.com","password":"admin123"}'

# 2. 获取园区列表（需要Token）
TOKEN="你的access_token"
curl -H "Authorization: Bearer $TOKEN" \\
  ${baseUrl}/campus

# 3. 获取教师列表
curl -H "Authorization: Bearer $TOKEN" \\
  "${baseUrl}/users?role=TEACHER&pageSize=1000"

# 4. 创建每日观察记录
curl -X POST ${baseUrl}/records/daily-observation \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "date": "2025-11-19",
    "weather": "晴天",
    "teacherId": "teacher-uuid",
    "classId": "class-uuid",
    "lifeActivity": "观察内容..."
  }'`;

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <ApiOutlined /> API 接口文档
      </Title>
      <Paragraph type="secondary">
        本文档提供系统 API 接口信息，支持域名访问（nginx代理）和内网直连两种方式，方便外部系统和服务接入。
      </Paragraph>

      <Alert
        message="多种接入方式"
        description="系统提供域名访问（nginx统一端口8828）和内网直连（8891端口）两种方式。域名访问无跨域问题，内网直连速度更快。所有接口均采用RESTful规范，返回JSON格式数据。"
        type="info"
        showIcon
        icon={<GlobalOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Tabs
        defaultActiveKey="overview"
        items={[
          {
            key: 'overview',
            label: '📖 接入指南',
            children: (
              <>
                {/* API访问地址 */}
                <Card title="🌐 API 访问地址" style={{ marginBottom: 24 }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div>
                      <Text strong>选择访问方式：</Text>
                      <Select
                        style={{ width: 300, marginLeft: 16 }}
                        value={selectedEndpoint}
                        onChange={setSelectedEndpoint}
                        options={apiEndpoints.map(e => ({
                          label: e.label,
                          value: e.value,
                        }))}
                      />
                    </div>

                    <Alert
                      message={currentEndpoint?.label}
                      description={currentEndpoint?.description}
                      type="success"
                      showIcon
                    />

                    <Descriptions bordered column={1}>
                      <Descriptions.Item label="API Base URL">
                        <Space>
                          <code style={{ background: '#f5f5f5', padding: '4px 12px', borderRadius: 4, fontSize: 14 }}>
                            {currentEndpoint?.baseUrl}
                          </code>
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => copyToClipboard(currentEndpoint?.baseUrl || '')}
                          >
                            复制
                          </Button>
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="前端地址">
                        <Space>
                          <code style={{ background: '#f5f5f5', padding: '4px 12px', borderRadius: 4, fontSize: 14 }}>
                            {currentEndpoint?.frontendUrl}
                          </code>
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => copyToClipboard(currentEndpoint?.frontendUrl || '')}
                          >
                            复制
                          </Button>
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="认证方式">
                        JWT Bearer Token
                      </Descriptions.Item>
                      <Descriptions.Item label="Content-Type">
                        application/json
                      </Descriptions.Item>
                      <Descriptions.Item label="字符编码">
                        UTF-8
                      </Descriptions.Item>
                    </Descriptions>

                    <Alert
                      message="认证说明"
                      description="除登录、注册等公开接口外，所有API请求都需要在请求头中添加：Authorization: Bearer <token>"
                      type="warning"
                      showIcon
                    />
                  </Space>
                </Card>

                {/* 所有访问地址 */}
                <Card title="📍 访问地址对照表" style={{ marginBottom: 24 }}>
                  <Table
                    dataSource={apiEndpoints}
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '访问方式', dataIndex: 'label', key: 'label', width: 150 },
                      {
                        title: '前端地址',
                        dataIndex: 'frontendUrl',
                        key: 'frontendUrl',
                        width: 280,
                        render: (url: string) => (
                          <Space>
                            <code style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>
                              {url}
                            </code>
                            <CopyOutlined
                              style={{ cursor: 'pointer', color: '#1890ff' }}
                              onClick={() => copyToClipboard(url)}
                            />
                          </Space>
                        ),
                      },
                      {
                        title: 'API地址',
                        dataIndex: 'baseUrl',
                        key: 'baseUrl',
                        width: 300,
                        render: (url: string) => (
                          <Space>
                            <code style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>
                              {url}
                            </code>
                            <CopyOutlined
                              style={{ cursor: 'pointer', color: '#1890ff' }}
                              onClick={() => copyToClipboard(url)}
                            />
                          </Space>
                        ),
                      },
                      { title: '说明', dataIndex: 'description', key: 'description' },
                    ]}
                  />
                </Card>

                {/* 网络架构说明 */}
                <Card title="🏗️ 网络架构说明" style={{ marginBottom: 24 }}>
                  <Alert
                    message="nginx反向代理架构"
                    description="外网访问通过nginx反向代理，前端和API统一在8828端口，无跨域问题。内网访问可直连8891端口，速度更快。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <pre
                    style={{
                      background: '#f5f5f5',
                      padding: 16,
                      borderRadius: 4,
                      overflow: 'auto',
                      fontSize: 13,
                    }}
                  >
{`外网用户
  ↓
beichen.706tech.cn:8828
  ↓
nginx反向代理服务器
  ├─ /           → Tailscale(100.85.113.25:8828) → 本地前端
  └─ /api/       → Tailscale(100.85.113.25:8891) → 本地API

内网用户
  ↓
192.168.88.228:8828 → 本地前端
192.168.88.228:8891 → 本地API（直连，速度快）

优势：
✅ 前端和API同源，无跨域问题
✅ 只需开放一个端口（8828）
✅ 外网访问通过nginx统一代理
✅ 内网访问直连8891，速度更快`}
                  </pre>
                </Card>

                {/* 数据库连接信息 */}
                <Card title="🗄️ 数据库连接信息" style={{ marginBottom: 24 }}>
                  <Alert
                    message="直接数据库访问"
                    description="如需直接访问数据库，可使用以下连接信息。建议优先使用API接口，更安全可控。"
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Descriptions bordered column={1}>
                    <Descriptions.Item label="数据库类型">{dbInfo.type}</Descriptions.Item>
                    <Descriptions.Item label="主机地址">{dbInfo.host}</Descriptions.Item>
                    <Descriptions.Item label="端口">{dbInfo.port}</Descriptions.Item>
                    <Descriptions.Item label="数据库名">{dbInfo.database}</Descriptions.Item>
                    <Descriptions.Item label="用户名">{dbInfo.username}</Descriptions.Item>
                    <Descriptions.Item label="密码">{dbInfo.password}</Descriptions.Item>
                    <Descriptions.Item label="连接字符串">
                      <Space>
                        <code style={{ background: '#f5f5f5', padding: '4px 12px', borderRadius: 4 }}>
                          {dbInfo.connectionString}
                        </code>
                        <Button
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => copyToClipboard(dbInfo.connectionString)}
                        >
                          复制
                        </Button>
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {/* 测试账号 */}
                <Card title="🔑 测试账号" style={{ marginBottom: 24 }}>
                  <Alert
                    message="API测试专用账号"
                    description="以下账号仅用于API测试和外部系统接入，请妥善保管。"
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  {testAccounts.map((account, index) => (
                    <Card key={index} size="small" style={{ marginBottom: 16 }}>
                      <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="邮箱">
                          <Space>
                            <code style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>
                              {account.email}
                            </code>
                            <CopyOutlined
                              style={{ cursor: 'pointer', color: '#1890ff' }}
                              onClick={() => copyToClipboard(account.email)}
                            />
                          </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="密码">
                          <Space>
                            <code style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>
                              {account.password}
                            </code>
                            <CopyOutlined
                              style={{ cursor: 'pointer', color: '#1890ff' }}
                              onClick={() => copyToClipboard(account.password)}
                            />
                          </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="角色">
                          <Tag color="red">{account.role}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="说明">
                          {account.description}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  ))}
                </Card>
              </>
            ),
          },
          {
            key: 'apis',
            label: '📚 API 接口列表',
            children: (
              <>
                {apiCategories.map((category) => (
                  <Card
                    key={category.key}
                    title={category.label}
                    style={{ marginBottom: 24 }}
                  >
                    <Table
                      dataSource={category.apis}
                      columns={apiColumns}
                      pagination={false}
                      rowKey="path"
                      size="small"
                    />
                  </Card>
                ))}
              </>
            ),
          },
          {
            key: 'examples',
            label: '💻 代码示例',
            children: (
              <>
                <Alert
                  message={`当前使用：${currentEndpoint?.label}`}
                  description="代码示例会根据您选择的访问方式自动更新API地址"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Card title="JavaScript / TypeScript 示例" style={{ marginBottom: 24 }}>
                  <Card type="inner" title="1. 登录获取 Token" style={{ marginBottom: 16 }}>
                    <pre
                      style={{
                        background: '#282c34',
                        color: '#abb2bf',
                        padding: 16,
                        borderRadius: 4,
                        overflow: 'auto',
                        fontSize: 13,
                      }}
                    >
                      {loginExample}
                    </pre>
                  </Card>

                  <Card type="inner" title="2. 获取数据" style={{ marginBottom: 16 }}>
                    <pre
                      style={{
                        background: '#282c34',
                        color: '#abb2bf',
                        padding: 16,
                        borderRadius: 4,
                        overflow: 'auto',
                        fontSize: 13,
                      }}
                    >
                      {getDataExample}
                    </pre>
                  </Card>

                  <Card type="inner" title="3. 创建每日观察记录">
                    <pre
                      style={{
                        background: '#282c34',
                        color: '#abb2bf',
                        padding: 16,
                        borderRadius: 4,
                        overflow: 'auto',
                        fontSize: 13,
                      }}
                    >
                      {createRecordExample}
                    </pre>
                  </Card>
                </Card>

                <Card title="Python 示例" style={{ marginBottom: 24 }}>
                  <pre
                    style={{
                      background: '#282c34',
                      color: '#abb2bf',
                      padding: 16,
                      borderRadius: 4,
                      overflow: 'auto',
                      fontSize: 13,
                    }}
                  >
                    {pythonExample}
                  </pre>
                </Card>

                <Card title="cURL 测试命令">
                  <pre
                    style={{
                      background: '#282c34',
                      color: '#abb2bf',
                      padding: 16,
                      borderRadius: 4,
                      overflow: 'auto',
                      fontSize: 13,
                    }}
                  >
                    {curlExample}
                  </pre>
                </Card>
              </>
            ),
          },
          {
            key: 'models',
            label: '📋 数据模型',
            children: (
              <>
                <Card title="每日观察记录 (DailyObservation)" style={{ marginBottom: 24 }}>
                  <pre
                    style={{
                      background: '#f5f5f5',
                      padding: 16,
                      borderRadius: 4,
                      overflow: 'auto',
                      fontSize: 13,
                    }}
                  >
{`{
  id: string,              // UUID
  date: string,            // 日期 "YYYY-MM-DD"
  weather: string,         // 天气
  teacherId: string,       // 教师ID (UUID)
  classId: string,         // 班级ID (UUID)
  campusId?: string,       // 园区ID (UUID, 可选)

  // 时间线记录
  timeline?: Array<{
    time: string,          // "HH:mm"
    activity: string,      // 活动名称
    description: string    // 活动描述
  }>,

  // 各项活动记录 (均为可选)
  lifeActivity?: string,      // 生活活动
  outdoorActivity?: string,   // 户外运动
  learningActivity?: string,  // 学习活动
  gameActivity?: string,      // 游戏活动
  wonderfulMoment?: string,   // 精彩瞬间
  homeCooperation?: string,   // 家园共育

  createdAt: string,       // 创建时间
  updatedAt: string        // 更新时间
}`}
                  </pre>
                </Card>

                <Card title="值班播报记录 (DutyReport)" style={{ marginBottom: 24 }}>
                  <pre
                    style={{
                      background: '#f5f5f5',
                      padding: 16,
                      borderRadius: 4,
                      overflow: 'auto',
                      fontSize: 13,
                    }}
                  >
{`{
  id: string,              // UUID
  date: string,            // 日期 "YYYY-MM-DD"
  weather: string,         // 天气
  dutyLeader: string,      // 值班领导姓名
  dutyLeaderId: string,    // 值班领导ID (UUID)
  campusId: string,        // 园区ID (UUID)

  // 播报内容 (均为可选)
  attendance?: string,        // 出勤情况
  entryExit?: string,         // 入园离园
  learningActivity?: string,  // 学习活动
  areaActivity?: string,      // 区域活动
  outdoorActivity?: string,   // 户外活动
  lifeActivity?: string,      // 生活活动
  notice?: string,            // 温馨提示
  safety?: string,            // 校园安全
  other?: string,             // 其他事项

  createdAt: string,       // 创建时间
  updatedAt: string        // 更新时间
}`}
                  </pre>
                </Card>

                <Card title="用户 (User)">
                  <pre
                    style={{
                      background: '#f5f5f5',
                      padding: 16,
                      borderRadius: 4,
                      overflow: 'auto',
                      fontSize: 13,
                    }}
                  >
{`{
  id: string,              // UUID
  email: string,           // 邮箱（唯一）
  name: string,            // 姓名
  phone?: string,          // 电话
  idCard?: string,         // 身份证号
  role: string,            // 角色: ADMIN | TEACHER | PARENT
  avatar?: string,         // 头像URL
  isActive: boolean,       // 是否启用
  gender?: string,         // 性别
  birthday?: string,       // 生日
  hireDate?: string,       // 入职日期

  // 关联信息
  campusId?: string,       // 所属园区ID
  positionId?: string,     // 职位ID
  campus?: {               // 园区信息
    id: string,
    name: string,
    address: string,
    phone: string
  },
  position?: {             // 职位信息
    id: string,
    name: string,
    type: string,
    level: number
  },

  // 银行信息
  bankAccount?: string,    // 银行卡号
  bankName?: string,       // 开户行
  workplace?: string,      // 工作单位

  createdAt: string,       // 创建时间
  updatedAt: string        // 更新时间
}`}
                  </pre>
                </Card>
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
