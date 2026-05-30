import { Outlet, useNavigate } from 'react-router-dom';
import { Button, Space, Typography } from 'antd';
import { LoginOutlined, LogoutOutlined } from '@ant-design/icons';
import { Logo } from '~/components/ui/Logo';
import { useAuth } from '~/hooks/useAuth';
import { CSSProperties } from 'react';

const { Text } = Typography;

const wrapperStyle: CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#f5f5f5',
};

const headerStyle: CSSProperties = {
  padding: '16px 24px',
  backgroundColor: '#fff',
  borderBottom: '1px solid #f0f0f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const contentStyle: CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '24px',
};

export function CatalogLayout() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate('/catalog');
  }

  return (
    <div style={wrapperStyle}>
      <header style={headerStyle}>
        <Logo size="sm" />
        {isAuthenticated ? (
          <Space>
            <Text>Olá, {user?.name.split(' ')[0]}</Text>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              Sair
            </Button>
          </Space>
        ) : (
          <Button
            type="primary"
            icon={<LoginOutlined />}
            onClick={() => navigate('/login')}
          >
            Entrar
          </Button>
        )}
      </header>
      <main style={contentStyle}>
        <Outlet />
      </main>
    </div>
  );
}
