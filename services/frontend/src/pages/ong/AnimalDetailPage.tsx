import { useState, useEffect, useCallback } from 'react';
import { Typography, Button, Card, Descriptions, Tag, Spin, Space, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { EditOutlined, HistoryOutlined, StopOutlined } from '@ant-design/icons';
import { animalManagementService } from '~/services/animal-management.service';
import { AnimalMediaSection, InactivateConfirmModal, AnimalAuditLogModal } from '~/components/animal-management';
import type { AnimalDetail, AnimalMedia, AnimalStatus } from '~/types/animal-management.types';
import { useAuth } from '~/hooks/useAuth';

const { Title } = Typography;

const STATUS_COLORS: Record<AnimalStatus, string> = {
  available: 'green',
  adopted: 'blue',
  in_adoption_process: 'orange',
  inactive: 'default',
};

const STATUS_LABELS: Record<AnimalStatus, string> = {
  available: 'Disponível',
  adopted: 'Adotado',
  in_adoption_process: 'Em processo de adoção',
  inactive: 'Inativo',
};

const SPECIES_LABELS = { dog: 'Cachorro', cat: 'Gato' };
const SEX_LABELS = { male: 'Macho', female: 'Fêmea' };
const CASTRATION_LABELS = { yes: 'Sim', no: 'Não', unknown: 'Desconhecido' };
const AGE_LABELS = { puppy: 'Filhote', young: 'Jovem', adult: 'Adulto', senior: 'Idoso' };
const SIZE_LABELS: Record<string, string> = { small: 'Pequeno', medium: 'Médio', large: 'Grande' };
const TEMPERAMENT_LABELS: Record<string, string> = {
  docile: 'Dócil',
  playful: 'Brincalhão',
  shy: 'Tímido',
  aggressive_with_animals: 'Agressivo com outros animais',
  independent: 'Independente',
  needy: 'Carente',
  other: 'Outro',
};

export function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [animal, setAnimal] = useState<AnimalDetail | null>(null);
  const [media, setMedia] = useState<AnimalMedia[]>([]);
  const [inactivateModalOpen, setInactivateModalOpen] = useState(false);
  const [inactivating, setInactivating] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  const fetchAnimal = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await animalManagementService.findById(id);
      setAnimal(data);
      setMedia(data.media);
    } catch {
      message.error('Erro ao carregar dados do animal.');
      navigate('/ong/animals');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchAnimal();
  }, [fetchAnimal]);

  async function handleInactivate() {
    if (!id) return;
    setInactivating(true);
    try {
      await animalManagementService.inactivate(id);
      message.success('Animal inativado com sucesso!');
      navigate('/ong/animals');
    } catch {
      message.error('Erro ao inativar animal.');
    } finally {
      setInactivating(false);
      setInactivateModalOpen(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!animal) return null;

  const isInactive = animal.status === 'inactive';
  const isAdmin = user?.role === 'ong_admin';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button onClick={() => navigate('/ong/animals')}>Voltar</Button>
          <Title level={3} style={{ margin: 0 }}>
            {animal.name}
          </Title>
          <Tag color={STATUS_COLORS[animal.status]}>{STATUS_LABELS[animal.status]}</Tag>
        </div>
        <Space>
          <Button icon={<HistoryOutlined />} onClick={() => setAuditModalOpen(true)}>
            Histórico
          </Button>
          {!isInactive && (
            <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/ong/animals/${id}/edit`)}>
              Editar
            </Button>
          )}
          {isAdmin && !isInactive && (
            <Button danger icon={<StopOutlined />} onClick={() => setInactivateModalOpen(true)}>
              Inativar
            </Button>
          )}
        </Space>
      </div>

      <Card>
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Espécie">{SPECIES_LABELS[animal.species]}</Descriptions.Item>
          <Descriptions.Item label="Raça">{animal.breed}</Descriptions.Item>
          <Descriptions.Item label="Sexo">{SEX_LABELS[animal.sex]}</Descriptions.Item>
          <Descriptions.Item label="Castrado">{CASTRATION_LABELS[animal.castration]}</Descriptions.Item>
          <Descriptions.Item label="Idade Estimada">{AGE_LABELS[animal.estimated_age_category]}</Descriptions.Item>
          <Descriptions.Item label="Porte">{animal.size ? SIZE_LABELS[animal.size] : '-'}</Descriptions.Item>
          <Descriptions.Item label="Peso">{animal.weight_kg ? `${animal.weight_kg} kg` : '-'}</Descriptions.Item>
          <Descriptions.Item label="Altura">{animal.height_cm ? `${animal.height_cm} cm` : '-'}</Descriptions.Item>
          <Descriptions.Item label="Comprimento">{animal.length_cm ? `${animal.length_cm} cm` : '-'}</Descriptions.Item>
          <Descriptions.Item label="Temperamento" span={2}>
            {animal.temperament.map((t) => (
              <Tag key={t}>{TEMPERAMENT_LABELS[t] || t}</Tag>
            ))}
          </Descriptions.Item>
          <Descriptions.Item label="Necessidades Especiais" span={2}>
            {animal.special_needs ? animal.special_needs_description || 'Sim' : 'Não'}
          </Descriptions.Item>
          {animal.rescue_observations && (
            <Descriptions.Item label="Observações de Resgate" span={2}>
              {animal.rescue_observations}
            </Descriptions.Item>
          )}
          {animal.general_observations && (
            <Descriptions.Item label="Observações Gerais" span={2}>
              {animal.general_observations}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Cadastrado em">
            {new Date(animal.created_at).toLocaleDateString('pt-BR')}
          </Descriptions.Item>
          <Descriptions.Item label="Última atualização">
            {new Date(animal.updated_at).toLocaleString('pt-BR')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <AnimalMediaSection
          animalId={id!}
          media={media}
          onMediaChange={setMedia}
          disabled={isInactive}
        />
      </Card>

      <InactivateConfirmModal
        open={inactivateModalOpen}
        animalName={animal.name}
        onConfirm={handleInactivate}
        onCancel={() => setInactivateModalOpen(false)}
        loading={inactivating}
      />

      <AnimalAuditLogModal
        open={auditModalOpen}
        animalId={id!}
        animalName={animal.name}
        onClose={() => setAuditModalOpen(false)}
      />
    </div>
  );
}
