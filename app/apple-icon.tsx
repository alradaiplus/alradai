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
          background: '#EC4516',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="104" height="104" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="7" width="16" height="2.4" rx="1.2" fill="#fff" />
          <rect x="4" y="12" width="16" height="2.4" rx="1.2" fill="#fff" opacity="0.85" />
          <rect x="4" y="17" width="10" height="2.4" rx="1.2" fill="#fff" opacity="0.7" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
