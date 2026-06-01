import { Form, Input, Button, Select, DatePicker, message } from 'antd';
import { useState } from 'react';
import { AxiosError } from 'axios';
import dayjs from 'dayjs';
import { volunteerService } from '~/services/volunteer.service';
import type { CreateVolunteerInput, UpdateVolunteerInput, VolunteerDetail } from '~/types/volunteer.types';
import type { ApiError } from '~/types/api.types';
import {
  nameRules,
  emailRules,
  passwordRules,
  phoneRules,
  cpfRules,
  rgRules,
  birthDateRules,
  zipCodeRules,
  stateRules,
} from '~/utils/validators';
import { VALIDATION_MESSAGES, VOLUNTEER_MESSAGES } from '~/utils/messages';
import { PasswordInput } from '~/components/ui/PasswordInput';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
];

interface VolunteerFormProps {
  mode: 'create' | 'edit';
  initialValues?: VolunteerDetail;
  onSuccess: () => void;
}

type FormValues = CreateVolunteerInput & { birth_date_picker?: dayjs.Dayjs };

export function VolunteerForm({ mode, initialValues, onSuccess }: VolunteerFormProps) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const defaultValues = initialValues
    ? {
        ...initialValues,
        birth_date_picker: initialValues.birth_date ? dayjs(initialValues.birth_date) : undefined,
      }
    : undefined;

  async function handleSubmit(values: FormValues) {
    setLoading(true);
    try {
      const birthDate = values.birth_date_picker
        ? values.birth_date_picker.format('YYYY-MM-DD')
        : values.birth_date;

      if (mode === 'create') {
        const payload: CreateVolunteerInput = {
          name: values.name,
          email: values.email,
          password: values.password,
          password_confirmation: values.password_confirmation,
          cpf: values.cpf.replace(/\D/g, ''),
          rg: values.rg,
          birth_date: birthDate as string,
          phone: values.phone.replace(/\D/g, ''),
          zip_code: values.zip_code.replace(/\D/g, ''),
          street: values.street,
          number: values.number,
          complement: values.complement,
          neighborhood: values.neighborhood,
          city: values.city,
          state: values.state,
        };
        await volunteerService.create(payload);
        message.success(VOLUNTEER_MESSAGES.CREATE_SUCCESS);
      } else {
        const payload: UpdateVolunteerInput = {
          name: values.name,
          rg: values.rg,
          birth_date: birthDate,
          phone: values.phone.replace(/\D/g, ''),
          zip_code: values.zip_code.replace(/\D/g, ''),
          street: values.street,
          number: values.number,
          complement: values.complement,
          neighborhood: values.neighborhood,
          city: values.city,
          state: values.state,
        };
        await volunteerService.update(initialValues!.id, payload);
        message.success(VOLUNTEER_MESSAGES.UPDATE_SUCCESS);
      }

      onSuccess();
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      const msg = error.response?.data?.error?.message || 'Erro ao salvar.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={defaultValues}
      onFinish={handleSubmit}
      autoComplete="off"
    >
      {mode === 'create' && (
        <>
          <Form.Item label="Dados de Acesso" style={{ marginBottom: 0 }}>
            <Form.Item name="email" label="E-mail" rules={emailRules}>
              <Input placeholder="E-mail" />
            </Form.Item>
            <Form.Item name="password" label="Senha" rules={passwordRules}>
              <PasswordInput placeholder="Senha" />
            </Form.Item>
            <Form.Item
              name="password_confirmation"
              label="Confirmar Senha"
              dependencies={['password']}
              rules={[
                { required: true, message: VALIDATION_MESSAGES.REQUIRED },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(VALIDATION_MESSAGES.PASSWORDS_MISMATCH),
                    );
                  },
                }),
              ]}
            >
              <PasswordInput placeholder="Confirmar Senha" />
            </Form.Item>
          </Form.Item>
        </>
      )}

      <Form.Item label="Dados Pessoais" style={{ marginBottom: 0 }}>
        <Form.Item name="name" label="Nome" rules={nameRules}>
          <Input placeholder="Nome completo" />
        </Form.Item>
        <Form.Item name="cpf" label="CPF" rules={cpfRules}>
          <Input
            placeholder="000.000.000-00"
            disabled={mode === 'edit'}
            maxLength={14}
          />
        </Form.Item>
        <Form.Item name="rg" label="RG" rules={rgRules}>
          <Input placeholder="RG" maxLength={20} />
        </Form.Item>
        <Form.Item name="birth_date_picker" label="Data de Nascimento" rules={birthDateRules}>
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="DD/MM/AAAA"
            disabledDate={(d) => d.isAfter(dayjs())}
          />
        </Form.Item>
        <Form.Item name="phone" label="Telefone" rules={phoneRules}>
          <Input placeholder="(00) 00000-0000" maxLength={15} />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Endereço" style={{ marginBottom: 0 }}>
        <Form.Item name="zip_code" label="CEP" rules={zipCodeRules}>
          <Input placeholder="00000-000" maxLength={9} />
        </Form.Item>
        <Form.Item
          name="street"
          label="Rua"
          rules={[{ required: true, message: VALIDATION_MESSAGES.REQUIRED }]}
        >
          <Input placeholder="Rua, Avenida..." />
        </Form.Item>
        <Form.Item
          name="number"
          label="Número"
          rules={[{ required: true, message: VALIDATION_MESSAGES.REQUIRED }]}
        >
          <Input placeholder="Número" />
        </Form.Item>
        <Form.Item name="complement" label="Complemento">
          <Input placeholder="Apartamento, bloco..." />
        </Form.Item>
        <Form.Item
          name="neighborhood"
          label="Bairro"
          rules={[{ required: true, message: VALIDATION_MESSAGES.REQUIRED }]}
        >
          <Input placeholder="Bairro" />
        </Form.Item>
        <Form.Item
          name="city"
          label="Cidade"
          rules={[{ required: true, message: VALIDATION_MESSAGES.REQUIRED }]}
        >
          <Input placeholder="Cidade" />
        </Form.Item>
        <Form.Item name="state" label="Estado" rules={stateRules}>
          <Select placeholder="UF" showSearch>
            {BRAZILIAN_STATES.map((uf) => (
              <Select.Option key={uf} value={uf}>
                {uf}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form.Item>

      {mode === 'edit' && (
        <Form.Item name="email" label="E-mail">
          <Input disabled />
        </Form.Item>
      )}

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          {mode === 'create' ? 'Cadastrar Voluntário' : 'Salvar Alterações'}
        </Button>
      </Form.Item>
    </Form>
  );
}
