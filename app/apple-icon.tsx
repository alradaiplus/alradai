import { ImageResponse } from 'next/og';

// Apple touch icon — 180×180
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#0A0A0A',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
          <rect x="2"   y="15" width="20" height="3"   rx="1.5" fill="#D4A843" />
          <rect x="4"   y="10.5" width="16" height="3" rx="1.5" fill="#D4A843" opacity="0.7" />
          <rect x="6.5" y="6"   width="11" height="3"  rx="1.5" fill="#D4A843" opacity="0.45" />
          <circle cx="12" cy="2.5" r="2" fill="#D4A843" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
