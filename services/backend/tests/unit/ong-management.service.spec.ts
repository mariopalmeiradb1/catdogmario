import { OngManagementService } from '~/domains/ong-management/ong-management.service';
import { ongManagementRepository } from '~/domains/ong-management/ong-management.repository';
import { OngNotFoundError, InvalidOngStatusTransitionError, CnpjDuplicateError } from '~/domains/ong-management/ong-management.errors';
import { OngDetail } from '~/domains/ong-management/ong-management.types';

jest.mock('~/domains/ong-management/ong-management.repository');

const mockedRepository = jest.mocked(ongManagementRepository);

describe('OngManagementService', () => {
  let service: OngManagementService;

  const mockOng: OngDetail = {
    id: 'ong-1',
    name: 'ONG Teste',
    cnpj: '12345678000100',
    phone: '11999999999',
    address: 'Rua Teste, 123',
    city: 'São Paulo',
    state: 'SP',
    description: 'Uma descrição com no mínimo cinquenta caracteres para validação funcionar corretamente no sistema.',
    mission: null,
    capacity: 10,
    instagram: null,
    facebook: null,
    whatsapp: null,
    status: 'approved',
    rejected_at: null,
    deactivated_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OngManagementService();
  });

  describe('getMyOngDetail', () => {
    it('should return ONG detail for valid user', async () => {
      mockedRepository.findOngByUserId.mockResolvedValue(mockOng);

      const result = await service.getMyOngDetail('user-1');

      expect(result).toEqual(mockOng);
      expect(mockedRepository.findOngByUserId).toHaveBeenCalledWith('user-1');
    });

    it('should throw OngNotFoundError when user has no ONG', async () => {
      mockedRepository.findOngByUserId.mockResolvedValue(null);

      await expect(service.getMyOngDetail('user-1')).rejects.toThrow(OngNotFoundError);
    });
  });

  describe('updateByOngAdmin', () => {
    it('should update ONG data successfully', async () => {
      const updatedOng = { ...mockOng, phone: '11888888888' };
      mockedRepository.findOngByUserId.mockResolvedValue(mockOng);
      mockedRepository.updateOngData.mockResolvedValue(undefined);
      mockedRepository.findById.mockResolvedValue(updatedOng);

      const result = await service.updateByOngAdmin('user-1', { phone: '11888888888' });

      expect(result.phone).toBe('11888888888');
      expect(mockedRepository.updateOngData).toHaveBeenCalledWith('ong-1', { phone: '11888888888' });
    });

    it('should throw OngNotFoundError when user has no ONG', async () => {
      mockedRepository.findOngByUserId.mockResolvedValue(null);

      await expect(service.updateByOngAdmin('user-1', { phone: '11888888888' })).rejects.toThrow(OngNotFoundError);
    });

    it('should throw InvalidOngStatusTransitionError when ONG is not approved', async () => {
      const pendingOng = { ...mockOng, status: 'pending' as const };
      mockedRepository.findOngByUserId.mockResolvedValue(pendingOng);

      await expect(service.updateByOngAdmin('user-1', { phone: '11888888888' })).rejects.toThrow(InvalidOngStatusTransitionError);
    });
  });

  describe('updateBySystemAdmin', () => {
    it('should update ONG data successfully', async () => {
      const updatedOng = { ...mockOng, name: 'Novo Nome' };
      mockedRepository.findById.mockResolvedValue(mockOng);
      mockedRepository.updateOngData.mockResolvedValue(undefined);
      mockedRepository.findById.mockResolvedValueOnce(mockOng).mockResolvedValueOnce(updatedOng);

      const result = await service.updateBySystemAdmin('ong-1', { name: 'Novo Nome' });

      expect(result.name).toBe('Novo Nome');
    });

    it('should throw OngNotFoundError when ONG does not exist', async () => {
      mockedRepository.findById.mockResolvedValue(null);

      await expect(service.updateBySystemAdmin('ong-1', { name: 'Novo Nome' })).rejects.toThrow(OngNotFoundError);
    });

    it('should throw CnpjDuplicateError when CNPJ already exists in another ONG', async () => {
      mockedRepository.findById.mockResolvedValue(mockOng);
      mockedRepository.findOngByCnpjExcluding.mockResolvedValue({ id: 'ong-2' });

      await expect(service.updateBySystemAdmin('ong-1', { cnpj: '99999999000199' })).rejects.toThrow(CnpjDuplicateError);
    });

    it('should not check CNPJ uniqueness when CNPJ is unchanged', async () => {
      const updatedOng = { ...mockOng, phone: '11888888888' };
      mockedRepository.findById.mockResolvedValueOnce(mockOng).mockResolvedValueOnce(updatedOng);
      mockedRepository.updateOngData.mockResolvedValue(undefined);

      await service.updateBySystemAdmin('ong-1', { cnpj: '12345678000100', phone: '11888888888' });

      expect(mockedRepository.findOngByCnpjExcluding).not.toHaveBeenCalled();
    });

    it('should allow CNPJ update when new CNPJ is unique', async () => {
      const updatedOng = { ...mockOng, cnpj: '99999999000199' };
      mockedRepository.findById.mockResolvedValueOnce(mockOng).mockResolvedValueOnce(updatedOng);
      mockedRepository.findOngByCnpjExcluding.mockResolvedValue(null);
      mockedRepository.updateOngData.mockResolvedValue(undefined);

      const result = await service.updateBySystemAdmin('ong-1', { cnpj: '99999999000199' });

      expect(result.cnpj).toBe('99999999000199');
      expect(mockedRepository.findOngByCnpjExcluding).toHaveBeenCalledWith('99999999000199', 'ong-1');
    });
  });
});
