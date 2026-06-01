import { Layout, Menu, Button, theme } from 'antd';
import { LogoutOutlined, BankOutlined, AuditOutlined } from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '~/hooks/useAuth';
import { Logo } from '~/components/ui/Logo';

const { Header, Sider, Content } = Layout;

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const menuItems = [
    {
      key: '/admin/ongs',
      icon: <BankOutlined />,
      label: 'ONGs',
    },
    {
      key: '/admin/audit-logs',
      icon: <AuditOutlined />,
      label: 'Logs de Auditoria',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" breakpoint="lg" collapsedWidth="80">
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
          <Logo size="sm" />
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={['/admin/ongs']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            background: token.colorBgContainer,
            padding: '0 24px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>{user?.name}</span>
            <Button type="text" icon={<LogoutOutlined />} onClick={logout}>
              Sair
            </Button>
          </div>
        </Header>
        <Content style={{ padding: '24px' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
