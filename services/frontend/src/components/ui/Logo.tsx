import { CSSProperties } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap: Record<string, { fontSize: string; iconSize: string }> = {
  sm: { fontSize: '20px', iconSize: '24px' },
  md: { fontSize: '28px', iconSize: '32px' },
  lg: { fontSize: '36px', iconSize: '42px' },
};

export function Logo({ size = 'md' }: LogoProps) {
  const { fontSize, iconSize } = sizeMap[size];

  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const iconStyle: CSSProperties = {
    fontSize: iconSize,
    lineHeight: 1,
  };

  const textStyle: CSSProperties = {
    fontSize,
    fontWeight: 700,
    color: '#333',
    lineHeight: 1,
  };

  const separatorStyle: CSSProperties = {
    width: '1px',
    height: iconSize,
    backgroundColor: '#ddd',
  };

  return (
    <div style={containerStyle}>
      <span style={iconStyle}>🐱</span>
      <div style={separatorStyle} />
      <span style={textStyle}>
        <span style={{ color: '#FF6B35' }}>Cat</span>Dog
      </span>
    </div>
  );
}
