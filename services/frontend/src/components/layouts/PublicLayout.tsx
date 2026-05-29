import { Outlet } from 'react-router-dom';
import { Logo } from '~/components/ui/Logo';
import { CSSProperties } from 'react';

const wrapperStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#f5f5f5',
  padding: '20px',
};

const cardStyle: CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  padding: '40px',
  maxWidth: '480px',
  width: '100%',
};

const logoContainerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '32px',
};

export function PublicLayout() {
  return (
    <div style={wrapperStyle}>
      <div style={cardStyle}>
        <div style={logoContainerStyle}>
          <Logo size="lg" />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
