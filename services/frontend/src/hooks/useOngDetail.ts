import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { ongManagementService } from '~/services/ong-management.service';
import type { OngDetail } from '~/types/ong-management.types';

interface UseOngDetailReturn {
  ong: OngDetail | null;
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
  markInReview: () => Promise<void>;
  approve: () => Promise<void>;
  reject: (reason?: string) => Promise<void>;
  deactivate: () => Promise<void>;
  reactivate: () => Promise<void>;
  refetch: () => void;
}

export function useOngDetail(ongId: string): UseOngDetailReturn {
  const [ong, setOng] = useState<OngDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await ongManagementService.getDetail(ongId);
      setOng(data);
    } catch {
      setError('Não foi possível carregar os dados da ONG.');
    } finally {
      setLoading(false);
    }
  }, [ongId]);

  useEffect(() => {
    if (ongId) {
      fetchDetail();
    }
  }, [ongId, fetchDetail]);

  const executeAction = useCallback(
    async (action: () => Promise<{ message: string }>) => {
      setActionLoading(true);
      try {
        const result = await action();
        message.success(result.message);
        await fetchDetail();
      } catch (err) {
        if (isConflictError(err)) {
          message.error(
            'O status desta ONG foi alterado por outro administrador. Os dados foram atualizados.',
          );
          await fetchDetail();
        } else {
          message.error('Ocorreu um erro ao executar a ação. Tente novamente.');
        }
      } finally {
        setActionLoading(false);
      }
    },
    [fetchDetail],
  );

  const markInReview = useCallback(
    () => executeAction(() => ongManagementService.markInReview(ongId)),
    [executeAction, ongId],
  );

  const approve = useCallback(
    () => executeAction(() => ongManagementService.approve(ongId)),
    [executeAction, ongId],
  );

  const reject = useCallback(
    (reason?: string) => executeAction(() => ongManagementService.reject(ongId, reason)),
    [executeAction, ongId],
  );

  const deactivate = useCallback(
    () => executeAction(() => ongManagementService.deactivate(ongId)),
    [executeAction, ongId],
  );

  const reactivate = useCallback(
    () => executeAction(() => ongManagementService.reactivate(ongId)),
    [executeAction, ongId],
  );

  return {
    ong,
    loading,
    error,
    actionLoading,
    markInReview,
    approve,
    reject,
    deactivate,
    reactivate,
    refetch: fetchDetail,
  };
}

function isConflictError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response?: { status?: number } }).response === 'object' &&
    (err as { response: { status: number } }).response.status === 409
  );
}
