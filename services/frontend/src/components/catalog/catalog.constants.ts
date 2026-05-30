export const DOG_BREEDS = [
  'Vira-lata (SRD)',
  'Labrador Retriever',
  'Golden Retriever',
  'Pastor Alemão',
  'Bulldog Francês',
  'Poodle',
  'Beagle',
  'Border Collie',
  'Shih Tzu',
  'Rottweiler',
  'Dachshund (salsicha)',
];

export const CAT_BREEDS = [
  'Vira-lata (SRD)',
  'Persa',
  'Maine Coon',
  'Siamês',
  'Ragdoll',
  'British Shorthair',
  'Sphynx (sem pelo)',
  'Bengal',
  'Angorá',
  'Munchkin',
];

export const BREEDS_BY_SPECIES: Record<string, string[]> = {
  dog: DOG_BREEDS,
  cat: CAT_BREEDS,
  all: [...DOG_BREEDS, ...CAT_BREEDS],
};

export const SPECIES_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'dog', label: 'Cachorro' },
  { value: 'cat', label: 'Gato' },
];

export const SIZE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'small', label: 'Pequeno' },
  { value: 'medium', label: 'Médio' },
  { value: 'large', label: 'Grande' },
];

export const SEX_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'male', label: 'Macho' },
  { value: 'female', label: 'Fêmea' },
];

export const TEMPERAMENT_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'Dócil', label: 'Dócil' },
  { value: 'Brincalhão', label: 'Brincalhão' },
  { value: 'Calma', label: 'Calma' },
  { value: 'Protetor', label: 'Protetor' },
  { value: 'Independente', label: 'Independente' },
  { value: 'Sociável', label: 'Sociável' },
  { value: 'Curioso', label: 'Curioso' },
  { value: 'Alegre', label: 'Alegre' },
  { value: 'Carinhosa', label: 'Carinhosa' },
];

export const PAGE_SIZE = 8;
