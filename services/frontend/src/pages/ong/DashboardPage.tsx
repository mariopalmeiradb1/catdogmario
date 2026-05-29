import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

export function DashboardPage() {
  return (
    <div>
      <Title level={2}>Painel da ONG</Title>
      <Paragraph>Gerencie as solicitações de adoção aqui.</Paragraph>
    </div>
  );
}
