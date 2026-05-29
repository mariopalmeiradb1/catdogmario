import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

export function OngListPage() {
  return (
    <div>
      <Title level={2}>Gerenciar ONGs</Title>
      <Paragraph>Visualize e aprove ONGs cadastradas no sistema.</Paragraph>
    </div>
  );
}
