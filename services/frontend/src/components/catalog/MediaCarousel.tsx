import { CSSProperties, useRef, useState } from 'react';
import { Carousel, Empty } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import type { CarouselRef } from 'antd/es/carousel';
import type { CatalogAnimalMedia } from '~/types/catalog.types';

interface MediaCarouselProps {
  media: CatalogAnimalMedia[];
  species: 'dog' | 'cat';
}

const containerStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
};

const slideStyle: CSSProperties = {
  width: '100%',
  height: 300,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#fafafa',
  overflow: 'hidden',
};

const imageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
};

const placeholderStyle: CSSProperties = {
  width: '100%',
  height: 300,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 72,
  backgroundColor: '#f0f0f0',
  color: '#bfbfbf',
};

const thumbnailStripStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  marginTop: 8,
  overflowX: 'auto',
  padding: '4px 0',
};

const thumbnailStyle = (active: boolean): CSSProperties => ({
  width: 56,
  height: 56,
  borderRadius: 6,
  objectFit: 'cover',
  cursor: 'pointer',
  border: active ? '2px solid #9b59b6' : '2px solid transparent',
  opacity: active ? 1 : 0.7,
  transition: 'border 0.2s, opacity 0.2s',
  flexShrink: 0,
});

const videoOverlayStyle: CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  fontSize: 48,
  color: 'rgba(255, 255, 255, 0.9)',
  pointerEvents: 'none',
};

function Placeholder({ species }: { species: 'dog' | 'cat' }) {
  const icon = species === 'dog' ? '🐕' : '🐈';
  return <div style={placeholderStyle}>{icon}</div>;
}

function MediaSlide({ item }: { item: CatalogAnimalMedia }) {
  const [playing, setPlaying] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (item.type === 'video') {
    if (playing) {
      return (
        <div style={slideStyle}>
          <video
            src={item.url}
            controls
            autoPlay
            style={imageStyle}
            onError={() => setPlaying(false)}
          />
        </div>
      );
    }

    return (
      <div
        style={{ ...slideStyle, position: 'relative', cursor: 'pointer' }}
        onClick={() => setPlaying(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setPlaying(true)}
        aria-label="Reproduzir vídeo"
      >
        <div style={{ ...placeholderStyle, height: '100%', fontSize: 48 }}>🎬</div>
        <PlayCircleOutlined style={videoOverlayStyle} />
      </div>
    );
  }

  if (imgError) {
    return (
      <div style={slideStyle}>
        <Empty description="Imagem indisponível" />
      </div>
    );
  }

  return (
    <div style={slideStyle}>
      <img
        src={item.url}
        alt=""
        style={imageStyle}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    </div>
  );
}

export function MediaCarousel({ media, species }: MediaCarouselProps) {
  const carouselRef = useRef<CarouselRef>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (media.length === 0) {
    return <Placeholder species={species} />;
  }

  if (media.length === 1) {
    return <MediaSlide item={media[0]} />;
  }

  return (
    <div style={containerStyle}>
      <Carousel
        ref={carouselRef}
        arrows
        dots={false}
        afterChange={setCurrentIndex}
      >
        {media.map((item) => (
          <MediaSlide key={item.id} item={item} />
        ))}
      </Carousel>

      <div style={thumbnailStripStyle}>
        {media.map((item, index) => (
          <img
            key={item.id}
            src={item.type === 'photo' ? item.url : ''}
            alt=""
            style={thumbnailStyle(index === currentIndex)}
            onClick={() => {
              carouselRef.current?.goTo(index);
              setCurrentIndex(index);
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.backgroundColor = '#f0f0f0';
              (e.target as HTMLImageElement).src = '';
            }}
          />
        ))}
      </div>
    </div>
  );
}
