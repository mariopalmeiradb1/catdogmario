import { Row, Col, Typography } from 'antd';
import { useCatalog } from '~/hooks/useCatalog';
import { AnimalCard } from '~/components/catalog/AnimalCard';
import { AnimalCardSkeleton } from '~/components/catalog/AnimalCardSkeleton';
import { CatalogSearchBar } from '~/components/catalog/CatalogSearchBar';
import { CatalogFilters } from '~/components/catalog/CatalogFilters';
import { CatalogEmptyState } from '~/components/catalog/CatalogEmptyState';
import { useState } from 'react';

const { Title } = Typography;

export function CatalogPage() {
  const { animals, loading, hasMore, error, filters, setFilters, retry, sentinelRef } =
    useCatalog();
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const hasActiveFilters = Object.keys(filters).length > 0;
  const showEmpty = !error && animals.length === 0 && !loading;

  function handleSearchChange(value: string) {
    setSearchInput(value);
    setFilters({ search: value || undefined });
  }

  return (
    <div>
      <Title level={2}>Catálogo de Animais</Title>

      <CatalogSearchBar value={searchInput} onChange={handleSearchChange} />

      <CatalogFilters filters={filters} onChange={setFilters} />

      {!error && animals.length > 0 && (
        <Typography.Text type="secondary" style={{ display: 'block', margin: '12px 0' }}>
          {animals.length} {animals.length === 1 ? 'animal encontrado' : 'animais encontrados'}
        </Typography.Text>
      )}

      {error && <CatalogEmptyState type="error" message={error} onRetry={retry} />}

      {showEmpty && (
        <CatalogEmptyState type={hasActiveFilters ? 'no-results' : 'empty'} />
      )}

      {!error && animals.length > 0 && (
        <Row gutter={[24, 24]}>
          {animals.map((animal) => (
            <Col xs={24} sm={12} md={8} lg={6} key={animal.id}>
              <AnimalCard animal={animal} />
            </Col>
          ))}
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <Col xs={24} sm={12} md={8} lg={6} key={`loading-${i}`}>
                <AnimalCardSkeleton />
              </Col>
            ))}
        </Row>
      )}

      {!error && loading && animals.length === 0 && (
        <Row gutter={[24, 24]}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Col xs={24} sm={12} md={8} lg={6} key={`initial-loading-${i}`}>
              <AnimalCardSkeleton />
            </Col>
          ))}
        </Row>
      )}

      {hasMore && !error && <div ref={sentinelRef} style={{ height: 1 }} />}
    </div>
  );
}
