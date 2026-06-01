import { Button, Empty, Result } from 'antd';

interface CatalogEmptyStateProps {
  type: 'empty' | 'no-results' | 'error';
  message?: string;
  onRetry?: () => void;
}

export function CatalogEmptyState({ type, message: errorMessage, onRetry }: CatalogEmptyStateProps) {
  if (type === 'error') {
    return (
      <Result
        status="error"
        title="Erro ao carregar"
        subTitle={errorMessage || 'Não foi possível carregar os animais. Tente novamente em alguns instantes.'}
        extra={
          onRetry && (
            <Button type="primary" onClick={onRetry}>
              Tentar novamente
            </Button>
          )
        }
      />
    );
  }

  if (type === 'no-results') {
    return (
      <Empty
        description="Nenhum animal encontrado com os filtros selecionados. Tente ajustar sua busca."
        style={{ padding: '48px 0' }}
      />
    );
  }

  return (
    <Empty
      description="Nenhum animal disponível no momento. Volte em breve!"
      style={{ padding: '48px 0' }}
    />
  );
}
