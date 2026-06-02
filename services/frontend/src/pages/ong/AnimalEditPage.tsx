import { useState, useEffect, useCallback } from 'react';
import { Typography, Button, Form, Card, message, Spin, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { HistoryOutlined, StopOutlined } from '@ant-design/icons';
import { animalManagementService } from '~/services/animal-management.service';
import { AnimalForm, AnimalMediaSection, InactivateConfirmModal, AnimalAuditLogModal } from '~/components/animal-management';
import type { UpdateAnimalInput, AnimalDetail, AnimalMedia } from '~/types/animal-management.types';
import { useAuth } from '~/hooks/useAuth';

const { Title } = Typography;

export function AnimalEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
      form.setFieldsValue({
        name: data.name,
        species: data.species,
        breed: data.breed,
        sex: data.sex,
        castration: data.castration,
        temperament: data.temperament,
        estimated_age_category: data.estimated_age_category,
        size: data.size,
        weight_kg: data.weight_kg,
        height_cm: data.height_cm,
        length_cm: data.length_cm,
        special_needs: data.special_needs,
        special_needs_description: data.special_needs_description,
        rescue_observations: data.rescue_observations,
        general_observations: data.general_observations,
      });
    } catch {
      message.error('Erro ao carregar dados do animal.');
      navigate('/ong/animals');
    } finally {
      setLoading(false);
    }
  }, [id, form, navigate]);

  useEffect(() => {
    fetchAnimal();
  }, [fetchAnimal]);

  async function handleSubmit(values: UpdateAnimalInput) {
    if (!id || !animal) return;
    setSaving(true);
    try {
      const payload: UpdateAnimalInput = {
        ...values,
        weight_kg: values.weight_kg || null,
        height_cm: values.height_cm || null,
        length_cm: values.length_cm || null,
        special_needs_description: values.special_needs_description || null,
        rescue_observations: values.rescue_observations || null,
        general_observations: values.general_observations || null,
        size: values.size || null,
        updated_at: animal.updated_at,
      };

      const updated = await animalManagementService.update(id, payload);
      setAnimal(updated);
      message.success('Animal atualizado com sucesso!');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: { message?: string; fields?: Record<string, string> } } } };
        if (axiosError.response?.status === 409) {
          message.error('Este registro foi modificado por outro usuário. Recarregue a página.');
          fetchAnimal();
        } else {
          const apiError = axiosError.response?.data?.error;
          if (apiError?.fields) {
            const fieldErrors = Object.entries(apiError.fields).map(([name, errors]) => ({
              name,
              errors: [errors],
            }));
            form.setFields(fieldErrors);
          } else if (apiError?.message) {
            message.error(apiError.message);
          }
        }
      } else {
        message.error('Erro ao atualizar animal. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleInactivate() {
    if (!id) return;
    setInactivating(true);
    try {
      await animalManagementService.inactivate(id);
      message.success('Animal inativado com sucesso!');
      navigate('/ong/animals');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
        message.error(axiosError.response?.data?.error?.message || 'Erro ao inativar animal.');
      } else {
        message.error('Erro ao inativar animal.');
      }
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
            Editar Animal - {animal.name}
          </Title>
        </div>
        <Space>
          <Button icon={<HistoryOutlined />} onClick={() => setAuditModalOpen(true)}>
            Histórico
          </Button>
          {isAdmin && !isInactive && (
            <Button danger icon={<StopOutlined />} onClick={() => setInactivateModalOpen(true)}>
              Inativar
            </Button>
          )}
        </Space>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={isInactive}
        >
          <AnimalForm form={form} disabled={isInactive} />

          {!isInactive && (
            <Form.Item style={{ marginTop: 24 }}>
              <Button type="primary" htmlType="submit" loading={saving} size="large">
                Salvar Alterações
              </Button>
            </Form.Item>
          )}
        </Form>
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
