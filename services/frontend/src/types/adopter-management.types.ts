export interface AdopterProfile {
  id: string;
  user_id: string;
  full_name: string;
  cpf: string;
  rg: string;
  birth_date: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  has_current_animals: boolean;
  current_animals_description: string | null;
  had_animals_before: boolean;
  previous_animals_description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateAdopterProfileInput {
  full_name: string;
  cpf: string;
  rg: string;
  birth_date: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  has_current_animals: boolean;
  current_animals_description?: string;
  had_animals_before: boolean;
  previous_animals_description?: string;
}

export interface UpdateAdopterProfileInput {
  full_name?: string;
  rg?: string;
  birth_date?: string;
  phone?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  has_current_animals?: boolean;
  current_animals_description?: string;
  had_animals_before?: boolean;
  previous_animals_description?: string;
}
