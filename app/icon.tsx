import { ImageResponse } from 'next/og';

// App icon generated at runtime (32×32)
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#0A0A0A',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Stack of three bars — bottom to top */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2"  y="15" width="20" height="3" rx="1.5" fill="#D4A843" />
          <rect x="4"  y="10.5" width="16" height="3" rx="1.5" fill="#D4A843" opacity="0.7" />
          <rect x="6"  y="6" width="12" height="3" rx="1.5" fill="#D4A843" opacity="0.45" />
          <circle cx="12" cy="2.5" r="2" fill="#D4A843" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
