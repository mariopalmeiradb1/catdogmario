import { Input } from 'antd';
import { CSSProperties } from 'react';

interface CatalogSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const wrapperStyle: CSSProperties = {
  maxWidth: 400,
  width: '100%',
  marginBottom: 16,
};

export function CatalogSearchBar({ value, onChange }: CatalogSearchBarProps) {
  return (
    <div style={wrapperStyle}>
      <Input.Search
        placeholder="Busque por nome ou cidade"
        allowClear
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size="large"
      />
    </div>
  );
}
