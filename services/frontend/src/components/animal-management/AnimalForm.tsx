import { Form, Input, Select, InputNumber, Switch, Row, Col, Typography } from 'antd';
import type { FormInstance } from 'antd';
import type { Temperament } from '~/types/animal-management.types';

const { Title } = Typography;
const { TextArea } = Input;

const speciesOptions = [
  { value: 'dog', label: 'Cachorro' },
  { value: 'cat', label: 'Gato' },
];

const sexOptions = [
  { value: 'male', label: 'Macho' },
  { value: 'female', label: 'Fêmea' },
];

const castrationOptions = [
  { value: 'yes', label: 'Sim' },
  { value: 'no', label: 'Não' },
  { value: 'unknown', label: 'Desconhecido' },
];

const ageCategoryOptions = [
  { value: 'puppy', label: 'Filhote' },
  { value: 'young', label: 'Jovem' },
  { value: 'adult', label: 'Adulto' },
  { value: 'senior', label: 'Idoso' },
];

const sizeOptions = [
  { value: 'small', label: 'Pequeno' },
  { value: 'medium', label: 'Médio' },
  { value: 'large', label: 'Grande' },
];

const temperamentOptions: { value: Temperament; label: string }[] = [
  { value: 'docile', label: 'Dócil' },
  { value: 'playful', label: 'Brincalhão' },
  { value: 'shy', label: 'Tímido' },
  { value: 'aggressive_with_animals', label: 'Agressivo com outros animais' },
  { value: 'independent', label: 'Independente' },
  { value: 'needy', label: 'Carente' },
  { value: 'other', label: 'Outro' },
];

interface AnimalFormProps {
  form: FormInstance;
  disabled?: boolean;
}

export function AnimalForm({ form, disabled = false }: AnimalFormProps) {
  const specialNeeds = Form.useWatch('special_needs', form);

  return (
    <>
      <Title level={5}>Informações Básicas</Title>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item name="name" label="Nome" rules={[{ required: true, message: 'Informe o nome do animal.' }]}>
            <Input maxLength={100} placeholder="Nome do animal" disabled={disabled} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="species" label="Espécie" rules={[{ required: true, message: 'Selecione a espécie.' }]}>
            <Select options={speciesOptions} placeholder="Selecione" disabled={disabled} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item name="breed" label="Raça" rules={[{ required: true, message: 'Informe a raça.' }]}>
            <Input maxLength={100} placeholder="Raça do animal" disabled={disabled} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="sex" label="Sexo" rules={[{ required: true, message: 'Selecione o sexo.' }]}>
            <Select options={sexOptions} placeholder="Selecione" disabled={disabled} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item name="castration" label="Castrado" rules={[{ required: true, message: 'Informe a castração.' }]}>
            <Select options={castrationOptions} placeholder="Selecione" disabled={disabled} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="estimated_age_category"
            label="Idade estimada"
            rules={[{ required: true, message: 'Selecione a categoria de idade.' }]}
          >
            <Select options={ageCategoryOptions} placeholder="Selecione" disabled={disabled} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="temperament"
        label="Temperamento"
        rules={[{ required: true, message: 'Selecione pelo menos um temperamento.' }]}
      >
        <Select mode="multiple" options={temperamentOptions} placeholder="Selecione um ou mais" disabled={disabled} />
      </Form.Item>

      <Title level={5} style={{ marginTop: 24 }}>Medidas (opcional)</Title>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="size" label="Porte">
            <Select options={sizeOptions} placeholder="Selecione" allowClear disabled={disabled} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="weight_kg" label="Peso (kg)">
            <InputNumber min={0.1} max={999.9} step={0.1} style={{ width: '100%' }} placeholder="Ex: 12.5" disabled={disabled} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="height_cm" label="Altura (cm)">
            <InputNumber min={1} max={300} step={1} style={{ width: '100%' }} placeholder="Ex: 60" disabled={disabled} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="length_cm" label="Comprimento (cm)">
            <InputNumber min={1} max={300} step={1} style={{ width: '100%' }} placeholder="Ex: 80" disabled={disabled} />
          </Form.Item>
        </Col>
      </Row>

      <Title level={5} style={{ marginTop: 24 }}>Necessidades Especiais</Title>
      <Form.Item name="special_needs" label="Possui necessidades especiais?" valuePropName="checked">
        <Switch disabled={disabled} />
      </Form.Item>
      {specialNeeds && (
        <Form.Item name="special_needs_description" label="Descrição das necessidades">
          <TextArea maxLength={500} rows={3} placeholder="Descreva as necessidades especiais do animal" disabled={disabled} />
        </Form.Item>
      )}

      <Title level={5} style={{ marginTop: 24 }}>Observações (opcional)</Title>
      <Form.Item name="rescue_observations" label="Observações de resgate">
        <TextArea maxLength={1000} rows={3} placeholder="Informações sobre como o animal foi resgatado" disabled={disabled} />
      </Form.Item>
      <Form.Item name="general_observations" label="Observações gerais">
        <TextArea maxLength={1000} rows={3} placeholder="Outras informações relevantes" disabled={disabled} />
      </Form.Item>
    </>
  );
}
