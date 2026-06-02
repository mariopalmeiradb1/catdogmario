import { useState } from 'react';
import { Typography, Button, Form, Card, message, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { animalManagementService } from '~/services/animal-management.service';
import { AnimalForm } from '~/components/animal-management';
import type { CreateAnimalInput } from '~/types/animal-management.types';

const { Title } = Typography;

export function AnimalCreatePage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  async function handleSubmit(values: CreateAnimalInput) {
    setLoading(true);
    setDuplicateWarning(false);

    try {
      const payload: CreateAnimalInput = {
        ...values,
        weight_kg: values.weight_kg || null,
        height_cm: values.height_cm || null,
        length_cm: values.length_cm || null,
        special_needs_description: values.special_needs_description || null,
        rescue_observations: values.rescue_observations || null,
        general_observations: values.general_observations || null,
        size: values.size || null,
      };

      const result = await animalManagementService.create(payload);

      if (result.duplicateWarning) {
        setDuplicateWarning(true);
        message.warning('Animal cadastrado, mas já existe um com mesmo nome, espécie e raça nesta ONG.');
      } else {
        message.success('Animal cadastrado com sucesso!');
      }

      navigate('/ong/animals');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: { message?: string; fields?: Record<string, string> } } } };
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
      } else {
        message.error('Erro ao cadastrar animal. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Button onClick={() => navigate('/ong/animals')}>Voltar</Button>
        <Title level={3} style={{ margin: 0 }}>
          Cadastrar Animal
        </Title>
      </div>

      {duplicateWarning && (
        <Alert
          type="warning"
          message="Possível duplicidade detectada"
          description="Já existe um animal com o mesmo nome, espécie e raça cadastrado nesta ONG."
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ special_needs: false, castration: 'unknown' }}
        >
          <AnimalForm form={form} />

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              Cadastrar Animal
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
