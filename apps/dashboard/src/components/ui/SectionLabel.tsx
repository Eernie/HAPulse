import React from 'react';

interface SectionLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SectionLabel({ children, className = '', style, ...rest }: SectionLabelProps) {
  return (
    <div
      className={`section-label ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        ...style,
      }}
      {...rest}
    >
      <span>{children}</span>
      <span
        style={{
          flex: 1,
          height: '1px',
          background: 'var(--line)',
        }}
        aria-hidden="true"
      />
    </div>
  );
}
