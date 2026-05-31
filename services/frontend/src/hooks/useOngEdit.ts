import { useState, useEffect, useCallback, useRef } from 'react';
import { Form, message, FormInstance } from 'antd';
import { ongManagementService } from '~/services/ong-management.service';
import type { OngDetail, UpdateOngInput } from '~/types/ong-management.types';

interface UseOngEditReturn {
  form: FormInstance<UpdateOngInput>;
  ong: OngDetail | null;
  loading: boolean;
  submitting: boolean;
  isDirty: boolean;
  submit: (values: UpdateOngInput) => Promise<void>;
  resetForm: () => void;
  handleValuesChange: () => void;
}

export function useOngEdit(): UseOngEditReturn {
  const [form] = Form.useForm<UpdateOngInput>();
  const [ong, setOng] = useState<OngDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const initialValuesRef = useRef<Record<string, unknown>>({});

  const fetchOng = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ongManagementService.getMyOng();
      setOng(data);
      const formValues = {
        phone: data.phone,
        address: data.address,
        city: data.city || undefined,
        state: data.state || undefined,
        description: data.description,
        mission: data.mission || undefined,
        capacity: data.capacity,
        instagram: data.instagram || undefined,
        facebook: data.facebook || undefined,
        whatsapp: data.whatsapp || undefined,
      };
      form.setFieldsValue(formValues);
      initialValuesRef.current = formValues;
      setIsDirty(false);
    } catch {
      message.error('Não foi possível carregar os dados da ONG.');
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    fetchOng();
  }, [fetchOng]);

  const handleValuesChange = useCallback(() => {
    const currentValues = form.getFieldsValue();
    const hasChanges = Object.keys(initialValuesRef.current).some((key) => {
      const initial = initialValuesRef.current[key];
      const current = currentValues[key as keyof UpdateOngInput];
      return initial !== current;
    });
    setIsDirty(hasChanges);
  }, [form]);

  const submit = useCallback(async (values: UpdateOngInput) => {
    setSubmitting(true);
    try {
      await ongManagementService.updateMyOng(values);
      message.success('Dados atualizados com sucesso.');
      await fetchOng();
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [fetchOng]);

  const resetForm = useCallback(() => {
    form.setFieldsValue(initialValuesRef.current);
    setIsDirty(false);
  }, [form]);

  return { form, ong, loading, submitting, isDirty, submit, resetForm, handleValuesChange };
}

function extractErrorMessage(err: unknown): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response?: { data?: { error?: { message?: string } } } }).response === 'object'
  ) {
    const response = (err as { response: { data?: { error?: { message?: string } } } }).response;
    return response.data?.error?.message || 'Erro ao salvar alterações. Tente novamente.';
  }
  return 'Erro ao salvar alterações. Tente novamente.';
}
