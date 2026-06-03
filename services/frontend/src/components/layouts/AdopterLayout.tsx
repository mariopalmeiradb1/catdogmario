import { Layout, Button, theme } from 'antd';
import { LogoutOutlined, HistoryOutlined } from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '~/hooks/useAuth';
import { Logo } from '~/components/ui/Logo';

const { Header, Content } = Layout;

export function AdopterLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: token.colorBgContainer,
          padding: '0 24px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Logo size="sm" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            type="text"
            icon={<HistoryOutlined />}
            onClick={() => navigate('/adopter/history')}
          >
            Meu Histórico
          </Button>
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
  );
}
