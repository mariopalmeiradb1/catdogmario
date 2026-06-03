import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { adopterManagementService } from '~/services/adopter-management.service';
import type { AdopterProfile, CreateAdopterProfileInput, UpdateAdopterProfileInput } from '~/types/adopter-management.types';

export function useAdopterProfile() {
  const [profile, setProfile] = useState<AdopterProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adopterManagementService.getMyProfile();
      setProfile(result);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function createProfile(data: CreateAdopterProfileInput): Promise<AdopterProfile> {
    const result = await adopterManagementService.createProfile(data);
    setProfile(result);
    message.success('Perfil de adotante cadastrado com sucesso!');
    return result;
  }

  async function updateProfile(data: UpdateAdopterProfileInput): Promise<AdopterProfile> {
    const result = await adopterManagementService.updateMyProfile(data);
    setProfile(result);
    return result;
  }

  return {
    profile,
    isLoading: loading,
    hasProfile: !!profile,
    createProfile,
    updateProfile,
    refetch: fetchProfile,
  };
}

export function useAdopterProfileById(id: string) {
  const [profile, setProfile] = useState<AdopterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await adopterManagementService.getProfileById(id);
      setProfile(result);
    } catch {
      setError('Erro ao carregar perfil do adotante.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, isLoading: loading, error };
}
