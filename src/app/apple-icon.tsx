import { ImageResponse } from 'next/og';
import { palette } from '@/lib/palette';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** The home-screen icon: the patrol car with its amber light bar on a night tile. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: palette.night,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 30, height: 10, background: palette.street, borderRadius: 4 }} />
        <div style={{ width: 70, height: 30, background: palette.night2, borderRadius: 8 }} />
        <div style={{ width: 110, height: 36, background: palette.snow, borderRadius: 12 }} />
      </div>
    </div>,
    size,
  );
}
