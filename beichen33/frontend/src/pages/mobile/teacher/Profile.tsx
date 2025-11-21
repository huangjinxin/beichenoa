import { List, Avatar, Dialog, Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth';
import MobileLayout from '../../../components/mobile/MobileLayout';
import {
  UserOutline,
  PhoneFill,
  EnvironmentOutline,
  StarOutline,
  SetOutline,
} from 'antd-mobile-icons';
import './Profile.css';

export default function TeacherProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    const result = await Dialog.confirm({
      content: '确定要退出登录吗？',
    });

    if (result) {
      logout();
      Toast.show({
        icon: 'success',
        content: '已退出登录',
      });
      navigate('/login', { replace: true });
    }
  };

  return (
    <MobileLayout role="teacher">
      <div className="teacher-profile">
        {/* 用户信息卡片 */}
        <div className="profile-header">
          <Avatar
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
            style={{ '--size': '80px' } as any}
          />
          <div className="profile-info">
            <div className="profile-name">{user?.name}</div>
            <div className="profile-role">
              {user?.position?.name || '教师'}
            </div>
          </div>
        </div>

        {/* 个人信息列表 */}
        <List header="个人信息">
          <List.Item prefix={<UserOutline />} extra={user?.email}>
            邮箱
          </List.Item>
          <List.Item prefix={<PhoneFill />} extra={user?.phone || '未设置'}>
            手机号
          </List.Item>
          <List.Item prefix={<EnvironmentOutline />} extra={user?.campus?.name}>
            所属校区
          </List.Item>
          {user?.classes && user.classes.length > 0 && (
            <List.Item
              prefix={<StarOutline />}
              extra={user.classes.map((c: any) => c.name).join('、')}
            >
              负责班级
            </List.Item>
          )}
        </List>

        {/* 设置列表 */}
        <List header="设置">
          <List.Item
            prefix={<SetOutline />}
            onClick={() => Toast.show('功能开发中')}
            clickable
          >
            修改密码
          </List.Item>
        </List>

        {/* 退出登录按钮 */}
        <div className="profile-logout">
          <div className="logout-button" onClick={handleLogout}>
            退出登录
          </div>
        </div>

        {/* 版本信息 */}
        <div className="profile-footer">
          <p>北辰幼儿园管理系统</p>
          <p>移动端 v1.0.0</p>
        </div>
      </div>
    </MobileLayout>
  );
}
