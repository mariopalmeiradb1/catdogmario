import { useState } from 'react';
import { Upload, Button, Card, Row, Col, Image, Popconfirm, message, Typography } from 'antd';
import { UploadOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { animalManagementService } from '~/services/animal-management.service';
import type { AnimalMedia } from '~/types/animal-management.types';
import { env } from '~/config/env';

const { Title } = Typography;

const MAX_MEDIA = 10;

interface AnimalMediaSectionProps {
  animalId: string;
  media: AnimalMedia[];
  onMediaChange: (media: AnimalMedia[]) => void;
  disabled?: boolean;
}

export function AnimalMediaSection({ animalId, media, onMediaChange, disabled = false }: AnimalMediaSectionProps) {
  const [uploading, setUploading] = useState(false);

  function getMediaUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return `${env.VITE_API_URL.replace('/api', '')}${url}`;
  }

  async function handleUpload(file: UploadFile) {
    if (media.length >= MAX_MEDIA) {
      message.error(`Limite máximo de ${MAX_MEDIA} mídias atingido.`);
      return false;
    }

    setUploading(true);
    try {
      const newMedia = await animalManagementService.uploadMedia(animalId, file as unknown as File);
      onMediaChange([...media, newMedia]);
      message.success('Mídia enviada com sucesso!');
    } catch {
      message.error('Erro ao enviar mídia.');
    } finally {
      setUploading(false);
    }
    return false;
  }

  async function handleRemove(mediaId: string) {
    try {
      await animalManagementService.removeMedia(animalId, mediaId);
      onMediaChange(media.filter((m) => m.id !== mediaId));
      message.success('Mídia removida com sucesso!');
    } catch {
      message.error('Erro ao remover mídia.');
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <Title level={5}>Fotos e Vídeos ({media.length}/{MAX_MEDIA})</Title>

      <Row gutter={[16, 16]}>
        {media.map((item) => (
          <Col key={item.id} xs={12} sm={8} md={6}>
            <Card
              size="small"
              cover={
                item.media_type === 'image' ? (
                  <Image
                    src={getMediaUrl(item.url)}
                    alt="Mídia do animal"
                    style={{ height: 120, objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0' }}>
                    <PlayCircleOutlined style={{ fontSize: 40, color: '#999' }} />
                  </div>
                )
              }
              actions={
                !disabled
                  ? [
                      <Popconfirm
                        key="delete"
                        title="Remover mídia?"
                        onConfirm={() => handleRemove(item.id)}
                        okText="Sim"
                        cancelText="Não"
                      >
                        <DeleteOutlined style={{ color: '#ff4d4f' }} />
                      </Popconfirm>,
                    ]
                  : undefined
              }
            />
          </Col>
        ))}
      </Row>

      {!disabled && media.length < MAX_MEDIA && (
        <Upload
          beforeUpload={handleUpload}
          showUploadList={false}
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
        >
          <Button icon={<UploadOutlined />} loading={uploading} style={{ marginTop: 16 }}>
            Enviar Mídia
          </Button>
        </Upload>
      )}
    </div>
  );
}
