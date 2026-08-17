import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Cube Online Arena — The Ultimate Speedcubing Competition Platform';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#020617',
          backgroundImage: 'radial-gradient(circle at 50% 30%, #1e293b 0%, #020617 70%)',
          color: '#f8fafc',
          fontFamily: 'monospace',
          padding: '60px 80px',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '32px',
          }}
        >
          {/* 3x3 Logo Grid */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              width: '84px',
              height: '84px',
              gap: '6px',
            }}
          >
            <div style={{ width: '24px', height: '24px', borderRadius: '5px', backgroundColor: '#64748b' }} />
            <div style={{ width: '24px', height: '24px', borderRadius: '5px', backgroundColor: '#64748b' }} />
            <div style={{ width: '24px', height: '24px', borderRadius: '5px', backgroundColor: '#64748b' }} />
            <div style={{ width: '24px', height: '24px', borderRadius: '5px', backgroundColor: '#64748b' }} />
            <div style={{ width: '24px', height: '24px', borderRadius: '5px', backgroundColor: '#f59e0b' }} />
            <div style={{ width: '24px', height: '24px', borderRadius: '5px', backgroundColor: '#64748b' }} />
            <div style={{ width: '24px', height: '24px', borderRadius: '5px', backgroundColor: '#64748b' }} />
            <div style={{ width: '24px', height: '24px', borderRadius: '5px', backgroundColor: '#64748b' }} />
            <div style={{ width: '24px', height: '24px', borderRadius: '5px', backgroundColor: '#64748b' }} />
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: '48px',
              fontWeight: 900,
              letterSpacing: '-1px',
              textTransform: 'uppercase',
            }}
          >
            <span>CUBE</span>
            <span style={{ color: '#f59e0b' }}>ONLINE</span>
            <span style={{ color: '#94a3b8', marginLeft: '12px' }}>ARENA</span>
          </div>
        </div>

        {/* Main Headline */}
        <div
          style={{
            fontSize: '40px',
            fontWeight: 800,
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: '20px',
            maxWidth: '960px',
            textTransform: 'uppercase',
          }}
        >
          Real-Time Speedcubing Battles & Drag-Race Tournaments
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '22px',
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '860px',
            lineHeight: 1.4,
            marginBottom: '40px',
            fontFamily: 'sans-serif',
          }}
        >
          Race head-to-head with drag-race starting lights, challenge friends across devices, and battle adaptive AI opponents.
        </div>

        {/* Feature Badges */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
          }}
        >
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#fbbf24',
              fontSize: '16px',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            🚦 Drag-Race Lights
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              color: '#22d3ee',
              fontSize: '16px',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            🌐 Real-Time Multiplayer
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '16px',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            🤖 Adaptive AI Bots
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#c084fc',
              fontSize: '16px',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            📊 Live Match Analytics
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
