import { ImageResponse } from 'next/og';
import { palette } from '@/lib/palette';
import { simpleCopy } from '@/content/ui';

export const alt = simpleCopy.site.title;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * The social preview: a winter night over the patrol road, the title, and a line of what it is. Drawn
 * with plain shapes (no photos, no logos) so it is fully original.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 72,
        background: `linear-gradient(180deg, ${palette.night} 0%, ${palette.night2} 62%, #3b2a2a 100%)`,
        color: palette.snow,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 190,
          background: '#cfd8e3',
          opacity: 0.12,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 120,
          top: 90,
          width: 18,
          height: 18,
          borderRadius: 9,
          background: palette.street,
          boxShadow: `0 0 60px 30px ${palette.street}55`,
        }}
      />
      <div style={{ fontSize: 28, color: palette.hud, letterSpacing: 4, display: 'flex' }}>
        UNIT 02 · WINNIPEG
      </div>
      <div style={{ fontSize: 112, fontWeight: 700, color: palette.street, display: 'flex' }}>
        {simpleCopy.site.title}
      </div>
      <div style={{ fontSize: 34, maxWidth: 900, display: 'flex' }}>
        {simpleCopy.site.description}
      </div>
    </div>,
    size,
  );
}
