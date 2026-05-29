import { Spin } from 'antd';
import { CSSProperties } from 'react';

const containerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  width: '100vw',
};

export function LoadingSpinner() {
  return (
    <div style={containerStyle}>
      <Spin size="large" />
    </div>
  );
}
