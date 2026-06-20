import React from 'react';

interface PulseLogoProps {
  size?: number;
  /** If true, render the full wordmark alongside the icon */
  wordmark?: boolean;
}

/**
 * HAPulse logomark — rounded square with a heartbeat/pulse line in accent color.
 */
export function PulseLogo({ size = 36, wordmark = false }: PulseLogoProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Rounded square background */}
        <rect width="36" height="36" rx="9" fill="var(--accent)" />
        {/* Pulse / heartbeat line */}
        <polyline
          points="4,18 9,18 12,10 15,26 18,14 21,22 24,18 32,18"
          stroke="var(--on-accent)"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {wordmark && (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '1.25rem',
            letterSpacing: '-0.02em',
            color: 'var(--text)',
            lineHeight: 1,
          }}
        >
          HAPulse
        </span>
      )}
    </span>
  );
}
