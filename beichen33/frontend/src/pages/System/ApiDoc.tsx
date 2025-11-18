import { Card, Table, Typography, Divider, Tag, Tabs, Alert, Space } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { message } from 'antd';

const { Title, Text, Paragraph } = Typography;

export default function ApiDoc() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  };

  // 数据库连接信息
  const dbInfo = {
    type: 'PostgreSQL',
    host: 'localhost',
    port: '5432',
    database: 'kindergarten',
    username: 'postgres',
    password: 'postgres',
    connectionString: 'postgresql://postgres:postgres@localhost:5432/kindergarten?schema=public',
  };

  // API 基础信息
  const apiBaseInfo = {
    baseUrl: 'http://localhost:8891/api',
    authType: 'JWT Bearer Token',
    contentType: 'application/json',
  };

  // 测试账号信息
  const testAccount = {
    email: 'admin@beichen.com',
    password: 'admin123',
  };

  // 每日观察记录 API
  const dailyObservationApiColumns = [
    { title: '方法', dataIndex: 'method', key: 'method', width: 80,
      render: (method: string) => {
        const colors: Record<string, string> = { GET: 'green', POST: 'blue', PUT: 'orange', DELETE: 'red' };
        return <Tag color={colors[method]}>{method}</Tag>;
      }
    },
    { title: '路径', dataIndex: 'path', key: 'path', width: 300 },
    { title: '说明', dataIndex: 'description', key: 'description' },
    { title: '认证', dataIndex: 'auth', key: 'auth', width: 80,
      render: (auth: boolean) => auth ? <Tag color="orange">需要</Tag> : <Tag>不需要</Tag>
    },
  ];

  const dailyObservationApis = [
    { method: 'POST', path: '/records/daily-observation', description: '创建每日观察记录', auth: true },
    { method: 'GET', path: '/records/daily-observation', description: '获取每日观察记录列表', auth: true },
    { method: 'GET', path: '/records/daily-observation/:id', description: '获取单条记录详情', auth: true },
    { method: 'PUT', path: '/records/daily-observation/:id', description: '更新记录', auth: true },
    { method: 'DELETE', path: '/records/daily-observation/:id', description: '删除记录', auth: true },
  ];

  // 关联数据 API
  const relatedApis = [
    { method: 'GET', path: '/campus', description: '获取园区列表', auth: true },
    { method: 'GET', path: '/classes', description: '获取班级列表', auth: true },
    { method: 'GET', path: '/users?role=TEACHER', description: '获取教师列表', auth: true },
    { method: 'POST', path: '/auth/login', description: '用户登录获取Token', auth: false },
  ];

  // 值班播报 API
  const dutyReportApis = [
    { method: 'POST', path: '/records/duty-report', description: '创建值班播报记录', auth: true },
    { method: 'GET', path: '/records/duty-report', description: '获取值班播报记录列表', auth: true },
    { method: 'GET', path: '/records/duty-report/:id', description: '获取单条记录详情', auth: true },
    { method: 'PUT', path: '/records/duty-report/:id', description: '更新记录', auth: true },
    { method: 'DELETE', path: '/records/duty-report/:id', description: '删除记录', auth: true },
  ];

  // 数据模型
  const dailyObservationModel = `{
  // 必填字段
  date: string,           // 日期 "YYYY-MM-DD"
  weather: string,        // 天气 "☀️ 晴天"
  teacherId: string,      // 教师ID (UUID)
  classId: string,        // 班级ID (UUID)

  // 可选字段
  campusId?: string,      // 园区ID (UUID)
  timeline?: Array<{      // 时间日志
    time: string,         // "HH:mm"
    event: string         // 活动内容
  }>,

  // 观察要点 (可选)
  lifeActivity?: string,      // 生活活动
  outdoorActivity?: string,   // 户外运动
  learningActivity?: string,  // 学习活动
  gameActivity?: string,      // 游戏活动
  wonderfulMoment?: string,   // 精彩瞬间
  homeCooperation?: string    // 家园共育
}`;

  const dutyReportModel = `{
  // 必填字段
  date: string,           // 日期 "YYYY-MM-DD"
  weather: string,        // 天气 "☀️ 晴天"
  dutyLeaderId: string,   // 值班领导ID (UUID)
  campusId: string,       // 园区ID (UUID)

  // 可选字段 (播报内容)
  attendance?: string,        // 出勤情况
  entryExit?: string,         // 入园离园
  learningActivity?: string,  // 学习活动
  areaActivity?: string,      // 区域活动
  outdoorActivity?: string,   // 户外活动
  lifeActivity?: string,      // 生活活动
  notice?: string,            // 温馨提示
  safety?: string,            // 校园安全
  other?: string              // 其他事项
}`;

  // 示例代码
  const loginExample = `// 1. 登录获取 Token
const loginRes = await fetch('http://localhost:8891/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@beichen.com',
    password: 'admin123'
  })
});
const { access_token } = await loginRes.json();`;

  const createDailyObservationExample = `// 2. 创建每日观察记录
const res = await fetch('http://localhost:8891/api/records/daily-observation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${access_token}\`
  },
  body: JSON.stringify({
    date: '2025-11-18',
    weather: '☀️ 晴天',
    teacherId: 'teacher-uuid-here',
    classId: 'class-uuid-here',
    campusId: 'campus-uuid-here',
    timeline: [
      { time: '08:00', event: '晨检入园' },
      { time: '09:00', event: '早餐' },
      { time: '10:00', event: '学习活动' }
    ],
    lifeActivity: '今日生活活动记录...',
    outdoorActivity: '户外运动情况...',
    learningActivity: '学习活动情况...'
  })
});
const result = await res.json();`;

  const getRelatedDataExample = `// 3. 获取关联数据 (园区、班级、教师)
const headers = {
  'Authorization': \`Bearer \${access_token}\`
};

// 获取园区列表
const campuses = await fetch('http://localhost:8891/api/campus', { headers })
  .then(r => r.json());

// 获取班级列表
const classes = await fetch('http://localhost:8891/api/classes', { headers })
  .then(r => r.json());

// 获取教师列表
const teachers = await fetch('http://localhost:8891/api/users?role=TEACHER&pageSize=1000', { headers })
  .then(r => r.json());`;

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>API 接口文档</Title>
      <Paragraph type="secondary">
        本文档提供系统 API 接口信息，方便外部系统接入数据。
      </Paragraph>

      <Tabs
        defaultActiveKey="overview"
        items={[
          {
            key: 'overview',
            label: '概览',
            children: (
              <>
                {/* 数据库连接信息 */}
                <Card title="数据库连接信息" style={{ marginBottom: 24 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px 16px', background: '#fafafa', width: 150, border: '1px solid #f0f0f0' }}>
                          <Text strong>数据库类型</Text>
                        </td>
                        <td style={{ padding: '8px 16px', border: '1px solid #f0f0f0' }}>{dbInfo.type}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 16px', background: '#fafafa', border: '1px solid #f0f0f0' }}>
                          <Text strong>主机</Text>
                        </td>
                        <td style={{ padding: '8px 16px', border: '1px solid #f0f0f0' }}>{dbInfo.host}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 16px', background: '#fafafa', border: '1px solid #f0f0f0' }}>
                          <Text strong>端口</Text>
                        </td>
                        <td style={{ padding: '8px 16px', border: '1px solid #f0f0f0' }}>{dbInfo.port}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 16px', background: '#fafafa', border: '1px solid #f0f0f0' }}>
                          <Text strong>数据库名</Text>
                        </td>
                        <td style={{ padding: '8px 16px', border: '1px solid #f0f0f0' }}>{dbInfo.database}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 16px', background: '#fafafa', border: '1px solid #f0f0f0' }}>
                          <Text strong>用户名</Text>
                        </td>
                        <td style={{ padding: '8px 16px', border: '1px solid #f0f0f0' }}>{dbInfo.username}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 16px', background: '#fafafa', border: '1px solid #f0f0f0' }}>
                          <Text strong>密码</Text>
                        </td>
                        <td style={{ padding: '8px 16px', border: '1px solid #f0f0f0' }}>{dbInfo.password}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 16px', background: '#fafafa', border: '1px solid #f0f0f0' }}>
                          <Text strong>连接字符串</Text>
                        </td>
                        <td style={{ padding: '8px 16px', border: '1px solid #f0f0f0' }}>
                          <Space>
                            <code style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>
                              {dbInfo.connectionString}
                            </code>
                            <CopyOutlined
                              style={{ cursor: 'pointer', color: '#1890ff' }}
                              onClick={() => copyToClipboard(dbInfo.connectionString)}
                            />
                          </Space>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Card>

                {/* API 基础信息 */}
                <Card title="API 基础信息" style={{ marginBottom: 24 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px 16px', background: '#fafafa', width: 150, border: '1px solid #f0f0f0' }}>
                          <Text strong>Base URL</Text>
                        </td>
                        <td style={{ padding: '8px 16px', border: '1px solid #f0f0f0' }}>
                          <Space>
                            <code style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>
                              {apiBaseInfo.baseUrl}
                            </code>
                            <CopyOutlined
                              style={{ cursor: 'pointer', color: '#1890ff' }}
                              onClick={() => copyToClipboard(apiBaseInfo.baseUrl)}
                            />
                          </Space>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 16px', background: '#fafafa', border: '1px solid #f0f0f0' }}>
                          <Text strong>认证方式</Text>
                        </td>
                        <td style={{ padding: '8px 16px', border: '1px solid #f0f0f0' }}>{apiBaseInfo.authType}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 16px', background: '#fafafa', border: '1px solid #f0f0f0' }}>
                          <Text strong>Content-Type</Text>
                        </td>
                        <td style={{ padding: '8px 16px', border: '1px solid #f0f0f0' }}>{apiBaseInfo.contentType}</td>
                      </tr>
                    </tbody>
                  </table>

                  <Alert
                    message="认证说明"
                    description="所有需要认证的接口，请在请求头中添加：Authorization: Bearer <token>"
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                </Card>

                {/* 测试账号 */}
                <Card title="测试账号" style={{ marginBottom: 24 }}>
                  <Alert
                    message="以下账号可用于API测试和外部系统接入"
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px 16px', background: '#fafafa', width: 150, border: '1px solid #f0f0f0' }}>
                          <Text strong>邮箱</Text>
                        </td>
                        <td style={{ padding: '8px 16px', border: '1px solid #f0f0f0' }}>
                          <Space>
                            <code style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>
                              {testAccount.email}
                            </code>
                            <CopyOutlined
                              style={{ cursor: 'pointer', color: '#1890ff' }}
                              onClick={() => copyToClipboard(testAccount.email)}
                            />
                          </Space>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 16px', background: '#fafafa', border: '1px solid #f0f0f0' }}>
                          <Text strong>密码</Text>
                        </td>
                        <td style={{ padding: '8px 16px', border: '1px solid #f0f0f0' }}>
                          <Space>
                            <code style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>
                              {testAccount.password}
                            </code>
                            <CopyOutlined
                              style={{ cursor: 'pointer', color: '#1890ff' }}
                              onClick={() => copyToClipboard(testAccount.password)}
                            />
                          </Space>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 16px', background: '#fafafa', border: '1px solid #f0f0f0' }}>
                          <Text strong>角色</Text>
                        </td>
                        <td style={{ padding: '8px 16px', border: '1px solid #f0f0f0' }}>
                          <Tag color="red">管理员 (ADMIN)</Tag>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Card>
              </>
            ),
          },
          {
            key: 'daily-observation',
            label: '每日观察记录',
            children: (
              <>
                <Card title="API 接口列表" style={{ marginBottom: 24 }}>
                  <Table
                    dataSource={dailyObservationApis}
                    columns={dailyObservationApiColumns}
                    pagination={false}
                    rowKey="path"
                    size="small"
                  />
                </Card>

                <Card title="数据模型" style={{ marginBottom: 24 }}>
                  <pre style={{
                    background: '#f5f5f5',
                    padding: 16,
                    borderRadius: 4,
                    overflow: 'auto',
                    fontSize: 13
                  }}>
                    {dailyObservationModel}
                  </pre>
                </Card>

                <Card title="关联数据接口">
                  <Table
                    dataSource={relatedApis}
                    columns={dailyObservationApiColumns}
                    pagination={false}
                    rowKey="path"
                    size="small"
                  />
                </Card>
              </>
            ),
          },
          {
            key: 'duty-report',
            label: '值班播报记录',
            children: (
              <>
                <Card title="API 接口列表" style={{ marginBottom: 24 }}>
                  <Table
                    dataSource={dutyReportApis}
                    columns={dailyObservationApiColumns}
                    pagination={false}
                    rowKey="path"
                    size="small"
                  />
                </Card>

                <Card title="数据模型">
                  <pre style={{
                    background: '#f5f5f5',
                    padding: 16,
                    borderRadius: 4,
                    overflow: 'auto',
                    fontSize: 13
                  }}>
                    {dutyReportModel}
                  </pre>
                </Card>
              </>
            ),
          },
          {
            key: 'examples',
            label: '代码示例',
            children: (
              <>
                <Card title="1. 登录获取 Token" style={{ marginBottom: 24 }}>
                  <pre style={{
                    background: '#282c34',
                    color: '#abb2bf',
                    padding: 16,
                    borderRadius: 4,
                    overflow: 'auto',
                    fontSize: 13
                  }}>
                    {loginExample}
                  </pre>
                </Card>

                <Card title="2. 创建每日观察记录" style={{ marginBottom: 24 }}>
                  <pre style={{
                    background: '#282c34',
                    color: '#abb2bf',
                    padding: 16,
                    borderRadius: 4,
                    overflow: 'auto',
                    fontSize: 13
                  }}>
                    {createDailyObservationExample}
                  </pre>
                </Card>

                <Card title="3. 获取关联数据">
                  <pre style={{
                    background: '#282c34',
                    color: '#abb2bf',
                    padding: 16,
                    borderRadius: 4,
                    overflow: 'auto',
                    fontSize: 13
                  }}>
                    {getRelatedDataExample}
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
