import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import { useNavigate, useLocation, Navigate, Outlet } from 'react-router-dom';
import {
  DashboardOutlined,
  ProjectOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  BellOutlined,
  LinkOutlined,
  UserOutlined,
  SettingOutlined,
  HistoryOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const { Header, Sider, Content } = Layout;

const roleNames: Record<string, string> = {
  admin: '系统管理员',
  project_manager: '项目负责人',
  designer: '设计师',
  reviewer: '审校员',
  viewer: '查看者',
};

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: '项目管理',
    },
    {
      key: '/drawings',
      icon: <FileTextOutlined />,
      label: '图纸管理',
    },
    {
      key: '/approvals',
      icon: <CheckCircleOutlined />,
      label: '审批会签',
    },
    {
      key: '/ecns',
      icon: <BellOutlined />,
      label: '变更通知(ECN)',
    },
    {
      key: '/external-links',
      icon: <LinkOutlined />,
      label: '外部链接',
    },
    ...(user.role === 'admin' ? [
      {
        key: '/settings/users',
        icon: <UserOutlined />,
        label: '用户管理',
      },
      {
        key: '/audit/access-logs',
        icon: <HistoryOutlined />,
        label: '访问审计',
      },
    ] : []),
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="h-screen overflow-hidden">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="bg-gradient-to-b from-[#0F3B86] to-[#1E5BC6] border-r border-blue-900/30"
        width={260}
      >
        <div className="h-16 flex items-center justify-center border-b border-blue-900/30 px-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur">
              <FileTextOutlined className="text-white text-xl" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg tracking-wide">图控平台</span>
                <span className="text-blue-200 text-xs">DRAWING CONTROL</span>
              </div>
            )}
          </motion.div>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="bg-transparent border-none mt-4 menu-custom"
          style={{ padding: '0 8px' }}
        />
      </Sider>

      <Layout className="bg-slate-50">
        <Header className="bg-white h-16 px-6 flex items-center justify-between border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-600 hover:text-blue-600"
            />
            <div className="flex items-center gap-2 text-slate-500">
              <span className="text-sm">欢迎回来，</span>
              <span className="text-slate-800 font-medium">{user.name}</span>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                {roleNames[user.role]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors">
                <Avatar
                  size={36}
                  className="bg-gradient-to-br from-blue-500 to-blue-700 font-medium"
                  icon={<UserOutlined />}
                >
                  {user.name.charAt(0)}
                </Avatar>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-slate-800">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
