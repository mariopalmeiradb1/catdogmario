import { Card, Tag, Typography } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import type { CatalogAnimal } from '~/types/catalog.types';
import { CSSProperties } from 'react';

const { Text, Paragraph } = Typography;

interface AnimalCardProps {
  animal: CatalogAnimal;
  onClick?: (id: string) => void;
}

const cardStyle: CSSProperties = {
  borderRadius: 12,
  overflow: 'hidden',
  transition: 'box-shadow 0.2s ease',
  height: '100%',
};

const imageStyle: CSSProperties = {
  width: '100%',
  height: 200,
  objectFit: 'cover',
};

const placeholderStyle: CSSProperties = {
  width: '100%',
  height: 200,
  backgroundColor: '#f0f0f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 48,
  color: '#bfbfbf',
};

const nameStyle: CSSProperties = {
  margin: 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontWeight: 600,
  fontSize: 16,
};

const descriptionStyle: CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  margin: '8px 0',
  color: '#595959',
  fontSize: 13,
};

const tagColor = '#9b59b6';

function formatAge(months: number): string {
  if (months >= 12) {
    const years = Math.floor(months / 12);
    return years === 1 ? '1 ano' : `${years} anos`;
  }
  return months === 1 ? '1 mês' : `${months} meses`;
}

function formatSize(size: 'small' | 'medium' | 'large'): string {
  const map = { small: 'Pequeno', medium: 'Médio', large: 'Grande' };
  return map[size];
}

function formatSex(sex: 'male' | 'female'): string {
  return sex === 'male' ? 'Macho' : 'Fêmea';
}

function formatSpecies(species: 'dog' | 'cat'): string {
  return species === 'dog' ? 'Cachorro' : 'Gato';
}

function PlaceholderIcon({ species }: { species: 'dog' | 'cat' }) {
  const icon = species === 'dog' ? '🐕' : '🐈';
  return <div style={placeholderStyle}>{icon}</div>;
}

export function AnimalCard({ animal, onClick }: AnimalCardProps) {
  const cover = animal.photo_url ? (
    <img
      src={animal.photo_url}
      alt={animal.name}
      style={imageStyle}
      loading="lazy"
    />
  ) : (
    <PlaceholderIcon species={animal.species} />
  );

  const location =
    animal.ong.city && animal.ong.state
      ? `${animal.ong.city}/${animal.ong.state}`
      : animal.ong.city || '';

  return (
    <Card
      hoverable
      style={cardStyle}
      cover={cover}
      bodyStyle={{ padding: 16 }}
      onClick={() => onClick?.(animal.id)}
    >
      <div style={nameStyle} title={animal.name}>
        {animal.name}
      </div>

      {location && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          <EnvironmentOutlined /> {location}
        </Text>
      )}

      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <Tag color={tagColor}>{formatSpecies(animal.species)}</Tag>
        <Tag color={tagColor}>{formatSex(animal.sex)}</Tag>
        <Tag color={tagColor}>{formatSize(animal.size)}</Tag>
        <Tag color={tagColor}>{formatAge(animal.estimated_age_months)}</Tag>
      </div>

      {animal.description && (
        <Paragraph style={descriptionStyle}>{animal.description}</Paragraph>
      )}
    </Card>
  );
}
