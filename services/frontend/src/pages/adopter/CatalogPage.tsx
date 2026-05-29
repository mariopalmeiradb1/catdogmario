import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

export function CatalogPage() {
  return (
    <div>
      <Title level={2}>Catálogo de Animais</Title>
      <Paragraph>Em breve você poderá ver os animais disponíveis para adoção.</Paragraph>
    </div>
  );
}
