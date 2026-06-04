import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { followUpService } from '~/services/follow-up.service';
import type { AdoptionTimeline } from '~/types/follow-up.types';

export function useFollowUpTimeline(adoptionRequestId: string | undefined) {
  const [timeline, setTimeline] = useState<AdoptionTimeline | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    if (!adoptionRequestId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await followUpService.getTimeline(adoptionRequestId);
      setTimeline(data);
    } catch {
      message.error('Erro ao carregar timeline de acompanhamento.');
      setError('Erro ao carregar timeline.');
      setTimeline(null);
    } finally {
      setLoading(false);
    }
  }, [adoptionRequestId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return { timeline, loading, error, refetch: fetchTimeline };
}
