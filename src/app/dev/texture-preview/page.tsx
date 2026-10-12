import { notFound } from 'next/navigation';
import { isQualityTier } from '@/lib/quality';
import { TexturePreviewLoader } from './Loader';

/**
 * Development-only texture preview: /dev/texture-preview?light=cool|sodium&tier=high|medium|low.
 * Returns 404 in production builds.
 */
export default async function TexturePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ light?: string; tier?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { light, tier } = await searchParams;
  return (
    <TexturePreviewLoader
      light={light === 'sodium' ? 'sodium' : 'cool'}
      tier={isQualityTier(tier) ? tier : 'high'}
    />
  );
}
