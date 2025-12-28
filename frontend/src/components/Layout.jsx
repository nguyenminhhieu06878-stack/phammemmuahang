import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Badge, Drawer } from 'antd';
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
  MenuOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

const { Header, Sider, Content } = AntLayout;

function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleMenuClick = (key) => {
    navigate(key);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const menuComponent = (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={({ key }) => handleMenuClick(key)}
    />
  );

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
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="light"
          width={250}
          breakpoint="lg"
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
          {menuComponent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          bodyStyle={{ padding: 0 }}
          width={250}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 'bold',
              color: '#1890ff',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            Quản lý Mua hàng
          </div>
          {menuComponent}
        </Drawer>
      )}

      <AntLayout>
        <Header
          style={{
            background: '#fff',
            padding: isMobile ? '0 16px' : '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <MenuOutlined
                style={{ fontSize: 20, cursor: 'pointer' }}
                onClick={() => setMobileDrawerOpen(true)}
              />
            )}
            <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 500 }}>
              {isMobile ? '' : (menuItems.find(item => item.key === location.pathname)?.label || 'Dashboard')}
            </div>
            {!isMobile && (
              <div style={{ 
                fontSize: 12, 
                padding: '2px 8px', 
                background: '#1890ff', 
                color: '#fff', 
                borderRadius: 4 
              }}>
                {getRoleLabel(user?.role)}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 24 }}>
            <Badge count={0}>
              <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                {!isMobile && <span>{user?.name}</span>}
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: isMobile ? '16px' : '24px', background: '#f0f2f5' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

export default Layout;
