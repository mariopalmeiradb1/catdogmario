import { Typography, Spin, Button, Modal, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useState, useRef } from 'react';
import { useAdopterProfile } from '~/hooks/useAdopterProfile';
import { AdopterProfileForm } from '~/components/adopter-management/AdopterProfileForm';
import type { UpdateAdopterProfileInput } from '~/types/adopter-management.types';

const { Title } = Typography;

export function AdopterProfilePage() {
  const { profile, isLoading, updateProfile } = useAdopterProfile();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const initialValuesRef = useRef<string>('');

  function handleEdit() {
    initialValuesRef.current = JSON.stringify(profile);
    setEditing(true);
  }

  function handleCancel() {
    if (initialValuesRef.current !== JSON.stringify(profile)) {
      Modal.confirm({
        title: 'Descartar alterações?',
        content: 'Você tem alterações não salvas. Deseja descartá-las?',
        okText: 'Descartar',
        cancelText: 'Continuar editando',
        onOk: () => setEditing(false),
      });
    } else {
      setEditing(false);
    }
  }

  async function handleSubmit(data: UpdateAdopterProfileInput) {
    const hasChanges = Object.entries(data).some(([key, value]) => {
      const currentValue = profile?.[key as keyof typeof profile];
      return String(value ?? '') !== String(currentValue ?? '');
    });

    if (!hasChanges) {
      message.info('Nenhuma alteração foi realizada.');
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await updateProfile(data);
      message.success('Perfil atualizado com sucesso.');
      setEditing(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || 'Erro ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        <Title level={3}>Perfil não encontrado</Title>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Meu Perfil</Title>
        {!editing && (
          <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
            Editar
          </Button>
        )}
      </div>

      <AdopterProfileForm
        profile={profile}
        editing={editing}
        loading={saving}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
