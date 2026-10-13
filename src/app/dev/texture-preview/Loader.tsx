'use client';

import dynamic from 'next/dynamic';
import type { QualityTier } from '@/lib/quality';

const TexturePreview = dynamic(
  () => import('@/scene/Preview/TexturePreview').then((m) => m.TexturePreview),
  { ssr: false },
);

export function TexturePreviewLoader({
  light,
  tier,
}: {
  light: 'cool' | 'sodium';
  tier: QualityTier;
}) {
  return (
    <div className="fixed inset-0">
      <TexturePreview light={light} tier={tier} />
    </div>
  );
}
