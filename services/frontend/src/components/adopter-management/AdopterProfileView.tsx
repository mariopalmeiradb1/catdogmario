import { Descriptions, Tag, Typography } from 'antd';
import type { AdopterProfile } from '~/types/adopter-management.types';

const { Title } = Typography;

interface AdopterProfileViewProps {
  profile: AdopterProfile;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function formatPhone(phone: string): string {
  if (phone.length === 11) {
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
  }
  if (phone.length === 10) {
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
  }
  return phone;
}

function formatCep(cep: string): string {
  if (cep.length === 8) {
    return `${cep.slice(0, 5)}-${cep.slice(5)}`;
  }
  return cep;
}

export function AdopterProfileView({ profile }: AdopterProfileViewProps) {
  const statusColor = profile.status === 'active' ? 'green' : 'red';
  const statusLabel = profile.status === 'active' ? 'Ativo' : 'Inativo';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>{profile.full_name}</Title>
        <Tag color={statusColor}>{statusLabel}</Tag>
      </div>

      <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
        <Descriptions.Item label="CPF">{profile.cpf}</Descriptions.Item>
        <Descriptions.Item label="RG">{profile.rg}</Descriptions.Item>
        <Descriptions.Item label="Data de nascimento">{formatDate(profile.birth_date)}</Descriptions.Item>
        <Descriptions.Item label="Telefone">{formatPhone(profile.phone)}</Descriptions.Item>
        <Descriptions.Item label="CEP">{formatCep(profile.cep)}</Descriptions.Item>
        <Descriptions.Item label="Rua">{profile.street}</Descriptions.Item>
        <Descriptions.Item label="Número">{profile.number}</Descriptions.Item>
        <Descriptions.Item label="Complemento">{profile.complement || '—'}</Descriptions.Item>
        <Descriptions.Item label="Bairro">{profile.neighborhood}</Descriptions.Item>
        <Descriptions.Item label="Cidade">{profile.city}</Descriptions.Item>
        <Descriptions.Item label="Estado">{profile.state}</Descriptions.Item>
      </Descriptions>

      <Title level={5} style={{ marginTop: 24 }}>Informações sobre animais</Title>
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Possui animais atualmente?">
          {profile.has_current_animals ? 'Sim' : 'Não'}
        </Descriptions.Item>
        {profile.has_current_animals && (
          <Descriptions.Item label="Descrição dos animais atuais">
            {profile.current_animals_description || '—'}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Já teve animais antes?">
          {profile.had_animals_before ? 'Sim' : 'Não'}
        </Descriptions.Item>
        {profile.had_animals_before && (
          <Descriptions.Item label="Descrição dos animais anteriores">
            {profile.previous_animals_description || '—'}
          </Descriptions.Item>
        )}
      </Descriptions>
    </div>
  );
}
