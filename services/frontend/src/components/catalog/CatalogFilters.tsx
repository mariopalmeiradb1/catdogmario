import { Row, Col, Select, InputNumber, Switch } from 'antd';
import { useEffect, useRef, useState } from 'react';
import type { CatalogFilters } from '~/types/catalog.types';
import {
  SPECIES_OPTIONS,
  SIZE_OPTIONS,
  SEX_OPTIONS,
  TEMPERAMENT_OPTIONS,
  BREEDS_BY_SPECIES,
} from './catalog.constants';

interface CatalogFiltersProps {
  filters: CatalogFilters;
  onChange: (updates: Partial<CatalogFilters>) => void;
}

export function CatalogFilters({ filters, onChange }: CatalogFiltersProps) {
  const breedKey = filters.species || 'all';
  const breedOptions = (BREEDS_BY_SPECIES[breedKey] || BREEDS_BY_SPECIES.all).map(
    (breed) => ({ value: breed, label: breed }),
  );

  const [ageInput, setAgeInput] = useState<number | null>(filters.age || null);
  const ageDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setAgeInput(filters.age || null);
  }, [filters.age]);

  function handleAgeChange(value: number | null) {
    setAgeInput(value);
    if (ageDebounceRef.current) clearTimeout(ageDebounceRef.current);
    ageDebounceRef.current = setTimeout(() => {
      onChange({ age: value || undefined });
    }, 600);
  }

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={8} lg={4}>
        <Select
          style={{ width: '100%' }}
          placeholder="Espécie"
          allowClear
          value={filters.species || undefined}
          onChange={(value) => onChange({ species: value || undefined })}
          options={SPECIES_OPTIONS.filter((o) => o.value !== '')}
        />
      </Col>

      <Col xs={24} sm={12} md={8} lg={4}>
        <Select
          style={{ width: '100%' }}
          placeholder="Raça"
          allowClear
          value={filters.breed || undefined}
          onChange={(value) => onChange({ breed: value || undefined })}
          options={breedOptions}
          showSearch
        />
      </Col>

      <Col xs={24} sm={12} md={8} lg={3}>
        <InputNumber
          style={{ width: '100%' }}
          placeholder="Idade (anos)"
          min={1}
          max={30}
          value={ageInput}
          onChange={handleAgeChange}
        />
      </Col>

      <Col xs={24} sm={12} md={8} lg={4}>
        <Select
          style={{ width: '100%' }}
          placeholder="Porte"
          allowClear
          value={filters.size || undefined}
          onChange={(value) => onChange({ size: value || undefined })}
          options={SIZE_OPTIONS.filter((o) => o.value !== '')}
        />
      </Col>

      <Col xs={24} sm={12} md={8} lg={3}>
        <Select
          style={{ width: '100%' }}
          placeholder="Sexo"
          allowClear
          value={filters.sex || undefined}
          onChange={(value) => onChange({ sex: value || undefined })}
          options={SEX_OPTIONS.filter((o) => o.value !== '')}
        />
      </Col>

      <Col xs={24} sm={12} md={8} lg={4}>
        <Select
          style={{ width: '100%' }}
          placeholder="Temperamento"
          allowClear
          value={filters.temperament || undefined}
          onChange={(value) => onChange({ temperament: value || undefined })}
          options={TEMPERAMENT_OPTIONS.filter((o) => o.value !== '')}
        />
      </Col>

      <Col xs={24} sm={12} md={8} lg={2}>
        <Switch
          checkedChildren="Sim"
          unCheckedChildren="Não"
          checked={filters.special_needs || false}
          onChange={(checked) => onChange({ special_needs: checked || undefined })}
        />
        <span style={{ marginLeft: 8, fontSize: 13 }}>Necessidades especiais</span>
      </Col>
    </Row>
  );
}
