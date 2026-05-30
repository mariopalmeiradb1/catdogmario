import { Card, Skeleton } from 'antd';
import { CSSProperties } from 'react';

interface AnimalCardSkeletonProps {
  count?: number;
}

const cardStyle: CSSProperties = {
  borderRadius: 12,
  overflow: 'hidden',
  height: '100%',
};

export function AnimalCardSkeleton({ count = 1 }: AnimalCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={`skeleton-${index}`}
          style={cardStyle}
          cover={
            <Skeleton.Image
              active
              style={{ width: '100%', height: 200, display: 'block' }}
            />
          }
          bodyStyle={{ padding: 16 }}
        >
          <Skeleton active paragraph={{ rows: 2 }} title={{ width: '60%' }} />
        </Card>
      ))}
    </>
  );
}
