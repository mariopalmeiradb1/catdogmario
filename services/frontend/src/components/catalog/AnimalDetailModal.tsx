import { useEffect, useState } from 'react';
import {
  Modal,
  Typography,
  Tag,
  Descriptions,
  Alert,
  Button,
  Tooltip,
  Skeleton,
  Result,
  message,
} from 'antd';
import {
  PhoneOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAnimalDetail } from '~/hooks/useAnimalDetail';
import { useAuth } from '~/hooks/useAuth';
import { adoptionRequestsService } from '~/services/adoption-requests.service';
import { MediaCarousel } from './MediaCarousel';
import type { CatalogAnimalDetail } from '~/types/catalog.types';
import { CSSProperties } from 'react';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

interface AnimalDetailModalProps {
  animalId: string | null;
  onClose: () => void;
}

const tagColor = '#9b59b6';

const sectionStyle: CSSProperties = {
  marginTop: 24,
};

const sectionTitleStyle: CSSProperties = {
  marginBottom: 12,
};

function formatSpecies(species: 'dog' | 'cat'): string {
  return species === 'dog' ? 'Cachorro' : 'Gato';
}

function formatSex(sex: 'male' | 'female'): string {
  return sex === 'male' ? 'Macho' : 'Fêmea';
}

function formatSize(size: 'small' | 'medium' | 'large' | null): string | null {
  if (!size) return null;
  const map = { small: 'Pequeno', medium: 'Médio', large: 'Grande' };
  return map[size];
}

function formatAgeCategory(category: string | null): string | null {
  if (!category) return null;
  const map: Record<string, string> = {
    puppy: 'Filhote',
    young: 'Jovem',
    adult: 'Adulto',
    senior: 'Idoso',
  };
  return map[category] || null;
}

function formatAgeMonths(months: number): string {
  if (months >= 12) {
    const years = Math.floor(months / 12);
    return years === 1 ? '1 ano' : `${years} anos`;
  }
  return months === 1 ? '1 mês' : `${months} meses`;
}

function formatCastration(castration: 'yes' | 'no' | 'unknown'): string {
  const map = { yes: 'Sim', no: 'Não', unknown: 'Desconhecido' };
  return map[castration];
}

function DetailContent({ data }: { data: CatalogAnimalDetail }) {
  const sizeLabel = formatSize(data.size);
  const hasPhysicalInfo = data.weight_kg || data.height_cm || data.length_cm;
  const hasObservations = data.general_observations || data.rescue_observations;
  const hasTemperament = data.temperament.length > 0;
  const location =
    data.ong.city && data.ong.state
      ? `${data.ong.city}/${data.ong.state}`
      : data.ong.city || data.ong.state || null;

  return (
    <div>
      <MediaCarousel media={data.media} species={data.species} />

      <Title level={3} style={{ marginTop: 16, marginBottom: 4 }}>
        {data.name}
      </Title>

      {data.status === 'in_adoption_process' && (
        <Alert
          type="warning"
          message="Este animal está em processo de adoção"
          description="Outro adotante já está em processo de adoção com este animal. Você ainda pode entrar na fila de espera."
          showIcon
          style={{ marginTop: 12, marginBottom: 8 }}
        />
      )}

      <div style={sectionStyle}>
        <Title level={5} style={sectionTitleStyle}>Dados Básicos</Title>
        <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
          <Descriptions.Item label="Espécie">{formatSpecies(data.species)}</Descriptions.Item>
          <Descriptions.Item label="Raça">{data.breed}</Descriptions.Item>
          <Descriptions.Item label="Sexo">{formatSex(data.sex)}</Descriptions.Item>
          <Descriptions.Item label="Castrado">{formatCastration(data.castration)}</Descriptions.Item>
          <Descriptions.Item label="Idade">
            {formatAgeCategory(data.estimated_age_category) || formatAgeMonths(data.estimated_age_months)}
          </Descriptions.Item>
          {sizeLabel && <Descriptions.Item label="Porte">{sizeLabel}</Descriptions.Item>}
        </Descriptions>
      </div>

      {hasTemperament && (
        <div style={sectionStyle}>
          <Title level={5} style={sectionTitleStyle}>Temperamento</Title>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.temperament.map((t) => (
              <Tag key={t} color={tagColor}>{t}</Tag>
            ))}
          </div>
        </div>
      )}

      {hasPhysicalInfo && (
        <div style={sectionStyle}>
          <Title level={5} style={sectionTitleStyle}>Informações Físicas</Title>
          <Descriptions column={{ xs: 1, sm: 3 }} size="small" bordered>
            {data.weight_kg && (
              <Descriptions.Item label="Peso">{data.weight_kg} kg</Descriptions.Item>
            )}
            {data.height_cm && (
              <Descriptions.Item label="Altura">{data.height_cm} cm</Descriptions.Item>
            )}
            {data.length_cm && (
              <Descriptions.Item label="Comprimento">{data.length_cm} cm</Descriptions.Item>
            )}
          </Descriptions>
        </div>
      )}

      {data.special_needs && (
        <div style={sectionStyle}>
          <Alert
            type="info"
            showIcon
            message="Necessidades Especiais"
            description={data.special_needs_description || 'Este animal possui necessidades especiais.'}
          />
        </div>
      )}

      {hasObservations && (
        <div style={sectionStyle}>
          <Title level={5} style={sectionTitleStyle}>Observações</Title>
          {data.general_observations && (
            <Paragraph>{data.general_observations}</Paragraph>
          )}
          {data.rescue_observations && (
            <>
              <Text strong>Observações de resgate:</Text>
              <Paragraph>{data.rescue_observations}</Paragraph>
            </>
          )}
        </div>
      )}

      <div style={sectionStyle}>
        <Title level={5} style={sectionTitleStyle}>ONG Responsável</Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text strong>{data.ong.name}</Text>
          {location && (
            <Text type="secondary">
              <EnvironmentOutlined /> {location}
            </Text>
          )}
          {data.ong.phone && (
            <Text type="secondary">
              <PhoneOutlined /> {data.ong.phone}
            </Text>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalFooter({ status, animalId, onRequestSent }: { status: string; animalId: string; onRequestSent?: () => void }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  if (status === 'in_adoption_process') {
    return (
      <Tooltip title="Em breve">
        <Button type="primary" disabled>
          Entrar na fila de espera
        </Button>
      </Tooltip>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button type="primary" onClick={() => navigate('/login')}>
        Solicitar Adoção
      </Button>
    );
  }

  if (user?.role !== 'adopter') {
    return null;
  }

  async function handleAdoptionRequest() {
    setSubmitting(true);
    try {
      await adoptionRequestsService.create(animalId);
      message.success('Pedido de adoção enviado com sucesso!');
      onRequestSent?.();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        message.warning('Você já possui um pedido ativo para este animal.');
      } else {
        message.error('Erro ao enviar pedido. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Button type="primary" loading={submitting} onClick={handleAdoptionRequest}>
      Solicitar Adoção
    </Button>
  );
}

export function AnimalDetailModal({ animalId, onClose }: AnimalDetailModalProps) {
  const { data, loading, error, fetchDetail, reset } = useAnimalDetail();

  useEffect(() => {
    if (animalId) {
      fetchDetail(animalId);
    }
  }, [animalId, fetchDetail]);

  function handleClose() {
    onClose();
    reset();
  }

  const footer = data ? <ModalFooter status={data.status} animalId={data.id} onRequestSent={handleClose} /> : null;

  return (
    <Modal
      open={!!animalId}
      onCancel={handleClose}
      footer={footer}
      width={720}
      destroyOnHidden
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      {loading && (
        <div>
          <Skeleton.Image active style={{ width: '100%', height: 300 }} />
          <Skeleton active paragraph={{ rows: 8 }} style={{ marginTop: 16 }} />
        </div>
      )}

      {error && !loading && (
        <Result
          status="error"
          title="Erro ao carregar detalhes"
          subTitle={error}
          extra={
            <Button onClick={() => animalId && fetchDetail(animalId)}>
              Tentar novamente
            </Button>
          }
        />
      )}

      {data && !loading && !error && <DetailContent data={data} />}
    </Modal>
  );
}
