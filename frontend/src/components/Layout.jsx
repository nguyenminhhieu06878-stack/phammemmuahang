import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Badge } from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  ShopOutlined,
  FileDoneOutlined,
  DollarOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  ControlOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

const { Header, Sider, Content } = AntLayout;

function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const getRoleLabel = (role) => {
    const roleLabels = {
      admin: 'Quản trị viên',
      truong_phong_mh: 'Trưởng phòng MH',
      nhan_vien_mh: 'Nhân viên MH',
      ke_toan: 'Kế toán',
      giam_doc: 'Giám đốc',
      giam_sat: 'Giám sát',
      ncc: 'Nhà cung cấp',
      phong_os: 'Phòng OS',
    };
    return roleLabels[role] || role;
  };

  // Role-based menu configuration
  const getMenuItemsByRole = (role) => {
    const allMenuItems = {
      dashboard: {
        key: '/',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
      },
      users: {
        key: '/users',
        icon: <UserOutlined />,
        label: 'Quản lý Users',
      },
      projects: {
        key: '/projects',
        icon: <ProjectOutlined />,
        label: 'Dự án',
      },
      materials: {
        key: '/materials',
        icon: <ShoppingOutlined />,
        label: 'Vật tư',
      },
      suppliers: {
        key: '/suppliers',
        icon: <ShopOutlined />,
        label: 'Nhà cung cấp',
      },
      requests: {
        key: '/requests',
        icon: <FileTextOutlined />,
        label: 'Yêu cầu vật tư',
      },
      rfq: {
        key: '/rfq',
        icon: <FileDoneOutlined />,
        label: 'Yêu cầu báo giá',
      },
      quotations: {
        key: '/quotations',
        icon: <DollarOutlined />,
        label: 'Báo giá',
      },
      po: {
        key: '/po',
        icon: <FileDoneOutlined />,
        label: 'Đơn đặt hàng',
      },
      quotas: {
        key: '/quotas',
        icon: <ControlOutlined />,
        label: 'Định mức vật tư',
      },
      stockIssues: {
        key: '/stock-issues',
        icon: <ShoppingOutlined />,
        label: 'Lịch sử xuất kho',
      },
    };

    const roleMenuMap = {
      admin: ['dashboard', 'users', 'projects', 'materials', 'suppliers', 'quotas', 'requests', 'rfq', 'quotations', 'po', 'stockIssues'],
      truong_phong_mh: ['dashboard', 'requests', 'rfq', 'quotations', 'po', 'suppliers', 'stockIssues'],
      nhan_vien_mh: ['dashboard', 'requests', 'rfq', 'quotations', 'materials', 'suppliers'],
      ke_toan: ['dashboard', 'requests', 'po', 'stockIssues'],
      giam_doc: ['dashboard', 'projects', 'requests', 'po'],
      giam_sat: ['dashboard', 'requests', 'materials', 'po'],
      ncc: ['quotations', 'po'],
      phong_os: ['dashboard', 'projects', 'materials', 'quotas'],
    };

    const allowedMenuKeys = roleMenuMap[role] || ['dashboard'];
    return allowedMenuKeys.map(key => allMenuItems[key]).filter(Boolean);
  };

  const menuItems = getMenuItemsByRole(user?.role);

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={250}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: collapsed ? 16 : 20,
            fontWeight: 'bold',
            color: '#1890ff',
          }}
        >
          {collapsed ? 'QL' : 'Quản lý Mua hàng'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <AntLayout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 500 }}>
              {menuItems.find(item => item.key === location.pathname)?.label || 'Dashboard'}
            </div>
            <div style={{ 
              fontSize: 12, 
              padding: '2px 8px', 
              background: '#1890ff', 
              color: '#fff', 
              borderRadius: 4 
            }}>
              {getRoleLabel(user?.role)}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Badge count={0}>
              <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: '24px', background: '#f0f2f5' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

export default Layout;
